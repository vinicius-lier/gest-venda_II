import React, { useState } from 'react';
import { Modal, Button, Image } from 'react-bootstrap';
import './PhotoViewer.css';

interface PhotoViewerProps {
  show: boolean;
  onHide: () => void;
  photos: string[];
  currentIndex: number;
  title?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ 
  show, 
  onHide, 
  photos, 
  currentIndex = 0,
  title = "Visualizador de Fotos"
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      prevPhoto();
    } else if (event.key === 'ArrowRight') {
      nextPhoto();
    } else if (event.key === 'Escape') {
      onHide();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="photo-viewer-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          📸 {title} ({activeIndex + 1} de {photos.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-0">
        {photos.length > 0 && (
          <div className="position-relative">
            {/* Foto Principal */}
            <Image
              src={`data:image/jpeg;base64,${photos[activeIndex]}`}
              alt={`Foto ${activeIndex + 1}`}
              fluid
              style={{ 
                maxHeight: '70vh', 
                objectFit: 'contain',
                backgroundColor: '#f8f9fa'
              }}
              onError={(e) => {
                console.error(`❌ Erro ao carregar foto no PhotoViewer (índice ${activeIndex}):`, e);
                e.currentTarget.style.display = 'none';
              }}
            />
            
            {/* Navegação */}
            {photos.length > 1 && (
              <>
                {/* Botão Anterior */}
                <Button
                  onClick={prevPhoto}
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 photo-viewer-nav-button"
                  style={{ zIndex: 1000 }}
                >
                  ‹
                </Button>
                
                {/* Botão Próximo */}
                <Button
                  onClick={nextPhoto}
                  className="position-absolute top-50 end-0 translate-middle-y me-2 photo-viewer-nav-button"
                  style={{ zIndex: 1000 }}
                >
                  ›
                </Button>
              </>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <small className="text-muted">
              Use as setas do teclado ou clique nos botões para navegar
            </small>
          </div>
          <div className="d-flex gap-2">
            {photos.length > 1 && (
              <>
                <Button variant="outline-secondary" size="sm" onClick={prevPhoto}>
                  ‹ Anterior
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={nextPhoto}>
                  Próximo ›
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={onHide}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PhotoViewer;
