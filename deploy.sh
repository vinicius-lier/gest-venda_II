#!/bin/bash

# Script de Deploy Automático para Heroku
# Uso: ./deploy.sh [mensagem_commit]

echo "🚀 Iniciando deploy automático..."

# Verificar se há mudanças para commitar
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Nenhuma mudança detectada"
    exit 0
fi

# Mensagem de commit padrão ou personalizada
COMMIT_MESSAGE=${1:-"Deploy automático - $(date '+%Y-%m-%d %H:%M:%S')"}

echo "📝 Commit message: $COMMIT_MESSAGE"

# Adicionar todas as mudanças
echo "📦 Adicionando arquivos..."
git add .

# Fazer commit
echo "💾 Fazendo commit..."
git commit -m "$COMMIT_MESSAGE"

# Fazer push para o GitHub
echo "⬆️ Fazendo push para GitHub..."
git push origin fix-dashboard

# Fazer push para o Heroku
echo "🚀 Fazendo deploy no Heroku..."
git push heroku fix-dashboard:main

# Executar migrações
echo "🔄 Executando migrações..."
heroku run python manage.py migrate --app gestao-vendas-prado-novo

# Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
heroku run python manage.py collectstatic --noinput --app gestao-vendas-prado-novo

# Limpar arquivos temporários
echo "🧹 Limpando arquivos temporários..."
heroku run python manage.py cleanup_temp_files --force --app gestao-vendas-prado-novo

echo "✅ Deploy concluído com sucesso!"
echo "🌐 URL: https://gestao-vendas-prado-novo-502f3420b042.herokuapp.com/" 