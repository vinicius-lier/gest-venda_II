import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { Consignacao, Cliente, Motocicleta, Usuario } from '../types';
import apiService from '../services/api';
import AutocompleteField from '../components/AutocompleteField';

const Consignacoes: React.FC = () => {
  const [consignacoes, setConsignacoes] = useState<Consignacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingConsignacao, setEditingConsignacao] = useState<Consignacao | null>(null);
  const [formData, setFormData] = useState({
    moto: 0,
    consignante: 0,
    vendedor_responsavel: 0,
    loja: 0,
    valor_pretendido: 0,
    valor_minimo: 0,
    comissao_percentual: 0,
    data_entrada: '',
    data_limite: '',
    data_venda: '',
    status: 'disponivel',
    valor_venda: 0,
    observacoes: ''
  });

  // Estados para autocomplete
  const [motoSearch, setMotoSearch] = useState('');
  const [consignanteSearch, setConsignanteSearch] = useState('');
  const [vendedorSearch, setVendedorSearch] = useState('');
  const [selectedMoto, setSelectedMoto] = useState<Motocicleta | null>(null);
  const [selectedConsignante, setSelectedConsignante] = useState<Cliente | null>(null);
  const [selectedVendedor, setSelectedVendedor] = useState<Usuario | null>(null);

  const loadConsignacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getConsignacoes();
      
      if (response && response.results) {
        setConsignacoes(response.results);
      } else {
        setConsignacoes([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar consignações:', error);
      setError('Erro ao carregar consignações. Verifique sua conexão e tente novamente.');
      setConsignacoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClientes = useCallback(async () => {
    try {
      const response = await apiService.getClientes();
      if (response && response.results) {
        setClientes(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }, []);

  const loadMotocicletas = useCallback(async () => {
    try {
      const response = await apiService.getMotocicletas();
      if (response && response.results) {
        setMotocicletas(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar motocicletas:', error);
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    try {
      const response = await apiService.getUsuarios();
      if (response && response.results) {
        setUsuarios(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  useEffect(() => {
    loadConsignacoes();
    loadClientes();
    loadMotocicletas();
    loadUsuarios();
  }, [loadConsignacoes, loadClientes, loadMotocicletas, loadUsuarios]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleMotoSelect = (moto: Motocicleta) => {
    setSelectedMoto(moto);
    setFormData(prev => ({
      ...prev,
      moto: moto.id
    }));
  };

  const handleConsignanteSelect = (cliente: Cliente) => {
    setSelectedConsignante(cliente);
    setFormData(prev => ({
      ...prev,
      consignante: cliente.id
    }));
  };

  const handleVendedorSelect = (usuario: Usuario) => {
    setSelectedVendedor(usuario);
    setFormData(prev => ({
      ...prev,
      vendedor_responsavel: usuario.id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConsignacao) {
        await apiService.updateConsignacao(editingConsignacao.id, formData as any);
      } else {
        await apiService.createConsignacao(formData as any);
      }
      setShowModal(false);
      setEditingConsignacao(null);
      resetForm();
      loadConsignacoes();
    } catch (error) {
      console.error('Erro ao salvar consignação:', error);
      setError('Erro ao salvar consignação. Tente novamente.');
    }
  };

  const handleEdit = (consignacao: Consignacao) => {
    setEditingConsignacao(consignacao);
    setFormData({
      moto: consignacao.moto.id,
      consignante: consignacao.consignante.id,
      vendedor_responsavel: consignacao.vendedor_responsavel.id,
              loja: consignacao.loja?.id || 0,
      valor_pretendido: consignacao.valor_pretendido,
      valor_minimo: consignacao.valor_minimo,
      comissao_percentual: consignacao.comissao_percentual,
      data_entrada: consignacao.data_entrada || '',
      data_limite: consignacao.data_limite || '',
      data_venda: consignacao.data_venda || '',
      status: consignacao.status,
      valor_venda: consignacao.valor_venda || 0,
      observacoes: consignacao.observacoes || ''
    });
    
    // Configurar autocomplete para edição
    setMotoSearch(`${consignacao.moto.marca} ${consignacao.moto.modelo} - ${consignacao.moto.placa || consignacao.moto.chassi}`);
    setConsignanteSearch(`${consignacao.consignante.nome} - ${consignacao.consignante.cpf_cnpj}`);
    setVendedorSearch(`${consignacao.vendedor_responsavel.user.first_name} ${consignacao.vendedor_responsavel.user.last_name} - ${consignacao.vendedor_responsavel.user.username}`);
    setSelectedMoto(consignacao.moto);
    setSelectedConsignante(consignacao.consignante);
    setSelectedVendedor(consignacao.vendedor_responsavel);
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta consignação?')) {
      try {
        await apiService.deleteConsignacao(id);
        loadConsignacoes();
      } catch (error) {
        console.error('Erro ao excluir consignação:', error);
        setError('Erro ao excluir consignação. Tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      moto: 0,
      consignante: 0,
      vendedor_responsavel: 0,
      loja: 0,
      valor_pretendido: 0,
      valor_minimo: 0,
      comissao_percentual: 0,
      data_entrada: '',
      data_limite: '',
      data_venda: '',
      status: 'disponivel',
      valor_venda: 0,
      observacoes: ''
    });
    setMotoSearch('');
    setConsignanteSearch('');
    setVendedorSearch('');
    setSelectedMoto(null);
    setSelectedConsignante(null);
    setSelectedVendedor(null);
  };

  const openCreateModal = () => {
    setEditingConsignacao(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'disponivel': 'success',
      'vendido': 'primary',
      'devolvido': 'warning',
      'cancelado': 'danger'
    } as const;
    
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📋 Consignações</h2>
          <p className="text-muted mb-0">Gerencie as consignações de motocicletas</p>
        </div>
        <div className="text-end">
          <small className="text-muted">
            © 2025 Vinicius Oliveira - Todos os direitos reservados
          </small>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Erro!</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={loadConsignacoes} variant="outline-danger">
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Lista de Consignações</h5>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            ➕ Nova Consignação
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : consignacoes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma consignação encontrada.</p>
              <Button variant="outline-primary" onClick={loadConsignacoes}>
                Recarregar
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Motocicleta</th>
                  <th>Consignante</th>
                  <th>Valor Pretendido</th>
                  <th>Valor Mínimo</th>
                  <th>Comissão</th>
                  <th>Status</th>
                  <th>Data Limite</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {consignacoes.map((consignacao) => (
                  <tr key={consignacao.id}>
                    <td>
                      <strong>{consignacao.moto.marca} {consignacao.moto.modelo}</strong>
                      <br />
                      <small className="text-muted">{consignacao.moto.placa || consignacao.moto.chassi}</small>
                    </td>
                    <td>{consignacao.consignante.nome}</td>
                    <td>R$ {consignacao.valor_pretendido.toLocaleString('pt-BR')}</td>
                    <td>R$ {consignacao.valor_minimo.toLocaleString('pt-BR')}</td>
                    <td>{consignacao.comissao_percentual}%</td>
                    <td>{getStatusBadge(consignacao.status)}</td>
                    <td>{new Date(consignacao.data_limite).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(consignacao)}>
                        ✏️ Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-1"
                        onClick={() => handleDelete(consignacao.id)}
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

      {/* Modal de Criação/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingConsignacao ? `Editar Consignação #${editingConsignacao.id}` : 'Nova Consignação'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Motocicleta *"
                  placeholder="Digite para buscar motocicleta..."
                  value={motoSearch}
                  onChange={setMotoSearch}
                  onSelect={handleMotoSelect}
                  items={motocicletas}
                  searchKey="modelo"
                  displayKey="modelo"
                  secondaryKey="placa"
                  required
                />
                {selectedMoto && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedMoto.marca} {selectedMoto.modelo} {selectedMoto.ano} - {selectedMoto.placa || selectedMoto.chassi}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Consignante *"
                  placeholder="Digite para buscar consignante..."
                  value={consignanteSearch}
                  onChange={setConsignanteSearch}
                  onSelect={handleConsignanteSelect}
                  items={clientes}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="cpf_cnpj"
                  required
                />
                {selectedConsignante && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedConsignante.nome} - {selectedConsignante.cpf_cnpj}
                    </small>
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Vendedor Responsável *"
                  placeholder="Digite para buscar vendedor..."
                  value={vendedorSearch}
                  onChange={setVendedorSearch}
                  onSelect={handleVendedorSelect}
                  items={usuarios}
                  searchKey="user.first_name"
                  displayKey="user.first_name"
                  secondaryKey="user.username"
                  required
                />
                {selectedVendedor && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedVendedor.user.first_name} {selectedVendedor.user.last_name} - {selectedVendedor.user.username}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="disponivel">Disponível</option>
                    <option value="vendido">Vendido</option>
                    <option value="devolvido">Devolvido</option>
                    <option value="cancelado">Cancelado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor Pretendido *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_pretendido"
                    value={formData.valor_pretendido}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor Mínimo *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_minimo"
                    value={formData.valor_minimo}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Comissão (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="comissao_percentual"
                    value={formData.comissao_percentual}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Entrada</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_entrada"
                    value={formData.data_entrada}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Limite</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_limite"
                    value={formData.data_limite}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Venda</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_venda"
                    value={formData.data_venda}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor da Venda</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_venda"
                    value={formData.valor_venda}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observacoes"
                value={formData.observacoes}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingConsignacao ? 'Atualizar' : 'Criar'} Consignação
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Consignacoes;
