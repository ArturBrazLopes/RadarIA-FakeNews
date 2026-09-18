# RadarIA - Plataforma de Verificação de Fake News

Uma plataforma moderna para auditoria, checagem e monitoramento de notícias em tempo real, combinando **Inteligência Artificial (modelo fine-tuned de 0.6B)**, layout inspirado no **Twitter/X em tons escuros e roxo translúcido (*Glassmorphism*)** e validação comunitária com **sistema de Upvotes/Downvotes estilo Reddit**.

---

## Demonstração do Projeto

- **Layout Twitter/X:** Navegação lateral com colunas fixas e feed central fluido.
- **Glassmorphism Escuro:** Interface moderna em tons de preto (`#08050e`) com detalhes em roxo vibrante e efeito de vidro translúcido (`backdrop-blur`).
- **Selo de Confiabilidade por IA:** Cada notícia recebe uma porcentagem e selo visual calibrado:
  - 🟢 **Confiável (>= 70%):** Alta probabilidade de veracidade factual.
  - 🟡 **Duvidoso (40% - 69%):** Informação parcial, alarmista ou não confirmada.
  - 🔴 **Alto Risco de Fake (< 40%):** Boato sensacionalista ou desinformação.
- **Votação Estilo Reddit:** Botões de Upvote e Downvote com balanço de votos da comunidade e atualização instantânea.

---

## As 3 Telas Principais do Feed

1. **Em Alta (Trending):** As notícias mais relevantes no topo, ranqueadas pelo saldo de Upvotes da comunidade + repercussão da matéria.
2. **Meus Tópicos:** Feed personalizado de acordo com as preferências do usuário. Conta com chips clicáveis de categorias pré-definidas (*Tecnologia, Saúde, Ciência, Política, Economia, etc.*) e suporte para adicionar tags personalizadas salvas diretamente no navegador (`LocalStorage`, sem exigir login).
3. **Recentes:** Linha do tempo cronológica com as últimas notícias checadas pelo sistema.

---

## Arquitetura da Inteligência Artificial

- **Arquitetura Base:** `XLMRobertaForSequenceClassification` (560M parâmetros, ~0.6B).
- **Fine-Tuning:** Calibrado especificamente para o português brasileiro na classificação de desinformação vs notícias jornalísticas reais.
- **Inferência:** Executada localmente via PyTorch / Hugging Face Transformers com suporte à aceleração por hardware (Apple Silicon MPS / GPU / CPU).
- **Ingestão Periódica:** Integração com **NewsAPI.org** gerenciada por um agendador (`APScheduler`) que roda automaticamente a cada **12 horas**, respeitando a cota da API gratuita e evitando sobrecargas.

---

## Tecnologias Utilizadas

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** (design system customizado com tons roxos, sombras neon e classes de vidro translúcido)
- **Lucide React** (ícones vetoriais modernos)
- **LocalStorage API** (persistência de tópicos favoritos e identificador anônimo para votos)

### Backend
- **Python 3.11+ / 3.14**
- **FastAPI** + **Uvicorn** (API REST de alta performance)
- **PyTorch** + **Hugging Face Transformers** + **Safetensors** (inferência do modelo de 0.6B)
- **SQLAlchemy** + **SQLite** (armazenamento leve e ágil de matérias e votos)
- **APScheduler** (agendamento da rotina a cada 12 horas)
- **HTTPX** (requisições assíncronas para a NewsAPI)

---

## Como Executar o Projeto

### Pré-requisitos
- **Python 3.10+** (recomendado com ambiente virtual)
- **Node.js 18+** e **npm**

### 1. Clonar o Repositório
```bash
git clone https://github.com/ArturBrazLopes/RadarIA-FakeNews.git
cd RadarIA-FakeNews
```

### 2. Configurar o Modelo de IA
Coloque os arquivos do seu modelo treinado (ou descompacte o arquivo `.zip` com os pesos) na pasta `modelo-fake-news-finetuned/` na raiz do projeto:
```text
modelo-fake-news-finetuned/
├── config.json
├── model.safetensors
├── tokenizer.json
└── tokenizer_config.json
```
*(Caso os pesos não estejam presentes, o sistema iniciará em modo de simulação/fallback seguro sem quebrar o servidor).*

### 3. Configurar a Chave da NewsAPI
Crie o arquivo `API-News.env` na raiz do projeto (ou copie de `API-News.env.example`) e insira sua chave gratuita da [NewsAPI.org](https://newsapi.org):
```env
NEWS_API_KEY=sua_chave_aqui
```

### 4. Instalar Dependências e Executar

#### Opção A: Executar tudo com um único comando (Recomendado)
```bash
chmod +x run.sh
./run.sh
```

#### Opção B: Executar manualmente os serviços separadamente

**Backend:**
```bash
# Criar e ativar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar pacotes
pip install -r backend/requirements.txt

# Iniciar servidor
uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Endpoints da API

- `GET /api/health` - Status do servidor e confirmação de carregamento do modelo de IA.
- `GET /api/news?tab=trending|topics|recent` - Retorna o feed de notícias filtrado ou ordenado.
- `POST /api/news/{id}/vote` - Registra ou alterna Upvotes/Downvotes com contagem da comunidade.
- `GET /api/topics` - Lista as categorias ativas no banco de dados.
- `GET /api/stats` - Retorna totais de notícias checadas, % de confiabilidade geral e total de votos.
- `POST /api/sync` - Força uma busca e análise imediata de notícias.

A documentação interativa Swagger fica disponível em: `http://localhost:8000/docs`

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
Desenvolvido por Artur Braz Lopes.
