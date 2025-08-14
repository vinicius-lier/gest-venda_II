import React, { useState } from 'react';
import { Image } from 'react-bootstrap';
import PhotoPlaceholder from './PhotoPlaceholder';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'moto' | 'cliente' | 'generic';
  title?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width = 60,
  height = 40,
  style = {},
  className = '',
  variant = 'moto',
  title
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <PhotoPlaceholder
        width={width}
        height={height}
        title={title || alt}
        variant={variant}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: 'cover', borderRadius: '4px', ...style }}
      className={className}
      onError={() => {
        console.error(`❌ Erro ao carregar imagem: ${src}`);
        setHasError(true);
      }}
    />
  );
};

export default SafeImage;

