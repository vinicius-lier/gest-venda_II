import React, { useState, useRef } from 'react';
import { Form, Button, Image, Alert, Card, Row, Col, Badge } from 'react-bootstrap';

interface MultipleImageUploadProps {
  label: string;
  value: string[];
  fotoPrincipalIndex: number;
  onChange: (fotos: string[], fotoPrincipalIndex: number) => void;
  required?: boolean;
  className?: string;
  maxSize?: number; // em MB
  maxFiles?: number;
  acceptedTypes?: string[];
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  label,
  value = [],
  fotoPrincipalIndex = 0,
  onChange,
  required = false,
  className = '',
  maxSize = 20, // 20MB para suportar fotos em 4K
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList) => {
    setError(null);
    console.log('🔍 MultipleImageUpload - Arquivos selecionados:', files.length);

    if (value.length + files.length > maxFiles) {
      setError(`Máximo de ${maxFiles} fotos permitidas. Você já tem ${value.length} fotos.`);
      return;
    }

    const newFotos: string[] = [];
    let hasError = false;

    Array.from(files).forEach((file, index) => {
      console.log('🔍 Processando arquivo:', file.name, file.type, file.size);
      
      // Validar tipo de arquivo
      if (!acceptedTypes.includes(file.type)) {
        setError(`Arquivo "${file.name}" não é suportado. Use: ${acceptedTypes.join(', ')}`);
        hasError = true;
        return;
      }

      // Validar tamanho
      if (file.size > maxSize * 1024 * 1024) {
        setError(`Arquivo "${file.name}" muito grande. Máximo: ${maxSize}MB`);
        hasError = true;
        return;
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('🔍 Arquivo convertido para base64:', result.substring(0, 50) + '...');
        newFotos.push(result);
        
        // Se é o último arquivo, atualizar o estado
        if (newFotos.length === files.length && !hasError) {
          const todasFotos = [...value, ...newFotos];
          const novoFotoPrincipalIndex = fotoPrincipalIndex === -1 ? 0 : fotoPrincipalIndex;
          console.log('🔍 Atualizando fotos:', todasFotos.length, 'foto principal:', novoFotoPrincipalIndex);
          console.log('🔍 Tipo das fotos:', typeof todasFotos, 'É array:', Array.isArray(todasFotos));
          onChange(todasFotos, novoFotoPrincipalIndex);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleRemove = (index: number) => {
    const novasFotos = value.filter((_, i) => i !== index);
    let novoFotoPrincipalIndex = fotoPrincipalIndex;
    
    // Ajustar índice da foto principal
    if (index === fotoPrincipalIndex) {
      novoFotoPrincipalIndex = novasFotos.length > 0 ? 0 : -1;
    } else if (index < fotoPrincipalIndex) {
      novoFotoPrincipalIndex = Math.max(0, fotoPrincipalIndex - 1);
    }
    
    onChange(novasFotos, novoFotoPrincipalIndex);
  };

  const handleSetPrincipal = (index: number) => {
    onChange(value, index);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Função para obter a foto principal (mantida para uso futuro)
  // const getFotoPrincipal = () => {
  //   return value.length > 0 && fotoPrincipalIndex >= 0 && fotoPrincipalIndex < value.length 
  //     ? value[fotoPrincipalIndex] 
  //     : null;
  // };

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

      {/* Área de Upload */}
      <div
        className={`border-2 border-dashed rounded p-4 text-center mb-3 ${
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
          <strong>Clique ou arraste fotos</strong>
        </p>
        <p className="text-muted small mb-0">
          {acceptedTypes.join(', ').replace('image/', '').toUpperCase()} • Máx: {maxSize}MB • Máx: {maxFiles} fotos
        </p>
        <p className="text-muted small mb-0">
          Fotos adicionadas: {value.length}/{maxFiles}
        </p>
      </div>

      {/* Lista de Fotos */}
      {value.length > 0 && (
        <div className="mb-3">
          <h6 className="mb-2">
            📸 Fotos ({value.length})
            {fotoPrincipalIndex >= 0 && (
              <Badge bg="primary" className="ms-2">
                Principal: {fotoPrincipalIndex + 1}
              </Badge>
            )}
          </h6>
          <Row>
            {value.map((foto, index) => (
              <Col key={index} md={4} lg={3} className="mb-3">
                <Card className="h-100">
                  <Card.Body className="p-2">
                    <div className="position-relative">
                      <Image
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        fluid
                        className="w-100 mb-2"
                        style={{ height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      
                      {/* Botões de ação */}
                      <div className="position-absolute top-0 end-0 p-1">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(index);
                          }}
                          title="Remover foto"
                        >
                          ✕
                        </Button>
                      </div>
                      
                      {/* Indicador de foto principal */}
                      {index === fotoPrincipalIndex && (
                        <div className="position-absolute top-0 start-0 p-1">
                          <Badge bg="primary">Principal</Badge>
                        </div>
                      )}
                      
                      {/* Botão para definir como principal */}
                      {index !== fotoPrincipalIndex && (
                        <div className="position-absolute bottom-0 start-0 p-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrincipal(index);
                            }}
                            title="Definir como foto principal"
                          >
                            ⭐ Principal
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <small className="text-muted">Foto {index + 1}</small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Form.Control
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        multiple
        className="d-none"
      />
    </div>
  );
};

export default MultipleImageUpload;
