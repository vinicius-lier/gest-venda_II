import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import apiService from '../services/api';

interface PreVenda {
  id: string;
  cliente: string;
  telefone: string;
  motocicleta_interesse: string;
  valor_interesse: number;
  status: string;
  data_criacao: string;
  vendedor: string;
  observacoes: string;
}

const PreVenda: React.FC = () => {
  const [preVendas, setPreVendas] = useState<PreVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPreVenda, setSelectedPreVenda] = useState<PreVenda | null>(null);

  useEffect(() => {
    carregarPreVendas();
  }, []);

  const carregarPreVendas = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/pre-venda/pre-venda/lista/');
      setPreVendas(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar pré-vendas');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaPreVenda = () => {
    setSelectedPreVenda(null);
    setShowModal(true);
  };

  const handleEditar = (preVenda: PreVenda) => {
    setSelectedPreVenda(preVenda);
    setShowModal(true);
  };

  const handleAlterarStatus = async (id: string, novoStatus: string) => {
    try {
      await apiService.post(`/pre-venda/pre-venda/${id}/status/`, { status: novoStatus });
      carregarPreVendas();
    } catch (err) {
      setError('Erro ao alterar status da pré-venda');
      console.error('Erro:', err);
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

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Nova': 'primary',
      'Em Análise': 'warning',
      'Aprovada': 'success',
      'Rejeitada': 'danger',
      'Convertida': 'info',
      'Cancelada': 'secondary'
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatus = ['Nova', 'Em Análise', 'Aprovada', 'Rejeitada', 'Convertida', 'Cancelada'];
    return allStatus.filter(status => status !== currentStatus);
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
        <h1 className="h3 mb-0">Pré-vendas</h1>
        <Button variant="primary" onClick={handleNovaPreVenda}>
          <i className="fas fa-plus me-2"></i>
          Nova Pré-venda
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
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Interesse</th>
                <th>Valor</th>
                <th>Vendedor</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {preVendas.map((preVenda) => (
                <tr key={preVenda.id}>
                  <td>{preVenda.id.substring(0, 8)}...</td>
                  <td>
                    <strong>{preVenda.cliente}</strong>
                    {preVenda.observacoes && (
                      <div className="text-muted small">
                        {preVenda.observacoes.length > 50 
                          ? `${preVenda.observacoes.substring(0, 50)}...` 
                          : preVenda.observacoes}
                      </div>
                    )}
                  </td>
                  <td>{formatarTelefone(preVenda.telefone)}</td>
                  <td>{preVenda.motocicleta_interesse}</td>
                  <td className="fw-bold">{formatarValor(preVenda.valor_interesse)}</td>
                  <td>{preVenda.vendedor}</td>
                  <td>{formatarData(preVenda.data_criacao)}</td>
                  <td>
                    <Badge bg={getStatusBadge(preVenda.status)}>
                      {preVenda.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditar(preVenda)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(`/pre-venda/pre-venda/${preVenda.id}/`, '_blank')}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <div className="dropdown d-inline">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="dropdown-toggle"
                        data-bs-toggle="dropdown"
                      >
                        <i className="fas fa-cog"></i>
                      </Button>
                      <ul className="dropdown-menu">
                        {getStatusOptions(preVenda.status).map((status) => (
                          <li key={status}>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAlterarStatus(preVenda.id, status)}
                            >
                              Alterar para: {status}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {preVendas.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma pré-venda encontrada.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para criar/editar pré-venda */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPreVenda ? 'Editar Pré-venda' : 'Nova Pré-venda'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação/edição de pré-vendas será implementada em breve.
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

export default PreVenda;
