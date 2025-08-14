import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { Usuario, Loja, Perfil, ApiError, Motocicleta } from '../types';
import apiService from '../services/api';
import PermissionGuard from '../components/PermissionGuard';
import AutocompleteField from '../components/AutocompleteField';
import WhatsApp from '../components/WhatsApp';

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [motocicletas, setMotocicletas] = useState<Motocicleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    user: {
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      is_active: true
    },
    loja: 0,
    perfil: 0,
    telefone: '',
    status: 'ativo',
    // Campos de senha
    gerar_senha_automatica: true,
    tipo_senha: 'segura',
    enviar_senha_email: true,
    password1: '',
    password2: ''
  });

  // Estado para armazenar dados do usuário criado
  const [usuarioCriado, setUsuarioCriado] = useState<any>(null);
  const [senhaGerada, setSenhaGerada] = useState<string>('');
  const [lojaDisplay, setLojaDisplay] = useState('');

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getUsuarios();
      
      if (response && response.results) {
        setUsuarios(response.results);
      } else {
        setUsuarios([]);
        console.warn('Resposta da API não tem estrutura esperada:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários. Verifique sua conexão e tente novamente.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLojas = useCallback(async () => {
    try {
      const response = await apiService.getLojas();
      if (response && response.results) {
        setLojas(response.results);
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  }, []);

  const loadMotocicletas = useCallback(async () => {
    try {
      const response = await apiService.getMotocicletas();
      if (response && response.results) {
        // Filtrar apenas motocicletas em estoque
        const motosEmEstoque = response.results.filter((moto: Motocicleta) => 
          moto.status === 'estoque' && moto.ativo
        );
        setMotocicletas(motosEmEstoque);
      }
    } catch (error) {
      console.error('Erro ao carregar motocicletas:', error);
    }
  }, []);

  useEffect(() => {
    loadUsuarios();
    loadLojas();
    loadMotocicletas();
  }, [loadUsuarios, loadLojas, loadMotocicletas]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('user.')) {
      const userField = name.replace('user.', '');
      setFormData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [userField]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.user.username.trim()) {
      setError('Username é obrigatório');
      return;
    }
    
    if (!formData.user.first_name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    
    if (!formData.user.email.trim()) {
      setError('Email é obrigatório');
      return;
    }
    
    if (!formData.telefone.trim()) {
      setError('Telefone é obrigatório');
      return;
    }
    
    if (!formData.perfil) {
      setError('Perfil é obrigatório');
      return;
    }
    
    try {
      setError(null); // Limpar erros anteriores
      
      // Preparar dados para envio - tratar campos vazios
      const dadosParaEnviar = {
        ...formData,
        user: {
          ...formData.user,
          // Garantir que campos opcionais sejam tratados
          last_name: formData.user.last_name?.trim() || '',
          email: formData.user.email.trim(),
        },
      };
      
      if (editingUsuario) {
        const response = await apiService.updateUsuario(editingUsuario.id, dadosParaEnviar as any) as any;
        if (response && response.success) {
          setShowModal(false);
          setEditingUsuario(null);
          resetForm();
          loadUsuarios();
        } else {
          setError('Erro ao atualizar usuário: ' + (response?.error || 'Erro desconhecido'));
        }
      } else {
        // Para novos usuários, armazenar dados para WhatsApp
        const response = await apiService.createUsuario(dadosParaEnviar as any) as any;
        
        if (response && response.success && response.data) {
          setUsuarioCriado(response.data);
          setSenhaGerada(response.data.senha_gerada || 'Senha gerada automaticamente');
        } else {
          setError('Erro ao criar usuário: ' + (response?.error || 'Erro desconhecido'));
        }
        // Não fechar o modal imediatamente para mostrar opções de envio
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      const apiError = error as ApiError;
      
      // Tratar erros específicos da API
      if (apiError.response?.data?.details) {
        const details = apiError.response.data.details;
        if (details.username) {
          setError('Username já existe no sistema');
        } else if (details.email) {
          setError('Email já existe no sistema');
        } else {
          setError('Erro ao salvar usuário. Verifique os dados.');
        }
      } else {
        setError('Erro ao salvar usuário: ' + (apiError?.message || 'Erro desconhecido'));
      }
    }
  };

  // Função para enviar credenciais pelo WhatsApp
  const enviarWhatsApp = () => {
    if (!usuarioCriado) return;

    const telefone = formData.telefone.replace(/\D/g, '');
    if (!telefone) {
      setError('Telefone é obrigatório para enviar pelo WhatsApp');
      return;
    }

    const mensagem = `🔐 *Novo Usuário Criado - Prado Motors*

👤 *Dados do Usuário:*
• Nome: ${usuarioCriado.user?.first_name} ${usuarioCriado.user?.last_name}
• Username: ${usuarioCriado.user?.username}
• Email: ${usuarioCriado.user?.email}
• Perfil: ${usuarioCriado.perfil?.nome}

🔑 *Credenciais de Acesso:*
• Username: ${usuarioCriado.user?.username}
• Senha: ${senhaGerada}

🌐 *Link de Acesso:*
http://localhost:3000/login

⚠️ *Importante:*
• Troque sua senha no primeiro acesso
• Mantenha suas credenciais seguras
• Em caso de dúvidas, entre em contato com o administrador

---
*Mensagem automática do sistema Prado Motors*`;

    const url = `https://web.whatsapp.com/send?phone=55${telefone}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // Função para fechar modal e limpar dados
  const fecharModal = () => {
    setShowModal(false);
    setEditingUsuario(null);
    setUsuarioCriado(null);
    setSenhaGerada('');
    resetForm();
    loadUsuarios();
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      user: {
        username: usuario.user?.username || '',
        first_name: usuario.user?.first_name || '',
        last_name: usuario.user?.last_name || '',
        email: usuario.user?.email || '',
        is_active: usuario.user?.is_active || true
      },
      loja: usuario.loja?.id || 0,
      perfil: usuario.perfil?.id || 0,
      telefone: usuario.telefone || '',
      status: usuario.status,
      gerar_senha_automatica: false,
      tipo_senha: 'segura',
      enviar_senha_email: false,
      password1: '',
              password2: ''
    });
    setLojaDisplay(usuario.loja ? `${usuario.loja.nome} - ${usuario.loja.cidade}` : '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        setError(null); // Limpar erros anteriores
        await apiService.deleteUsuario(id);
        loadUsuarios();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        const apiError = error as ApiError;
        setError('Erro ao excluir usuário: ' + (apiError?.message || 'Erro desconhecido'));
      }
    }
  };

  const resetForm = () => {
        setFormData({
      user: {
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        is_active: true
      },
      loja: 0,
      perfil: 0,
      telefone: '',
      status: 'ativo',
      gerar_senha_automatica: true,
      tipo_senha: 'segura',
      enviar_senha_email: true,
      password1: '',
      password2: ''
    });
    setLojaDisplay('');
  };

  const openCreateModal = () => {
    setEditingUsuario(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativo': 'success',
      'inativo': 'danger',
      'bloqueado': 'warning'
    } as const;
    
    return <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getPerfilBadge = (perfil: string) => {
    const variants = {
      'admin': 'danger',
      'gerente': 'warning',
      'vendedor': 'primary',
      'consultor': 'info',
      'financeiro': 'success',
      'ti': 'dark'
    } as const;
    
    return <Badge bg={variants[perfil as keyof typeof variants] || 'secondary'}>{perfil}</Badge>;
  };

  return (
    <PermissionGuard 
      requiredProfile={['admin', 'ti']}
      fallback={
        <Container fluid>
          <div className="text-center py-5">
            <h2>🚫 Acesso Negado</h2>
            <p className="text-muted">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-muted">
              Apenas administradores e usuários de TI podem gerenciar usuários.
            </p>
          </div>
        </Container>
      }
    >
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>👤 Usuários</h2>
            <p className="text-muted mb-0">Gerencie os usuários do sistema</p>
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
              <Button onClick={loadUsuarios} variant="outline-danger">
                Tentar Novamente
              </Button>
            </div>
          </Alert>
        )}

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Lista de Usuários</h5>
              <small className="text-muted">
                <Badge bg="success" className="me-2">Completo</Badge> Usuário com perfil e loja definidos
                <Badge bg="warning" className="ms-3 me-2">Básico</Badge> Apenas dados básicos do Django
              </small>
            </div>
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              ➕ Novo Usuário
            </Button>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">Nenhum usuário encontrado.</p>
                <Button variant="outline-primary" onClick={loadUsuarios}>
                  Recarregar
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Loja</th>
                    <th>Status</th>
                    <th>Telefone</th>
                    <th>Tipo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className={!usuario.tem_usuario_sistema ? 'table-warning' : ''}>
                      <td>
                        <strong>
                          {usuario.user?.first_name || ''} {usuario.user?.last_name || ''}
                        </strong>
                        {!usuario.tem_usuario_sistema && (
                          <Badge bg="warning" className="ms-2">Básico</Badge>
                        )}
                      </td>
                      <td>{usuario.user?.username || 'N/A'}</td>
                      <td>{usuario.user?.email || 'N/A'}</td>
                      <td>
                        {usuario.perfil ? (
                          getPerfilBadge(usuario.perfil.nome)
                        ) : (
                          <Badge bg="secondary">Não definido</Badge>
                        )}
                      </td>
                      <td>{usuario.loja?.nome || 'Não definida'}</td>
                      <td>{getStatusBadge(usuario.status)}</td>
                      <td>{usuario.telefone || 'Não informado'}</td>
                      <td>
                        {usuario.tem_usuario_sistema ? (
                          <Badge bg="success">Completo</Badge>
                        ) : (
                          <Badge bg="warning">Básico</Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button variant="outline-primary" size="sm" onClick={() => handleEdit(usuario)}>
                            ✏️
                          </Button>
                          {usuario.telefone && (
                            <WhatsApp
                              telefone={usuario.telefone}
                              nome={`${usuario.user.first_name} ${usuario.user.last_name}`}
                              tipo="usuario"
                              motocicletas={motocicletas}
                              variant="outline-success"
                              size="sm"
                              onSend={(mensagem) => {
                                console.log('Mensagem enviada para', usuario.user.first_name, ':', mensagem);
                              }}
                            />
                          )}
                          {usuario.tem_usuario_sistema && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(usuario.id)}
                            >
                              🗑️
                            </Button>
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

        {/* Modal de Criação/Edição */}
        <Modal show={showModal} onHide={fecharModal} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingUsuario ? `Editar Usuário - ${editingUsuario.user.first_name} ${editingUsuario.user.last_name}` : 
               usuarioCriado ? '✅ Usuário Criado com Sucesso!' : 'Novo Usuário'}
            </Modal.Title>
          </Modal.Header>
          
          {!usuarioCriado ? (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome *</Form.Label>
                      <Form.Control
                        type="text"
                        name="user.first_name"
                        value={formData.user.first_name}
                        onChange={handleFormChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sobrenome *</Form.Label>
                      <Form.Control
                        type="text"
                        name="user.last_name"
                        value={formData.user.last_name}
                        onChange={handleFormChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username *</Form.Label>
                      <Form.Control
                        type="text"
                        name="user.username"
                        value={formData.user.username}
                        onChange={handleFormChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="user.email"
                        value={formData.user.email}
                        onChange={handleFormChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Perfil *</Form.Label>
                      <Form.Select name="perfil" value={formData.perfil} onChange={handleFormChange} required>
                        <option value={0}>Selecione um perfil...</option>
                        <option value={2}>Admin</option>
                        <option value={3}>Gerente</option>
                        <option value={1}>Vendedor</option>
                        <option value={4}>Consultor</option>
                        <option value={5}>Financeiro</option>
                        <option value={6}>TI</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                                    <AutocompleteField
                  label="Loja"
                  placeholder="Digite o nome da loja..."
                  value={lojaDisplay}
                  onChange={setLojaDisplay}
                  onSelect={(loja) => {
                    setFormData({...formData, loja: loja.id});
                    setLojaDisplay(`${loja.nome} - ${loja.cidade}`);
                  }}
                  items={lojas}
                  searchKey="nome"
                  displayKey="nome"
                  secondaryKey="cidade"
                  required={false}
                  showId
                />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Telefone</Form.Label>
                      <Form.Control
                        type="text"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleFormChange}
                        placeholder="(11) 99999-9999"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select name="status" value={formData.status} onChange={handleFormChange}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="bloqueado">Bloqueado</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Campos de Senha - Apenas para novos usuários */}
                {!editingUsuario && (
                  <>
                    <hr />
                    <h6 className="mb-3">🔐 Configuração de Senha</h6>
                    
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            name="gerar_senha_automatica"
                            label="Gerar senha automaticamente"
                            checked={formData.gerar_senha_automatica}
                            onChange={handleFormChange}
                            className="mb-2"
                          />
                          <Form.Text className="text-muted">
                            Marque esta opção para gerar uma senha segura automaticamente
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    {formData.gerar_senha_automatica && (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Tipo de Senha</Form.Label>
                            <Form.Select name="tipo_senha" value={formData.tipo_senha} onChange={handleFormChange}>
                              <option value="segura">Senha Segura (Recomendada)</option>
                              <option value="legivel">Senha Legível</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="checkbox"
                              name="enviar_senha_email"
                              label="Enviar senha por email"
                              checked={formData.enviar_senha_email}
                              onChange={handleFormChange}
                            />
                            <Form.Text className="text-muted">
                              Enviar a senha gerada para o email do usuário
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    {!formData.gerar_senha_automatica && (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Senha *</Form.Label>
                            <Form.Control
                              type="password"
                              name="password1"
                              value={formData.password1}
                              onChange={handleFormChange}
                              required={!formData.gerar_senha_automatica}
                              placeholder="Digite a senha"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Confirmar Senha *</Form.Label>
                            <Form.Control
                              type="password"
                              name="password2"
                              value={formData.password2}
                              onChange={handleFormChange}
                              required={!formData.gerar_senha_automatica}
                              placeholder="Confirme a senha"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                  </>
                )}

                {/* Campos de Senha para Edição */}
                {editingUsuario && (
                  <>
                    <hr />
                    <h6 className="mb-3">🔐 Alterar Senha (Opcional)</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nova Senha</Form.Label>
                          <Form.Control
                            type="password"
                            name="password1"
                            value={formData.password1}
                            onChange={handleFormChange}
                            placeholder="Deixe em branco para manter a senha atual"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirmar Nova Senha</Form.Label>
                          <Form.Control
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleFormChange}
                            placeholder="Confirme a nova senha"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}



                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="user.is_active"
                    label="Usuário Ativo"
                    checked={formData.user.is_active}
                    onChange={handleFormChange}
                  />
                </Form.Group>

              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  {editingUsuario ? 'Atualizar' : 'Criar'} Usuário
                </Button>
              </Modal.Footer>
            </Form>
          ) : (
            <>
              <Modal.Body>
                <div className="text-center">
                  <div className="mb-4">
                    <h4 className="text-success">✅ Usuário Criado com Sucesso!</h4>
                    <p className="text-muted">Escolha como deseja enviar as credenciais:</p>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="card h-100">
                        <div className="card-body text-center">
                          <h5 className="card-title">📧 Email</h5>
                          <p className="card-text">Enviar credenciais por email</p>
                          <Button 
                            variant="outline-primary" 
                            onClick={() => {
                              // Implementar envio por email
                              alert('Funcionalidade de email será implementada');
                            }}
                          >
                            📧 Enviar por Email
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card h-100">
                        <div className="card-body text-center">
                          <h5 className="card-title">📱 WhatsApp</h5>
                          <p className="card-text">Enviar credenciais pelo WhatsApp</p>
                          <Button 
                            variant="outline-success" 
                            onClick={enviarWhatsApp}
                            disabled={!formData.telefone}
                          >
                            📱 Enviar por WhatsApp
                          </Button>
                          {!formData.telefone && (
                            <small className="text-muted d-block mt-2">
                              Telefone é obrigatório para WhatsApp
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-light rounded">
                    <h6>📋 Dados do Usuário Criado:</h6>
                    <div className="row text-start">
                      <div className="col-md-6">
                        <p><strong>Nome:</strong> {usuarioCriado.user?.first_name} {usuarioCriado.user?.last_name}</p>
                        <p><strong>Username:</strong> {usuarioCriado.user?.username}</p>
                        <p><strong>Email:</strong> {usuarioCriado.user?.email}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Perfil:</strong> {usuarioCriado.perfil?.nome}</p>
                        <p><strong>Loja:</strong> {usuarioCriado.loja?.nome}</p>
                        <p><strong>Senha:</strong> {senhaGerada}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={fecharModal}>
                  Fechar
                </Button>
                <Button variant="primary" onClick={fecharModal}>
                  Criar Outro Usuário
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        <div className="text-center mt-5 pt-3 border-top">
          <small className="text-muted">
            © 2025 Vinicius Oliveira - Todos os direitos reservados
          </small>
        </div>
      </Container>
    </PermissionGuard>
  );
};

export default Usuarios;
