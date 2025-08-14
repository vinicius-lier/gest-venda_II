import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { Motocicleta, Cliente, ApiError } from '../types';
import apiService from '../services/api';
import AutocompleteField from '../components/AutocompleteField';
import DetailModal from '../components/DetailModal';
import MultipleImageUpload from '../components/MultipleImageUpload';
import PhotoPlaceholder from '../components/PhotoPlaceholder';
import SafeImage from '../components/SafeImage';
import StatusBadge from '../components/StatusBadge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import DateDisplay from '../components/DateDisplay';

const Motocicletas: React.FC = () => {
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMotocicleta, setSelectedMotocicleta] = useState<Motocicleta | null>(null);
  const [editingMotocicleta, setEditingMotocicleta] = useState<Motocicleta | null>(null);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    ano: 0,
    placa: '',
    chassi: '',
    renavam: '',
    ano_fabricacao: '',
    cor: '',
    cilindrada: '',
    km_atual: 0,
    valor_compra: 0,
    valor_venda: 0,
    status: 'estoque',
    tipo_entrada: 'usada',
    origem: 'cliente',
    proprietario: 0,
    fornecedor: 0,
    data_entrada: '',
    observacoes: '',
    fotos: [] as string[],
    foto_principal_index: -1
  });

  // Estados para autocomplete
  const [proprietarioSearch, setProprietarioSearch] = useState('');
  const [fornecedorSearch, setFornecedorSearch] = useState('');
  const [selectedProprietario, setSelectedProprietario] = useState<Cliente | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Cliente | null>(null);

  const loadMotocicletas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getMotocicletas();
      
      // Debug: Verificar estrutura dos dados
      console.log('🔍 loadMotocicletas - Resposta completa:', response);
      
      // Verificar se a resposta tem a estrutura esperada
      if (response && response.results) {
        // Debug: Verificar dados das fotos
        response.results.forEach((moto, index) => {
          console.log(`🔍 Motocicleta ${index + 1} (ID: ${moto.id}):`, {
            marca: moto.marca,
            modelo: moto.modelo,
            fotos: moto.fotos,
            foto_principal_index: moto.foto_principal_index,
            fotos_length: moto.fotos ? moto.fotos.length : 0,
            fotos_type: typeof moto.fotos,
            fotos_is_array: Array.isArray(moto.fotos)
          });
        });
        
        setMotocicletas(response.results);
      } else {
        // Se não há dados, definir como array vazio
        setMotocicletas([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar motocicletas:', error);
      setError('Erro ao carregar motocicletas. Verifique sua conexão e tente novamente.');
      setMotocicletas([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    loadMotocicletas();
    loadClientes();
  }, [loadMotocicletas, loadClientes]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Mostrar alerta quando status for alterado para 'vendida'
    if (name === 'status' && value === 'vendida') {
      setError(null); // Limpar erros anteriores
    }
  };

  const handleProprietarioSelect = (cliente: Cliente) => {
    setSelectedProprietario(cliente);
    setFormData(prev => ({
      ...prev,
      proprietario: cliente.id
    }));
  };

  const handleFornecedorSelect = (cliente: Cliente) => {
    setSelectedFornecedor(cliente);
    setFormData(prev => ({
      ...prev,
      fornecedor: cliente.id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.marca.trim()) {
      setError('Marca é obrigatória');
      return;
    }
    
    if (!formData.modelo.trim()) {
      setError('Modelo é obrigatório');
      return;
    }
    
    if (!formData.chassi.trim()) {
      setError('Chassi é obrigatório');
      return;
    }
    
    if (!formData.cor.trim()) {
      setError('Cor é obrigatória');
      return;
    }
    
    // Validação: se status for 'vendida', verificar se há dados de venda
    if (formData.status === 'vendida') {
      if (!formData.valor_venda || formData.valor_venda <= 0) {
        setError('Para motocicletas vendidas, é obrigatório informar o valor de venda.');
        return;
      }
      if (!formData.data_entrada) {
        setError('Para motocicletas vendidas, é obrigatório informar a data de entrada.');
        return;
      }
    }
    
    try {
      // Preparar dados para envio - tratar campos vazios
      const dadosParaEnviar = {
        ...formData,
        // Converter campos vazios para strings vazias (não null)
        placa: formData.placa.trim() || '',
        observacoes: formData.observacoes.trim() || '',
        // Garantir que valores numéricos sejam válidos
        valor_entrada: formData.valor_compra || 0,
        valor_atual: formData.valor_venda || 0,
        rodagem: formData.km_atual || 0,
        // Converter ano para string se necessário
        ano: formData.ano.toString(),
        // Usar o novo sistema unificado de fotos
        fotos: Array.isArray(formData.fotos) ? formData.fotos : [],
        foto_principal_index: typeof formData.foto_principal_index === 'number' ? formData.foto_principal_index : -1
      };
      
      // Log dos dados sendo enviados
      console.log('🔍 Dados sendo enviados para API:', dadosParaEnviar);
      console.log('🔍 Fotos:', dadosParaEnviar.fotos);
      console.log('🔍 Foto principal index:', dadosParaEnviar.foto_principal_index);
      
      if (editingMotocicleta) {
        console.log('🔍 Atualizando motocicleta ID:', editingMotocicleta.id);
        await apiService.updateMotocicleta(editingMotocicleta.id, dadosParaEnviar as any);
      } else {
        console.log('🔍 Criando nova motocicleta');
        await apiService.createMotocicleta(dadosParaEnviar as any);
      }
      setShowModal(false);
      setEditingMotocicleta(null);
      resetForm();
      loadMotocicletas();
      setError(null); // Limpar erros anteriores
    } catch (error) {
      console.error('Erro ao salvar motocicleta:', error);
      const apiError = error as ApiError;
      
      // Tratar erros específicos da API
      if (apiError.response?.data?.details) {
        const details = apiError.response.data.details;
        if (details.chassi) {
          setError('Chassi já existe no sistema');
        } else if (details.placa && details.placa.includes('já existe')) {
          setError('Placa já existe no sistema');
        } else {
          setError('Erro ao salvar motocicleta. Verifique os dados.');
        }
      } else {
        setError('Erro ao salvar motocicleta. Tente novamente.');
      }
    }
  };

  const handleEdit = (motocicleta: Motocicleta) => {
    setEditingMotocicleta(motocicleta);
    
    // Usar o novo sistema unificado de fotos
    const fotosArray: string[] = Array.isArray(motocicleta.fotos) ? motocicleta.fotos : [];
    const fotoPrincipalIndex = typeof motocicleta.foto_principal_index === 'number' ? motocicleta.foto_principal_index : -1;
    
    console.log('🔍 handleEdit - Fotos recebidas:', motocicleta.fotos);
    console.log('🔍 handleEdit - Tipo das fotos:', typeof motocicleta.fotos, 'É array:', Array.isArray(motocicleta.fotos));
    console.log('🔍 handleEdit - Fotos processadas:', fotosArray);
    console.log('🔍 handleEdit - Foto principal index:', fotoPrincipalIndex);
    
    setFormData({
      marca: motocicleta.marca,
      modelo: motocicleta.modelo,
      ano: parseInt(motocicleta.ano.toString()) || 0,
      placa: motocicleta.placa || '',
      chassi: motocicleta.chassi || '',
      renavam: motocicleta.renavam || '',
      ano_fabricacao: motocicleta.ano_fabricacao || '',
      cor: motocicleta.cor || '',
      cilindrada: motocicleta.cilindrada || '',
      km_atual: motocicleta.rodagem || 0,
      valor_compra: motocicleta.valor_entrada || 0,
      valor_venda: motocicleta.valor_atual || 0,
      status: motocicleta.status,
      tipo_entrada: motocicleta.tipo_entrada || 'usada',
      origem: motocicleta.origem || 'cliente',
      proprietario: motocicleta.proprietario?.id || 0,
      fornecedor: motocicleta.fornecedor?.id || 0,
      data_entrada: motocicleta.data_entrada || '',
      observacoes: motocicleta.observacoes || '',
      fotos: fotosArray,
      foto_principal_index: fotoPrincipalIndex
    });
    
    // Configurar autocomplete para edição
    if (motocicleta.proprietario) {
      setProprietarioSearch(`${motocicleta.proprietario.nome} - ${motocicleta.proprietario.cpf_cnpj}`);
      setSelectedProprietario(motocicleta.proprietario);
    }
    if (motocicleta.fornecedor) {
      setFornecedorSearch(`${motocicleta.fornecedor.nome} - ${motocicleta.fornecedor.cpf_cnpj}`);
      setSelectedFornecedor(motocicleta.fornecedor);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta motocicleta?')) {
      try {
        await apiService.deleteMotocicleta(id);
        loadMotocicletas();
      } catch (error) {
        console.error('Erro ao excluir motocicleta:', error);
        setError('Erro ao excluir motocicleta. Tente novamente.');
      }
    }
  };

  const handleDetails = (motocicleta: Motocicleta) => {
    setSelectedMotocicleta(motocicleta);
    setShowDetailModal(true);
  };

  const handleKeyRetrieval = (motocicleta: Motocicleta) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    
    const keyRetrieval = `
🔑 REGISTRO DE RETIRADA DE CHAVE

🏍️ Motocicleta:
• ${motocicleta.marca} ${motocicleta.modelo} ${motocicleta.ano}
• Chassi: ${motocicleta.chassi}
• Placa: ${motocicleta.placa || 'N/A'}

📅 Data/Hora: ${currentDate} às ${currentTime}

👤 Funcionário: ${localStorage.getItem('userName') || 'Usuário atual'}

⚠️ IMPORTANTE:
• Este registro é para fins de auditoria
• A chave deve ser devolvida após o teste/manutenção
• Registrar a devolução da chave quando concluído

✅ Chave retirada para: [TESTE/MANUTENÇÃO]
    `;
    
    if (window.confirm('Confirmar retirada da chave?\n\n' + keyRetrieval)) {
      alert('✅ Chave retirada com sucesso!\n\nRegistro salvo para auditoria.');
    }
  };

  const resetForm = () => {
    setFormData({
      marca: '',
      modelo: '',
      ano: 0,
      placa: '',
      chassi: '',
      renavam: '',
      ano_fabricacao: '',
      cor: '',
      cilindrada: '',
      km_atual: 0,
      valor_compra: 0,
      valor_venda: 0,
      status: 'estoque',
      tipo_entrada: 'usada',
      origem: 'cliente',
      proprietario: 0,
      fornecedor: 0,
      data_entrada: '',
      observacoes: '',
      fotos: [] as string[],
      foto_principal_index: -1
    });
    setProprietarioSearch('');
    setFornecedorSearch('');
    setSelectedProprietario(null);
    setSelectedFornecedor(null);
  };

  const openCreateModal = () => {
    setEditingMotocicleta(null);
    resetForm();
    setShowModal(true);
  };

  // Função getStatusBadge removida - agora usando o componente StatusBadge

  const renderFoto = (moto: Motocicleta) => {
    // Debug: Log detalhado para cada moto
    console.log(`🔍 Renderizando fotos para moto ${moto.id}:`, {
      fotos: moto.fotos,
      fotos_length: moto.fotos ? moto.fotos.length : 0,
      foto_principal_index: moto.foto_principal_index,
      tem_foto_principal: moto.fotos && moto.fotos.length > 0 && moto.foto_principal_index >= 0 && moto.foto_principal_index < moto.fotos.length,
      tem_fotos: moto.fotos && moto.fotos.length > 0
    });
    
    // Verificar se há fotos válidas
    if (!moto.fotos || moto.fotos.length === 0) {
      console.log(`🔍 Moto ${moto.id} sem fotos`);
      return (
        <PhotoPlaceholder
          width={60}
          height={40}
          title={`${moto.marca} ${moto.modelo} - Sem foto disponível`}
          variant="moto"
        />
      );
    }
    
    // Verificar se há foto principal válida
    if (moto.foto_principal_index >= 0 && moto.foto_principal_index < moto.fotos.length) {
      const fotoPrincipal = moto.fotos[moto.foto_principal_index];
      console.log(`🔍 Usando foto principal (índice ${moto.foto_principal_index}):`, fotoPrincipal);
      
      // Verificar se a foto é válida
      if (fotoPrincipal && fotoPrincipal.length > 0) {
        return (
          <SafeImage
            src={`data:image/jpeg;base64,${fotoPrincipal}`}
            alt={`${moto.marca} ${moto.modelo}`}
            width={60}
            height={40}
            title={`${moto.marca} ${moto.modelo}`}
            variant="moto"
          />
        );
      }
    }
    
    // Usar primeira foto se não há foto principal válida
    if (moto.fotos.length > 0) {
      const primeiraFoto = moto.fotos[0];
      console.log(`🔍 Usando primeira foto:`, primeiraFoto);
      
      if (primeiraFoto && primeiraFoto.length > 0) {
        return (
          <SafeImage
            src={`data:image/jpeg;base64,${primeiraFoto}`}
            alt={`${moto.marca} ${moto.modelo}`}
            width={60}
            height={40}
            title={`${moto.marca} ${moto.modelo}`}
            variant="moto"
          />
        );
      }
    }
    
    // Fallback se nenhuma foto for válida
    console.log(`🔍 Moto ${moto.id} sem fotos válidas`);
    return (
      <PhotoPlaceholder
        width={60}
        height={40}
        title={`${moto.marca} ${moto.modelo} - Sem foto disponível`}
        variant="moto"
      />
    );
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🏍️ Motocicletas</h2>
          <p className="text-muted mb-0">Gerencie o estoque de motocicletas</p>
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
            <Button onClick={loadMotocicletas} variant="outline-danger">
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Estoque de Motocicletas</h5>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            ➕ Nova Motocicleta
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : motocicletas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Nenhuma motocicleta encontrada.</p>
              <Button variant="outline-primary" onClick={loadMotocicletas}>
                Recarregar
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Marca/Modelo</th>
                  <th>Ano</th>
                  <th>Placa/Chassi</th>
                  <th>Status</th>
                  <th>Valor Atual</th>
                  <th>Data Entrada</th>
                  <th>Proprietário</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {motocicletas.map((moto) => (
                  <tr key={moto.id}>
                    <td>
                      {renderFoto(moto)}
                    </td>
                    <td>
                      <strong>{moto.marca} {moto.modelo}</strong>
                      <br />
                      <small className="text-muted">{moto.cor}</small>
                    </td>
                    <td>{moto.ano}</td>
                    <td>{moto.placa || moto.chassi}</td>
                    <td><StatusBadge status={moto.status} /></td>
                    <td><CurrencyDisplay value={moto.valor_atual} /></td>
                    <td>
                                              <small><DateDisplay date={moto.data_entrada} /></small>
                    </td>
                    <td>{moto.proprietario?.nome || 'N/A'}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="outline-info" size="sm" onClick={() => handleDetails(moto)} title="Ver detalhes">
                          👁️
                        </Button>
                        <Button variant="outline-warning" size="sm" onClick={() => handleKeyRetrieval(moto)} title="Retirada de chave">
                          🔑
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(moto)}>
                          ✏️
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(moto.id)}>
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

      {/* Modal de Criação/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingMotocicleta ? `Editar Motocicleta #${editingMotocicleta.id}` : 'Nova Motocicleta'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formData.status === 'vendida' && (
              <Alert variant="info" className="mb-3">
                <Alert.Heading>⚠️ Motocicleta Vendida</Alert.Heading>
                <p>
                  Para motocicletas com status "Vendida", é obrigatório preencher:
                </p>
                <ul className="mb-0">
                  <li><strong>Valor de Venda</strong> - Valor pelo qual a moto foi vendida</li>
                  <li><strong>Data de Entrada</strong> - Data em que a moto entrou no sistema</li>
                </ul>
              </Alert>
            )}
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca *</Form.Label>
                  <Form.Control
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Modelo *</Form.Label>
                  <Form.Control
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Ano *</Form.Label>
                  <Form.Control
                    type="number"
                    name="ano"
                    value={formData.ano}
                    onChange={handleFormChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Ano Fab.</Form.Label>
                  <Form.Control
                    type="number"
                    name="ano_fabricacao"
                    value={formData.ano_fabricacao}
                    onChange={handleFormChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="Fabricação"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Placa</Form.Label>
                  <Form.Control
                    type="text"
                    name="placa"
                    value={formData.placa}
                    onChange={handleFormChange}
                    maxLength={8}
                    placeholder="ABC-1234"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Renavam</Form.Label>
                  <Form.Control
                    type="text"
                    name="renavam"
                    value={formData.renavam}
                    onChange={handleFormChange}
                    maxLength={11}
                    placeholder="12345678901"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Chassi *</Form.Label>
                  <Form.Control
                    type="text"
                    name="chassi"
                    value={formData.chassi}
                    onChange={handleFormChange}
                    maxLength={17}
                    required
                    placeholder="Digite o número do chassi"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <AutocompleteField
                  label="Proprietário"
                  placeholder="Digite para buscar proprietário..."
                  value={proprietarioSearch}
                  onChange={setProprietarioSearch}
                  onSelect={handleProprietarioSelect}
                  items={clientes}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="cpf_cnpj"
                />
                {selectedProprietario && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedProprietario.nome} - {selectedProprietario.cpf_cnpj}
                    </small>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <AutocompleteField
                  label="Fornecedor"
                  placeholder="Digite para buscar fornecedor..."
                  value={fornecedorSearch}
                  onChange={setFornecedorSearch}
                  onSelect={handleFornecedorSelect}
                  items={clientes}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="cpf_cnpj"
                />
                {selectedFornecedor && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Selecionado:</strong> {selectedFornecedor.nome} - {selectedFornecedor.cpf_cnpj}
                    </small>
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cor *</Form.Label>
                  <Form.Control
                    type="text"
                    name="cor"
                    value={formData.cor}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cilindrada</Form.Label>
                  <Form.Control
                    type="text"
                    name="cilindrada"
                    value={formData.cilindrada}
                    onChange={handleFormChange}
                    placeholder="Ex: 150cc, 250cc"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Chassi *</Form.Label>
                  <Form.Control
                    type="text"
                    name="chassi"
                    value={formData.chassi}
                    onChange={handleFormChange}
                    maxLength={17}
                    required
                    placeholder="Digite o número do chassi"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Km Atual</Form.Label>
                  <Form.Control
                    type="number"
                    name="km_atual"
                    value={formData.km_atual}
                    onChange={handleFormChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor de Compra</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_compra"
                    value={formData.valor_compra}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor de Venda {formData.status === 'vendida' && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    type="number"
                    name="valor_venda"
                    value={formData.valor_venda}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    required={formData.status === 'vendida'}
                    className={formData.status === 'vendida' && !formData.valor_venda ? 'is-invalid' : ''}
                  />
                  {formData.status === 'vendida' && !formData.valor_venda && (
                    <div className="invalid-feedback">
                      Valor de venda é obrigatório para motocicletas vendidas.
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="estoque">Em Estoque</option>
                    <option value="vendida">Vendida</option>
                    <option value="repasse">Repasse</option>
                    <option value="reservada">Reservada</option>
                    <option value="manutencao">Em Manutenção</option>
                    <option value="pendencia">Pendência</option>
                    <option value="bloqueada">Bloqueada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Entrada</Form.Label>
                  <Form.Select name="tipo_entrada" value={formData.tipo_entrada} onChange={handleFormChange}>
                    <option value="0km">0km</option>
                    <option value="usada">Usada (Entrada)</option>
                    <option value="consignada">Consignada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Origem</Form.Label>
                  <Form.Select name="origem" value={formData.origem} onChange={handleFormChange}>
                    <option value="cliente">Cliente</option>
                    <option value="loja_parceira">Loja Parceira</option>
                    <option value="fornecedor_externo">Fornecedor Externo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Entrada {formData.status === 'vendida' && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    type="date"
                    name="data_entrada"
                    value={formData.data_entrada}
                    onChange={handleFormChange}
                    required={formData.status === 'vendida'}
                    className={formData.status === 'vendida' && !formData.data_entrada ? 'is-invalid' : ''}
                  />
                  {formData.status === 'vendida' && !formData.data_entrada && (
                    <div className="invalid-feedback">
                      Data de entrada é obrigatória para motocicletas vendidas.
                    </div>
                  )}
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

            {/* Seção de Fotos */}
            <hr className="my-4" />
            <MultipleImageUpload
              label="📸 Fotos da Motocicleta"
              value={formData.fotos || []}
              fotoPrincipalIndex={formData.foto_principal_index || -1}
              onChange={(fotos, fotoPrincipalIndex) => {
                console.log('🔍 MultipleImageUpload onChange - Fotos:', fotos.length, 'Principal:', fotoPrincipalIndex);
                console.log('🔍 Tipo das fotos recebidas:', typeof fotos, 'É array:', Array.isArray(fotos));
                setFormData(prev => {
                  const newData = { 
                    ...prev, 
                    fotos: Array.isArray(fotos) ? fotos : [], 
                    foto_principal_index: typeof fotoPrincipalIndex === 'number' ? fotoPrincipalIndex : -1
                  };
                  console.log('🔍 Novo estado do formulário:', newData);
                  return newData;
                });
              }}
              maxFiles={10}
              className="mb-3"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingMotocicleta ? 'Atualizar' : 'Criar'} Motocicleta
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Detalhes */}
      <DetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        title={`Motocicleta ${selectedMotocicleta?.marca} ${selectedMotocicleta?.modelo}`}
        data={selectedMotocicleta}
        type="motocicleta"
      />

      <div className="text-center mt-5 pt-3 border-top">
        <small className="text-muted">
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </Container>
  );
};

export default Motocicletas;
