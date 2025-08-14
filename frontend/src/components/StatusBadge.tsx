import React from 'react';
import { Badge } from 'react-bootstrap';

interface StatusBadgeProps {
  status: string;
  className?: string;
  color?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', color }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'estoque': {
        variant: 'success',
        icon: '📦',
        text: 'Em Estoque'
      },
      'vendida': {
        variant: 'danger',
        icon: '✅',
        text: 'Vendida'
      },
      'repasse': {
        variant: 'warning',
        icon: '🔄',
        text: 'Repasse'
      },
      'reservada': {
        variant: 'info',
        icon: '🔒',
        text: 'Reservada'
      },
      'manutencao': {
        variant: 'secondary',
        icon: '🔧',
        text: 'Manutenção'
      },
      'pendencia': {
        variant: 'warning',
        icon: '⚠️',
        text: 'Pendência'
      },
      'bloqueada': {
        variant: 'dark',
        icon: '🚫',
        text: 'Bloqueada'
      }
    };

    return configs[status as keyof typeof configs] || {
      variant: 'secondary',
      icon: '❓',
      text: status
    };
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      bg={color || config.variant} 
      className={`d-flex align-items-center gap-1 ${className}`}
      style={{ 
        fontSize: '0.75rem',
        padding: '0.375rem 0.5rem',
        borderRadius: '0.375rem'
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>{config.icon}</span>
      <span>{config.text}</span>
    </Badge>
  );
};

export default StatusBadge;
