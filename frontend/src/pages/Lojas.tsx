import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Loja } from '../types';

interface LojaForm {
  nome: string;
  cnpj: string;
  cidade: string;
  endereco: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

const Lojas: React.FC = () => {
  const { user } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [formData, setFormData] = useState<LojaForm>({
    nome: '',
    cnpj: '',
    cidade: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true
  });
  const [filtroAtivo, setFiltroAtivo] = useState<string>('');
  const [filtroCidade, setFiltroCidade] = useState<string>('');

  const loadLojas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando lojas...');
      const response = await apiService.getLojas();
      console.log('🔍 Resposta da API:', response);
      
      if (response.results) {
        setLojas(response.results);
        console.log('✅ Lojas carregadas:', response.results.length);
        console.log('🔍 Dados das lojas:', response.results);
      } else {
        setLojas([]);
        console.log('⚠️ Nenhuma loja encontrada ou estrutura inesperada');
        console.log('🔍 Estrutura da resposta:', response);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar lojas:', error);
      setError('Erro ao carregar lojas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLojas();
  }, [loadLojas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cnpj || !formData.cidade) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingLoja) {
        await apiService.updateLoja(editingLoja.id, formData);
        console.log('✅ Loja atualizada');
      } else {
        await apiService.createLoja(formData);
        console.log('✅ Nova loja criada');
      }

      setShowModal(false);
      setEditingLoja(null);
      setFormData({
        nome: '',
        cnpj: '',
        cidade: '',
        endereco: '',
        telefone: '',
        email: '',
        ativo: true
      });
      loadLojas();
    } catch (error) {
      console.error('❌ Erro ao salvar loja:', error);
      setError('Erro ao salvar loja. Tente novamente.');
    }
  };

  const handleEdit = (loja: Loja) => {
    setEditingLoja(loja);
    setFormData({
      nome: loja.nome,
      cnpj: loja.cnpj,
      cidade: loja.cidade,
      endereco: loja.endereco,
      telefone: loja.telefone,
      email: loja.email,
      ativo: loja.ativo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta loja?')) return;

    try {
      await apiService.deleteLoja(id);
      console.log('✅ Loja excluída');
      loadLojas();
    } catch (error) {
      console.error('❌ Erro ao excluir loja:', error);
      setError('Erro ao excluir loja.');
    }
  };

  const handleToggleStatus = async (loja: Loja) => {
    try {
      await apiService.updateLoja(loja.id, { ativo: !loja.ativo });
      console.log('✅ Status da loja alterado');
      loadLojas();
    } catch (error) {
      console.error('❌ Erro ao alterar status da loja:', error);
      setError('Erro ao alterar status da loja.');
    }
  };

  const formatarCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatarTelefone = (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return telefone;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Filtrar lojas
  const lojasFiltradas = lojas.filter(loja => {
    const matchAtivo = filtroAtivo === '' || 
      (filtroAtivo === 'ativo' && loja.ativo) || 
      (filtroAtivo === 'inativo' && !loja.ativo);
    const matchCidade = !filtroCidade || 
      loja.cidade.toLowerCase().includes(filtroCidade.toLowerCase());
    
    return matchAtivo && matchCidade;
  });

  const lojasAtivas = lojas.filter(l => l.ativo).length;
  const lojasInativas = lojas.filter(l => !l.ativo).length;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🏪 Lojas</h2>
          <p className="text-muted mb-0">
            Gerencie as lojas ({lojasAtivas} ativas, {lojasInativas} inativas)
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
          <h5 className="mb-0">Lista de Lojas</h5>
          <div>
            <Button variant="outline-primary" size="sm" onClick={loadLojas} className="me-2">
              🔄 Atualizar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              ➕ Nova Loja
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
                  value={filtroAtivo} 
                  onChange={(e) => setFiltroAtivo(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativas</option>
                  <option value="inativo">Inativas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Cidade</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por cidade..."
                  value={filtroCidade}
                  onChange={(e) => setFiltroCidade(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="text-muted">
                {lojasFiltradas.length} de {lojas.length} lojas
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : lojasFiltradas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma loja encontrada</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Cidade</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>Data Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lojasFiltradas.map((loja) => (
                  <tr key={loja.id}>
                    <td>
                      {loja.ativo ? (
                        <Badge bg="success">Ativa</Badge>
                      ) : (
                        <Badge bg="secondary">Inativa</Badge>
                      )}
                    </td>
                    <td>
                      <strong>{loja.nome}</strong>
                      {loja.endereco && (
                        <div className="small text-muted">{loja.endereco}</div>
                      )}
                    </td>
                    <td>{formatarCNPJ(loja.cnpj)}</td>
                    <td>{loja.cidade}</td>
                    <td>{formatarTelefone(loja.telefone)}</td>
                    <td>
                      {loja.email ? (
                        <a href={`mailto:${loja.email}`}>{loja.email}</a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{formatarData(loja.data_cadastro)}</td>
                    <td>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleEdit(loja)}
                        className="me-2"
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant={loja.ativo ? "outline-secondary" : "outline-success"}
                        size="sm"
                        onClick={() => handleToggleStatus(loja)}
                        className="me-2"
                      >
                        {loja.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(loja.id)}
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
        setEditingLoja(null);
        setFormData({
          nome: '',
          cnpj: '',
          cidade: '',
          endereco: '',
          telefone: '',
          email: '',
          ativo: true
        });
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingLoja ? '✏️ Editar Loja' : '➕ Nova Loja'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Loja *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Digite o nome da loja"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CNPJ *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cidade *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Digite a cidade"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefone</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="loja@exemplo.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="ativo-switch"
                    label="Loja ativa"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Digite o endereço completo"
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
              {editingLoja ? 'Atualizar' : 'Criar'}
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

export default Lojas;
