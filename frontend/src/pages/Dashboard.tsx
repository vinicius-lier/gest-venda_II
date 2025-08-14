import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Table, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Venda, Cliente, Motocicleta, Ocorrencia, Consignacao, Seguro } from '../types';

interface DashboardStats {
  vendas: {
    total: number;
    valor_total: number;
    mes_atual: number;
    valor_mes_atual: number;
    recentes: Venda[];
  };
  clientes: {
    total: number;
    ativos: number;
    novos_mes: number;
  };
  motocicletas: {
    total: number;
    estoque: number;
    vendidas: number;
    consignadas: number;
  };
  ocorrencias: {
    total: number;
    pendentes: number;
    em_andamento: number;
    resolvidas: number;
  };
  consignacoes: {
    total: number;
    ativas: number;
    vendidas: number;
  };
  seguros: {
    total: number;
    ativos: number;
    valor_total: number;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Carregando dados do dashboard...');

      // Carregar dados de todas as entidades
      const [
        vendasResponse,
        clientesResponse,
        motocicletasResponse,
        ocorrenciasResponse,
        consignacoesResponse,
        segurosResponse
      ] = await Promise.all([
        apiService.getVendas().catch(e => {
          console.error('❌ Erro ao carregar vendas:', e);
          return null;
        }),
        apiService.getClientes().catch(e => {
          console.error('❌ Erro ao carregar clientes:', e);
          return null;
        }),
        apiService.getMotocicletas().catch(e => {
          console.error('❌ Erro ao carregar motocicletas:', e);
          return null;
        }),
        apiService.getOcorrencias().catch(e => {
          console.error('❌ Erro ao carregar ocorrências:', e);
          return null;
        }),
        apiService.getConsignacoes().catch(e => {
          console.error('❌ Erro ao carregar consignações:', e);
          return null;
        }),
        apiService.getSeguros().catch(e => {
          console.error('❌ Erro ao carregar seguros:', e);
          return null;
        })
      ]);

      console.log('📊 Respostas recebidas:', {
        vendas: vendasResponse,
        clientes: clientesResponse,
        motocicletas: motocicletasResponse,
        ocorrencias: ocorrenciasResponse,
        consignacoes: consignacoesResponse,
        seguros: segurosResponse
      });

      // Verificar se todas as respostas são válidas
      if (!vendasResponse || !clientesResponse || !motocicletasResponse || 
          !ocorrenciasResponse || !consignacoesResponse || !segurosResponse) {
        throw new Error('Uma ou mais APIs falharam ao carregar dados');
      }

      // Processar dados de vendas
      const vendas = vendasResponse.results || [];
      const vendasMesAtual = vendas.filter((venda: Venda) => {
        if (!venda.data_venda) return false;
        const dataVenda = new Date(venda.data_venda);
        const hoje = new Date();
        return dataVenda.getMonth() === hoje.getMonth() && 
               dataVenda.getFullYear() === hoje.getFullYear();
      });

      // Processar dados de clientes
      const clientes = clientesResponse.results || [];
      const clientesAtivos = clientes.filter((cliente: Cliente) => cliente.ativo);
      const clientesNovosMes = clientes.filter((cliente: Cliente) => {
        if (!cliente.data_cadastro) return false;
        const dataCadastro = new Date(cliente.data_cadastro);
        const hoje = new Date();
        return dataCadastro.getMonth() === hoje.getMonth() && 
               dataCadastro.getFullYear() === hoje.getFullYear();
      });

      // Processar dados de motocicletas
      const motocicletas = motocicletasResponse.results || [];
      const motocicletasEstoque = motocicletas.filter((moto: Motocicleta) => moto.status === 'estoque');
      const motocicletasVendidas = motocicletas.filter((moto: Motocicleta) => moto.status === 'vendida');
      const motocicletasConsignadas = motocicletas.filter((moto: Motocicleta) => moto.tipo_entrada === 'consignada');

      // Processar dados de ocorrências
      const ocorrencias = ocorrenciasResponse.results || [];
      const ocorrenciasPendentes = ocorrencias.filter((ocorrencia: Ocorrencia) => 
        ocorrencia.status && ['aberta', 'pendente'].includes(ocorrencia.status)
      );
      const ocorrenciasEmAndamento = ocorrencias.filter((ocorrencia: Ocorrencia) => 
        ocorrencia.status === 'em_andamento'
      );
      const ocorrenciasResolvidas = ocorrencias.filter((ocorrencia: Ocorrencia) => 
        ocorrencia.status === 'resolvida'
      );

      // Processar dados de consignações
      const consignacoes = consignacoesResponse.results || [];
      const consignacoesAtivas = consignacoes.filter((consignacao: Consignacao) => 
        consignacao.status === 'disponivel'
      );
      const consignacoesVendidas = consignacoes.filter((consignacao: Consignacao) => 
        consignacao.status === 'vendido'
      );

      // Processar dados de seguros
      const seguros = segurosResponse.results || [];
      const segurosAtivos = seguros.filter((seguro: Seguro) => seguro.status === 'ativo');

      // Calcular valores totais
      const valorTotalVendas = vendas.reduce((total: number, venda: Venda) => total + (venda.valor_venda || 0), 0);
      const valorMesAtualVendas = vendasMesAtual.reduce((total: number, venda: Venda) => total + (venda.valor_venda || 0), 0);
      const valorTotalSeguros = segurosAtivos.reduce((total: number, seguro: Seguro) => total + (seguro.valor_seguro || 0), 0);

      // Montar objeto de estatísticas
      const dashboardStats: DashboardStats = {
        vendas: {
          total: vendas.length,
          valor_total: valorTotalVendas,
          mes_atual: vendasMesAtual.length,
          valor_mes_atual: valorMesAtualVendas,
          recentes: vendas.slice(0, 5) // Últimas 5 vendas
        },
        clientes: {
          total: clientes.length,
          ativos: clientesAtivos.length,
          novos_mes: clientesNovosMes.length
        },
        motocicletas: {
          total: motocicletas.length,
          estoque: motocicletasEstoque.length,
          vendidas: motocicletasVendidas.length,
          consignadas: motocicletasConsignadas.length
        },
        ocorrencias: {
          total: ocorrencias.length,
          pendentes: ocorrenciasPendentes.length,
          em_andamento: ocorrenciasEmAndamento.length,
          resolvidas: ocorrenciasResolvidas.length
        },
        consignacoes: {
          total: consignacoes.length,
          ativas: consignacoesAtivas.length,
          vendidas: consignacoesVendidas.length
        },
        seguros: {
          total: seguros.length,
          ativos: segurosAtivos.length,
          valor_total: valorTotalSeguros
        }
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError('Erro ao carregar dados do dashboard. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'vendido': 'success',
      'pendente': 'warning',
      'cancelado': 'danger',
      'em_negociacao': 'info',
      'aberta': 'warning',
      'em_andamento': 'primary',
      'resolvida': 'success',
      'disponivel': 'success',
      'ativo': 'success',
      'estoque': 'success',
      'vendida': 'success'
    } as const;
    
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3 text-muted">Carregando dados do dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📊 Dashboard</h2>
          <p className="text-muted mb-0">
            Bem-vindo, {user?.user.first_name} {user?.user.last_name}!
          </p>
        </div>
        <div className="text-end">
          <small className="text-muted">
            © 2025 Vinicius Oliveira - Todos os direitos reservados
          </small>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Erro!</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={loadDashboardData} variant="outline-danger">
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 border-primary">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">💰</span>
              </div>
              <Card.Title>Vendas do Mês</Card.Title>
              <h3 className="text-primary mb-0">
                {stats?.vendas.mes_atual || 0}
              </h3>
              <small className="text-muted">
                R$ {stats?.vendas.valor_mes_atual?.toLocaleString('pt-BR') || '0,00'}
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  Total: {stats?.vendas.total || 0} vendas
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 border-success">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">🏍️</span>
              </div>
              <Card.Title>Estoque</Card.Title>
              <h3 className="text-success mb-0">
                {stats?.motocicletas.estoque || 0}
              </h3>
              <small className="text-muted">
                Motocicletas disponíveis
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  Total: {stats?.motocicletas.total || 0} motos
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 border-info">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">👥</span>
              </div>
              <Card.Title>Clientes</Card.Title>
              <h3 className="text-info mb-0">
                {stats?.clientes.ativos || 0}
              </h3>
              <small className="text-muted">
                Clientes ativos
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  +{stats?.clientes.novos_mes || 0} este mês
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 border-warning">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">⚠️</span>
              </div>
              <Card.Title>Ocorrências</Card.Title>
              <h3 className="text-warning mb-0">
                {stats?.ocorrencias.pendentes || 0}
              </h3>
              <small className="text-muted">
                Pendentes de resolução
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  {stats?.ocorrencias.em_andamento || 0} em andamento
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cards Adicionais */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100 border-secondary">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">📋</span>
              </div>
              <Card.Title>Consignações</Card.Title>
              <h3 className="text-secondary mb-0">
                {stats?.consignacoes.ativas || 0}
              </h3>
              <small className="text-muted">
                Consignações ativas
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  {stats?.consignacoes.vendidas || 0} vendidas
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center h-100 border-danger">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">🛡️</span>
              </div>
              <Card.Title>Seguros</Card.Title>
              <h3 className="text-danger mb-0">
                {stats?.seguros.ativos || 0}
              </h3>
              <small className="text-muted">
                Seguros ativos
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  R$ {stats?.seguros.valor_total?.toLocaleString('pt-BR') || '0,00'}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center h-100 border-dark">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1">📈</span>
              </div>
              <Card.Title>Faturamento</Card.Title>
              <h3 className="text-dark mb-0">
                R$ {stats?.vendas.valor_total?.toLocaleString('pt-BR') || '0,00'}
              </h3>
              <small className="text-muted">
                Valor total de vendas
              </small>
              <div className="mt-2">
                <small className="text-muted">
                  + R$ {stats?.seguros.valor_total?.toLocaleString('pt-BR') || '0,00'} seguros
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos e Tabelas */}
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Vendas Recentes</h5>
              <Button variant="outline-primary" size="sm">
                Ver Todas
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Motocicleta</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.vendas.recentes?.map((venda: Venda) => (
                    <tr key={venda.id}>
                      <td>#{venda.id}</td>
                      <td>
                        {venda.moto?.marca} {venda.moto?.modelo}
                        <br />
                        <small className="text-muted">{venda.moto?.placa || venda.moto?.chassi}</small>
                      </td>
                      <td>
                        {venda.comprador?.nome}
                        <br />
                        <small className="text-muted">{venda.comprador?.cpf_cnpj}</small>
                      </td>
                      <td>
                        <strong>R$ {venda.valor_venda?.toLocaleString('pt-BR')}</strong>
                        <br />
                        <small className="text-muted">Entrada: R$ {venda.valor_entrada?.toLocaleString('pt-BR')}</small>
                      </td>
                      <td>
                        {getStatusBadge(venda.status)}
                      </td>
                      <td>
                        {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                        <br />
                        <small className="text-muted">
                          {new Date(venda.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        <div>
                          <span className="fs-1">📊</span>
                          <p className="mt-2 mb-0">Nenhuma venda recente</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Ações Rápidas</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" size="sm" href="/vendas">
                  ➕ Nova Venda
                </Button>
                <Button variant="outline-primary" size="sm" href="/clientes">
                  👤 Novo Cliente
                </Button>
                <Button variant="outline-primary" size="sm" href="/motocicletas">
                  🏍️ Nova Motocicleta
                </Button>
                <Button variant="outline-primary" size="sm" href="/consignacoes">
                  📋 Nova Consignação
                </Button>
                <Button variant="outline-primary" size="sm" href="/seguros">
                  🛡️ Novo Seguro
                </Button>
                <Button variant="outline-warning" size="sm" href="/ocorrencias">
                  ⚠️ Nova Ocorrência
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Resumo do Estoque</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Total de Motocicletas:</span>
                <Badge bg="primary">{stats?.motocicletas.total || 0}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Em Estoque:</span>
                <Badge bg="success">{stats?.motocicletas.estoque || 0}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Vendidas:</span>
                <Badge bg="info">{stats?.motocicletas.vendidas || 0}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Consignadas:</span>
                <Badge bg="secondary">{stats?.motocicletas.consignadas || 0}</Badge>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <span>Ocorrências Pendentes:</span>
                <Badge bg="warning">{stats?.ocorrencias.pendentes || 0}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Seguros Ativos:</span>
                <Badge bg="danger">{stats?.seguros.ativos || 0}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Copyright no final da página */}
      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Dashboard;
