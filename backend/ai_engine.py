import os
import logging
from typing import Tuple, List, Dict
import torch

logger = logging.getLogger(__name__)

class FakeNewsClassifier:
    _instance = None

    def __init__(self, model_path: str = None):
        self.device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        
        # Determine model path
        if not model_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            candidate = os.path.join(base_dir, "modelo-fake-news-finetuned")
            model_path = os.getenv("MODEL_PATH", candidate)
        
        self.model_path = model_path
        self.load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = FakeNewsClassifier()
        return cls._instance

    def load_model(self):
        try:
            if not os.path.exists(self.model_path):
                logger.warning(f"Pasta do modelo não encontrada em {self.model_path}. Usando modo de fallback.")
                return

            logger.info(f"Carregando modelo e tokenizer de {self.model_path} no dispositivo {self.device}...")
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info("Modelo de 0.6B carregado com sucesso e pronto para inferência!")
        except Exception as e:
            logger.error(f"Erro ao carregar o modelo de 0.6B: {e}", exc_info=True)
            self.is_loaded = False

    def predict(self, title: str, description: str = "") -> Tuple[float, str]:
        """
        Analisa uma notícia (título + descrição) e retorna (porcentagem_confiabilidade, rotulo)
        """
        results = self.predict_batch([{"title": title, "description": description}])
        return results[0]

    def predict_batch(self, items: List[Dict[str, str]]) -> List[Tuple[float, str]]:
        """
        Analisa em lote para alta performance
        """
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            # Fallback seguro caso o modelo não esteja em memória
            return [(75.0, "Confiável") for _ in items]

        texts = []
        for item in items:
            t = (item.get("title") or "").strip()
            d = (item.get("description") or "").strip()
            full_text = f"{t}. {d}" if d else t
            texts.append(full_text if full_text else "Sem conteúdo")

        try:
            inputs = self.tokenizer(
                texts,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt"
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1)

            results = []
            for prob in probs:
                # prob[1] é a classe de notícia real/confiável
                confidence = float(prob[1].item() * 100.0)
                confidence = round(confidence, 1)

                if confidence >= 70.0:
                    label = "Confiável"
                elif confidence >= 40.0:
                    label = "Duvidoso"
                else:
                    label = "Provável Fake"

                results.append((confidence, label))

            return results
        except Exception as e:
            logger.error(f"Erro durante a inferência em lote: {e}")
            return [(50.0, "Duvidoso") for _ in items]

# Instância global reutilizável
classifier = FakeNewsClassifier.get_instance()

