import React from 'react';

interface CurrencyDisplayProps {
  value: number | null | undefined;
  currency?: string;
  className?: string;
  showSymbol?: boolean;
  precision?: number;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  currency = 'BRL',
  className = '',
  showSymbol = true,
  precision = 2
}) => {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0,00';
    }

    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    return formatter.format(value);
  };

  const formattedValue = formatCurrency(value);
  const displayValue = showSymbol ? formattedValue : formattedValue.replace(/[^\d,.-]/g, '');

  return (
    <span className={className}>
      {displayValue}
    </span>
  );
};

export default CurrencyDisplay;
