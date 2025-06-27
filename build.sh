#!/bin/bash

echo "Iniciando build do projeto..."

# Instalar dependências
pip install -r requirements.txt

# Executar migrações
python manage.py migrate 

# Coletar arquivos estáticos
python manage.py collectstatic --noinput

# Configurar usuários do sistema automaticamente
echo "Configurando usuários do sistema..."
python manage.py setup_users

echo "Build concluído com sucesso!" 