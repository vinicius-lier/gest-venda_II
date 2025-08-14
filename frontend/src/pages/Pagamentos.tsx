import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { api } from '../services/api';

interface Pagamento {
  id: number;
  venda: string;
  cliente: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  status: string;
  observacoes: string;
}

const Pagamentos: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);

  useEffect(() => {
    carregarPagamentos();
  }, []);

  const carregarPagamentos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pagamentos/');
      setPagamentos(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar pagamentos');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoPagamento = () => {
    setSelectedPagamento(null);
    setShowModal(true);
  };

  const handleEditar = (pagamento: Pagamento) => {
    setSelectedPagamento(pagamento);
    setShowModal(true);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      try {
        await api.delete(`/pagamentos/${id}/excluir/`);
        carregarPagamentos();
      } catch (err) {
        setError('Erro ao excluir pagamento');
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
      'Pago': 'success',
      'Pendente': 'warning',
      'Atrasado': 'danger',
      'Cancelado': 'secondary'
    };
    return statusMap[status] || 'secondary';
  };

  const getFormaPagamentoIcon = (forma: string) => {
    const iconMap: { [key: string]: string } = {
      'Dinheiro': 'fas fa-money-bill-wave',
      'Cartão de Crédito': 'fas fa-credit-card',
      'Cartão de Débito': 'fas fa-credit-card',
      'PIX': 'fas fa-mobile-alt',
      'Transferência': 'fas fa-university',
      'Boleto': 'fas fa-barcode'
    };
    return iconMap[forma] || 'fas fa-money-bill';
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
        <h1 className="h3 mb-0">Pagamentos</h1>
        <Button variant="primary" onClick={handleNovoPagamento}>
          <i className="fas fa-plus me-2"></i>
          Novo Pagamento
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
                <th>Venda</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Forma</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((pagamento) => (
                <tr key={pagamento.id}>
                  <td>{pagamento.id}</td>
                  <td>{pagamento.venda}</td>
                  <td>{pagamento.cliente}</td>
                  <td className="fw-bold">{formatarValor(pagamento.valor)}</td>
                  <td>{formatarData(pagamento.data_pagamento)}</td>
                  <td>
                    <i className={`${getFormaPagamentoIcon(pagamento.forma_pagamento)} me-2`}></i>
                    {pagamento.forma_pagamento}
                  </td>
                  <td>
                    <span className={`badge bg-${getStatusBadge(pagamento.status)}`}>
                      {pagamento.status}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditar(pagamento)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(`/pagamentos/${pagamento.id}/`, '_blank')}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleExcluir(pagamento.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {pagamentos.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">Nenhum pagamento encontrado.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para criar/editar pagamento */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPagamento ? 'Editar Pagamento' : 'Novo Pagamento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação/edição de pagamentos será implementada em breve.
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

export default Pagamentos;
