# 🏍️ Prado Motors - Frontend React

Frontend moderno em React + TypeScript para o sistema de gestão de vendas da Prado Motors.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **React Router** - Roteamento da aplicação
- **Bootstrap 5** - Framework CSS para design responsivo
- **Axios** - Cliente HTTP para requisições à API
- **React Bootstrap** - Componentes Bootstrap para React

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx      # Layout principal com sidebar
│   └── ProtectedRoute.tsx # Rota protegida
├── contexts/           # Contextos React
│   └── AuthContext.tsx # Contexto de autenticação
├── pages/              # Páginas da aplicação
│   ├── Login.tsx       # Página de login
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Vendas.tsx      # Gestão de vendas
│   ├── Clientes.tsx    # Gestão de clientes
│   ├── Motocicletas.tsx # Gestão de motocicletas
│   └── ...             # Outras páginas
├── services/           # Serviços e APIs
│   └── api.ts          # Serviço de comunicação com backend
├── types/              # Definições de tipos TypeScript
│   └── index.ts        # Tipos principais
├── hooks/              # Custom hooks
├── utils/              # Utilitários
└── assets/             # Recursos estáticos
```

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start

# Build para produção
npm run build

# Executar testes
npm test
```

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_API_URL=http://127.0.0.1:8000/api
REACT_APP_NAME=Prado Motors - Gestão de Vendas
REACT_APP_VERSION=2.0.0
```

## 📱 Funcionalidades

### ✅ Implementadas
- [x] Sistema de autenticação
- [x] Layout responsivo com sidebar
- [x] Dashboard com estatísticas
- [x] Gestão de vendas
- [x] Gestão de clientes
- [x] Gestão de motocicletas
- [x] Sistema de rotas protegidas
- [x] Integração com API Django
- [x] Design moderno com Bootstrap

### 🚧 Em Desenvolvimento
- [ ] Formulários de criação/edição
- [ ] Upload de arquivos
- [ ] Gráficos e relatórios
- [ ] Notificações em tempo real
- [ ] Exportação de dados

## 🎨 Design System

### Cores Principais
- **Primária**: Bootstrap Blue (#0d6efd)
- **Sucesso**: Bootstrap Green (#198754)
- **Aviso**: Bootstrap Yellow (#ffc107)
- **Perigo**: Bootstrap Red (#dc3545)

### Ícones
O sistema utiliza emojis como ícones para melhor compatibilidade:
- 🏍️ Motocicletas
- 💰 Vendas
- 👥 Clientes
- 📋 Consignações
- 🛡️ Seguros
- ⚠️ Ocorrências
- 👤 Usuários
- 🏪 Lojas
- 📄 Documentos
- 🔑 Chaves
- 📈 Relatórios
- 🔔 Notificações

## 🔐 Autenticação

O sistema utiliza JWT tokens para autenticação:
- Login com usuário e senha
- Token armazenado no localStorage
- Rotas protegidas automaticamente
- Logout automático em caso de erro 401

## 📊 API Integration

Todas as requisições são feitas através do `apiService`:
- Interceptors para tokens de autenticação
- Tratamento automático de erros
- Tipagem TypeScript completa
- Paginação automática

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Servir Build
```bash
npx serve -s build
```

## 📝 Copyright

© 2025 Vinicius Oliveira - Todos os direitos reservados

Este sistema foi desenvolvido especificamente para a Prado Motors.
