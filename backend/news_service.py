import os
import logging
from datetime import datetime
from typing import List, Dict, Any
import httpx
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import NewsArticle
from backend.ai_engine import FakeNewsClassifier

logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente (.env e API-News.env)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, ".env"))
load_dotenv(os.path.join(base_dir, "API-News.env"))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "").strip()

# Categorias mapeadas para a NewsAPI
NEWSAPI_CATEGORIES = {
    "tecnologia": "technology",
    "ciência": "science",
    "saúde": "health",
    "economia": "business",
    "entretenimento": "entertainment",
    "esportes": "sports",
    "geral": "general"
}

FALLBACK_SAMPLE_NEWS = [
    {
        "title": "Anvisa aprova novo tratamento inovador para controle do diabetes tipo 2",
        "description": "Estudos clínicos de fase 3 confirmaram a eficácia e segurança da nova medicação desenvolvida com biotecnologia.",
        "content": "A Agência Nacional de Vigilância Sanitária (Anvisa) deu parecer favorável ao uso de um novo medicamento para pacientes com diabetes.",
        "url": "https://g1.globo.com/saude/noticia/2026/09/anvisa-aprova-tratamento-diabetes.ghtml",
        "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop",
        "source_name": "G1 Saúde",
        "category": "Saúde",
        "published_at": datetime.utcnow()
    },
    {
        "title": "URGENTE: Chá de casca de banana cura qualquer infecção viral em 12 horas sem remédios!",
        "description": "Mensagens viralizam em grupos afirmando que hospitais escondem a receita milagrosa que promete eliminar vírus instantaneamente.",
        "content": "Publicações que circulam nas redes sociais alegam que ferver casca de banana cura doenças graves. Especialistas e médicos alertam que a informação é falsa e sem base científica.",
        "url": "https://fatooufake.globo.com/checagem/noticia/2026/09/cha-casca-banana-cura.ghtml",
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop",
        "source_name": "Fato ou Fake",
        "category": "Saúde",
        "published_at": datetime.utcnow()
    },
    {
        "title": "Telescópio James Webb identifica atmosfera com vapor d'água em exoplaneta rochoso",
        "description": "Dados da NASA e da ESA revelam novas pistas fascinantes sobre a habitabilidade fora do nosso sistema solar.",
        "content": "Astrônomos confirmaram nesta semana uma das observações mais detalhadas já registradas da atmosfera de um exoplaneta rochoso distante.",
        "url": "https://canaltech.com.br/astronomia/telescopio-james-webb-atmosfera-exoplaneta-2026/",
        "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
        "source_name": "Canaltech",
        "category": "Ciência",
        "published_at": datetime.utcnow()
    },
    {
        "title": "Governo vai confiscar saldo da poupança de todos os correntistas na próxima segunda-feira",
        "description": "Áudios espalhados pelo WhatsApp dizem que decreto secreto do Banco Central autorizou o bloqueio de investimentos.",
        "content": "O Banco Central e o Ministério da Fazenda emitiram nota oficial desmentindo boatos sobre qualquer plano de confisco financeiro.",
        "url": "https://uol.com.br/economia/confisco-poupanca-boato-2026.htm",
        "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop",
        "source_name": "UOL Confere",
        "category": "Economia",
        "published_at": datetime.utcnow()
    },
    {
        "title": "Startup brasileira lança processador quântico de alta eficiência para computação em nuvem",
        "description": "Projeto liderado por pesquisadores da Unicamp recebe investimento de 100 milhões para acelerar pesquisa em IA.",
        "content": "A inovação coloca o Brasil na vanguarda da corrida quântica aplicada à criptografia e computação de alta performance.",
        "url": "https://tecmundo.com.br/computacao/processador-quantico-brasil-2026.htm",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop",
        "source_name": "TecMundo",
        "category": "Tecnologia",
        "published_at": datetime.utcnow()
    }
]


def fetch_from_newsapi() -> List[Dict[str, Any]]:
    """
    Busca as principais notícias do Brasil usando a NewsAPI.org
    """
    key = os.getenv("NEWS_API_KEY", "").strip()
    if not key:
        logger.warning("NEWS_API_KEY não configurada no .env. Usando notícias de demonstração.")
        return []

    collected_articles = []
    # 1 requisição para top-headlines do Brasil
    url = f"https://newsapi.org/v2/top-headlines?country=br&pageSize=30&apiKey={key}"
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                articles = data.get("articles", [])
                for a in articles:
                    if not a.get("title") or a.get("title") == "[Removed]":
                        continue
                    pub_str = a.get("publishedAt")
                    try:
                        pub_dt = datetime.fromisoformat(pub_str.replace("Z", "+00:00")) if pub_str else datetime.utcnow()
                    except Exception:
                        pub_dt = datetime.utcnow()

                    collected_articles.append({
                        "title": a.get("title"),
                        "description": a.get("description") or "",
                        "content": a.get("content") or "",
                        "url": a.get("url"),
                        "image_url": a.get("urlToImage"),
                        "source_name": a.get("source", {}).get("name") or "Notícia",
                        "category": "Geral",
                        "published_at": pub_dt
                    })
            else:
                logger.error(f"Erro na requisição da NewsAPI (Status {resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Falha de conexão com NewsAPI: {e}")

    return collected_articles


def ingest_news(force: bool = False) -> int:
    """
    Executa a busca de notícias, filtra duplicadas, roda a IA treinada de 0.6B e salva no banco de dados.
    Retorna o número de novas notícias inseridas.
    """
    db: Session = SessionLocal()
    try:
        articles_data = fetch_from_newsapi()
        
        # Se não retornou nada da API (sem chave ou sem internet), e o banco está vazio, alimenta com o acervo inicial
        existing_count = db.query(NewsArticle).count()
        if not articles_data and (existing_count == 0 or force):
            logger.info("Usando catálogo padrão de notícias para alimentar o sistema inicial.")
            articles_data = FALLBACK_SAMPLE_NEWS

        if not articles_data:
            logger.info("Nenhuma nova notícia para processar.")
            return 0

        # Filtrar as que já existem no banco
        new_items = []
        for item in articles_data:
            url = item.get("url")
            if not url:
                continue
            exists = db.query(NewsArticle).filter(NewsArticle.url == url).first()
            if not exists:
                new_items.append(item)

        if not new_items:
            logger.info("Todas as notícias obtidas já existem no banco.")
            return 0

        logger.info(f"Analisando {len(new_items)} novas notícias com o modelo de IA de 0.6B...")
        classifier = FakeNewsClassifier.get_instance()
        
        # Inferência em lote com o modelo de IA
        predictions = classifier.predict_batch(new_items)

        inserted_count = 0
        for item, (score, label) in zip(new_items, predictions):
            article = NewsArticle(
                title=item["title"],
                description=item.get("description"),
                content=item.get("content"),
                url=item["url"],
                image_url=item.get("image_url"),
                source_name=item.get("source_name"),
                published_at=item.get("published_at", datetime.utcnow()),
                category=item.get("category", "Geral"),
                reliability_score=score,
                reliability_label=label,
                upvotes=10 if score >= 70 else 2,  # upvotes iniciais dinâmicos
                downvotes=1 if score >= 70 else 8
            )
            db.add(article)
            inserted_count += 1

        db.commit()
        logger.info(f"Sucesso! {inserted_count} novas notícias analisadas e armazenadas no banco.")
        return inserted_count
    except Exception as e:
        db.rollback()
        logger.error(f"Erro durante a ingestão de notícias: {e}", exc_info=True)
        return 0
    finally:
        db.close()

