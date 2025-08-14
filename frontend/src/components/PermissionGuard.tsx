import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredProfile?: string | string[];
  fallback?: React.ReactNode;
}

// HOC para proteger componentes
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredProfile?: string | string[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard requiredProfile={requiredProfile}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredProfile, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Se não há perfil requerido, mostrar o conteúdo
  if (!requiredProfile) {
    return <>{children}</>;
  }

  // Superusers têm acesso total a tudo
  if (user.user?.is_superuser) {
    return <>{children}</>;
  }

  // Verificar se o usuário tem o perfil requerido
  const userProfile = user.perfil?.nome;
  const requiredProfiles = Array.isArray(requiredProfile) ? requiredProfile : [requiredProfile];
  
  // Se o usuário não tem perfil definido, não tem permissão
  if (!userProfile) {
    return <>{fallback}</>;
  }
  
  const hasPermission = requiredProfiles.includes(userProfile);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
