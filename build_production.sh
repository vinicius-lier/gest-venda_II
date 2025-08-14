#!/bin/bash

echo "🏗️  Construindo aplicação para produção..."

# Verificar se estamos no diretório correto
if [ ! -f "manage.py" ]; then
    echo "❌ Execute este script na raiz do projeto (onde está o manage.py)"
    exit 1
fi

# Verificar se o frontend existe
if [ ! -d "frontend" ]; then
    echo "❌ Pasta frontend não encontrada"
    exit 1
fi

echo "📦 Instalando dependências do frontend..."
cd frontend

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado na pasta frontend"
    exit 1
fi

# Instalar dependências
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi

echo "🔨 Fazendo build do React..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do React"
    exit 1
fi

cd ..

echo "✅ Build do React concluído"

# Verificar se o build foi criado
if [ ! -d "frontend/build" ]; then
    echo "❌ Pasta build não foi criada"
    exit 1
fi

echo "🐍 Coletando arquivos estáticos do Django..."
python3 manage.py collectstatic --noinput

if [ $? -ne 0 ]; then
    echo "❌ Erro ao coletar arquivos estáticos"
    exit 1
fi

echo "✅ Arquivos estáticos coletados"

echo "📋 Verificando migrações..."
python3 manage.py makemigrations --check

if [ $? -ne 0 ]; then
    echo "⚠️  Existem migrações pendentes. Execute: python manage.py makemigrations"
fi

echo ""
echo "🎉 Build de produção concluído com sucesso!"
echo ""
echo "📁 Arquivos gerados:"
echo "   - frontend/build/ (React build)"
echo "   - staticfiles/ (Django static files)"
echo ""
echo "🚀 Para executar em produção:"
echo "   python manage.py runserver 0.0.0.0:8000"
echo ""
echo "📊 Ou use Gunicorn:"
echo "   gunicorn gestao_vendas.wsgi:application --bind 0.0.0.0:8000"
