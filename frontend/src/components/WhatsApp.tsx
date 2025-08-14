import React, { useState } from 'react';
import { Button, Modal, Form, Alert, Row, Col, Card, Badge } from 'react-bootstrap';
import { Motocicleta } from '../types';
import './WhatsApp.css';

interface WhatsAppProps {
  telefone: string;
  nome: string;
  tipo: 'cliente' | 'usuario';
  motocicletas?: Motocicleta[];
  onSend?: (mensagem: string) => void;
  variant?: 'primary' | 'success' | 'outline-success';
  size?: 'sm' | 'lg';
  className?: string;
}

interface MensagemTemplate {
  id: string;
  titulo: string;
  template: string;
  categoria: 'venda' | 'consulta' | 'promocao' | 'personalizada';
}

const WhatsApp: React.FC<WhatsAppProps> = ({
  telefone,
  nome,
  tipo,
  motocicletas = [],
  onSend,
  variant = 'success',
  size = 'sm',
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState<string>('');
  const [motocicletaSelecionada, setMotocicletaSelecionada] = useState<Motocicleta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Templates de mensagens pré-definidas
  const templates: MensagemTemplate[] = [
    {
      id: 'consulta_estoque',
      titulo: 'Consulta de Estoque',
      template: `Olá ${nome}! 👋

Temos uma motocicleta que pode te interessar no nosso estoque:

🏍️ {marca} {modelo} {ano}
💰 Valor: R$ {valor}
📍 Placa: {placa}
🛣️ Quilometragem: {km} km

Gostaria de saber mais detalhes? 😊`,
      categoria: 'consulta'
    },
    {
      id: 'promocao_especial',
      titulo: 'Promoção Especial',
      template: `Olá ${nome}! 🎉

Temos uma oferta especial para você:

🔥 PROMOÇÃO ESPECIAL 🔥
🏍️ {marca} {modelo} {ano}
💰 De: R$ {valor_original}
💸 Por: R$ {valor_promocional}
⏰ Oferta válida até {data_limite}

Não perca essa oportunidade! 😍`,
      categoria: 'promocao'
    },
    {
      id: 'consulta_geral',
      titulo: 'Consulta Geral',
      template: `Olá ${nome}! 👋

Como posso te ajudar hoje? 

Temos várias opções no nosso estoque:
🏍️ Motocicletas novas e usadas
💰 Financiamento facilitado
🛡️ Seguros com desconto
🔧 Manutenção e peças

Me diga o que você está procurando! 😊`,
      categoria: 'consulta'
    },
    {
      id: 'agendamento',
      titulo: 'Agendamento de Visita',
      template: `Olá ${nome}! 👋

Que tal agendarmos uma visita para você conhecer nossa motocicleta?

🏍️ {marca} {modelo} {ano}
📍 Nosso endereço: {endereco}
📅 Horário de funcionamento: {horario}

Qual horário seria melhor para você? 😊`,
      categoria: 'venda'
    }
  ];

  const formatarTelefone = (telefone: string) => {
    // Remove todos os caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (numeros.length === 11 && numeros.startsWith('0')) {
      return `55${numeros.substring(1)}`;
    } else if (numeros.length === 10) {
      return `55${numeros}`;
    } else if (numeros.length === 11) {
      return `55${numeros}`;
    }
    
    return numeros;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const aplicarTemplate = (template: string, moto?: Motocicleta) => {
    if (!moto) return template;

    return template
      .replace('{marca}', moto.marca)
      .replace('{modelo}', moto.modelo)
      .replace('{ano}', moto.ano)
      .replace('{placa}', moto.placa)
      .replace('{km}', moto.rodagem?.toString() || 'N/A')
      .replace('{valor}', formatarMoeda(moto.valor_atual))
      .replace('{valor_original}', formatarMoeda(moto.valor_atual * 1.1))
      .replace('{valor_promocional}', formatarMoeda(moto.valor_atual))
      .replace('{data_limite}', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'))
      .replace('{endereco}', 'Rua das Motocicletas, 123 - Centro')
      .replace('{horario}', 'Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTemplateSelecionado(templateId);
      setMensagem(aplicarTemplate(template.template, motocicletaSelecionada || undefined));
    }
  };

  const handleMotocicletaSelect = (moto: Motocicleta) => {
    setMotocicletaSelecionada(moto);
    if (templateSelecionado) {
      const template = templates.find(t => t.id === templateSelecionado);
      if (template) {
        setMensagem(aplicarTemplate(template.template, moto));
      }
    }
  };

  const handleSendWhatsApp = () => {
    if (!mensagem.trim()) {
      setError('Por favor, digite uma mensagem.');
      return;
    }

    const telefoneFormatado = formatarTelefone(telefone);
    const mensagemCodificada = encodeURIComponent(mensagem);
    const url = `https://wa.me/${telefoneFormatado}?text=${mensagemCodificada}`;
    
    window.open(url, '_blank');
    
    if (onSend) {
      onSend(mensagem);
    }
    
    setShowModal(false);
    setMensagem('');
    setTemplateSelecionado('');
    setMotocicletaSelecionada(null);
    setError(null);
  };

  const handleSendDirect = () => {
    const telefoneFormatado = formatarTelefone(telefone);
    const url = `https://wa.me/${telefoneFormatado}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={`${className}`}
      >
        📱 WhatsApp
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            📱 Enviar WhatsApp para {nome}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Row>
            <Col md={4}>
              <h6>📋 Templates de Mensagem</h6>
              <div className="mb-3">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={templateSelecionado === template.id ? 'primary' : 'outline-primary'}
                    size="sm"
                    className="d-block w-100 mb-2"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    {template.titulo}
                  </Button>
                ))}
              </div>

              {motocicletas.length > 0 && (
                <>
                  <h6>🏍️ Motocicletas em Estoque</h6>
                  <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {motocicletas.map((moto) => (
                      <Card
                        key={moto.id}
                        className={`mb-2 cursor-pointer ${motocicletaSelecionada?.id === moto.id ? 'border-primary' : ''}`}
                        onClick={() => handleMotocicletaSelect(moto)}
                      >
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{moto.marca} {moto.modelo}</strong>
                              <div className="small text-muted">
                                {moto.ano} • {moto.placa}
                              </div>
                            </div>
                            <Badge bg="success">
                              {formatarMoeda(moto.valor_atual)}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </Col>

            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Mensagem</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={12}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite sua mensagem ou selecione um template..."
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Telefone: {telefone}
                </small>
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleSendDirect}
                    className="me-2"
                  >
                    📱 Abrir WhatsApp
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSendWhatsApp}
                    disabled={!mensagem.trim()}
                  >
                    📤 Enviar Mensagem
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default WhatsApp;
