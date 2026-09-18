import logging
from apscheduler.schedulers.background import BackgroundScheduler
from backend.news_service import ingest_news

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def start_scheduler():
    """
    Inicia o agendador para rodar a cada 12 horas, respeitando os limites da NewsAPI.
    """
    if not scheduler.running:
        scheduler.add_job(
            ingest_news,
            trigger="interval",
            hours=12,
            id="news_ingest_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Agendador de ingestão iniciado (execução a cada 12 horas).")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Agendador encerrado.")

