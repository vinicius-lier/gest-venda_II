# 🏍️ Sistema de Gestão Operacional de Vendas

Sistema completo para gestão de vendas de motocicletas, incluindo controle de estoque, clientes, vendas, consignações e seguros.

## 🚀 Características Principais

### 🔐 Controle de Acesso (RBAC)
- **Perfis de Usuário**: Admin, Gerente, Vendedor, Consultor, Financeiro, TI
- **Permissões Granulares**: Por módulo e ação (CRUD)
- **Logs de Acesso**: Rastreamento completo de ações críticas
- **Restrições por Loja**: Usuários veem apenas dados de sua loja

### 👥 Gestão de Clientes
- **Tipos Unificados**: Comprador, Fornecedor, Consignado, Proprietário
- **Relacionamentos Flexíveis**: Um cliente pode ter múltiplos papéis
- **Histórico Completo**: Rastreamento de todas as interações

### 🏍️ Gestão de Motocicletas
- **Tipos de Entrada**: 0km, Usada, Consignada
- **Origens Diversas**: Cliente, Loja Parceira, Fornecedor Externo
- **Status Dinâmicos**: Estoque, Vendida, Repasse, Reservada, Manutenção
- **Histórico de Proprietários**: Rastreamento completo da cadeia de propriedade

### 💰 Operações Comerciais
- **Vendas**: Comissões, formas de pagamento, origens de leads
- **Consignações**: Controle de prazos, comissões, valores
- **Seguros**: Cotações e vendas com comissões
- **Repasses**: Entre lojas parceiras

### 🏬 Lojas Parceiras
- **Gestão Completa**: Dados, contatos, histórico de transações
- **Repasses**: Controle de movimentação entre lojas

### 📊 Relatórios e Analytics
- **Relatórios Financeiros**: Vendas, comissões, lucros
- **Relatórios Operacionais**: Estoque, consignações, repasses
- **Dashboards**: Visão geral por perfil de usuário

## 🏗️ Arquitetura do Sistema

### Modelos Principais

#### 1. Controle de Usuários (RBAC)
```python
# Usuários do sistema com controle de acesso
class Usuario(models.Model):
    user = models.OneToOneField(User)
    loja = models.ForeignKey(Loja)
    perfil = models.ForeignKey(Perfil)
    status = models.CharField(choices=STATUS_CHOICES)
    
# Perfis de acesso
class Perfil(models.Model):
    nome = models.CharField(choices=PERFIL_CHOICES)
    
# Permissões granulares
class Permissao(models.Model):
    modulo = models.CharField(choices=MODULO_CHOICES)
    acao = models.CharField(choices=ACAO_CHOICES)
    perfil = models.ForeignKey(Perfil)
```

#### 2. Clientes Unificados
```python
class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    cpf_cnpj = models.CharField(unique=True)
    tipo = models.CharField(choices=TIPO_CHOICES)  # comprador, fornecedor, etc.
    # Contatos e endereço
```

#### 3. Motocicletas
```python
class Motocicleta(models.Model):
    chassi = models.CharField(unique=True)
    placa = models.CharField()
    marca = models.CharField()
    modelo = models.CharField()
    ano = models.CharField()
    tipo_entrada = models.CharField(choices=TIPO_ENTRADA_CHOICES)
    origem = models.CharField(choices=ORIGEM_CHOICES)
    status = models.CharField(choices=STATUS_CHOICES)
    proprietario = models.ForeignKey(Cliente)
    fornecedor = models.ForeignKey(Cliente)
    # Valores e datas
```

#### 4. Operações Comerciais
```python
# Vendas
class Venda(models.Model):
    moto = models.ForeignKey(Motocicleta)
    comprador = models.ForeignKey(Cliente)
    vendedor = models.ForeignKey(Usuario)
    valor_venda = models.DecimalField()
    # Dados da venda

# Consignações
class Consignacao(models.Model):
    moto = models.OneToOneField(Motocicleta)
    consignante = models.ForeignKey(Cliente)
    valor_pretendido = models.DecimalField()
    # Dados da consignação

# Seguros
class Seguro(models.Model):
    cliente = models.ForeignKey(Cliente)
    moto = models.ForeignKey(Motocicleta)
    apolice = models.CharField(unique=True)
    # Dados do seguro
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Python 3.8+
- Django 5.2+
- SQLite (desenvolvimento) ou PostgreSQL (produção)

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd gestao_operacional_vendas
```

### 2. Crie um ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure o banco de dados
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Configure o sistema RBAC
```bash
python setup_rbac.py
```

### 6. Execute o servidor
```bash
python manage.py runserver
```

## 🔑 Acesso Inicial

Após executar o `setup_rbac.py`, você terá acesso com:

- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha do administrador após o primeiro login!

## 👥 Perfis de Usuário

### 🔧 Administrador
- **Acesso**: Total ao sistema
- **Permissões**: Todas as ações em todos os módulos
- **Responsabilidades**: Configuração do sistema, gestão de usuários

### 👔 Gerente
- **Acesso**: Relatórios, gestão de equipe
- **Permissões**: CRUD em clientes, motos, vendas, consignações, seguros
- **Responsabilidades**: Supervisão de vendas, análise de relatórios

### 💼 Vendedor
- **Acesso**: Vendas e clientes
- **Permissões**: CRUD em clientes, motos, vendas, consignações
- **Responsabilidades**: Atendimento, fechamento de vendas

### 🛡️ Consultor
- **Acesso**: Seguros e clientes
- **Permissões**: CRUD em clientes e seguros
- **Responsabilidades**: Cotações e vendas de seguros

### 💰 Financeiro
- **Acesso**: Relatórios financeiros
- **Permissões**: Visualização de relatórios e dados financeiros
- **Responsabilidades**: Análise financeira, controle de receitas

### 🔧 TI
- **Acesso**: Usuários e lojas
- **Permissões**: CRUD em usuários e lojas
- **Responsabilidades**: Suporte técnico, manutenção do sistema

## 📊 Funcionalidades por Módulo

### 🔐 Usuários
- Gestão de perfis e permissões
- Controle de acesso por loja
- Logs de atividades

### 👥 Clientes
- Cadastro unificado com múltiplos tipos
- Histórico de transações
- Relacionamentos com motos

### 🏍️ Motocicletas
- Controle de estoque
- Histórico de proprietários
- Gestão de fotos
- Status dinâmicos

### 💰 Vendas
- Controle de comissões
- Múltiplas formas de pagamento
- Rastreamento de origens
- Integração com motos

### 📋 Consignações
- Controle de prazos
- Cálculo automático de comissões
- Gestão de valores pretendidos
- Status de disponibilidade

### 🛡️ Seguros
- Cotações e vendas
- Controle de apólices
- Comissões de consultores
- Integração com motos

### 🏬 Lojas Parceiras
- Gestão de dados
- Histórico de transações
- Controle de repasses

### 📈 Relatórios
- Relatórios financeiros
- Relatórios operacionais
- Dashboards personalizados
- Exportação de dados

## 🔒 Segurança

### Controle de Acesso
- Middleware RBAC para verificação de permissões
- Restrições por loja
- Logs de todas as ações críticas

### Validações
- Validação de CPF/CNPJ
- Controle de integridade referencial
- Validações de negócio

### Auditoria
- Logs de acesso
- Histórico de alterações
- Rastreamento de IPs

## 🚀 Deploy

### Desenvolvimento
```bash
python manage.py runserver
```

### Produção
1. Configure `DEBUG = False`
2. Use PostgreSQL ou MySQL
3. Configure variáveis de ambiente
4. Use Gunicorn ou uWSGI
5. Configure Nginx como proxy reverso

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: suporte@sistema.com
- Telefone: (11) 99999-9999

---

**Desenvolvido com ❤️ para gestão eficiente de vendas de motocicletas**

## Importação de Dados - NOVO

### Melhorias na Importação de Motocicletas

O sistema agora permite importar motocicletas mesmo com dados divergentes do sistema anterior:

#### Principais Melhorias:

1. **Importação com Dados Divergentes**: 
   - Chassis inválidos são substituídos por identificadores temporários
   - Campos não mapeados recebem valores padrão ("NÃO INFORMADO")
   - Sistema continua funcionando mesmo com dados incompletos

2. **Tratamento Robusto de Erros**:
   - Logs detalhados para debug
   - Tratamento específico para ambiente Heroku
   - Limpeza automática de arquivos temporários

3. **Compatibilidade com Heroku**:
   - Uso do diretório `/tmp` para arquivos temporários
   - Configurações específicas para produção
   - Melhor tratamento de memória

#### Como Usar:

1. Acesse **Importação > Motocicletas**
2. Faça upload do arquivo CSV
3. Mapeie as colunas (não é mais obrigatório mapear todos os campos)
4. Clique em "Importar Motocicletas"

#### Campos Importantes:

- **Marca/Modelo**: Se não mapeados, recebem "NÃO INFORMADO"
- **Chassi**: Se inválido, recebe identificador temporário (TEMP_linha_timestamp)
- **Ano**: Se não mapeado, recebe "NÃO INFORMADO"
- **Outros campos**: Valores padrão são aplicados automaticamente

#### Comandos de Manutenção:

```bash
# Limpar arquivos temporários (local)
python manage.py cleanup_temp_files

# Limpar arquivos temporários (Heroku)
heroku run python manage.py cleanup_temp_files --force

# Limpar arquivos mais antigos que 12 horas
python manage.py cleanup_temp_files --older-than 12 --force
```

## Estrutura do Projeto

```
gestao_operacional_vendas/
├── core/                    # App principal
│   ├── models.py           # Modelos de dados
│   ├── views.py            # Views do sistema
│   ├── forms.py            # Formulários
│   ├── importers.py        # Sistema de importação
│   └── templates/          # Templates HTML
├── administrativo/         # App administrativo
├── gestao_vendas/         # Configurações do projeto
├── media/                 # Arquivos de mídia
├── static/                # Arquivos estáticos
└── requirements.txt       # Dependências
``` 