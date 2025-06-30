# Configuração de Secrets para GitHub Actions

Para que o deploy automático funcione, você precisa configurar os seguintes secrets no seu repositório GitHub:

## Como Configurar Secrets

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** > **Actions**
4. Clique em **New repository secret**

## Secrets Necessários

### 1. HEROKU_API_KEY
- **Descrição**: Chave de API do Heroku
- **Como obter**:
  1. Faça login no Heroku CLI: `heroku login`
  2. Execute: `heroku authorizations:create`
  3. Copie o token gerado

### 2. HEROKU_EMAIL
- **Descrição**: Email da sua conta Heroku
- **Valor**: Seu email cadastrado no Heroku

## Configuração Manual (Alternativa)

Se preferir não usar GitHub Actions, você pode usar os scripts locais:

### Windows (PowerShell)
```powershell
.\deploy.ps1 "Sua mensagem de commit"
```

### Linux/Mac (Bash)
```bash
./deploy.sh "Sua mensagem de commit"
```

## Verificação

Após configurar os secrets, faça um commit e push para testar o deploy automático:

```bash
git add .
git commit -m "Teste deploy automático"
git push origin fix-dashboard
```

O GitHub Action será executado automaticamente e fará o deploy no Heroku. 