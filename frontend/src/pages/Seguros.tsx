import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { Seguro, Cliente, Bem, PlanoSeguro, Usuario, Loja } from '../types';
import apiService from '../services/api';
import AutocompleteField from '../components/AutocompleteField';

const Seguros: React.FC = () => {
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [bens, setBens] = useState<Bem[]>([]);
  const [planosSeguro, setPlanosSeguro] = useState<PlanoSeguro[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSeguro, setEditingSeguro] = useState<Seguro | null>(null);
  const [formData, setFormData] = useState({
    cliente: 0,
    bem: 0,
    plano: 0,
    cotacao: 0,
    vendedor: 0,
    loja: 0,
    apolice: '',
    valor_seguro: 0,
    comissao_percentual: 0,
    status: 'ativo',
    data_inicio: '',
    data_fim: '',
    data_venda: '',
    observacoes: ''
  });

  // Estados para autocomplete
  const [clienteSearch, setClienteSearch] = useState('');
  const [bemSearch, setBemSearch] = useState('');
  const [planoSearch, setPlanoSearch] = useState('');
  const [vendedorSearch, setVendedorSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedBem, setSelectedBem] = useState<Bem | null>(null);
  const [selectedPlano, setSelectedPlano] = useState<PlanoSeguro | null>(null);
  const [selectedVendedor, setSelectedVendedor] = useState<Usuario | null>(null);

  const loadSeguros = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSeguros();
      
      if (response && response.results) {
        setSeguros(response.results);
      } else {
        setSeguros([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar seguros:', error);
      setError('Erro ao carregar seguros. Verifique sua conexão e tente novamente.');
      setSeguros([]);
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

  const loadBens = useCallback(async () => {
    try {
      const response = await apiService.getBens();
      if (response && response.results) {
        setBens(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar bens:', error);
    }
  }, []);

  const loadPlanosSeguro = useCallback(async () => {
    try {
      const response = await apiService.getPlanosSeguro();
      if (response && response.results) {
        setPlanosSeguro(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar planos de seguro:', error);
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

  const loadLojas = useCallback(async () => {
    try {
      const response = await apiService.getLojas();
      if (response && response.results) {
        setLojas(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  }, []);

  useEffect(() => {
    loadSeguros();
    loadClientes();
    loadBens();
    loadPlanosSeguro();
    loadUsuarios();
    loadLojas();
  }, [loadSeguros, loadClientes, loadBens, loadPlanosSeguro, loadUsuarios, loadLojas]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleClienteSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData(prev => ({
      ...prev,
      cliente: cliente.id
    }));
  };

  const handleBemSelect = (bem: Bem) => {
    setSelectedBem(bem);
    setFormData(prev => ({
      ...prev,
      bem: bem.id
    }));
  };

  const handlePlanoSelect = (plano: PlanoSeguro) => {
    setSelectedPlano(plano);
    setFormData(prev => ({
      ...prev,
      plano: plano.id
    }));
  };

  const handleVendedorSelect = (usuario: Usuario) => {
    setSelectedVendedor(usuario);
    setFormData(prev => ({
      ...prev,
      vendedor: usuario.id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSeguro) {
        await apiService.updateSeguro(editingSeguro.id, formData as any);
      } else {
        await apiService.createSeguro(formData as any);
      }
      setShowModal(false);
      setEditingSeguro(null);
      resetForm();
      loadSeguros();
    } catch (error) {
      console.error('Erro ao salvar seguro:', error);
      setError('Erro ao salvar seguro. Tente novamente.');
    }
  };

  const handleEdit = (seguro: Seguro) => {
    setEditingSeguro(seguro);
    setFormData({
      cliente: seguro.cliente.id,
      bem: seguro.bem.id,
      plano: seguro.plano.id,
      cotacao: seguro.cotacao,
      vendedor: seguro.vendedor.id,
              loja: seguro.loja?.id || 0,
      apolice: seguro.apolice || '',
      valor_seguro: seguro.valor_seguro,
      comissao_percentual: seguro.comissao_percentual,
      status: seguro.status,
      data_inicio: seguro.data_inicio || '',
      data_fim: seguro.data_fim || '',
      data_venda: seguro.data_venda || '',
      observacoes: seguro.observacoes || ''
    });
    
    // Configurar autocomplete para edição
    setClienteSearch(`${seguro.cliente.nome} - ${seguro.cliente.cpf_cnpj}`);
    setBemSearch(`${seguro.bem.descricao} - ${seguro.bem.tipo}`);
    setPlanoSearch(`${seguro.plano.nome} - ${seguro.plano.seguradora.nome}`);
    setVendedorSearch(`${seguro.vendedor.user.first_name} ${seguro.vendedor.user.last_name} - ${seguro.vendedor.user.username}`);
    setSelectedCliente(seguro.cliente);
    setSelectedBem(seguro.bem);
    setSelectedPlano(seguro.plano);
    setSelectedVendedor(seguro.vendedor);
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este seguro?')) {
      try {
        await apiService.deleteSeguro(id);
        loadSeguros();
      } catch (error) {
        console.error('Erro ao excluir seguro:', error);
        setError('Erro ao excluir seguro. Tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cliente: 0,
      bem: 0,
      plano: 0,
      cotacao: 0,
      vendedor: 0,
      loja: 0,
      apolice: '',
      valor_seguro: 0,
      comissao_percentual: 0,
      status: 'ativo',
      data_inicio: '',
      data_fim: '',
      data_venda: '',
      observacoes: ''
    });
    setClienteSearch('');
    setBemSearch('');
    setPlanoSearch('');
    setVendedorSearch('');
    setSelectedCliente(null);
    setSelectedBem(null);
    setSelectedPlano(null);
    setSelectedVendedor(null);
  };

  const openCreateModal = () => {
    setEditingSeguro(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativo': 'success',
      'cancelado': 'danger',
      'suspenso': 'warning',
      'vencido': 'secondary'
    } as const;
    
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🛡️ Seguros</h2>
          <p className="text-muted mb-0">Gerencie os seguros do sistema</p>
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
            <Button onClick={loadSeguros} variant="outline-danger">
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Lista de Seguros</h5>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            ➕ Novo Seguro
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : seguros.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum seguro encontrado.</p>
              <Button variant="outline-primary" onClick={loadSeguros}>
                Recarregar
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Bem Segurado</th>
                  <th>Plano</th>
                  <th>Apólice</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Vencimento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {seguros.map((seguro) => (
                  <tr key={seguro.id}>
                    <td>{seguro.cliente.nome}</td>
                    <td>
                      <strong>{seguro.bem.descricao}</strong>
                      <br />
                      <small className="text-muted">{seguro.bem.tipo}</small>
                    </td>
                    <td>{seguro.plano.nome}</td>
                    <td>{seguro.apolice || 'N/A'}</td>
                    <td>R$ {seguro.valor_seguro.toLocaleString('pt-BR')}</td>
                    <td>{getStatusBadge(seguro.status)}</td>
                    <td>{new Date(seguro.data_fim).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(seguro)}>
                        ✏️ Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-1"
                        onClick={() => handleDelete(seguro.id)}
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
            {editingSeguro ? `Editar Seguro #${editingSeguro.id}` : 'Novo Seguro'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Cliente *"
                  placeholder="Digite para buscar cliente..."
                  value={clienteSearch}
                  onChange={setClienteSearch}
                  onSelect={handleClienteSelect}
                  items={clientes}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="cpf_cnpj"
                  required
                />
                {selectedCliente && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedCliente.nome} - {selectedCliente.cpf_cnpj}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Bem Segurado *"
                  placeholder="Digite para buscar bem..."
                  value={bemSearch}
                  onChange={setBemSearch}
                  onSelect={handleBemSelect}
                  items={bens}
                  searchKey="descricao"
                  displayKey="descricao"
                  secondaryKey="tipo"
                  required
                />
                {selectedBem && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedBem.descricao} - {selectedBem.tipo}
                    </small>
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Plano de Seguro *"
                  placeholder="Digite para buscar plano..."
                  value={planoSearch}
                  onChange={setPlanoSearch}
                  onSelect={handlePlanoSelect}
                  items={planosSeguro}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="seguradora.nome"
                  required
                />
                {selectedPlano && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedPlano.nome} - {selectedPlano.seguradora.nome}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Vendedor *"
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
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loja</Form.Label>
                  <Form.Select name="loja" value={formData.loja} onChange={handleFormChange}>
                    <option value={0}>Selecione uma loja...</option>
                    {lojas.map(loja => (
                      <option key={loja.id} value={loja.id}>
                        {loja.nome} - {loja.cidade}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="ativo">Ativo</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="vencido">Vencido</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cotação</Form.Label>
                  <Form.Control
                    type="number"
                    name="cotacao"
                    value={formData.cotacao}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor do Seguro *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_seguro"
                    value={formData.valor_seguro}
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
                  <Form.Label>Data de Início</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_inicio"
                    value={formData.data_inicio}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Fim</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_fim"
                    value={formData.data_fim}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data da Venda</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_venda"
                    value={formData.data_venda}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Número da Apólice</Form.Label>
              <Form.Control
                type="text"
                name="apolice"
                value={formData.apolice}
                onChange={handleFormChange}
                placeholder="Número da apólice"
              />
            </Form.Group>
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
              {editingSeguro ? 'Atualizar' : 'Criar'} Seguro
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

export default Seguros;
