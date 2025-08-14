import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { Ocorrencia, Usuario, Cliente, Motocicleta } from '../types';
import apiService from '../services/api';
import AutocompleteField from '../components/AutocompleteField';

const Ocorrencias: React.FC = () => {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'trabalho_interno',
    prioridade: 'media',
    responsavel: 0,
    solicitante: 0,
    loja: 0,
    data_abertura: '',
    data_limite: '',
    status: 'aberta',
    observacoes: ''
  });

  // Estados para autocomplete
  const [responsavelSearch, setResponsavelSearch] = useState('');
  const [solicitanteSearch, setSolicitanteSearch] = useState('');
  const [selectedResponsavel, setSelectedResponsavel] = useState<Usuario | null>(null);
  const [selectedSolicitante, setSelectedSolicitante] = useState<Usuario | null>(null);

  const loadOcorrencias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOcorrencias();
      
      if (response && response.results) {
        setOcorrencias(response.results);
      } else if (response && (response as any).data) {
        // Compatibilidade com estrutura {success: true, data: [...]}
        setOcorrencias((response as any).data);
      } else {
        setOcorrencias([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
      setError('Erro ao carregar ocorrências. Verifique sua conexão e tente novamente.');
      setOcorrencias([]);
    } finally {
      setLoading(false);
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
    loadOcorrencias();
    loadUsuarios();
  }, [loadOcorrencias, loadUsuarios]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleResponsavelSelect = (usuario: Usuario) => {
    setSelectedResponsavel(usuario);
    setFormData(prev => ({
      ...prev,
      responsavel: usuario.id
    }));
  };

  const handleSolicitanteSelect = (usuario: Usuario) => {
    setSelectedSolicitante(usuario);
    setFormData(prev => ({
      ...prev,
      solicitante: usuario.id
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.titulo.trim()) {
      setError('Título é obrigatório');
      return;
    }
    
    if (!formData.descricao.trim()) {
      setError('Descrição é obrigatória');
      return;
    }
    
    if (!selectedResponsavel) {
      setError('Responsável é obrigatório');
      return;
    }
    
    try {
      // Preparar dados para envio
      const dadosParaEnviar = {
        ...formData,
        responsavel: selectedResponsavel.id,
        solicitante: selectedSolicitante?.id || selectedResponsavel.id, // Usar responsável como solicitante se não selecionado
        loja: selectedResponsavel.loja?.id || 0, // Usar loja do responsável (com fallback)
        data_abertura: formData.data_abertura || new Date().toISOString().split('T')[0],
      };
      
      if (editingOcorrencia) {
        await apiService.updateOcorrencia(editingOcorrencia.id, dadosParaEnviar as any);
      } else {
        await apiService.createOcorrencia(dadosParaEnviar as any);
      }
      setShowModal(false);
      setEditingOcorrencia(null);
      resetForm();
      loadOcorrencias();
      setError(null); // Limpar erros anteriores
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      setError('Erro ao salvar ocorrência. Tente novamente.');
    }
  };

  const handleEdit = (ocorrencia: Ocorrencia) => {
    setEditingOcorrencia(ocorrencia);
    setFormData({
      titulo: ocorrencia.titulo,
      descricao: ocorrencia.descricao,
      tipo: ocorrencia.tipo,
      prioridade: ocorrencia.prioridade,
      responsavel: ocorrencia.responsavel?.id || 0,
      solicitante: ocorrencia.solicitante?.id || 0,
      loja: ocorrencia.loja?.id || 0,
      data_abertura: ocorrencia.data_abertura ? ocorrencia.data_abertura.split('T')[0] : '',
      data_limite: ocorrencia.data_limite ? ocorrencia.data_limite.split('T')[0] : '',
      status: ocorrencia.status,
      observacoes: ocorrencia.observacoes || ''
    });
    
    // Configurar autocomplete para edição
    if (ocorrencia.responsavel) {
      setResponsavelSearch(`${ocorrencia.responsavel.user.first_name} ${ocorrencia.responsavel.user.last_name} - ${ocorrencia.responsavel.user.username}`);
      setSelectedResponsavel(ocorrencia.responsavel);
    } else {
      setResponsavelSearch('');
      setSelectedResponsavel(null);
    }
    
    if (ocorrencia.solicitante) {
      setSolicitanteSearch(`${ocorrencia.solicitante.user.first_name} ${ocorrencia.solicitante.user.last_name} - ${ocorrencia.solicitante.user.username}`);
      setSelectedSolicitante(ocorrencia.solicitante);
    } else {
      setSolicitanteSearch('');
      setSelectedSolicitante(null);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência?')) {
      try {
        await apiService.deleteOcorrencia(id);
        loadOcorrencias();
      } catch (error) {
        console.error('Erro ao excluir ocorrência:', error);
        setError('Erro ao excluir ocorrência. Tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'trabalho_interno',
      prioridade: 'media',
      responsavel: 0,
      solicitante: 0,
      loja: 0,
      data_abertura: '',
      data_limite: '',
      status: 'aberta',
      observacoes: ''
    });
    setResponsavelSearch('');
    setSolicitanteSearch('');
    setSelectedResponsavel(null);
    setSelectedSolicitante(null);
  };

  const openCreateModal = () => {
    setEditingOcorrencia(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'aberta': 'warning',
      'em_andamento': 'primary',
      'resolvida': 'success',
      'cancelada': 'danger',
      'pendente': 'info'
    } as const;
    
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants = {
      'baixa': 'success',
      'media': 'warning',
      'alta': 'danger',
      'urgente': 'dark'
    } as const;
    
    return <Badge bg={variants[prioridade as keyof typeof variants] || 'secondary'}>{prioridade}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const variants = {
      'trabalho_interno': 'primary',
      'manutencao': 'info',
      'atendimento': 'success',
      'administrativo': 'secondary'
    } as const;
    
    return <Badge bg={variants[tipo as keyof typeof variants] || 'secondary'}>{tipo}</Badge>;
  };

  const enviarWhatsApp = (telefone: string, mensagem: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagemCodificada = encodeURIComponent(mensagem);
    const url = `https://wa.me/55${numeroLimpo}?text=${mensagemCodificada}`;
    window.open(url, '_blank');
  };

  const gerarMensagemWhatsApp = (ocorrencia: Ocorrencia) => {
    const solicitante = ocorrencia.solicitante?.user.first_name || 'Solicitante';
    const responsavel = ocorrencia.responsavel?.user.first_name || 'Responsável';
    
    return `Olá! Sou ${responsavel} da Prado Motors.

Ocorrência: ${ocorrencia.titulo}
Solicitante: ${solicitante}
Status: ${ocorrencia.status}
Prioridade: ${ocorrencia.prioridade}

${ocorrencia.descricao}

Preciso entrar em contato sobre esta ocorrência. Poderia me retornar?`;
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🚨 Ocorrências</h2>
          <p className="text-muted mb-0">Gerencie ocorrências de trabalho interno</p>
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
            <Button onClick={loadOcorrencias} variant="outline-danger">
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Lista de Ocorrências</h5>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            ➕ Nova Ocorrência
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : ocorrencias.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma ocorrência encontrada.</p>
              <Button variant="outline-primary" onClick={loadOcorrencias}>
                Recarregar
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Prioridade</th>
                  <th>Responsável</th>
                  <th>Solicitante</th>
                  <th>Status</th>
                  <th>Data Limite</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.map((ocorrencia) => (
                  <tr key={ocorrencia.id}>
                    <td>
                      <strong>{ocorrencia.titulo}</strong>
                      <br />
                      <small className="text-muted">{ocorrencia.descricao.substring(0, 50)}...</small>
                    </td>
                    <td>{getTipoBadge(ocorrencia.tipo)}</td>
                    <td>{getPrioridadeBadge(ocorrencia.prioridade)}</td>
                    <td>
                      {ocorrencia.responsavel?.user.first_name} {ocorrencia.responsavel?.user.last_name}
                    </td>
                    <td>{ocorrencia.solicitante?.user.first_name} {ocorrencia.solicitante?.user.last_name}</td>
                    <td>{getStatusBadge(ocorrencia.status)}</td>
                    <td>{new Date(ocorrencia.data_limite).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(ocorrencia)}>
                        ✏️ Editar
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="ms-1"
                        onClick={() => enviarWhatsApp(
                          '11999999999', // Telefone padrão para demonstração
                          gerarMensagemWhatsApp(ocorrencia)
                        )}
                        title="Enviar WhatsApp"
                      >
                        📱 WhatsApp
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-1"
                        onClick={() => handleDelete(ocorrencia.id)}
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
            {editingOcorrencia ? `Editar Ocorrência #${editingOcorrencia.id}` : 'Nova Ocorrência'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <Alert.Heading>ℹ️ Trabalho Interno</Alert.Heading>
              <p className="mb-0">
                Todas as ocorrências são para trabalho interno. Use o botão WhatsApp para comunicação externa.
              </p>
            </Alert>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Título *</Form.Label>
                  <Form.Control
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleFormChange}
                    required
                    placeholder="Descreva brevemente a ocorrência"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo *</Form.Label>
                  <Form.Select name="tipo" value={formData.tipo} onChange={handleFormChange} required>
                    <option value="trabalho_interno">Trabalho Interno</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="atendimento">Atendimento</option>
                    <option value="administrativo">Administrativo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrição *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descricao"
                value={formData.descricao}
                onChange={handleFormChange}
                required
                placeholder="Descreva detalhadamente a ocorrência"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Responsável *"
                  placeholder="Digite para buscar responsável..."
                  value={responsavelSearch}
                  onChange={setResponsavelSearch}
                  onSelect={handleResponsavelSelect}
                  items={usuarios}
                  searchKey="user.first_name"
                  displayKey="user.first_name"
                  secondaryKey="user.username"
                  required
                />
                {selectedResponsavel && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedResponsavel.user.first_name} {selectedResponsavel.user.last_name} - {selectedResponsavel.user.username}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Solicitante"
                  placeholder="Digite para buscar solicitante..."
                  value={solicitanteSearch}
                  onChange={setSolicitanteSearch}
                  onSelect={handleSolicitanteSelect}
                  items={usuarios}
                  searchKey="user.first_name"
                  displayKey="user.first_name"
                  secondaryKey="user.username"
                />
                {selectedSolicitante && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedSolicitante.user.first_name} {selectedSolicitante.user.last_name} - {selectedSolicitante.user.username}
                    </small>
                  </div>
                )}
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prioridade *</Form.Label>
                  <Form.Select name="prioridade" value={formData.prioridade} onChange={handleFormChange} required>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="aberta">Aberta</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="resolvida">Resolvida</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelada">Cancelada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data da Ocorrência</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_abertura"
                    value={formData.data_abertura}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
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
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observacoes"
                value={formData.observacoes}
                onChange={handleFormChange}
                placeholder="Observações adicionais"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingOcorrencia ? 'Atualizar' : 'Criar'} Ocorrência
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

export default Ocorrencias;
