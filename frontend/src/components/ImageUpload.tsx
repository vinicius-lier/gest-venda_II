import React, { useState, useRef } from 'react';
import { Form, Button, Image, Alert, Card } from 'react-bootstrap';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  maxSize?: number; // em MB
  acceptedTypes?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  required = false,
  className = '',
  maxSize = 5, // 5MB padrão
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validar tipo de arquivo
    if (!acceptedTypes.includes(file.type)) {
      setError(`Tipo de arquivo não suportado. Use: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      
      {error && (
        <Alert variant="danger" className="mb-2 py-2">
          <small>{error}</small>
        </Alert>
      )}

      {preview ? (
        <Card className="mb-2">
          <Card.Body className="p-2">
            <div className="position-relative">
              <Image
                src={preview}
                alt={label}
                fluid
                className="w-100"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
              />
              <div className="position-absolute top-0 end-0 p-1">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  title="Remover imagem"
                >
                  ✕
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div
          className={`border-2 border-dashed rounded p-4 text-center ${
            isDragging ? 'border-primary bg-light' : 'border-secondary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{ cursor: 'pointer', minHeight: '120px' }}
        >
          <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📁</div>
          <p className="mb-1">
            <strong>Clique ou arraste uma imagem</strong>
          </p>
          <p className="text-muted small mb-0">
            {acceptedTypes.join(', ').replace('image/', '').toUpperCase()} • Máx: {maxSize}MB
          </p>
        </div>
      )}

      <Form.Control
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="d-none"
      />
    </div>
  );
};

export default ImageUpload;
