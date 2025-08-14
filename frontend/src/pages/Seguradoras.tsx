import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { api } from '../services/api';

interface Seguradora {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  status: string;
}

const Seguradoras: React.FC = () => {
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeguradora, setSelectedSeguradora] = useState<Seguradora | null>(null);

  useEffect(() => {
    carregarSeguradoras();
  }, []);

  const carregarSeguradoras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/seguradoras/');
      setSeguradoras(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar seguradoras');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaSeguradora = () => {
    setSelectedSeguradora(null);
    setShowModal(true);
  };

  const handleEditar = (seguradora: Seguradora) => {
    setSelectedSeguradora(seguradora);
    setShowModal(true);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta seguradora?')) {
      try {
        await api.delete(`/seguradoras/${id}/excluir/`);
        carregarSeguradoras();
      } catch (err) {
        setError('Erro ao excluir seguradora');
        console.error('Erro:', err);
      }
    }
  };

  const formatarCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
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
        <h1 className="h3 mb-0">Seguradoras</h1>
        <Button variant="primary" onClick={handleNovaSeguradora}>
          <i className="fas fa-plus me-2"></i>
          Nova Seguradora
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
                <th>CNPJ</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {seguradoras.map((seguradora) => (
                <tr key={seguradora.id}>
                  <td>{seguradora.id}</td>
                  <td>{seguradora.nome}</td>
                  <td>{formatarCNPJ(seguradora.cnpj)}</td>
                  <td>{formatarTelefone(seguradora.telefone)}</td>
                  <td>{seguradora.email}</td>
                  <td>
                    <span className={`badge bg-${seguradora.status === 'Ativa' ? 'success' : 'secondary'}`}>
                      {seguradora.status}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditar(seguradora)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(`/seguradoras/${seguradora.id}/`, '_blank')}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleExcluir(seguradora.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {seguradoras.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma seguradora encontrada.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para criar/editar seguradora */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSeguradora ? 'Editar Seguradora' : 'Nova Seguradora'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação/edição de seguradoras será implementada em breve.
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

export default Seguradoras;
