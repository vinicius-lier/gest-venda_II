import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { api } from '../services/api';

interface PlanoSeguro {
  id: number;
  nome: string;
  seguradora: string;
  descricao: string;
  valor_base: number;
  cobertura: string;
  status: string;
}

const PlanosSeguro: React.FC = () => {
  const [planos, setPlanos] = useState<PlanoSeguro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<PlanoSeguro | null>(null);

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planos-seguro/');
      setPlanos(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar planos de seguro');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoPlano = () => {
    setSelectedPlano(null);
    setShowModal(true);
  };

  const handleEditar = (plano: PlanoSeguro) => {
    setSelectedPlano(plano);
    setShowModal(true);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este plano de seguro?')) {
      try {
        await api.delete(`/planos-seguro/${id}/excluir/`);
        carregarPlanos();
      } catch (err) {
        setError('Erro ao excluir plano de seguro');
        console.error('Erro:', err);
      }
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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
        <h1 className="h3 mb-0">Planos de Seguro</h1>
        <Button variant="primary" onClick={handleNovoPlano}>
          <i className="fas fa-plus me-2"></i>
          Novo Plano
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
                <th>Seguradora</th>
                <th>Descrição</th>
                <th>Valor Base</th>
                <th>Cobertura</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {planos.map((plano) => (
                <tr key={plano.id}>
                  <td>{plano.id}</td>
                  <td>{plano.nome}</td>
                  <td>{plano.seguradora}</td>
                  <td>
                    <span title={plano.descricao}>
                      {plano.descricao.length > 50 
                        ? `${plano.descricao.substring(0, 50)}...` 
                        : plano.descricao}
                    </span>
                  </td>
                  <td>{formatarValor(plano.valor_base)}</td>
                  <td>{plano.cobertura}</td>
                  <td>
                    <span className={`badge bg-${plano.status === 'Ativo' ? 'success' : 'secondary'}`}>
                      {plano.status}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditar(plano)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(`/planos-seguro/${plano.id}/`, '_blank')}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleExcluir(plano.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {planos.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum plano de seguro encontrado.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para criar/editar plano */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPlano ? 'Editar Plano de Seguro' : 'Novo Plano de Seguro'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação/edição de planos de seguro será implementada em breve.
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

export default PlanosSeguro;
