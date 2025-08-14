import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Configuração de menu com permissões por perfil
  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/clientes', 
      label: 'Clientes', 
      icon: '👥',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/motocicletas', 
      label: 'Motocicletas', 
      icon: '🏍️',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'ti']
    },
    { 
      path: '/vendas', 
      label: 'Vendas', 
      icon: '💰',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/consignacoes', 
      label: 'Consignações', 
      icon: '📋',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/seguros', 
      label: 'Seguros', 
      icon: '🛡️',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/ocorrencias', 
      label: 'Ocorrências', 
      icon: '⚠️',
      profiles: ['admin', 'gerente', 'ti']
    },
    { 
      path: '/usuarios', 
      label: 'Usuários', 
      icon: '👤',
      profiles: ['admin', 'ti']
    },
    { 
      path: '/lojas', 
      label: 'Lojas', 
      icon: '🏪',
      profiles: ['admin', 'ti']
    },
    { 
      path: '/relatorios', 
      label: 'Relatórios', 
      icon: '📈',
      profiles: ['admin', 'gerente', 'financeiro', 'ti']
    },
    { 
      path: '/notificacoes', 
      label: 'Notificações', 
      icon: '🔔',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/documentos', 
      label: 'Documentos', 
      icon: '📄',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'financeiro', 'ti']
    },
    { 
      path: '/chaves', 
      label: 'Chaves', 
      icon: '🔑',
      profiles: ['admin', 'gerente', 'vendedor', 'consultor', 'ti']
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Verificar se o usuário tem permissão para um item do menu
  const hasMenuPermission = (itemProfiles: string[]) => {
    if (!user?.perfil?.nome) return false;
    
    // Superusers têm acesso total a tudo
    if (user.user?.is_superuser) {
      return true;
    }
    
    return itemProfiles.includes(user.perfil.nome);
  };

  // Filtrar itens do menu baseado no perfil do usuário
  const filteredMenuItems = menuItems.filter(item => hasMenuPermission(item.profiles));

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div 
        className={`bg-dark text-white ${sidebarCollapsed ? 'w-auto' : 'w-25'}`}
        style={{ minWidth: sidebarCollapsed ? '60px' : '250px' }}
      >
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className={`mb-0 ${sidebarCollapsed ? 'd-none' : ''}`}>
              Prado Motors
            </h5>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="nav flex-column">
            {filteredMenuItems.map((item) => (
              <button
                key={item.path}
                className={`btn btn-link text-white text-decoration-none text-start w-100 mb-2 ${
                  isActive(item.path) ? 'bg-primary' : ''
                }`}
                onClick={() => navigate(item.path)}
                style={{ padding: '8px 12px' }}
              >
                <span className="me-2">{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className={`mt-auto ${sidebarCollapsed ? 'd-none' : ''}`}>
            <hr className="text-white" />
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">Usuário</small>
                <div>{user?.user?.username || user?.user?.first_name || 'N/A'}</div>
                <small className="text-muted">
                  {user?.perfil?.nome ? `${user.perfil.nome.charAt(0).toUpperCase() + user.perfil.nome.slice(1)}` : 'N/A'}
                </small>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ padding: '0' }}>
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
