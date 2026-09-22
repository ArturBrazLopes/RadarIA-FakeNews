#!/bin/bash

# Adicionar Node e caminhos comuns ao PATH
export PATH="/Users/aluno2/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# Garantir que o script sempre execute a partir da raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "    Iniciando Radar Fake News (Twitter-Style)    "
echo "=================================================="

# Verificar ambiente virtual
if [ ! -f ".venv/bin/uvicorn" ]; then
    echo "❌ Erro: Uvicorn não encontrado em $SCRIPT_DIR/.venv/bin/uvicorn"
    echo "Certifique-se de que o ambiente virtual está configurado."
    exit 1
fi

# Verificar frontend
if [ ! -d "frontend" ]; then
    echo "❌ Erro: Pasta 'frontend' não encontrada em $SCRIPT_DIR"
    exit 1
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

