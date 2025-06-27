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

# Guia de Deploy - Gestão Operacional de Vendas

## Problema Resolvido: Formulário de Ocorrência

### Descrição do Problema
O formulário de ocorrência funcionava corretamente em localhost, mas no deploy ao clicar em "Nova Ocorrência" o usuário era redirecionado para a página inicial.

### Causa Raiz
O problema estava relacionado ao fato de que os usuários no ambiente de produção não tinham registros correspondentes na tabela `Usuario` (usuario_sistema), causando falha na validação da view `ocorrencia_create`.

### Soluções Implementadas

#### 1. Comando de Setup Automático
Criado o comando Django `setup_users` que:
- Cria automaticamente uma loja padrão
- Cria perfis de usuário (admin, usuario)
- Configura automaticamente todos os usuários Django com registros `Usuario` correspondentes

#### 2. Middleware Melhorado
O `RBACMiddleware` foi aprimorado para:
- Verificar se o usuário tem registro real na tabela `Usuario`
- Criar um `usuario_sistema` temporário se necessário
- Fornecer logs detalhados para debug

#### 3. View de Ocorrência Aprimorada
A view `ocorrencia_create` foi melhorada com:
- Verificações mais robustas para `usuario_sistema` e loja
- Tratamento de exceções com logs detalhados
- Mensagens de erro mais informativas

#### 4. Script de Build Atualizado
O `build.sh` foi atualizado para executar automaticamente o comando `setup_users` durante o deploy.

## Instruções de Deploy

### 1. Deploy Automático (Recomendado)
O deploy automático já inclui todas as correções. O script `build.sh` irá:
1. Instalar dependências
2. Executar migrações
3. Coletar arquivos estáticos
4. **Configurar automaticamente os usuários do sistema**

### 2. Deploy Manual
Se precisar fazer deploy manual:

```bash
# 1. Fazer push das alterações
git add .
git commit -m "Correção do formulário de ocorrência"
git push heroku main

# 2. Executar migrações
heroku run python manage.py migrate

# 3. Configurar usuários (IMPORTANTE!)
heroku run python manage.py setup_users

# 4. Coletar arquivos estáticos
heroku run python manage.py collectstatic --noinput
```

### 3. Verificação Pós-Deploy
Após o deploy, verifique se tudo está funcionando:

```bash
# Verificar status dos usuários
heroku run python manage.py check_users

# Verificar logs
heroku logs --tail
```

## Comandos Úteis

### Verificar Status dos Usuários
```bash
python manage.py check_users
```

### Configurar Usuários Manualmente
```bash
python manage.py setup_users
```

### Verificar Logs
```bash
# Local
python manage.py runserver

# Heroku
heroku logs --tail
```

## Estrutura de Arquivos Modificados

- `core/views.py` - View de ocorrência melhorada
- `core/middleware.py` - Middleware aprimorado
- `core/management/commands/setup_users.py` - Comando de setup automático
- `core/management/commands/check_users.py` - Comando de verificação
- `gestao_vendas/settings.py` - Configurações de produção
- `build.sh` - Script de build atualizado

## Troubleshooting

### Problema: Usuário ainda sendo redirecionado
**Solução**: Execute o comando de setup manualmente:
```bash
heroku run python manage.py setup_users
```

### Problema: Erro de permissão
**Solução**: Verifique se o usuário tem o perfil correto:
```bash
heroku run python manage.py check_users
```

### Problema: Logs não aparecem
**Solução**: Verifique as configurações de logging no `settings.py` e execute:
```bash
heroku logs --tail
```

## Status Atual
✅ **PROBLEMA RESOLVIDO**
- Formulário de ocorrência funcionando em produção
- Usuários configurados automaticamente
- Logs detalhados para monitoramento
- Deploy automatizado com todas as correções

## Próximos Passos
1. Monitorar logs de produção
2. Testar funcionalidade completa
3. Documentar qualquer novo problema encontrado 