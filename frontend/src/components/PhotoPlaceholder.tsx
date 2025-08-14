import React from 'react';

interface PhotoPlaceholderProps {
  width?: number;
  height?: number;
  title?: string;
  variant?: 'moto' | 'cliente' | 'generic';
  showText?: boolean;
  className?: string;
}

const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({
  width = 60,
  height = 40,
  title = 'Sem foto disponível',
  variant = 'moto',
  showText = true,
  className = ''
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'moto':
        return '🏍️';
      case 'cliente':
        return '👤';
      default:
        return '📷';
    }
  };

  const getText = () => {
    switch (variant) {
      case 'moto':
        return 'Sem foto';
      case 'cliente':
        return 'Sem foto';
      default:
        return 'Sem foto';
    }
  };

  return (
    <div 
      className={`bg-light d-flex align-items-center justify-content-center ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius: '4px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #dee2e6',
        cursor: 'default'
      }}
      title={title}
    >
      <div className="text-center">
        <div style={{ 
          fontSize: Math.max(10, Math.min(16, width * 0.2)), 
          color: '#6c757d', 
          fontWeight: 'bold',
          lineHeight: 1
        }}>
          {getIcon()}
        </div>
        {showText && (
          <small 
            className="text-muted" 
            style={{ 
              fontSize: Math.max(6, Math.min(10, width * 0.12)),
              lineHeight: 1,
              display: 'block',
              marginTop: '2px'
            }}
          >
            {getText()}
          </small>
        )}
      </div>
    </div>
  );
};

export default PhotoPlaceholder;

