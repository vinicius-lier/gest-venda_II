import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Alert, Tabs, Tab, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Venda, Cliente, Motocicleta, Seguro } from '../types';

interface RelatorioVendas {
  total_vendas: number;
  valor_total: number;
  vendas_por_periodo: Array<{
    data: string;
    quantidade: number;
    valor: number;
  }>;
  vendas_por_vendedor: Array<{
    vendedor: string;
    quantidade: number;
    valor: number;
  }>;
  vendas_por_loja: Array<{
    loja: string;
    quantidade: number;
    valor: number;
  }>;
}

interface RelatorioEstoque {
  total_motocicletas: number;
  em_estoque: number;
  vendidas: number;
  consignadas: number;
  valor_total_estoque: number;
  motocicletas_por_marca: Array<{
    marca: string;
    quantidade: number;
    valor: number;
  }>;
  motocicletas_por_status: Array<{
    status: string;
    quantidade: number;
  }>;
}

interface RelatorioFinanceiro {
  receita_total: number;
  despesas_total: number;
  lucro_liquido: number;
  receita_vendas: number;
  receita_extras: number;
  receitas_por_periodo: Array<{
    data: string;
    receita: number;
    despesa: number;
    lucro: number;
  }>;
  despesas_por_categoria: Array<{
    categoria: string;
    total: number;
  }>;
  receitas_extras_por_periodo: Array<{
    data: string;
    total: number;
  }>;
  ultimas_vendas: Array<any>;
  ultimas_despesas: Array<any>;
  ultimas_receitas: Array<any>;
}

const Relatorios: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vendas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para os relatórios
  const [relatorioVendas, setRelatorioVendas] = useState<RelatorioVendas | null>(null);
  const [relatorioEstoque, setRelatorioEstoque] = useState<RelatorioEstoque | null>(null);
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<RelatorioFinanceiro | null>(null);
  
  // Estados para modais de despesas e receitas
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'despesa' | 'receita'>('despesa');
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    observacoes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const gerarRelatorioVendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Gerando relatório de vendas...');
      const response = await apiService.getRelatorioVendas(dataInicio, dataFim);
      
      if (response.success) {
        setRelatorioVendas(response.data);
        console.log('✅ Relatório de vendas gerado');
      } else {
        throw new Error('Erro ao gerar relatório de vendas');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de vendas:', error);
      setError('Erro ao gerar relatório de vendas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  const gerarRelatorioEstoque = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Gerando relatório de estoque...');
      const response = await apiService.getRelatorioEstoque();
      
      if (response.success) {
        setRelatorioEstoque(response.data);
        console.log('✅ Relatório de estoque gerado');
      } else {
        throw new Error('Erro ao gerar relatório de estoque');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de estoque:', error);
      setError('Erro ao gerar relatório de estoque. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const gerarRelatorioFinanceiro = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Gerando relatório financeiro...');
      const response = await apiService.getRelatorioFinanceiro(dataInicio, dataFim);
      
      if (response.success) {
        setRelatorioFinanceiro(response.data);
        console.log('✅ Relatório financeiro gerado');
      } else {
        throw new Error('Erro ao gerar relatório financeiro');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório financeiro:', error);
      setError('Erro ao gerar relatório financeiro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  const gerarRelatorio = useCallback(() => {
    setError(null);
    
    switch (activeTab) {
      case 'vendas':
        gerarRelatorioVendas();
        break;
      case 'estoque':
        gerarRelatorioEstoque();
        break;
      case 'financeiro':
        gerarRelatorioFinanceiro();
        break;
      default:
        setError('Tipo de relatório não reconhecido');
    }
  }, [activeTab, gerarRelatorioVendas, gerarRelatorioEstoque, gerarRelatorioFinanceiro]);

  const exportarRelatorio = (tipo: string) => {
    // Implementar exportação
    console.log(`Exportando relatório ${tipo}`);
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Funções para modais de despesas e receitas
  const handleNovaDespesa = () => {
    setModalType('despesa');
    setFormData({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      observacoes: ''
    });
    setShowModal(true);
  };

  const handleNovaReceita = () => {
    setModalType('receita');
    setFormData({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      observacoes: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      observacoes: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const endpoint = modalType === 'despesa' ? '/despesas/' : '/receitas-extras/';
      await apiService.post(endpoint, formData);
      
      // Recarregar relatório financeiro se estiver na aba financeira
      if (activeTab === 'financeiro' && relatorioFinanceiro) {
        gerarRelatorioFinanceiro();
      }
      
      handleCloseModal();
      alert(`${modalType === 'despesa' ? 'Despesa' : 'Receita'} cadastrada com sucesso!`);
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">📊 Relatórios</h2>
          <p className="text-muted mb-0">Análise detalhada dos dados do sistema</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Início</Form.Label>
                <Form.Control
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Fim</Form.Label>
                <Form.Control
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={gerarRelatorio}
                disabled={loading}
                className="me-2"
              >
                {loading ? '⏳ Gerando...' : '📊 Gerar Relatório'}
              </Button>
            </Col>
          </Row>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'vendas')}
            className="mb-3"
          >
            <Tab eventKey="vendas" title="🛒 Vendas">
              {relatorioVendas && (
                <div>
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center bg-primary text-white">
                        <Card.Body>
                          <h4>{relatorioVendas.total_vendas}</h4>
                          <p className="mb-0">Total de Vendas</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-success text-white">
                        <Card.Body>
                          <h4>{formatarMoeda(relatorioVendas.valor_total)}</h4>
                          <p className="mb-0">Valor Total</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3} className="d-flex align-items-center justify-content-end">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => exportarRelatorio('vendas')}
                      >
                        📄 Exportar
                      </Button>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <h6>Vendas por Vendedor</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Vendedor</th>
                            <th>Quantidade</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioVendas.vendas_por_vendedor.map((item, index) => (
                            <tr key={index}>
                              <td>{item.vendedor}</td>
                              <td>{item.quantidade}</td>
                              <td>{formatarMoeda(item.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6>Vendas por Loja</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Loja</th>
                            <th>Quantidade</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioVendas.vendas_por_loja.map((item, index) => (
                            <tr key={index}>
                              <td>{item.loja}</td>
                              <td>{item.quantidade}</td>
                              <td>{formatarMoeda(item.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </div>
              )}
            </Tab>

            <Tab eventKey="estoque" title="🏍️ Estoque">
              {relatorioEstoque && (
                <div>
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center bg-info text-white">
                        <Card.Body>
                          <h4>{relatorioEstoque.total_motocicletas}</h4>
                          <p className="mb-0">Total</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-success text-white">
                        <Card.Body>
                          <h4>{relatorioEstoque.em_estoque}</h4>
                          <p className="mb-0">Em Estoque</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-warning text-white">
                        <Card.Body>
                          <h4>{relatorioEstoque.valor_total_estoque}</h4>
                          <p className="mb-0">Valor Total</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3} className="d-flex align-items-center justify-content-end">
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => exportarRelatorio('estoque')}
                      >
                        📄 Exportar
                      </Button>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <h6>Motocicletas por Marca</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Marca</th>
                            <th>Quantidade</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioEstoque.motocicletas_por_marca.map((item, index) => (
                            <tr key={index}>
                              <td>{item.marca}</td>
                              <td>{item.quantidade}</td>
                              <td>{formatarMoeda(item.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6>Motocicletas por Status</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Quantidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioEstoque.motocicletas_por_status.map((item, index) => (
                            <tr key={index}>
                              <td>{item.status}</td>
                              <td>{item.quantidade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </div>
              )}
            </Tab>

            <Tab eventKey="financeiro" title="💵 Financeiro">
              {relatorioFinanceiro && (
                <div>
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center bg-success text-white">
                        <Card.Body>
                          <h4>{formatarMoeda(relatorioFinanceiro.receita_total)}</h4>
                          <p className="mb-0">Receita Total</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-danger text-white">
                        <Card.Body>
                          <h4>{formatarMoeda(relatorioFinanceiro.despesas_total)}</h4>
                          <p className="mb-0">Despesas Total</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center bg-primary text-white">
                        <Card.Body>
                          <h4>{formatarMoeda(relatorioFinanceiro.lucro_liquido)}</h4>
                          <p className="mb-0">Lucro Líquido</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3} className="d-flex align-items-center justify-content-end">
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        className="me-2"
                        onClick={handleNovaDespesa}
                      >
                        💸 Nova Despesa
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        className="me-2"
                        onClick={handleNovaReceita}
                      >
                        💵 Nova Receita
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => exportarRelatorio('financeiro')}
                      >
                        📄 Exportar
                      </Button>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <h6>Receitas por Período</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Período</th>
                            <th>Receita</th>
                            <th>Despesa</th>
                            <th>Lucro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioFinanceiro.receitas_por_periodo.map((item, index) => (
                            <tr key={index}>
                              <td>{formatarData(item.data)}</td>
                              <td>{formatarMoeda(item.receita)}</td>
                              <td>{formatarMoeda(item.despesa)}</td>
                              <td>{formatarMoeda(item.lucro)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6>📈 Receitas por Tipo</h6>
                      <Card>
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Vendas:</span>
                            <strong className="text-success">{formatarMoeda(relatorioFinanceiro.receita_vendas || 0)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Receitas Extras:</span>
                            <strong className="text-success">{formatarMoeda(relatorioFinanceiro.receita_extras || 0)}</strong>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between">
                            <span><strong>Total:</strong></span>
                            <strong className="text-success">{formatarMoeda(relatorioFinanceiro.receita_total)}</strong>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Detalhamento de Receitas e Despesas */}
                  <Row className="mt-4">
                    <Col md={4}>
                      <h6>📊 Despesas por Categoria</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Categoria</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioFinanceiro.despesas_por_categoria?.map((item, index) => (
                            <tr key={index}>
                              <td>{item.categoria}</td>
                              <td className="text-danger">{formatarMoeda(item.total)}</td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan={2} className="text-center text-muted">Nenhuma despesa encontrada</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Col>

                    <Col md={4}>
                      <h6>💰 Receitas Extras por Período</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioFinanceiro.receitas_extras_por_periodo?.map((item, index) => (
                            <tr key={index}>
                              <td>{formatarData(item.data)}</td>
                              <td className="text-success">{formatarMoeda(item.total)}</td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan={2} className="text-center text-muted">Nenhuma receita extra encontrada</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Col>

                    <Col md={4}>
                      <h6>📋 Resumo Financeiro</h6>
                      <Card>
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Receita Total:</span>
                            <strong className="text-success">{formatarMoeda(relatorioFinanceiro.receita_total)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Despesas Total:</span>
                            <strong className="text-danger">{formatarMoeda(relatorioFinanceiro.despesas_total)}</strong>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between">
                            <span><strong>Lucro Líquido:</strong></span>
                            <strong className={relatorioFinanceiro.lucro_liquido >= 0 ? 'text-success' : 'text-danger'}>
                              {formatarMoeda(relatorioFinanceiro.lucro_liquido)}
                            </strong>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Últimas Transações */}
                  <Row className="mt-4">
                    <Col md={4}>
                      <h6>🛒 Últimas Vendas</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioFinanceiro.ultimas_vendas?.map((venda, index) => (
                            <tr key={index}>
                              <td>{formatarData(venda.data_venda)}</td>
                              <td className="text-success">{formatarMoeda(venda.valor_venda)}</td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan={2} className="text-center text-muted">Nenhuma venda encontrada</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Col>

                    <Col md={4}>
                      <h6>💸 Últimas Despesas</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioFinanceiro.ultimas_despesas?.map((despesa, index) => (
                            <tr key={index}>
                              <td>{formatarData(despesa.data)}</td>
                              <td>{despesa.descricao}</td>
                              <td className="text-danger">{formatarMoeda(despesa.valor)}</td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan={3} className="text-center text-muted">Nenhuma despesa encontrada</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Col>

                    <Col md={4}>
                      <h6>💵 Últimas Receitas Extras</h6>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioFinanceiro.ultimas_receitas?.map((receita, index) => (
                            <tr key={index}>
                              <td>{formatarData(receita.data)}</td>
                              <td>{receita.descricao}</td>
                              <td className="text-success">{formatarMoeda(receita.valor)}</td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan={3} className="text-center text-muted">Nenhuma receita extra encontrada</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </div>
              )}
            </Tab>
          </Tabs>

          {!relatorioVendas && !relatorioEstoque && !relatorioFinanceiro && (
            <div className="text-center py-5">
              <p className="text-muted">
                Selecione um tipo de relatório e clique em "Gerar Relatório" para visualizar os dados
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>

      {/* Modal para Nova Despesa/Receita */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'despesa' ? '💸 Nova Despesa' : '💵 Nova Receita Extra'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Descrição *</Form.Label>
                  <Form.Control
                    type="text"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Aluguel da loja"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor (R$) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor"
                    value={formData.valor}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data *</Form.Label>
                  <Form.Control
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione uma categoria</option>
                    {modalType === 'despesa' ? (
                      <>
                        <option value="aluguel">Aluguel</option>
                        <option value="marketing">Marketing</option>
                        <option value="salario">Salário</option>
                        <option value="energia">Energia</option>
                        <option value="agua">Água</option>
                        <option value="internet">Internet</option>
                        <option value="telefone">Telefone</option>
                        <option value="manutencao">Manutenção</option>
                        <option value="combustivel">Combustível</option>
                        <option value="impostos">Impostos</option>
                        <option value="seguros">Seguros</option>
                        <option value="fornecedores">Fornecedores</option>
                        <option value="outros">Outros</option>
                      </>
                    ) : (
                      <>
                        <option value="comissao">Comissão</option>
                        <option value="servico">Serviço</option>
                        <option value="aluguel_equipamento">Aluguel de Equipamento</option>
                        <option value="consultoria">Consultoria</option>
                        <option value="outros">Outros</option>
                      </>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Observações adicionais..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              variant={modalType === 'despesa' ? 'danger' : 'success'} 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : `Salvar ${modalType === 'despesa' ? 'Despesa' : 'Receita'}`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Relatorios;
