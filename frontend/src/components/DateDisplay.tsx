import React from 'react';

interface DateDisplayProps {
  date: string | Date | null | undefined;
  format?: 'short' | 'long' | 'time';
  className?: string;
  fallback?: string;
}

const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'short',
  className = '',
  fallback = 'N/A'
}) => {
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) {
      return fallback;
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return fallback;
      }

      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Sao_Paulo'
      };

      switch (format) {
        case 'long':
          options.year = 'numeric';
          options.month = 'long';
          options.day = 'numeric';
          break;
        case 'time':
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          options.hour = '2-digit';
          options.minute = '2-digit';
          break;
        default: // short
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
      }

      return dateObj.toLocaleDateString('pt-BR', options);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return fallback;
    }
  };

  return (
    <span className={className}>
      {formatDate(date)}
    </span>
  );
};

export default DateDisplay;
