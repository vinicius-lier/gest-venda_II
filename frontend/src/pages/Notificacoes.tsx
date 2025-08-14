import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Notificacao } from '../types';

const Notificacoes: React.FC = () => {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroLida, setFiltroLida] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<Notificacao | null>(null);

  const loadNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando notificações...');
      const response = await apiService.getNotificacoes();
      
      if (response.results) {
        setNotificacoes(response.results);
        console.log('✅ Notificações carregadas:', response.results.length);
      } else {
        setNotificacoes([]);
        console.log('⚠️ Nenhuma notificação encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
      setError('Erro ao carregar notificações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotificacoes();
  }, [loadNotificacoes]);

  const handleMarcarComoLida = async (id: number) => {
    try {
      await apiService.marcarNotificacaoComoLida(id);
      
      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
      
      console.log('✅ Notificação marcada como lida:', id);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      setError('Erro ao marcar notificação como lida.');
    }
  };

  const handleMarcarTodasComoLidas = async () => {
    try {
      const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);
      
      await Promise.all(
        notificacoesNaoLidas.map(notif => 
          apiService.marcarNotificacaoComoLida(notif.id)
        )
      );
      
      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );
      
      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
      setError('Erro ao marcar notificações como lidas.');
    }
  };

  const handleVerDetalhes = (notificacao: Notificacao) => {
    setNotificacaoSelecionada(notificacao);
    setShowModal(true);
    
    // Marcar como lida se não estiver lida
    if (!notificacao.lida) {
      handleMarcarComoLida(notificacao.id);
    }
  };

  const getTipoIcon = (tipo: string) => {
    const icons: { [key: string]: string } = {
      venda: '💰',
      ocorrencia: '⚠️',
      documento: '📄',
      menção: '👤',
      venda_pendente: '⏳',
      outros: '📢'
    };
    return icons[tipo] || '📢';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      venda: 'Venda',
      ocorrencia: 'Ocorrência',
      documento: 'Documento',
      menção: 'Menção',
      venda_pendente: 'Venda Pendente',
      outros: 'Outros'
    };
    return labels[tipo] || 'Outros';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar notificações
  const notificacoesFiltradas = notificacoes.filter(notif => {
    const matchTipo = !filtroTipo || notif.tipo === filtroTipo;
    const matchLida = filtroLida === '' || 
      (filtroLida === 'lida' && notif.lida) || 
      (filtroLida === 'nao_lida' && !notif.lida);
    
    return matchTipo && matchLida;
  });

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🔔 Notificações</h2>
          <p className="text-muted mb-0">
            Gerencie suas notificações ({notificacoesNaoLidas} não lidas)
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
          <h5 className="mb-0">Lista de Notificações</h5>
          <div>
            {notificacoesNaoLidas > 0 && (
              <Button 
                variant="outline-success" 
                size="sm" 
                onClick={handleMarcarTodasComoLidas}
                className="me-2"
              >
                ✅ Marcar todas como lidas
              </Button>
            )}
            <Button variant="outline-primary" size="sm" onClick={loadNotificacoes}>
              🔄 Atualizar
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filtros */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select 
                  value={filtroTipo} 
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="venda">Venda</option>
                  <option value="ocorrencia">Ocorrência</option>
                  <option value="documento">Documento</option>
                  <option value="menção">Menção</option>
                  <option value="venda_pendente">Venda Pendente</option>
                  <option value="outros">Outros</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={filtroLida} 
                  onChange={(e) => setFiltroLida(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="nao_lida">Não lidas</option>
                  <option value="lida">Lidas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="text-muted">
                {notificacoesFiltradas.length} de {notificacoes.length} notificações
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Mensagem</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {notificacoesFiltradas.map((notificacao) => (
                  <tr 
                    key={notificacao.id} 
                    className={!notificacao.lida ? 'table-warning' : ''}
                  >
                    <td>
                      {notificacao.lida ? (
                        <Badge bg="secondary">Lida</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">Nova</Badge>
                      )}
                    </td>
                    <td>
                      <span className="me-2">{getTipoIcon(notificacao.tipo)}</span>
                      {getTipoLabel(notificacao.tipo)}
                    </td>
                    <td>
                      <div 
                        className="text-truncate" 
                        style={{ maxWidth: '300px' }}
                        title={notificacao.mensagem}
                      >
                        {notificacao.mensagem}
                      </div>
                    </td>
                    <td>{formatarData(notificacao.data_criacao)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleVerDetalhes(notificacao)}
                        className="me-2"
                      >
                        👁️ Ver
                      </Button>
                      {!notificacao.lida && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleMarcarComoLida(notificacao.id)}
                        >
                          ✅ Lida
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Detalhes */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {notificacaoSelecionada && (
              <>
                <span className="me-2">
                  {getTipoIcon(notificacaoSelecionada.tipo)}
                </span>
                Detalhes da Notificação
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notificacaoSelecionada && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Tipo:</strong> {getTipoLabel(notificacaoSelecionada.tipo)}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>
                  {notificacaoSelecionada.lida ? (
                    <Badge bg="secondary" className="ms-2">Lida</Badge>
                  ) : (
                    <Badge bg="warning" text="dark" className="ms-2">Nova</Badge>
                  )}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Data de Criação:</strong>
                  <br />
                  {formatarData(notificacaoSelecionada.data_criacao)}
                </Col>
                <Col md={6}>
                  <strong>Link:</strong>
                  <br />
                  {notificacaoSelecionada.link ? (
                    <a href={notificacaoSelecionada.link} target="_blank" rel="noopener noreferrer">
                      {notificacaoSelecionada.link}
                    </a>
                  ) : (
                    <span className="text-muted">Nenhum link disponível</span>
                  )}
                </Col>
              </Row>
              <Row>
                <Col>
                  <strong>Mensagem:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {notificacaoSelecionada.mensagem}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
          {notificacaoSelecionada?.link && (
            <Button 
              variant="primary" 
              href={notificacaoSelecionada.link} 
              target="_blank"
            >
              Acessar Link
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Notificacoes;
