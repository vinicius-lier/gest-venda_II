import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { api } from '../services/api';

interface RelatorioFinanceiro {
  receitas: number;
  despesas: number;
  lucro: number;
  vendas_mes: number;
  pagamentos_pendentes: number;
  receitas_extras: number;
}

interface Despesa {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  status: string;
}

interface ReceitaExtra {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  status: string;
}

const Financeiro: React.FC = () => {
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [receitas, setReceitas] = useState<ReceitaExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'despesa' | 'receita'>('despesa');

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  const carregarDadosFinanceiros = async () => {
    try {
      setLoading(true);
      
      // Carregar relatório financeiro
      const relatorioResponse = await api.get('/relatorio-financeiro/');
      setRelatorio(relatorioResponse.data);
      
      // Carregar despesas recentes
      const despesasResponse = await api.get('/despesas/');
      setDespesas(despesasResponse.data.slice(0, 5)); // Últimas 5 despesas
      
      // Carregar receitas extras recentes
      const receitasResponse = await api.get('/receitas-extras/');
      setReceitas(receitasResponse.data.slice(0, 5)); // Últimas 5 receitas
      
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaDespesa = () => {
    setModalType('despesa');
    setShowModal(true);
  };

  const handleNovaReceita = () => {
    setModalType('receita');
    setShowModal(true);
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
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
        <h1 className="h3 mb-0">Relatório Financeiro</h1>
        <div>
          <Button variant="outline-danger" className="me-2" onClick={handleNovaDespesa}>
            <i className="fas fa-minus me-2"></i>
            Nova Despesa
          </Button>
          <Button variant="outline-success" onClick={handleNovaReceita}>
            <i className="fas fa-plus me-2"></i>
            Nova Receita
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Cards de Resumo */}
      {relatorio && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-success">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-success">Receitas</h6>
                    <h4 className="mb-0">{formatarValor(relatorio.receitas)}</h4>
                  </div>
                  <div className="text-success">
                    <i className="fas fa-arrow-up fa-2x"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-danger">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-danger">Despesas</h6>
                    <h4 className="mb-0">{formatarValor(relatorio.despesas)}</h4>
                  </div>
                  <div className="text-danger">
                    <i className="fas fa-arrow-down fa-2x"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className={`border-${relatorio.lucro >= 0 ? 'success' : 'danger'}`}>
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className={`text-${relatorio.lucro >= 0 ? 'success' : 'danger'}`}>Lucro</h6>
                    <h4 className="mb-0">{formatarValor(relatorio.lucro)}</h4>
                  </div>
                  <div className={`text-${relatorio.lucro >= 0 ? 'success' : 'danger'}`}>
                    <i className={`fas fa-${relatorio.lucro >= 0 ? 'chart-line' : 'chart-line'} fa-2x`}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-warning">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-warning">Vendas/Mês</h6>
                    <h4 className="mb-0">{relatorio.vendas_mes}</h4>
                  </div>
                  <div className="text-warning">
                    <i className="fas fa-shopping-cart fa-2x"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabelas de Despesas e Receitas */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Últimas Despesas</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover size="sm">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((despesa) => (
                    <tr key={despesa.id}>
                      <td>{despesa.descricao}</td>
                      <td className="text-danger fw-bold">{formatarValor(despesa.valor)}</td>
                      <td>{formatarData(despesa.data)}</td>
                      <td>
                        <Badge bg={getStatusBadge(despesa.status)}>
                          {despesa.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {despesas.length === 0 && (
                <p className="text-muted text-center">Nenhuma despesa encontrada.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Últimas Receitas Extras</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover size="sm">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receitas.map((receita) => (
                    <tr key={receita.id}>
                      <td>{receita.descricao}</td>
                      <td className="text-success fw-bold">{formatarValor(receita.valor)}</td>
                      <td>{formatarData(receita.data)}</td>
                      <td>
                        <Badge bg={getStatusBadge(receita.status)}>
                          {receita.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {receitas.length === 0 && (
                <p className="text-muted text-center">Nenhuma receita extra encontrada.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para criar despesa/receita */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'despesa' ? 'Nova Despesa' : 'Nova Receita Extra'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Funcionalidade de criação de {modalType === 'despesa' ? 'despesas' : 'receitas extras'} será implementada em breve.
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

export default Financeiro;
