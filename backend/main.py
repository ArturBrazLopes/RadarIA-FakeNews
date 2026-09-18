import os
import logging
from contextlib import asynccontextmanager
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import engine, Base, get_db
from backend.models import NewsArticle, UserVote
from backend.ai_engine import FakeNewsClassifier
from backend.news_service import ingest_news
from backend.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("api")

# Schemas Pydantic
class VoteRequest(BaseModel):
    client_id: str
    direction: int  # 1 para upvote, -1 para downvote

class NewsOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    source_name: Optional[str] = None
    published_at: Optional[str] = None
    category: Optional[str] = "Geral"
    reliability_score: float
    reliability_label: str
    upvotes: int
    downvotes: int
    vote_balance: int
    user_vote: Optional[int] = 0

    class Config:
        from_attributes = True

class StatsOut(BaseModel):
    total_news: int
    reliable_count: int
    suspicious_count: int
    fake_count: int
    total_votes: int
    reliable_percentage: float

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar tabelas no banco de dados
    logger.info("Criando tabelas no banco de dados SQLite...")
    Base.metadata.create_all(bind=engine)
    
    # Pré-carregar o modelo de IA
    logger.info("Inicializando motor de Inteligência Artificial...")
    FakeNewsClassifier.get_instance()
    
    # Iniciar agendador de 12 horas
    start_scheduler()
    
    # Ingestão inicial se o banco estiver vazio
    db = next(get_db())
    try:
        count = db.query(NewsArticle).count()
        if count == 0:
            logger.info("Banco de dados vazio. Executando primeira carga de notícias...")
            ingest_news()
    finally:
        db.close()

    yield
    
    stop_scheduler()

app = FastAPI(title="FakeNews Radar API", lifespan=lifespan)

# Habilitar CORS para o frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "online", "model_loaded": FakeNewsClassifier.get_instance().is_loaded}

@app.get("/api/news")
def get_news(
    tab: str = Query("trending", regex="^(trending|topics|recent)$"),
    topics: Optional[str] = Query(None, description="Lista separada por vírgula de tópicos para filtro"),
    client_id: Optional[str] = Query(None),
    limit: int = 30,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(NewsArticle)

    if tab == "topics" and topics:
        topic_list = [t.strip().lower() for t in topics.split(",") if t.strip()]
        if topic_list:
            # Filtra tanto na categoria quanto no título ou descrição
            from sqlalchemy import or_
            filters = []
            for t in topic_list:
                filters.append(NewsArticle.category.ilike(f"%{t}%"))
                filters.append(NewsArticle.title.ilike(f"%{t}%"))
                filters.append(NewsArticle.description.ilike(f"%{t}%"))
            query = query.filter(or_(*filters))

    if tab == "trending":
        # Ordenar pelo balanço de votos (upvotes - downvotes) DESC, e depois por data
        query = query.order_by(desc(NewsArticle.upvotes - NewsArticle.downvotes), desc(NewsArticle.published_at))
    else:
        # Recentes e Tópicos ordenados cronologicamente
        query = query.order_by(desc(NewsArticle.published_at))

    total = query.count()
    articles = query.offset(offset).limit(limit).all()

    # Mapear votos do cliente atual se informado
    user_votes_map = {}
    if client_id:
        article_ids = [a.id for a in articles]
        votes = db.query(UserVote).filter(UserVote.client_id == client_id, UserVote.article_id.in_(article_ids)).all()
        for v in votes:
            user_votes_map[v.article_id] = v.vote_type

    result = []
    for a in articles:
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "content": a.content,
            "url": a.url,
            "image_url": a.image_url,
            "source_name": a.source_name,
            "published_at": a.published_at.isoformat() if a.published_at else None,
            "category": a.category,
            "reliability_score": a.reliability_score,
            "reliability_label": a.reliability_label,
            "upvotes": a.upvotes,
            "downvotes": a.downvotes,
            "vote_balance": a.upvotes - a.downvotes,
            "user_vote": user_votes_map.get(a.id, 0)
        })

    return {"total": total, "news": result}

@app.post("/api/news/{article_id}/vote")
def vote_news(
    article_id: int,
    payload: VoteRequest,
    db: Session = Depends(get_db)
):
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")

    if payload.direction not in (-1, 1):
        raise HTTPException(status_code=400, detail="Direção de voto inválida (use 1 ou -1)")

    existing_vote = db.query(UserVote).filter(
        UserVote.article_id == article_id,
        UserVote.client_id == payload.client_id
    ).first()

    current_user_vote = 0

    if existing_vote:
        if existing_vote.vote_type == payload.direction:
            # Desfazer o voto (clicou de novo no mesmo botão)
            if existing_vote.vote_type == 1:
                article.upvotes = max(0, article.upvotes - 1)
            else:
                article.downvotes = max(0, article.downvotes - 1)
            db.delete(existing_vote)
            current_user_vote = 0
        else:
            # Trocar de voto (ex: de upvote para downvote)
            if existing_vote.vote_type == 1:
                article.upvotes = max(0, article.upvotes - 1)
                article.downvotes += 1
            else:
                article.downvotes = max(0, article.downvotes - 1)
                article.upvotes += 1
            existing_vote.vote_type = payload.direction
            current_user_vote = payload.direction
    else:
        # Novo voto
        new_vote = UserVote(
            article_id=article_id,
            client_id=payload.client_id,
            vote_type=payload.direction
        )
        db.add(new_vote)
        if payload.direction == 1:
            article.upvotes += 1
        else:
            article.downvotes += 1
        current_user_vote = payload.direction

    db.commit()
    db.refresh(article)

    return {
        "article_id": article.id,
        "upvotes": article.upvotes,
        "downvotes": article.downvotes,
        "vote_balance": article.upvotes - article.downvotes,
        "user_vote": current_user_vote
    }

@app.get("/api/topics")
def get_available_topics(db: Session = Depends(get_db)):
    predefined = [
        "Política", "Economia", "Tecnologia", "Saúde", 
        "Ciência", "Mundo", "Educação", "Meio Ambiente"
    ]
    # Buscar categorias reais no banco
    db_cats = db.query(NewsArticle.category).distinct().all()
    categories = set(predefined)
    for c in db_cats:
        if c[0]:
            categories.add(c[0])

    return {"categories": sorted(list(categories))}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(NewsArticle).count()
    if total == 0:
        return {
            "total_news": 0,
            "reliable_count": 0,
            "suspicious_count": 0,
            "fake_count": 0,
            "total_votes": 0,
            "reliable_percentage": 0.0
        }

    reliable = db.query(NewsArticle).filter(NewsArticle.reliability_score >= 70.0).count()
    suspicious = db.query(NewsArticle).filter(NewsArticle.reliability_score >= 40.0, NewsArticle.reliability_score < 70.0).count()
    fake = db.query(NewsArticle).filter(NewsArticle.reliability_score < 40.0).count()

    from sqlalchemy import func
    votes_sum = db.query(func.sum(NewsArticle.upvotes) + func.sum(NewsArticle.downvotes)).scalar() or 0

    return {
        "total_news": total,
        "reliable_count": reliable,
        "suspicious_count": suspicious,
        "fake_count": fake,
        "total_votes": votes_sum,
        "reliable_percentage": round((reliable / total) * 100, 1)
    }

@app.post("/api/sync")
def trigger_sync():
    """
    Endpoint manual para forçar busca e análise de notícias
    """
    count = ingest_news(force=True)
    return {"message": f"Sincronização concluída. {count} novas notícias adicionadas."}

