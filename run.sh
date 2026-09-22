#!/bin/bash

# Adicionar Node e caminhos comuns ao PATH
export PATH="/Users/aluno2/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# Garantir que o script sempre execute a partir da raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "    Iniciando Radar Fake News (Twitter-Style)    "
echo "=================================================="

# Verificar se python3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Erro: Python 3 não foi encontrado. Instale o Python 3.10+ para continuar."
    exit 1
fi

# 1. Configurar backend (.venv e dependências) se não existirem
if [ ! -f ".venv/bin/uvicorn" ]; then
    echo "⚠️  Ambiente virtual (.venv) ou uvicorn não encontrado."
    echo "📦 Criando ambiente virtual e instalando dependências do backend..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r backend/requirements.txt
    
    if [ ! -f ".venv/bin/uvicorn" ]; then
        echo "❌ Falha ao instalar uvicorn. Tente executar manualmente:"
        echo "   python3 -m venv .venv"
        echo "   source .venv/bin/activate"
        echo "   pip install -r backend/requirements.txt"
        exit 1
    fi
    echo "✅ Ambiente virtual configurado com sucesso!"
fi

# 2. Verificar pasta e dependências do frontend
if [ ! -d "frontend" ]; then
    echo "❌ Erro: Pasta 'frontend' não encontrada em $SCRIPT_DIR"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Dependências do frontend não encontradas. Executando 'npm install'..."
    if command -v npm &> /dev/null; then
        (cd frontend && npm install)
        echo "✅ Dependências do frontend instaladas com sucesso!"
    else
        echo "⚠️  Aviso: 'npm' não foi encontrado no PATH. Instale o Node.js para rodar o frontend."
    fi
fi

# 3. Criar API-News.env a partir do template se não existir
if [ ! -f "API-News.env" ] && [ -f "API-News.env.example" ]; then
    echo "ℹ️  Criando API-News.env a partir do template..."
    cp API-News.env.example API-News.env
fi

# Função de encerramento seguro
cleanup() {
    trap - INT TERM EXIT
    echo ""
    echo "Encerrando servidores..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}

trap cleanup INT TERM EXIT

# Iniciar Backend em segundo plano
echo "[1/2] Iniciando Backend FastAPI (Porta 8000)..."
.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Aguardar backend subir
sleep 2

# Iniciar Frontend Vite em segundo plano
echo "[2/2] Iniciando Frontend React (Porta 5173)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "🚀 Aplicação no ar!"
echo "👉 Acesse no seu navegador: http://localhost:5173"
echo "👉 Documentação da API:    http://localhost:8000/docs"
echo "Pressione Ctrl+C para encerrar."
echo ""

wait
