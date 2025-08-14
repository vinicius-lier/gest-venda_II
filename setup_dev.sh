#!/bin/bash

echo "🔧 Configurando ambiente de desenvolvimento..."

# Verificar se estamos no diretório correto
if [ ! -f "manage.py" ]; then
    echo "❌ Execute este script na raiz do projeto (onde está o manage.py)"
    exit 1
fi

echo "📋 Verificando dependências do sistema..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale o Python 3.8+ primeiro."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python $PYTHON_VERSION encontrado"

# Verificar pip
if ! command -v pip &> /dev/null; then
    echo "❌ pip não encontrado. Instale o pip primeiro."
    exit 1
fi

echo "✅ pip encontrado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 16+ primeiro."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm $NPM_VERSION encontrado"

echo ""
echo "🐍 Configurando Backend Django..."

# Instalar dependências Python
echo "📦 Instalando dependências Python..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências Python"
    exit 1
fi

echo "✅ Dependências Python instaladas"

# Aplicar migrações
echo "🗄️  Aplicando migrações do banco de dados..."
python3 manage.py migrate || {
    echo "⚠️  Aviso: Problemas com migrações. Continuando..."
    echo "💡 Dica: Execute 'python3 manage.py migrate' manualmente se necessário"
}

echo "✅ Configuração do banco concluída"

# Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
python3 manage.py collectstatic --noinput || {
    echo "⚠️  Aviso: Problemas ao coletar arquivos estáticos. Continuando..."
}

echo "✅ Configuração de arquivos estáticos concluída"

echo ""
echo "⚛️  Configurando Frontend React..."

# Verificar se a pasta frontend existe
if [ ! -d "frontend" ]; then
    echo "❌ Pasta frontend não encontrada"
    exit 1
fi

cd frontend

# Instalar dependências Node.js
echo "📦 Instalando dependências Node.js..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências Node.js"
    exit 1
fi

echo "✅ Dependências Node.js instaladas"

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "✅ Arquivo .env criado"
else
    echo "✅ Arquivo .env já existe"
fi

cd ..

echo ""
echo "🎉 Ambiente de desenvolvimento configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: ./run_dev.sh"
echo "2. Acesse: http://localhost:3000 (Frontend)"
echo "3. Acesse: http://localhost:8000/admin (Admin Django)"
echo ""
echo "🔧 Comandos úteis:"
echo "   ./run_dev.sh          - Executar backend + frontend"
echo "   ./build_production.sh - Build para produção"
echo "   python manage.py runserver - Apenas backend"
echo "   cd frontend && npm start - Apenas frontend"
