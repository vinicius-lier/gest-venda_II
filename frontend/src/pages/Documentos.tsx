import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { DocumentoMotocicleta, Motocicleta, Venda } from '../types';
import AutocompleteField from '../components/AutocompleteField';

interface DocumentoForm {
  moto: number;
  venda: number;
  tipo: string;
  arquivo: File | null;
  observacao: string;
}

const Documentos: React.FC = () => {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoMotocicleta[]>([]);
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoMotocicleta | null>(null);
  const [formData, setFormData] = useState<DocumentoForm>({
    moto: 0,
    venda: 0,
    tipo: '',
    arquivo: null,
    observacao: ''
  });
  const [motocicletaDisplay, setMotocicletaDisplay] = useState('');
  const [vendaDisplay, setVendaDisplay] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroMoto, setFiltroMoto] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando documentos...');
      
      const [documentosResponse, motosResponse, vendasResponse] = await Promise.all([
        apiService.getDocumentosMotocicleta(),
        apiService.getMotocicletas(),
        apiService.getVendas()
      ]);
      
      if (documentosResponse.results) {
        setDocumentos(documentosResponse.results);
        console.log('✅ Documentos carregados:', documentosResponse.results.length);
      }
      
      if (motosResponse.results) {
        setMotocicletas(motosResponse.results);
        console.log('✅ Motocicletas carregadas:', motosResponse.results.length);
      }
      
      if (vendasResponse.results) {
        setVendas(vendasResponse.results);
        console.log('✅ Vendas carregadas:', vendasResponse.results.length);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.moto || !formData.tipo || !formData.arquivo) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('moto', formData.moto.toString());
      if (formData.venda) {
        formDataToSend.append('venda', formData.venda.toString());
      }
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('arquivo', formData.arquivo);
      if (formData.observacao) {
        formDataToSend.append('observacao', formData.observacao);
      }

      await apiService.createDocumentoMotocicleta(formDataToSend);
      console.log('✅ Documento criado com sucesso');

      setShowModal(false);
      setFormData({
        moto: 0,
        venda: 0,
        tipo: '',
        arquivo: null,
        observacao: ''
      });
      setMotocicletaDisplay('');
      setVendaDisplay('');
      loadData();
    } catch (error) {
      console.error('❌ Erro ao criar documento:', error);
      setError('Erro ao criar documento. Tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await apiService.deleteDocumentoMotocicleta(id);
      console.log('✅ Documento excluído');
      loadData();
    } catch (error) {
      console.error('❌ Erro ao excluir documento:', error);
      setError('Erro ao excluir documento.');
    }
  };

  const handleViewDocument = (documento: DocumentoMotocicleta) => {
    setDocumentoSelecionado(documento);
    setShowViewModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, arquivo: file });
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      compra: 'Compra',
      venda: 'Venda',
      consignacao: 'Consignação',
      ficha_cliente: 'Ficha do Cliente',
      recibo: 'Recibo',
      seguro: 'Seguro',
      financiamento: 'Financiamento',
      intencao_venda: 'Intenção de Venda',
      outro: 'Outro'
    };
    return labels[tipo] || 'Outro';
  };

  const getTipoIcon = (tipo: string) => {
    const icons: { [key: string]: string } = {
      compra: '🛒',
      venda: '💰',
      consignacao: '📋',
      ficha_cliente: '👤',
      recibo: '🧾',
      seguro: '🛡️',
      financiamento: '🏦',
      intencao_venda: '📝',
      outro: '📄'
    };
    return icons[tipo] || '📄';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMotocicletaInfo = (motoId: number) => {
    const moto = motocicletas.find(m => m.id === motoId);
    return moto ? `${moto.marca} ${moto.modelo} - ${moto.placa}` : 'N/A';
  };

  const getVendaInfo = (vendaId: number) => {
    const venda = vendas.find(v => v.id === vendaId);
    return venda ? `Venda #${venda.id} - ${venda.comprador.nome}` : 'N/A';
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (filename: string) => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  };

  const isPdfFile = (filename: string) => {
    return getFileExtension(filename) === 'pdf';
  };

  // Filtrar documentos
  const documentosFiltrados = documentos.filter(doc => {
    const matchTipo = !filtroTipo || doc.tipo === filtroTipo;
    const matchMoto = !filtroMoto || 
      getMotocicletaInfo(doc.moto.id).toLowerCase().includes(filtroMoto.toLowerCase());
    
    return matchTipo && matchMoto;
  });

  const totalDocumentos = documentos.length;
  const documentosPorTipo = documentos.reduce((acc, doc) => {
    acc[doc.tipo] = (acc[doc.tipo] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📄 Documentos</h2>
          <p className="text-muted mb-0">
            Gerencie documentos de motocicletas ({totalDocumentos} documentos)
          </p>
        </div>
        <div className="text-end">
          <small className="text-muted">
            © 2025 Vinicius Oliveira - Todos os direitos reservados
          </small>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Lista de Documentos</h5>
          <div>
            <Button variant="outline-primary" size="sm" onClick={loadData} className="me-2">
              🔄 Atualizar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              ➕ Novo Documento
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filtros */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Tipo de Documento</Form.Label>
                <Form.Select 
                  value={filtroTipo} 
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="compra">Compra</option>
                  <option value="venda">Venda</option>
                  <option value="consignacao">Consignação</option>
                  <option value="ficha_cliente">Ficha do Cliente</option>
                  <option value="recibo">Recibo</option>
                  <option value="seguro">Seguro</option>
                  <option value="financiamento">Financiamento</option>
                  <option value="intencao_venda">Intenção de Venda</option>
                  <option value="outro">Outro</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Motocicleta</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por motocicleta..."
                  value={filtroMoto}
                  onChange={(e) => setFiltroMoto(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="text-muted">
                {documentosFiltrados.length} de {documentos.length} documentos
              </div>
            </Col>
          </Row>

          {/* Estatísticas */}
          <Row className="mb-3">
            {Object.entries(documentosPorTipo).map(([tipo, quantidade]) => (
              <Col key={tipo} md={2} className="mb-2">
                <Card className="text-center bg-light">
                  <Card.Body className="py-2">
                    <div className="h6 mb-1">{getTipoIcon(tipo)}</div>
                    <div className="small text-muted">{getTipoLabel(tipo)}</div>
                    <div className="fw-bold">{quantidade}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : documentosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum documento encontrado</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Motocicleta</th>
                  <th>Venda</th>
                  <th>Arquivo</th>
                  <th>Data Upload</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {documentosFiltrados.map((documento) => (
                  <tr key={documento.id}>
                    <td>
                      <span className="me-2">{getTipoIcon(documento.tipo)}</span>
                      {getTipoLabel(documento.tipo)}
                    </td>
                    <td>{getMotocicletaInfo(documento.moto.id)}</td>
                    <td>
                      {documento.venda ? getVendaInfo(documento.venda.id) : '-'}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {isImageFile(documento.arquivo) && (
                          <span className="me-2">🖼️</span>
                        )}
                        {isPdfFile(documento.arquivo) && (
                          <span className="me-2">📄</span>
                        )}
                        <span className="text-truncate" style={{ maxWidth: '200px' }}>
                          {documento.arquivo.split('/').pop()}
                        </span>
                      </div>
                    </td>
                    <td>{formatarData(documento.data_upload)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDocument(documento)}
                        className="me-2"
                      >
                        👁️ Ver
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(documento.id)}
                      >
                        🗑️ Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Criação */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setFormData({
          moto: 0,
          venda: 0,
          tipo: '',
          arquivo: null,
          observacao: ''
        });
        setMotocicletaDisplay('');
        setVendaDisplay('');
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>➕ Novo Documento</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Motocicleta *"
                  placeholder="Digite a marca, modelo ou placa..."
                  value={motocicletaDisplay}
                  onChange={setMotocicletaDisplay}
                  onSelect={(motocicleta) => {
                    setFormData({...formData, moto: motocicleta.id});
                    setMotocicletaDisplay(`${motocicleta.marca} ${motocicleta.modelo} - ${motocicleta.placa}`);
                  }}
                  items={motocicletas}
                  searchKey="marca"
                  displayKey="marca"
                  secondaryKey="modelo"
                  tertiaryKey="placa"
                  required
                  showId
                />
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Venda (Opcional)"
                  placeholder="Digite o ID da venda ou nome do comprador..."
                  value={vendaDisplay}
                  onChange={setVendaDisplay}
                  onSelect={(venda) => {
                    setFormData({...formData, venda: venda.id});
                    setVendaDisplay(`Venda #${venda.id} - ${venda.comprador.nome}`);
                  }}
                  items={vendas}
                  searchKey="id"
                  displayKey="id"
                  secondaryKey="comprador.nome"
                  required={false}
                  showId
                />
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Documento *</Form.Label>
                  <Form.Select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="compra">Compra</option>
                    <option value="venda">Venda</option>
                    <option value="consignacao">Consignação</option>
                    <option value="ficha_cliente">Ficha do Cliente</option>
                    <option value="recibo">Recibo</option>
                    <option value="seguro">Seguro</option>
                    <option value="financiamento">Financiamento</option>
                    <option value="intencao_venda">Intenção de Venda</option>
                    <option value="outro">Outro</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Arquivo *</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.doc,.docx,.xls,.xlsx"
                    required
                  />
                  <Form.Text className="text-muted">
                    Formatos aceitos: PDF, imagens, documentos
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Observações</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    placeholder="Observações sobre o documento..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Criar Documento
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Visualização */}
      <Modal show={showViewModal} onHide={() => {
        setShowViewModal(false);
        setDocumentoSelecionado(null);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {documentoSelecionado && (
              <>
                <span className="me-2">{getTipoIcon(documentoSelecionado.tipo)}</span>
                Visualizar Documento
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {documentoSelecionado && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Tipo:</strong> {getTipoLabel(documentoSelecionado.tipo)}
                </Col>
                <Col md={6}>
                  <strong>Data de Upload:</strong>
                  <br />
                  {formatarData(documentoSelecionado.data_upload)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Motocicleta:</strong>
                  <br />
                  {getMotocicletaInfo(documentoSelecionado.moto.id)}
                </Col>
                <Col md={6}>
                  <strong>Venda:</strong>
                  <br />
                  {documentoSelecionado.venda ? getVendaInfo(documentoSelecionado.venda.id) : 'N/A'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Arquivo:</strong>
                  <br />
                  <a 
                    href={documentoSelecionado.arquivo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm mt-2"
                  >
                    📄 Abrir Arquivo
                  </a>
                </Col>
              </Row>
              {documentoSelecionado.observacao && (
                <Row>
                  <Col>
                    <strong>Observações:</strong>
                    <div className="mt-2 p-3 bg-light rounded">
                      {documentoSelecionado.observacao}
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Fechar
          </Button>
          {documentoSelecionado && (
            <Button 
              variant="primary" 
              href={documentoSelecionado.arquivo} 
              target="_blank"
            >
              📄 Abrir Arquivo
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Documentos;
