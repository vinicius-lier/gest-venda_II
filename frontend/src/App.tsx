import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Motocicletas from './pages/Motocicletas';
import Vendas from './pages/Vendas';
import Consignacoes from './pages/Consignacoes';
import Seguros from './pages/Seguros';
import Ocorrencias from './pages/Ocorrencias';
import Usuarios from './pages/Usuarios';
import Lojas from './pages/Lojas';
import Relatorios from './pages/Relatorios';
import Notificacoes from './pages/Notificacoes';
import Documentos from './pages/Documentos';
import Chaves from './pages/Chaves';
import CotacoesSeguro from './pages/CotacoesSeguro';
import Seguradoras from './pages/Seguradoras';
import PlanosSeguro from './pages/PlanosSeguro';
import Pagamentos from './pages/Pagamentos';
import Financeiro from './pages/Financeiro';
import Bens from './pages/Bens';
import PreVenda from './pages/PreVenda';
// Importar Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="motocicletas" element={<Motocicletas />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="consignacoes" element={<Consignacoes />} />
            <Route path="seguros" element={<Seguros />} />
            <Route path="cotacoes-seguro" element={<CotacoesSeguro />} />
            <Route path="seguradoras" element={<Seguradoras />} />
            <Route path="planos-seguro" element={<PlanosSeguro />} />
            <Route path="pagamentos" element={<Pagamentos />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="bens" element={<Bens />} />
            <Route path="pre-venda" element={<PreVenda />} />
            <Route path="ocorrencias" element={<Ocorrencias />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="lojas" element={<Lojas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="notificacoes" element={<Notificacoes />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="chaves" element={<Chaves />} />
          </Route>
          
          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
