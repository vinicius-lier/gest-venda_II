import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Modal, Alert, Nav, Tab } from 'react-bootstrap';
import { Venda, FiltroVenda, Cliente, Motocicleta, Usuario, ApiError, Contrato } from '../types';
import apiService from '../services/api';
import AutocompleteField from '../components/AutocompleteField';
import DetailModal from '../components/DetailModal';
import StatusBadge from '../components/StatusBadge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import DateDisplay from '../components/DateDisplay';

const Vendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltroVenda>({});
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  
  // Estados para contratos
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [errorContratos, setErrorContratos] = useState<string | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [formData, setFormData] = useState({
    moto: 0,
    comprador: 0,
    vendedor: 0,
    valor_venda: 0,
    data_venda: '',
    forma_pagamento: 'dinheiro',
    observacoes: ''
  });

  // Estados para autocomplete
  const [motoSearch, setMotoSearch] = useState('');
  const [compradorSearch, setCompradorSearch] = useState('');
  const [selectedMoto, setSelectedMoto] = useState<Motocicleta | null>(null);
  const [selectedComprador, setSelectedComprador] = useState<Cliente | null>(null);

  const loadVendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getVendas(filtros);
      
      // Verificar se a resposta tem a estrutura esperada
      if (response && response.results) {
        setVendas(response.results);
      } else {
        // Se não há dados, definir como array vazio
        setVendas([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setError('Erro ao carregar vendas. Verifique sua conexão e tente novamente.');
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const loadClientes = useCallback(async () => {
    try {
      const response = await apiService.getClientes();
      if (response && response.results) {
        setClientes(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }, []);

  const loadMotocicletas = useCallback(async () => {
    try {
      const response = await apiService.getMotocicletas();
      if (response && response.results) {
        setMotocicletas(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar motocicletas:', error);
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    try {
      const response = await apiService.getUsuarios();
      if (response && response.results) {
        setUsuarios(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  // Função para carregar contratos
  const loadContratos = useCallback(async () => {
    try {
      setLoadingContratos(true);
      setErrorContratos(null);
      const response = await apiService.getContratos();
      if (response && response.data && response.data.contratos) {
        setContratos(response.data.contratos);
      } else {
        setContratos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      setErrorContratos('Erro ao carregar contratos');
      setContratos([]);
    } finally {
      setLoadingContratos(false);
    }
  }, []);

  useEffect(() => {
    loadVendas();
    loadClientes();
    loadMotocicletas();
    loadUsuarios();
    loadContratos();
  }, [loadVendas, loadClientes, loadMotocicletas, loadUsuarios, loadContratos]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleMotoSelect = (moto: Motocicleta) => {
    setSelectedMoto(moto);
    setFormData(prev => ({
      ...prev,
      moto: moto.id
    }));
  };

  const handleCompradorSelect = (cliente: Cliente) => {
    setSelectedComprador(cliente);
    setFormData(prev => ({
      ...prev,
      comprador: cliente.id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!selectedMoto) {
      setError('Motocicleta é obrigatória');
      return;
    }
    
    if (!selectedComprador) {
      setError('Comprador é obrigatório');
      return;
    }
    
    if (!formData.valor_venda || formData.valor_venda <= 0) {
      setError('Valor de venda é obrigatório e deve ser maior que zero');
      return;
    }
    
    if (!formData.data_venda) {
      setError('Data de venda é obrigatória');
      return;
    }
    
    try {
      // Preparar dados para envio - tratar campos vazios
      const dadosParaEnviar = {
        ...formData,
        // Garantir que IDs sejam números válidos
        moto: selectedMoto.id,
        comprador: selectedComprador.id,
        vendedor: formData.vendedor || 1, // Usar vendedor padrão se não selecionado
        // Tratar campos opcionais
        observacoes: formData.observacoes?.trim() || '',
      };
      
      if (editingVenda) {
        await apiService.updateVenda(editingVenda.id, dadosParaEnviar as any);
      } else {
        // Criar nova venda
        await apiService.createVenda(dadosParaEnviar as any);
        
        // Atualizar status da motocicleta para 'vendida'
        if (selectedMoto) {
          try {
            await apiService.updateMotocicleta(selectedMoto.id, {
              ...selectedMoto,
              status: 'vendida',
              data_venda: formData.data_venda || new Date().toISOString().split('T')[0]
            } as any);
            
            // Recarregar motocicletas para refletir a mudança
            loadMotocicletas();
          } catch (error) {
            console.error('Erro ao atualizar status da motocicleta:', error);
            // Não interrompe o fluxo se falhar ao atualizar a moto
          }
        }
      }
      setShowModal(false);
      setEditingVenda(null);
      resetForm();
      loadVendas();
      setError(null); // Limpar erros anteriores
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      const apiError = error as ApiError;
      
      // Tratar erros específicos da API
      if (apiError.response?.data?.details) {
        setError('Erro ao salvar venda. Verifique os dados.');
      } else {
        setError('Erro ao salvar venda. Tente novamente.');
      }
    }
  };

  const handleEdit = (venda: Venda) => {
    setEditingVenda(venda);
    setFormData({
      moto: venda.moto.id,
      comprador: venda.comprador.id,
      vendedor: venda.vendedor.id,
      valor_venda: venda.valor_venda,
      data_venda: venda.data_venda || '',
      forma_pagamento: venda.forma_pagamento,
      observacoes: venda.observacoes || ''
    });
    
    // Configurar autocomplete para edição
    setMotoSearch(`${venda.moto.marca} ${venda.moto.modelo} - ${venda.moto.placa || venda.moto.chassi}`);
    setCompradorSearch(`${venda.comprador.nome} - ${venda.comprador.cpf_cnpj}`);
    setSelectedMoto(venda.moto);
    setSelectedComprador(venda.comprador);
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        await apiService.deleteVenda(id);
        loadVendas();
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        setError('Erro ao excluir venda. Tente novamente.');
      }
    }
  };

  const handleDetails = (venda: Venda) => {
    setSelectedVenda(venda);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      moto: 0,
      comprador: 0,
      vendedor: 0,
      valor_venda: 0,
      data_venda: '',
      forma_pagamento: 'dinheiro',
      observacoes: ''
    });
    setMotoSearch('');
    setCompradorSearch('');
    setSelectedMoto(null);
    setSelectedComprador(null);
  };

  const openCreateModal = () => {
    setEditingVenda(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'vendido': 'success',
      'pendente': 'warning',
      'em_negociacao': 'info',
      'cancelado': 'danger'
    } as const;
    
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };



  // Funções para contratos
  const handleVisualizarContrato = async (contrato: Contrato) => {
    try {
      const response = await apiService.visualizarContratoHtml(contrato.id);
      if (response && response.data && response.data.html) {
        setHtmlContent(response.data.html);
        setShowHtmlModal(true);
      } else {
        alert('Erro ao carregar contrato');
      }
    } catch (err) {
      alert('Erro ao carregar contrato');
      console.error(err);
    }
  };

  const handleBaixarContratoPdf = async (contrato: Contrato) => {
    try {
      const blob = await apiService.baixarContratoPdf(contrato.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${contrato.numero_contrato}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erro ao baixar PDF');
      console.error(err);
    }
  };

  const handleAtualizarStatusContrato = async (contrato: Contrato, novoStatus: 'assinado' | 'cancelado') => {
    try {
      const response = await apiService.atualizarStatusContrato(contrato.id, { status: novoStatus });
      if (response && response.success) {
        loadContratos();
        alert('Status atualizado com sucesso');
      } else {
        alert(response?.message || 'Erro ao atualizar status');
      }
    } catch (err) {
      alert('Erro ao atualizar status');
      console.error(err);
    }
  };

  const handleCancelarContrato = async (contrato: Contrato) => {
    if (window.confirm('Tem certeza que deseja cancelar este contrato?')) {
      try {
        const response = await apiService.cancelarContrato(contrato.id);
        if (response && response.success) {
          loadContratos();
          alert('Contrato cancelado com sucesso');
        } else {
          alert(response?.message || 'Erro ao cancelar contrato');
        }
      } catch (err) {
        alert('Erro ao cancelar contrato');
        console.error(err);
      }
    }
  };

  // Função para verificar se uma venda já tem contrato
  const vendaTemContrato = (vendaId: number): boolean => {
    return contratos.some(contrato => contrato.venda === vendaId);
  };

  // Estados para modal de seleção de tipo de contrato
  const [showTipoContratoModal, setShowTipoContratoModal] = useState(false);
  const [vendaParaContrato, setVendaParaContrato] = useState<Venda | null>(null);
  const [tipoContratoSelecionado, setTipoContratoSelecionado] = useState<'0km' | 'seminova' | 'consignacao' | 'auto'>('seminova');

  // Função para abrir modal de seleção de tipo de contrato
  const handleAbrirModalTipoContrato = (venda: Venda) => {
    setVendaParaContrato(venda);
    
    // Se for consignada, definir automaticamente como consignação
    if (venda.moto.tipo_entrada === 'consignada') {
      setTipoContratoSelecionado('consignacao');
      // Gerar contrato automaticamente para consignadas
      handleGerarContratoDireto(venda, 'consignacao');
    } else {
      // Para outras, abrir modal para escolha
      setShowTipoContratoModal(true);
    }
  };

  // Função para gerar contrato diretamente (para consignadas)
  const handleGerarContratoDireto = async (venda: Venda, tipo: '0km' | 'seminova' | 'consignacao' | 'auto') => {
    try {
      const dadosContrato = {
        venda_id: venda.id,
        tipo: tipo
      };

      const response = await apiService.gerarContrato(dadosContrato);
      if (response && response.success) {
        alert('Contrato gerado com sucesso!');
        // Recarregar contratos para mostrar o novo
        loadContratos();
        // Sugerir ao usuário verificar a aba de contratos
        if (window.confirm('Contrato gerado com sucesso! Deseja visualizar na aba de Contratos?')) {
          // Tentar mudar para a aba de contratos
          setTimeout(() => {
            const contratosTab = document.querySelector('[data-rb-event-key="contratos"]') as HTMLElement;
            if (contratosTab) {
              contratosTab.click();
            }
          }, 100);
        }
      } else {
        alert(response?.message || 'Erro ao gerar contrato');
      }
    } catch (err) {
      alert('Erro ao gerar contrato');
      console.error(err);
    }
  };

  // Função para gerar contrato a partir de uma venda (com seleção de tipo)
  const handleGerarContrato = async () => {
    if (!vendaParaContrato) return;

    try {
      const dadosContrato = {
        venda_id: vendaParaContrato.id,
        tipo: tipoContratoSelecionado
      };

      const response = await apiService.gerarContrato(dadosContrato);
      if (response && response.success) {
        alert('Contrato gerado com sucesso!');
        // Recarregar contratos para mostrar o novo
        loadContratos();
        // Fechar modal
        setShowTipoContratoModal(false);
        setVendaParaContrato(null);
        // Sugerir ao usuário verificar a aba de contratos
        if (window.confirm('Contrato gerado com sucesso! Deseja visualizar na aba de Contratos?')) {
          // Tentar mudar para a aba de contratos
          setTimeout(() => {
            const contratosTab = document.querySelector('[data-rb-event-key="contratos"]') as HTMLElement;
            if (contratosTab) {
              contratosTab.click();
            }
          }, 100);
        }
      } else {
        alert(response?.message || 'Erro ao gerar contrato');
      }
    } catch (err) {
      alert('Erro ao gerar contrato');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gerado': return 'info';
      case 'assinado': return 'success';
      case 'cancelado': return 'danger';
      default: return 'secondary';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case '0km': return 'primary';
      case 'seminova': return 'warning';
      case 'consignacao': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>💰 Vendas & Contratos</h2>
          <p className="text-muted mb-0">Gerencie vendas e contratos do sistema</p>
        </div>
        <div className="text-end">
          <small className="text-muted">
            © 2025 Vinicius Oliveira - Todos os direitos reservados
          </small>
        </div>
      </div>

      {/* Sistema de Abas */}
      <Tab.Container id="vendas-contratos-tabs" defaultActiveKey="vendas">
        <Row>
          <Col>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="vendas">
                  💰 Vendas ({vendas.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="contratos">
                  📜 Contratos ({contratos.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Aba de Vendas */}
              <Tab.Pane eventKey="vendas">
                {error && (
                  <Alert variant="danger" className="mb-4">
                    <Alert.Heading>Erro!</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                      <Button onClick={loadVendas} variant="outline-danger">
                        Tentar Novamente
                      </Button>
                    </div>
                  </Alert>
                )}

                {/* Filtros */}
                <Card className="mb-4">
                  <Card.Body>
                    <Row>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Status</Form.Label>
                          <Form.Select name="status" value={filtros.status || ''} onChange={handleFilterChange}>
                            <option value="">Todos</option>
                            <option value="pendente">Pendente</option>
                            <option value="em_negociacao">Em Negociação</option>
                            <option value="vendido">Vendido</option>
                            <option value="cancelado">Cancelado</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Data Início</Form.Label>
                          <Form.Control
                            type="date"
                            name="data_inicio"
                            value={filtros.data_inicio || ''}
                            onChange={handleFilterChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Data Fim</Form.Label>
                          <Form.Control
                            type="date"
                            name="data_fim"
                            value={filtros.data_fim || ''}
                            onChange={handleFilterChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Buscar</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="text"
                              name="search"
                              placeholder="Buscar por cliente, moto..."
                              value={filtros.search || ''}
                              onChange={handleFilterChange}
                            />
                            <Button variant="outline-secondary">
                              🔍
                            </Button>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Tabela de Vendas */}
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Lista de Vendas</h5>
                    <Button variant="primary" size="sm" onClick={openCreateModal}>
                      ➕ Nova Venda
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Carregando...</span>
                        </div>
                      </div>
                    ) : vendas.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted">Nenhuma venda encontrada.</p>
                        <Button variant="outline-primary" onClick={loadVendas}>
                          Recarregar
                        </Button>
                      </div>
                    ) : (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Motocicleta</th>
                            <th>Cliente</th>
                            <th>Vendedor</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendas.map((venda) => (
                            <tr key={venda.id}>
                              <td>#{venda.id}</td>
                              <td>
                                <strong>{venda.moto.marca} {venda.moto.modelo}</strong>
                                <br />
                                <small className="text-muted">{venda.moto.placa || venda.moto.chassi}</small>
                              </td>
                              <td>{venda.comprador.nome}</td>
                              <td>
                                {venda.vendedor?.user ? 
                                  `${venda.vendedor.user.first_name || ''} ${venda.vendedor.user.last_name || ''}`.trim() || 
                                  venda.vendedor.user.username || 
                                  'N/A' 
                                  : 'N/A'
                                }
                              </td>
                              <td>
                                <strong>R$ {venda.valor_venda.toLocaleString('pt-BR')}</strong>
                              </td>
                              <td>{getStatusBadge(venda.status)}</td>
                              <td>{new Date(venda.data_venda || venda.data_atendimento).toLocaleDateString('pt-BR')}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button variant="outline-info" size="sm" onClick={() => handleDetails(venda)} title="Ver detalhes">
                                    👁️
                                  </Button>
                                  <Button variant="outline-primary" size="sm" onClick={() => handleEdit(venda)} title="Editar">
                                    ✏️
                                  </Button>
                                  {!vendaTemContrato(venda.id) ? (
                                    <Button 
                                      variant="outline-success" 
                                      size="sm" 
                                      onClick={() => handleAbrirModalTipoContrato(venda)}
                                      title={venda.moto.tipo_entrada === 'consignada' ? 'Gerar Contrato (Consignação)' : 'Gerar Contrato - Escolher Tipo'}
                                    >
                                      📜
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline-info" 
                                      size="sm" 
                                      disabled
                                      title="Contrato já gerado"
                                    >
                                      ✅
                                    </Button>
                                  )}
                                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(venda.id)} title="Excluir">
                                    🗑️
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Aba de Contratos */}
              <Tab.Pane eventKey="contratos">
                {errorContratos && (
                  <Alert variant="danger" className="mb-4">
                    <Alert.Heading>Erro!</Alert.Heading>
                    <p>{errorContratos}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                      <Button onClick={loadContratos} variant="outline-danger">
                        Tentar Novamente
                      </Button>
                    </div>
                  </Alert>
                )}

                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Lista de Contratos</h5>
                    <Button variant="primary" size="sm" onClick={loadContratos}>
                      🔄 Atualizar
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {loadingContratos ? (
                      <div className="text-center py-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Carregando...</span>
                        </div>
                      </div>
                    ) : contratos.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted">Nenhum contrato encontrado.</p>
                        <Button variant="outline-primary" onClick={loadContratos}>
                          Recarregar
                        </Button>
                      </div>
                    ) : (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Número</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Comprador</th>
                            <th>Motocicleta</th>
                            <th>Valor</th>
                            <th>Data Geração</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contratos.map((contrato) => (
                            <tr key={contrato.id}>
                              <td>
                                <strong>{contrato.numero_contrato}</strong>
                              </td>
                              <td>
                                <StatusBadge 
                                  status={contrato.tipo_display} 
                                  color={getTipoColor(contrato.tipo)}
                                />
                              </td>
                              <td>
                                <StatusBadge 
                                  status={contrato.status_display} 
                                  color={getStatusColor(contrato.status)}
                                />
                              </td>
                              <td>
                                {contrato.comprador_info?.nome || 'N/A'}
                                <br />
                                <small className="text-muted">
                                  {contrato.comprador_info?.cpf_cnpj || 'N/A'}
                                </small>
                              </td>
                              <td>
                                {contrato.motocicleta_info ? (
                                  <>
                                    {contrato.motocicleta_info.marca} {contrato.motocicleta_info.modelo}
                                    <br />
                                    <small className="text-muted">
                                      {contrato.motocicleta_info.ano} - {contrato.motocicleta_info.chassi}
                                    </small>
                                  </>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td>
                                <CurrencyDisplay value={contrato.valor_contrato} />
                              </td>
                              <td>
                                <DateDisplay date={contrato.data_geracao} />
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {
                                      setSelectedContrato(contrato);
                                      setShowContratoModal(true);
                                    }}
                                    title="Detalhes"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => handleVisualizarContrato(contrato)}
                                    title="Visualizar"
                                  >
                                    <i className="fas fa-file-alt"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleBaixarContratoPdf(contrato)}
                                    title="Baixar PDF"
                                  >
                                    <i className="fas fa-download"></i>
                                  </button>
                                  {contrato.status === 'gerado' && (
                                    <>
                                      <button
                                        className="btn btn-sm btn-outline-warning"
                                        onClick={() => handleAtualizarStatusContrato(contrato, 'assinado')}
                                        title="Marcar como Assinado"
                                      >
                                        <i className="fas fa-signature"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleCancelarContrato(contrato)}
                                        title="Cancelar"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* Modal de Criação/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVenda ? `Editar Venda #${editingVenda.id}` : 'Nova Venda'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Motocicleta *"
                  placeholder="Digite para buscar motocicleta..."
                  value={motoSearch}
                  onChange={setMotoSearch}
                  onSelect={handleMotoSelect}
                  items={motocicletas}
                  searchKey="modelo"
                  displayKey="modelo"
                  secondaryKey="placa"
                  required
                />
                {selectedMoto && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedMoto.marca} {selectedMoto.modelo} {selectedMoto.ano} - {selectedMoto.placa || selectedMoto.chassi}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Comprador *"
                  placeholder="Digite para buscar cliente..."
                  value={compradorSearch}
                  onChange={setCompradorSearch}
                  onSelect={handleCompradorSelect}
                  items={clientes}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="cpf_cnpj"
                  required
                />
                {selectedComprador && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedComprador.nome} - {selectedComprador.cpf_cnpj}
                    </small>
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendedor *</Form.Label>
                  <Form.Select name="vendedor" value={formData.vendedor} onChange={handleFormChange} required>
                    <option value={0}>Selecione um vendedor...</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.user.first_name} {usuario.user.last_name} - {usuario.user.username}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor da Venda *</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_venda"
                    value={formData.valor_venda}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data da Venda</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_venda"
                    value={formData.data_venda}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Forma de Pagamento</Form.Label>
                  <Form.Select name="forma_pagamento" value={formData.forma_pagamento} onChange={handleFormChange}>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="transferencia">Transferência</option>
                    <option value="boleto">Boleto</option>
                    <option value="financiamento">Financiamento</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observacoes"
                value={formData.observacoes}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingVenda ? 'Atualizar' : 'Criar'} Venda
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Detalhes da Venda */}
      <Modal show={!!selectedVenda} onHide={() => setSelectedVenda(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da Venda #{selectedVenda?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVenda && (
            <Row>
              <Col md={6}>
                <h6>Informações da Motocicleta</h6>
                <p><strong>Marca/Modelo:</strong> {selectedVenda.moto.marca} {selectedVenda.moto.modelo}</p>
                <p><strong>Ano:</strong> {selectedVenda.moto.ano}</p>
                <p><strong>Placa:</strong> {selectedVenda.moto.placa || 'N/A'}</p>
                <p><strong>Chassi:</strong> {selectedVenda.moto.chassi}</p>
              </Col>
              <Col md={6}>
                <h6>Informações do Cliente</h6>
                <p><strong>Nome:</strong> {selectedVenda.comprador.nome}</p>
                <p><strong>CPF/CNPJ:</strong> {selectedVenda.comprador.cpf_cnpj}</p>
                <p><strong>Telefone:</strong> {selectedVenda.comprador.telefone}</p>
                <p><strong>Email:</strong> {selectedVenda.comprador.email || 'N/A'}</p>
              </Col>
              <Col md={12} className="mt-3">
                <h6>Informações da Venda</h6>
                <Row>
                  <Col md={4}>
                    <p><strong>Valor:</strong> R$ {selectedVenda.valor_venda.toLocaleString('pt-BR')}</p>
                    <p><strong>Entrada:</strong> R$ {selectedVenda.valor_entrada?.toLocaleString('pt-BR') || '0,00'}</p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Status:</strong> {getStatusBadge(selectedVenda.status)}</p>
                    <p><strong>Forma Pagamento:</strong> {selectedVenda.forma_pagamento}</p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Data Atendimento:</strong> {new Date(selectedVenda.data_atendimento).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Data Venda:</strong> {selectedVenda.data_venda ? new Date(selectedVenda.data_venda).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </Col>
                </Row>
                {selectedVenda.observacoes && (
                  <div className="mt-3">
                    <h6>Observações</h6>
                    <p>{selectedVenda.observacoes}</p>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedVenda(null)}>
            Fechar
          </Button>
          {selectedVenda && (
            <Button variant="primary" onClick={() => {
              setSelectedVenda(null);
              handleEdit(selectedVenda);
            }}>
              ✏️ Editar Venda
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de Detalhes */}
      <DetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        title={`Venda #${selectedVenda?.id}`}
        data={selectedVenda}
        type="venda"
      />

      {/* Modal de Detalhes do Contrato */}
      {selectedContrato && (
        <DetailModal
          show={showContratoModal}
          onHide={() => {
            setShowContratoModal(false);
            setSelectedContrato(null);
          }}
          title={`Contrato ${selectedContrato.numero_contrato}`}
        >
          <div className="row">
            <div className="col-md-6">
              <h5>Informações do Contrato</h5>
              <p><strong>Número:</strong> {selectedContrato.numero_contrato}</p>
              <p><strong>Tipo:</strong> {selectedContrato.tipo_display}</p>
              <p><strong>Status:</strong> {selectedContrato.status_display}</p>
              <p><strong>Valor:</strong> <CurrencyDisplay value={selectedContrato.valor_contrato} /></p>
              {selectedContrato.valor_entrada && (
                <p><strong>Entrada:</strong> <CurrencyDisplay value={selectedContrato.valor_entrada} /></p>
              )}
              <p><strong>Data Geração:</strong> <DateDisplay date={selectedContrato.data_geracao} /></p>
              {selectedContrato.data_assinatura && (
                <p><strong>Data Assinatura:</strong> <DateDisplay date={selectedContrato.data_assinatura} /></p>
              )}
            </div>
            <div className="col-md-6">
              <h5>Informações da Motocicleta</h5>
              {selectedContrato.motocicleta_info ? (
                <>
                  <p><strong>Marca/Modelo:</strong> {selectedContrato.motocicleta_info.marca} {selectedContrato.motocicleta_info.modelo}</p>
                  <p><strong>Ano:</strong> {selectedContrato.motocicleta_info.ano}</p>
                  <p><strong>Cor:</strong> {selectedContrato.motocicleta_info.cor}</p>
                  <p><strong>Chassi:</strong> {selectedContrato.motocicleta_info.chassi}</p>
                  {selectedContrato.motocicleta_info.placa && (
                    <p><strong>Placa:</strong> {selectedContrato.motocicleta_info.placa}</p>
                  )}
                  {selectedContrato.motocicleta_info.quilometragem && (
                    <p><strong>KM:</strong> {selectedContrato.motocicleta_info.quilometragem.toLocaleString()}</p>
                  )}
                </>
              ) : (
                <p>Informações não disponíveis</p>
              )}
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-6">
              <h5>Informações do Comprador</h5>
              {selectedContrato.comprador_info ? (
                <>
                  <p><strong>Nome:</strong> {selectedContrato.comprador_info.nome}</p>
                  <p><strong>CPF/CNPJ:</strong> {selectedContrato.comprador_info.cpf_cnpj}</p>
                  <p><strong>Telefone:</strong> {selectedContrato.comprador_info.telefone}</p>
                  {selectedContrato.comprador_info.email && (
                    <p><strong>Email:</strong> {selectedContrato.comprador_info.email}</p>
                  )}
                </>
              ) : (
                <p>Informações não disponíveis</p>
              )}
            </div>
            <div className="col-md-6">
              <h5>Informações da Loja</h5>
              {selectedContrato.loja_info ? (
                <>
                  <p><strong>Nome:</strong> {selectedContrato.loja_info.nome}</p>
                  <p><strong>CNPJ:</strong> {selectedContrato.loja_info.cnpj}</p>
                  <p><strong>Endereço:</strong> {selectedContrato.loja_info.endereco}</p>
                  <p><strong>Cidade/UF:</strong> {selectedContrato.loja_info.cidade} - {selectedContrato.loja_info.estado}</p>
                </>
              ) : (
                <p>Informações não disponíveis</p>
              )}
            </div>
          </div>
        </DetailModal>
      )}

      {/* Modal de Seleção de Tipo de Contrato */}
      <Modal show={showTipoContratoModal} onHide={() => setShowTipoContratoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Escolher Tipo de Contrato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {vendaParaContrato && (
            <div>
              <p className="mb-3">
                <strong>Venda #{vendaParaContrato.id}</strong><br />
                <small className="text-muted">
                  {vendaParaContrato.moto.marca} {vendaParaContrato.moto.modelo} - {vendaParaContrato.comprador.nome}
                </small>
              </p>
              
              <Form.Group>
                <Form.Label>Tipo de Contrato</Form.Label>
                <Form.Select 
                  value={tipoContratoSelecionado} 
                  onChange={(e) => setTipoContratoSelecionado(e.target.value as '0km' | 'seminova' | 'consignacao' | 'auto')}
                >
                  <option value="seminova">Seminova</option>
                  <option value="0km">0km</option>
                  <option value="consignacao">Consignação</option>
                  <option value="auto">Automático</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Escolha o tipo de contrato que será gerado para esta venda.
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTipoContratoModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGerarContrato}>
            Gerar Contrato
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Visualização HTML */}
      <DetailModal
        show={showHtmlModal}
        onHide={() => setShowHtmlModal(false)}
        title="Visualização do Contrato"
        size="lg"
      >
        <div 
          className="border p-3" 
          style={{ 
            maxHeight: '70vh', 
            overflowY: 'auto',
            backgroundColor: 'white',
            fontFamily: 'Times New Roman, serif',
            fontSize: '12px'
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </DetailModal>

      {/* Copyright */}
      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Vendas;
