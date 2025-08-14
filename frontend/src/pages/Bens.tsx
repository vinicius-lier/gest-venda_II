import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { api } from '../services/api';

interface Bem {
  id: number;
  nome: string;
  descricao: string;
  valor: number;
  data_aquisicao: string;
  categoria: string;
  status: string;
  localizacao: string;
}

const Bens: React.FC = () => {
  const [bens, setBens] = useState<Bem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBem, setSelectedBem] = useState<Bem | null>(null);

  useEffect(() => {
    carregarBens();
  }, []);

  const carregarBens = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bens/');
      setBens(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar bens');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoBem = () => {
    setSelectedBem(null);
    setShowModal(true);
  };

  const handleEditar = (bem: Bem) => {
    setSelectedBem(bem);
    setShowModal(true);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este bem?')) {
      try {
        await api.delete(`/bens/${id}/excluir/`);
        carregarBens();
      } catch (err) {
        setError('Erro ao excluir bem');
        console.error('Erro:', err);
      }
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Ativo': 'success',
      'Inativo': 'secondary',
      'Em Manutenção': 'warning',
      'Vendido': 'info',
      'Perdido': 'danger'
    };
    return statusMap[status] || 'secondary';
  };

  const getCategoriaIcon = (categoria: string) => {
    const iconMap: { [key: string]: string } = {
      'Equipamento': 'fas fa-tools',
      'Veículo': 'fas fa-car',
      'Imóvel': 'fas fa-building',
      'Eletrônico': 'fas fa-laptop',
      'Móvel': 'fas fa-couch',
      'Outro': 'fas fa-box'
    };
    return iconMap[categoria] || 'fas fa-box';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Bens</h1>
        <Button variant="primary" onClick={handleNovoBem}>
          <i className="fas fa-plus me-2"></i>
          Novo Bem
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Data Aquisição</th>
                <th>Localização</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {bens.map((bem) => (
                <tr key={bem.id}>
                  <td>{bem.id}</td>
                  <td>
                    <div>
                      <strong>{bem.nome}</strong>
                      {bem.descricao && (
                        <div className="text-muted small">
                          {bem.descricao.length > 50 
                            ? `${bem.descricao.substring(0, 50)}...` 
                            : bem.descricao}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <i className={`${getCategoriaIcon(bem.categoria)} me-2`}></i>
                    {bem.categoria}
                  </td>
                  <td className="fw-bold">{formatarValor(bem.valor)}</td>
                  <td>{formatarData(bem.data_aquisicao)}</td>
                  <td>{bem.localizacao}</td>
                  <td>
                    <span className={`badge bg-${getStatusBadge(bem.status)}`}>
                      {bem.status}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditar(bem)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(`/bens/${bem.id}/`, '_blank')}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleExcluir(bem.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {bens.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum bem encontrado.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para criar/editar bem */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedBem ? 'Editar Bem' : 'Novo Bem'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação/edição de bens será implementada em breve.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Bens;
