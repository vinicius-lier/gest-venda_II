# Script de Deploy Automático para Heroku (PowerShell)
# Uso: .\deploy.ps1 [mensagem_commit]

param(
    [string]$CommitMessage = ""
)

Write-Host "Iniciando deploy automático..." -ForegroundColor Green

# Verificar se há mudanças para commitar
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "Nenhuma mudança detectada" -ForegroundColor Yellow
    exit 0
}

# Mensagem de commit padrão ou personalizada
if ([string]::IsNullOrEmpty($CommitMessage)) {
    $CommitMessage = "Deploy automático - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

Write-Host "Commit message: $CommitMessage" -ForegroundColor Cyan

# Adicionar todas as mudanças
Write-Host "Adicionando arquivos..." -ForegroundColor Blue
git add .

# Fazer commit
Write-Host "Fazendo commit..." -ForegroundColor Blue
git commit -m $CommitMessage

# Fazer push para o GitHub
Write-Host "Fazendo push para GitHub..." -ForegroundColor Blue
git push origin fix-dashboard

# Fazer push para o Heroku
Write-Host "Fazendo deploy no Heroku..." -ForegroundColor Blue
git push heroku fix-dashboard:main

# Executar migrações
Write-Host "Executando migrações..." -ForegroundColor Blue
heroku run python manage.py migrate --app gestao-vendas-prado-novo

# Coletar arquivos estáticos
Write-Host "Coletando arquivos estáticos..." -ForegroundColor Blue
heroku run python manage.py collectstatic --noinput --app gestao-vendas-prado-novo

# Limpar arquivos temporários
Write-Host "Limpando arquivos temporários..." -ForegroundColor Blue
heroku run python manage.py cleanup_temp_files --force --app gestao-vendas-prado-novo

Write-Host "Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "URL: https://gestao-vendas-prado-novo-502f3420b042.herokuapp.com/" -ForegroundColor Cyan 