# Melhorias na Importação de Dados

## Resumo das Modificações

### 1. Importação com Dados Divergentes

**Problema**: O sistema anterior não seguia as mesmas regras de dados, causando falhas na importação.

**Solução**: Modificação do importador para permitir importação mesmo com dados divergentes:

- **Chassis inválidos**: Substituídos por identificadores temporários (`TEMP_linha_timestamp`)
- **Campos não mapeados**: Recebem valores padrão ("NÃO INFORMADO")
- **Tratamento de erros**: Sistema tenta criar com dados mínimos se falhar

### 2. Compatibilidade com Heroku

**Problema**: Importação funcionava localmente mas falhava no Heroku.

**Solução**: Configurações específicas para ambiente de produção:

- **Diretório temporário**: Uso de `/tmp` no Heroku
- **Limite de memória**: Configurações otimizadas para uploads
- **Logs detalhados**: Melhor rastreamento de erros

### 3. Tratamento Robusto de Erros

**Melhorias implementadas**:

- Logs detalhados em todas as etapas
- Limpeza automática de arquivos temporários
- Tratamento de diferentes encodings de arquivo
- Fallback para criação com dados mínimos

## Arquivos Modificados

### 1. `core/importers.py`

**Principais mudanças**:

```python
# Antes: Rejeitava chassis inválidos
if not chassi or chassi in ['0', '*', 'N/LOCALIZADO', 'nan']:
    continue  # Ignorava a linha

# Depois: Permite importação com chassis temporário
if not chassi or chassi in ['0', '*', 'N/LOCALIZADO', 'nan', 'None', '']:
    chassi = f"TEMP_{index + 1}_{int(timezone.now().timestamp())}"
```

**Campos com valores padrão**:
- `marca`: "NÃO INFORMADO"
- `modelo`: "NÃO INFORMADO" 
- `ano`: "NÃO INFORMADO"
- `cor`: "NÃO INFORMADO"
- `status`: "estoque"
- `tipo_entrada`: "usada"
- `origem`: "cliente"

### 2. `core/views.py`

**Melhorias nas views**:

- Uso de configurações do `settings.py` para diretórios temporários
- Melhor tratamento de erros com logs
- Remoção da obrigatoriedade de campos no mapeamento
- Limpeza automática de arquivos temporários

### 3. `gestao_vendas/settings.py`

**Configurações específicas para Heroku**:

```python
if IS_PRODUCTION:
    TEMP_DIR = '/tmp'
    FILE_UPLOAD_TEMP_DIR = '/tmp'
    FILE_UPLOAD_MAX_MEMORY_SIZE = 2621440  # 2.5MB
    DATA_UPLOAD_MAX_MEMORY_SIZE = 2621440  # 2.5MB
else:
    TEMP_DIR = os.path.join(BASE_DIR, 'media', 'temp_uploads')
    FILE_UPLOAD_TEMP_DIR = os.path.join(BASE_DIR, 'media', 'temp_uploads')
    FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
    DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

### 4. `core/templates/core/preview_import_motocicletas.html`

**Melhorias na interface**:

- Remoção da obrigatoriedade de campos
- Instruções atualizadas sobre dados divergentes
- Melhor exibição de motos com chassis temporários
- Relatório mais detalhado

### 5. `core/management/commands/cleanup_temp_files.py`

**Comando de limpeza**:

- Limpeza automática de arquivos temporários
- Configurável por idade dos arquivos
- Compatível com Heroku

## Como Usar

### 1. Importação Básica

1. Acesse **Importação > Motocicletas**
2. Faça upload do arquivo CSV
3. Mapeie as colunas disponíveis (não é obrigatório mapear todas)
4. Clique em "Importar Motocicletas"

### 2. Campos Importantes

**Obrigatórios**: Nenhum (sistema aplica valores padrão)
**Recomendados**: marca, modelo, chassi, placa

### 3. Tratamento de Dados

- **Chassis vazios/inválidos**: Recebem identificador temporário
- **Campos não mapeados**: Recebem valores padrão
- **Erros de criação**: Sistema tenta criar com dados mínimos

### 4. Relatório de Importação

Após a importação, o sistema mostra:
- Quantidade de motos importadas com sucesso
- Motos ignoradas (duplicadas)
- Motos com erros
- Detalhes de cada moto processada

## Comandos de Manutenção

### Limpeza de Arquivos Temporários

```bash
# Verificar arquivos temporários (sem remover)
python manage.py cleanup_temp_files

# Limpar arquivos temporários
python manage.py cleanup_temp_files --force

# Limpar arquivos mais antigos que 12 horas
python manage.py cleanup_temp_files --older-than 12 --force

# No Heroku
heroku run python manage.py cleanup_temp_files --force
```

### Logs de Debug

Para verificar logs de importação:

```bash
# Local
tail -f logs/django.log

# Heroku
heroku logs --tail
```

## Troubleshooting

### Problema: Importação falha no Heroku

**Solução**:
1. Verificar logs: `heroku logs --tail`
2. Limpar arquivos temporários: `heroku run python manage.py cleanup_temp_files --force`
3. Verificar configurações de memória no `settings.py`

### Problema: Arquivo não é lido corretamente

**Solução**:
1. Verificar encoding do arquivo (UTF-8 ou Latin1)
2. Salvar como CSV separado por vírgula
3. Verificar se não há caracteres especiais

### Problema: Muitos erros de importação

**Solução**:
1. Verificar mapeamento de colunas
2. Verificar formato dos dados
3. Usar valores padrão para campos problemáticos

## Próximas Melhorias

1. **Importação em lote**: Processar arquivos grandes em chunks
2. **Validação prévia**: Verificar dados antes da importação
3. **Rollback**: Possibilidade de desfazer importações
4. **Templates personalizados**: Criar templates específicos por cliente
5. **API de importação**: Endpoint REST para importação automatizada 