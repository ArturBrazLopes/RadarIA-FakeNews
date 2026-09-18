#!/bin/bash

# Adicionar Node ao PATH
export PATH="/Users/aluno2/.local/node/bin:$PATH"

echo "=================================================="
echo "    Iniciando Radar Fake News (Twitter-Style)    "
echo "=================================================="

# Iniciar Backend em segundo plano
echo "[1/2] Iniciando Backend FastAPI (Porta 8000)..."
.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Aguardar backend subir
sleep 2

# Iniciar Frontend Vite
echo "[2/2] Iniciando Frontend React (Porta 5173)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "echo 'Encerrando servidores...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

echo ""
echo "🚀 Aplicação no ar!"
echo "👉 Acesse no seu navegador: http://localhost:5173"
echo "👉 Documentação da API:    http://localhost:8000/docs"
echo "Pressione Ctrl+C para encerrar."
echo ""

wait

