import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { ControleChave, ControleChaveForm, Motocicleta, User } from '../types';
import AutocompleteField from '../components/AutocompleteField';

const Chaves: React.FC = () => {
  const { user } = useAuth();
  const [controleChaves, setControleChaves] = useState<ControleChave[]>([]);
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [funcionarios, setFuncionarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [editingChave, setEditingChave] = useState<ControleChave | null>(null);
  const [devolvendoChave, setDevolvendoChave] = useState<ControleChave | null>(null);
  const [formData, setFormData] = useState<ControleChaveForm>({
    funcionario: 0,
    motocicleta: 0,
    data_saida: new Date().toISOString().split('T')[0],
    observacoes: ''
  });
  const [funcionarioDisplay, setFuncionarioDisplay] = useState('');
  const [motocicletaDisplay, setMotocicletaDisplay] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando dados do controle de chaves...');
      
      const [chavesResponse, motosResponse, usuariosResponse] = await Promise.all([
        apiService.getControleChaves(),
        apiService.getMotocicletas(),
        apiService.getUsuarios()
      ]);
      
      if (chavesResponse.results) {
        setControleChaves(chavesResponse.results);
        console.log('✅ Controle de chaves carregado:', chavesResponse.results.length);
      }
      
      if (motosResponse.results) {
        setMotocicletas(motosResponse.results);
        console.log('✅ Motocicletas carregadas:', motosResponse.results.length);
      }
      
      if (usuariosResponse.results) {
        setFuncionarios(usuariosResponse.results.map((u: any) => u.user).filter(Boolean));
        console.log('✅ Funcionários carregados:', usuariosResponse.results.length);
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
    
    if (!formData.funcionario || !formData.motocicleta) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const dataToSend: ControleChaveForm = {
        funcionario: formData.funcionario,
        motocicleta: formData.motocicleta,
        data_saida: new Date(formData.data_saida).toISOString(),
        observacoes: formData.observacoes
      };

      if (editingChave) {
        await apiService.updateControleChave(editingChave.id, dataToSend);
        console.log('✅ Controle de chave atualizado');
      } else {
        await apiService.createControleChave(dataToSend);
        console.log('✅ Novo controle de chave criado');
      }

      setShowModal(false);
      setEditingChave(null);
      setFormData({
        funcionario: 0,
        motocicleta: 0,
        data_saida: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setFuncionarioDisplay('');
      setMotocicletaDisplay('');
      loadData();
    } catch (error) {
      console.error('❌ Erro ao salvar controle de chave:', error);
      setError('Erro ao salvar controle de chave. Tente novamente.');
    }
  };

  const handleDevolucao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!devolvendoChave) return;

    try {
      await apiService.updateControleChave(devolvendoChave.id, {
        data_retorno: new Date().toISOString(),
        funcionario_devolucao: user?.id || 0,
        status: 'devolvida' as const
      });

      console.log('✅ Chave devolvida com sucesso');
      setShowDevolucaoModal(false);
      setDevolvendoChave(null);
      loadData();
    } catch (error) {
      console.error('❌ Erro ao devolver chave:', error);
      setError('Erro ao devolver chave. Tente novamente.');
    }
  };

  const handleEdit = (chave: ControleChave) => {
    setEditingChave(chave);
    setFormData({
      funcionario: chave.funcionario.id,
      motocicleta: chave.motocicleta.id,
      data_saida: chave.data_saida.split('T')[0],
      observacoes: ''
    });
    setFuncionarioDisplay(`${chave.funcionario.first_name} ${chave.funcionario.last_name}`);
    setMotocicletaDisplay(`${chave.motocicleta.marca} ${chave.motocicleta.modelo} - ${chave.motocicleta.placa}`);
    setShowModal(true);
  };

  const handleDevolver = (chave: ControleChave) => {
    setDevolvendoChave(chave);
    setShowDevolucaoModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      await apiService.deleteControleChave(id);
      console.log('✅ Controle de chave excluído');
      loadData();
    } catch (error) {
      console.error('❌ Erro ao excluir controle de chave:', error);
      setError('Erro ao excluir controle de chave.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string } } = {
      aberto: { bg: 'warning', text: 'dark' },
      devolvida: { bg: 'success', text: 'white' },
      atraso: { bg: 'danger', text: 'white' }
    };
    
    const config = badges[status] || { bg: 'secondary', text: 'white' };
    return <Badge bg={config.bg} text={config.text}>{status.toUpperCase()}</Badge>;
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

  const getFuncionarioNome = (funcionarioId: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario ? `${funcionario.first_name} ${funcionario.last_name}` : 'N/A';
  };

  const getMotocicletaInfo = (motoId: number) => {
    const moto = motocicletas.find(m => m.id === motoId);
    return moto ? `${moto.marca} ${moto.modelo} - ${moto.placa}` : 'N/A';
  };

  // Filtrar registros
  const registrosFiltrados = controleChaves.filter(registro => {
    const matchStatus = !filtroStatus || registro.status === filtroStatus;
    const matchFuncionario = !filtroFuncionario || 
      getFuncionarioNome(registro.funcionario.id).toLowerCase().includes(filtroFuncionario.toLowerCase());
    
    return matchStatus && matchFuncionario;
  });

  const chavesEmAberto = controleChaves.filter(c => c.status === 'aberto').length;
  const chavesEmAtraso = controleChaves.filter(c => c.status === 'atraso').length;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🔑 Controle de Chaves</h2>
          <p className="text-muted mb-0">
            Gerencie o controle de chaves ({chavesEmAberto} em aberto, {chavesEmAtraso} em atraso)
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
          <h5 className="mb-0">Lista de Controle de Chaves</h5>
          <div>
            <Button variant="outline-primary" size="sm" onClick={loadData} className="me-2">
              🔄 Atualizar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              ➕ Nova Saída
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filtros */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={filtroStatus} 
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="aberto">Em Aberto</option>
                  <option value="devolvida">Devolvida</option>
                  <option value="atraso">Em Atraso</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Funcionário</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por funcionário..."
                  value={filtroFuncionario}
                  onChange={(e) => setFiltroFuncionario(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="text-muted">
                {registrosFiltrados.length} de {controleChaves.length} registros
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum registro encontrado</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Funcionário</th>
                  <th>Motocicleta</th>
                  <th>Data Saída</th>
                  <th>Data Retorno</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((registro) => (
                  <tr key={registro.id}>
                    <td>{getStatusBadge(registro.status)}</td>
                    <td>{getFuncionarioNome(registro.funcionario.id)}</td>
                    <td>{getMotocicletaInfo(registro.motocicleta.id)}</td>
                    <td>{formatarData(registro.data_saida)}</td>
                    <td>
                      {registro.data_retorno ? formatarData(registro.data_retorno) : '-'}
                    </td>
                    <td>
                      {registro.status === 'aberto' && (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleDevolver(registro)}
                            className="me-2"
                          >
                            🔄 Devolver
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleEdit(registro)}
                            className="me-2"
                          >
                            ✏️ Editar
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(registro.id)}
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
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditingChave(null);
        setFormData({
          funcionario: 0,
          motocicleta: 0,
          data_saida: new Date().toISOString().split('T')[0],
          observacoes: ''
        });
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingChave ? '✏️ Editar Saída de Chave' : '➕ Nova Saída de Chave'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Funcionário *"
                  placeholder="Digite o nome do funcionário..."
                  value={funcionarioDisplay}
                  onChange={setFuncionarioDisplay}
                  onSelect={(funcionario) => {
                    setFormData({...formData, funcionario: funcionario.id});
                    setFuncionarioDisplay(`${funcionario.first_name} ${funcionario.last_name}`);
                  }}
                  items={funcionarios}
                  searchKey="first_name"
                  displayKey="first_name"
                  secondaryKey="last_name"
                  required
                  showId
                />
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Motocicleta *"
                  placeholder="Digite a marca, modelo ou placa..."
                  value={motocicletaDisplay}
                  onChange={setMotocicletaDisplay}
                  onSelect={(motocicleta) => {
                    setFormData({...formData, motocicleta: motocicleta.id});
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
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Saída *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.data_saida}
                    onChange={(e) => setFormData({...formData, data_saida: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Observações</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Observações sobre a saída da chave..."
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
              {editingChave ? 'Atualizar' : 'Criar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Devolução */}
      <Modal show={showDevolucaoModal} onHide={() => {
        setShowDevolucaoModal(false);
        setDevolvendoChave(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>🔄 Devolver Chave</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDevolucao}>
          <Modal.Body>
            {devolvendoChave && (
              <div>
                <p><strong>Funcionário:</strong> {getFuncionarioNome(devolvendoChave.funcionario.id)}</p>
                <p><strong>Motocicleta:</strong> {getMotocicletaInfo(devolvendoChave.motocicleta.id)}</p>
                <p><strong>Data de Saída:</strong> {formatarData(devolvendoChave.data_saida)}</p>
                <p className="text-warning">
                  <strong>Confirma a devolução da chave?</strong>
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDevolucaoModal(false)}>
              Cancelar
            </Button>
            <Button variant="success" type="submit">
              Confirmar Devolução
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

export default Chaves;
