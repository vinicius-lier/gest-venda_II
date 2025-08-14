# Módulo Pré-Venda

Este módulo foi desenvolvido para registrar e acompanhar pré-vendas de motocicletas, permitindo medir a taxa de conversão e gerenciar o pipeline de vendas.

## Funcionalidades

### 📊 Dashboard
- **KPIs Principais**: Total de pré-vendas, vendas convertidas, pré-vendas abertas e taxa de conversão
- **Gráficos**: Distribuição por status e top vendedores
- **Alertas**: Pré-vendas abertas há mais de 7 dias

### 📝 Registro de Pré-Vendas
- Formulário simples e rápido para recepcionistas
- Validação de dados em tempo real
- Máscara automática para telefone
- Associação automática com vendedor logado

### 📋 Lista de Pré-Vendas
- Filtros por status, vendedor e busca textual
- Visualização em tabela responsiva
- Ações rápidas (ver detalhes, registrar venda)
- Ordenação por data de atendimento

### 💰 Registro de Vendas
- Formulário para vendas convertidas
- Auto-sugestão de pré-venda por telefone
- Preenchimento automático de campos
- Associação automática com pré-venda existente

### 🔍 Detalhes da Pré-Venda
- Visualização completa dos dados
- Histórico de alterações de status
- Informações da venda relacionada (se convertida)
- Ações para alterar status

## Modelos de Dados

### PreVenda
- **id**: UUID (chave primária)
- **nome_cliente**: Nome simples do cliente
- **telefone**: Telefone com máscara
- **moto_desejada**: Moto de interesse
- **vendedor**: Vendedor responsável (FK para User)
- **status**: Aberta, Convertida, Descartada
- **data_atendimento**: Data/hora do registro
- **venda**: Relacionamento com Venda (OneToOne)
- **observacoes**: Campo de texto livre

### Venda
- **nome_completo**: Nome completo do cliente
- **telefone**: Telefone do cliente
- **moto_vendida**: Moto efetivamente vendida
- **valor_total**: Valor da venda
- **vendedor**: Vendedor responsável
- **data_venda**: Data/hora da venda
- **observacoes**: Campo de texto livre

## URLs

- `/pre-venda/` - Dashboard principal
- `/pre-venda/pre-venda/nova/` - Nova pré-venda
- `/pre-venda/pre-venda/lista/` - Lista de pré-vendas
- `/pre-venda/pre-venda/<id>/` - Detalhes da pré-venda
- `/pre-venda/venda/nova/` - Nova venda
- `/pre-venda/api/buscar-pre-venda/` - API para buscar pré-venda

## Funcionalidades Técnicas

### Auto-associação de Pré-Venda
Quando uma venda é registrada, o sistema automaticamente:
1. Busca pré-vendas com o mesmo telefone e status "aberta"
2. Associa a pré-venda à venda
3. Altera o status da pré-venda para "convertida"

### Validações
- Telefone deve ter 10 ou 11 dígitos
- Nome deve ter pelo menos 2 caracteres
- Valor da venda deve ser maior que zero
- Nome completo deve ter pelo menos 3 caracteres

### Interface Responsiva
- Design moderno com Tailwind CSS
- Funciona em desktop, tablet e mobile
- Componentes interativos com JavaScript

## Como Usar

### 1. Registrar Pré-Venda
1. Acesse "Nova Pré-Venda"
2. Preencha nome, telefone e moto desejada
3. Adicione observações se necessário
4. Clique em "Registrar Pré-Venda"

### 2. Acompanhar Pré-Vendas
1. Acesse "Lista de Pré-Vendas"
2. Use filtros para encontrar registros específicos
3. Clique em "Ver detalhes" para mais informações
4. Monitore pré-vendas abertas há mais de 7 dias

### 3. Registrar Venda
1. Acesse "Nova Venda"
2. Digite o telefone do cliente
3. O sistema sugere automaticamente a pré-venda
4. Preencha os dados da venda
5. Clique em "Registrar Venda"

### 4. Acompanhar KPIs
1. Acesse o Dashboard
2. Visualize os indicadores principais
3. Monitore a taxa de conversão
4. Acompanhe o desempenho dos vendedores

## Configuração

### Instalação
1. O módulo já está incluído no `INSTALLED_APPS`
2. As migrações já foram aplicadas
3. As URLs já estão configuradas

### Permissões
- Acesso requer login (`@login_required`)
- Vendedores devem ter `is_staff=True`
- Usuários podem ver apenas suas próprias pré-vendas

### Personalização
- Cores e estilos podem ser alterados nos templates
- Validações podem ser modificadas nos formulários
- KPIs podem ser customizados na view do dashboard

## Manutenção

### Backup
- Os dados são salvos no banco principal
- Backup automático via Django admin
- Exportação possível via Django admin

### Monitoramento
- Logs de criação e alteração
- Rastreamento de conversões
- Alertas para pré-vendas antigas

### Performance
- Queries otimizadas com `select_related`
- Paginação na lista de pré-vendas
- Cache para KPIs (se configurado) 