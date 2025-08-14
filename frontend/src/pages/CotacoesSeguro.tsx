import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { api } from '../services/api';

interface CotacaoSeguro {
  id: number;
  cliente: string;
  motocicleta: string;
  seguradora: string;
  valor: number;
  status: string;
  data_criacao: string;
}

const CotacoesSeguro: React.FC = () => {
  const [cotacoes, setCotacoes] = useState<CotacaoSeguro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoSeguro | null>(null);

  useEffect(() => {
    carregarCotacoes();
  }, []);

  const carregarCotacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cotacoes-seguro/');
      setCotacoes(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar cotações de seguro');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaCotacao = () => {
    setSelectedCotacao(null);
    setShowModal(true);
  };

  const handleEditar = (cotacao: CotacaoSeguro) => {
    setSelectedCotacao(cotacao);
    setShowModal(true);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
      try {
        await api.delete(`/cotacoes-seguro/${id}/excluir/`);
        carregarCotacoes();
      } catch (err) {
        setError('Erro ao excluir cotação');
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
        <h1 className="h3 mb-0">Cotações de Seguro</h1>
        <Button variant="primary" onClick={handleNovaCotacao}>
          <i className="fas fa-plus me-2"></i>
          Nova Cotação
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
                <th>Motocicleta</th>
                <th>Seguradora</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cotacoes.map((cotacao) => (
                <tr key={cotacao.id}>
                  <td>{cotacao.id}</td>
                  <td>{cotacao.cliente}</td>
                  <td>{cotacao.motocicleta}</td>
                  <td>{cotacao.seguradora}</td>
                  <td>{formatarValor(cotacao.valor)}</td>
                  <td>
                    <span className={`badge bg-${cotacao.status === 'Ativa' ? 'success' : 'secondary'}`}>
                      {cotacao.status}
                    </span>
                  </td>
                  <td>{formatarData(cotacao.data_criacao)}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditar(cotacao)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleExcluir(cotacao.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {cotacoes.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma cotação de seguro encontrada.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para criar/editar cotação */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCotacao ? 'Editar Cotação' : 'Nova Cotação de Seguro'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação/edição de cotações será implementada em breve.
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

export default CotacoesSeguro;
