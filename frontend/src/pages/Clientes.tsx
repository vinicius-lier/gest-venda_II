import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col, ButtonGroup } from 'react-bootstrap';
import { Cliente, FiltroCliente, ClienteForm, ApiError, Motocicleta } from '../types';
import apiService from '../services/api';
import DetailModal from '../components/DetailModal';
import WhatsApp from '../components/WhatsApp';

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltroCliente>({});
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteForm>({
    nome: '',
    cpf_cnpj: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    tipo: 'comprador',
    observacoes: '',
    ativo: true
  });

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getClientes(filtros);
      
      // Verificar se a resposta tem a estrutura esperada
      if (response && response.results) {
        setClientes(response.results);
      } else {
        // Se não há dados, definir como array vazio
        setClientes([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setError('Erro ao carregar clientes. Verifique sua conexão e tente novamente.');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const loadMotocicletas = useCallback(async () => {
    try {
      const response = await apiService.getMotocicletas();
      if (response && response.results) {
        // Filtrar apenas motocicletas em estoque
        const motosEmEstoque = response.results.filter((moto: Motocicleta) => 
          moto.status === 'estoque' && moto.ativo
        );
        setMotocicletas(motosEmEstoque);
      }
    } catch (error) {
      console.error('Erro ao carregar motocicletas:', error);
    }
  }, []);

  useEffect(() => {
    loadClientes();
    loadMotocicletas();
  }, [loadClientes, loadMotocicletas]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    
    if (!formData.cpf_cnpj.trim()) {
      setError('CPF/CNPJ é obrigatório');
      return;
    }
    
    if (!formData.telefone.trim()) {
      setError('Telefone é obrigatório');
      return;
    }
    
    try {
      // Preparar dados para envio - tratar campos vazios
      const dadosParaEnviar = {
        ...formData,
        // Converter campos vazios para strings vazias (não undefined)
        data_nascimento: formData.data_nascimento.trim() || '',
        rg: formData.rg.trim() || '',
        email: formData.email.trim() || '',
        endereco: formData.endereco.trim() || '',
        cidade: formData.cidade.trim() || '',
        estado: formData.estado.trim() || '',
        cep: formData.cep.trim() || '',
        observacoes: formData.observacoes.trim() || '',
      };
      
      if (editingCliente) {
        await apiService.updateCliente(editingCliente.id, dadosParaEnviar);
      } else {
        await apiService.createCliente(dadosParaEnviar);
      }
      setShowModal(false);
      setEditingCliente(null);
      resetForm();
      loadClientes();
      setError(null); // Limpar erros anteriores
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      const apiError = error as ApiError;
      
      // Tratar erros específicos da API
      if (apiError.response?.data?.details) {
        const details = apiError.response.data.details;
        if (details.cpf_cnpj) {
          setError('CPF/CNPJ já existe no sistema');
        } else if (details.data_nascimento) {
          setError('Formato de data inválido. Use DD/MM/AAAA');
        } else {
          setError('Erro ao salvar cliente. Verifique os dados.');
        }
      } else {
        setError('Erro ao salvar cliente. Tente novamente.');
      }
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj,
      rg: cliente.rg || '',
      data_nascimento: cliente.data_nascimento || '',
      telefone: cliente.telefone,
      email: cliente.email || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      tipo: cliente.tipo,
      observacoes: cliente.observacoes || '',
      ativo: cliente.ativo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await apiService.deleteCliente(id);
        loadClientes();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        setError('Erro ao excluir cliente. Tente novamente.');
      }
    }
  };

  const handleDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf_cnpj: '',
      rg: '',
      data_nascimento: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      tipo: 'comprador',
      observacoes: '',
      ativo: true
    });
  };

  const openCreateModal = () => {
    setEditingCliente(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👥 Clientes</h2>
          <p className="text-muted mb-0">Gerencie todos os clientes do sistema</p>
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
            <Button onClick={loadClientes} variant="outline-danger">
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select name="tipo" value={filtros.tipo || ''} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  <option value="comprador">Comprador</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="consignado">Consignado</option>
                  <option value="proprietario">Proprietário</option>
                  <option value="ambos">Ambos</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select name="ativo" value={filtros.ativo?.toString() || ''} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <Form.Control
                  type="text"
                  name="search"
                  placeholder="Buscar por nome, CPF/CNPJ, telefone..."
                  value={filtros.search || ''}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Lista de Clientes</h5>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            ➕ Novo Cliente
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum cliente encontrado.</p>
              <Button variant="outline-primary" onClick={loadClientes}>
                Recarregar
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF/CNPJ</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.cpf_cnpj}</td>
                    <td>{cliente.telefone}</td>
                    <td>{cliente.email || 'N/A'}</td>
                    <td>
                      <Badge bg="info">{cliente.tipo}</Badge>
                    </td>
                    <td>
                      <Badge bg={cliente.ativo ? 'success' : 'danger'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="outline-info" size="sm" onClick={() => handleDetails(cliente)} title="Ver detalhes">
                          👁️
                        </Button>
                        <WhatsApp
                          telefone={cliente.telefone}
                          nome={cliente.nome}
                          tipo="cliente"
                          motocicletas={motocicletas}
                          variant="outline-success"
                          size="sm"
                          onSend={(mensagem) => {
                            console.log('Mensagem enviada para', cliente.nome, ':', mensagem);
                          }}
                        />
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(cliente)}>
                          ✏️
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.id)}>
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Criação/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCliente ? `Editar Cliente - ${editingCliente.nome}` : 'Novo Cliente'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CPF/CNPJ *</Form.Label>
                  <Form.Control
                    type="text"
                    name="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>RG</Form.Label>
                  <Form.Control
                    type="text"
                    name="rg"
                    value={formData.rg}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Nascimento</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefone *</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cidade</Form.Label>
                  <Form.Control
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Control
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleFormChange}
                    maxLength={2}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>CEP</Form.Label>
                  <Form.Control
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo *</Form.Label>
                  <Form.Select name="tipo" value={formData.tipo} onChange={handleFormChange} required>
                    <option value="comprador">Comprador</option>
                    <option value="fornecedor">Fornecedor</option>
                    <option value="consignado">Consignado</option>
                    <option value="proprietario">Proprietário</option>
                    <option value="ambos">Comprador e Fornecedor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="ativo"
                    label="Cliente Ativo"
                    checked={formData.ativo}
                    onChange={handleFormChange}
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
              {editingCliente ? 'Atualizar' : 'Criar'} Cliente
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Detalhes */}
      <DetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        title={`Cliente - ${selectedCliente?.nome}`}
        data={selectedCliente}
        type="cliente"
      />

      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Clientes;
