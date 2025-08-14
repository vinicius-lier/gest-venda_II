#!/bin/bash

echo "🚀 Iniciando sistema Backend Django + Frontend React..."

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale o Python primeiro."
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

echo "✅ Dependências verificadas"

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Parando todos os processos..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar Backend Django
echo "🐍 Iniciando Backend Django na porta 8000..."
python3 manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Aguardar um pouco para o backend inicializar
sleep 3

# Verificar se o backend iniciou corretamente
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Erro ao iniciar o backend Django"
    exit 1
fi

echo "✅ Backend Django iniciado (PID: $BACKEND_PID)"

# Iniciar Frontend React
echo "⚛️  Iniciando Frontend React na porta 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Aguardar um pouco para o frontend inicializar
sleep 5

# Verificar se o frontend iniciou corretamente
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Erro ao iniciar o frontend React"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend React iniciado (PID: $FRONTEND_PID)"
echo ""
echo "🎉 Sistema iniciado com sucesso!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📊 Admin Django: http://localhost:8000/admin"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait
