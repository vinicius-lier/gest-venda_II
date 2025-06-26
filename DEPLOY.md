# Deploy no Heroku - Gestão Operacional de Vendas

## Pré-requisitos

1. Ter uma conta no Heroku (https://heroku.com)
2. Ter o Heroku CLI instalado (https://devcenter.heroku.com/articles/heroku-cli)
3. Ter o Git instalado
4. Ter o projeto configurado com Git

## Passos para Deploy

### 1. Login no Heroku
```bash
heroku login
```

### 2. Criar aplicação no Heroku
```bash
heroku create nome-da-sua-app
```

### 3. Adicionar banco de dados PostgreSQL
```bash
heroku addons:create heroku-postgresql:mini
```

### 4. Configurar variáveis de ambiente
```bash
heroku config:set SECRET_KEY="sua-chave-secreta-aqui"
heroku config:set DEBUG=False
```

### 5. Fazer commit das alterações
```bash
git add .
git commit -m "Configuração para deploy no Heroku"
```

### 6. Fazer deploy
```bash
git push heroku main
```

### 7. Executar migrações
```bash
heroku run python manage.py migrate
```

### 8. Criar superusuário (opcional)
```bash
heroku run python manage.py createsuperuser
```

### 9. Abrir a aplicação
```bash
heroku open
```

## Arquivos de Configuração Criados

- `Procfile`: Define como o Heroku deve executar a aplicação
- `runtime.txt`: Especifica a versão do Python
- `requirements.txt`: Lista todas as dependências
- `app.json`: Configuração da aplicação no Heroku
- `build.sh`: Script de build personalizado
- `.gitignore`: Exclui arquivos desnecessários do deploy

## Configurações de Produção

O arquivo `settings.py` foi configurado para:
- Usar PostgreSQL em produção
- Configurar WhiteNoise para servir arquivos estáticos
- Configurar segurança HTTPS
- Usar variáveis de ambiente para configurações sensíveis

## Troubleshooting

### Se houver problemas com static files:
```bash
heroku run python manage.py collectstatic --noinput
```

### Para ver os logs:
```bash
heroku logs --tail
```

### Para acessar o shell do Django:
```bash
heroku run python manage.py shell
```

### Para reiniciar a aplicação:
```bash
heroku restart
```

## URLs Importantes

- Aplicação: https://nome-da-sua-app.herokuapp.com
- Admin: https://nome-da-sua-app.herokuapp.com/admin
- Dashboard: https://nome-da-sua-app.herokuapp.com/dashboard

## Notas Importantes

1. O banco de dados será PostgreSQL em produção
2. Os arquivos de mídia não são persistentes no Heroku (use AWS S3 para produção)
3. Os logs são enviados para o console do Heroku
4. A aplicação usa HTTPS automaticamente
5. O modo DEBUG está desabilitado em produção por segurança 