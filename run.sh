#!/bin/bash

# Tentar carregar NVM se existir no sistema
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    \. "$NVM_DIR/nvm.sh"
fi

# Detectar versões de Node instaladas pelo NVM se não carregado automaticamente
NVM_LATEST_NODE=$(ls -d "$HOME/.nvm/versions/node/"* 2>/dev/null | tail -n 1)
[ -n "$NVM_LATEST_NODE" ] && export PATH="$NVM_LATEST_NODE/bin:$PATH"

# Adicionar caminhos comuns do Node e gerenciadores de pacotes ao PATH
export PATH="$HOME/.local/node/bin:$HOME/.volta/bin:$HOME/.fnm/current/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# Garantir que o script sempre execute a partir da raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "    Iniciando Radar Fake News (Twitter-Style)    "
echo "=================================================="

# 1. Verificar se python3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Erro: Python 3 não foi encontrado."
    echo "Instale o Python 3.10+ para continuar: https://www.python.org"
    exit 1
fi

# 2. Verificar se npm (Node.js) está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: 'npm' (Node.js) não foi encontrado neste computador."
    echo ""
    echo "👉 Para rodar a interface do projeto, instale o Node.js:"
    echo "   Opção 1 (Instalador): Baixe a versão LTS em https://nodejs.org"
    echo "   Opção 2 (Terminal):    brew install node"
    echo ""
    exit 1
fi

# 3. Configurar backend (.venv e dependências) se não existirem
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

# 4. Verificar pasta e dependências do frontend
if [ ! -d "frontend" ]; then
    echo "❌ Erro: Pasta 'frontend' não encontrada em $SCRIPT_DIR"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Dependências do frontend não encontradas. Executando 'npm install'..."
    (cd frontend && npm install)
    echo "✅ Dependências do frontend instaladas com sucesso!"
fi

# 5. Criar API-News.env a partir do template se não existir
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
