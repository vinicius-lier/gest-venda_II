import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Modal, Form, Row, Col, Accordion } from 'react-bootstrap';
import { Usuario, ApiError } from '../types';
import apiService from '../services/api';
import PermissionGuard from '../components/PermissionGuard';

interface PermissaoModulo {
  id: number;
  modulo: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_exportar: boolean;
  pode_importar: boolean;
}

interface PermissaoItem {
  id: number;
  modulo: string;
  tipo_item: string;
  item_id: number;
  pode_visualizar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

const GerenciadorPermissoes: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [permissoesModulo, setPermissoesModulo] = useState<PermissaoModulo[]>([]);
  const [permissoesItem, setPermissoesItem] = useState<PermissaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedModulo, setSelectedModulo] = useState<string>('');

  const modulos = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'motocicletas', label: 'Motocicletas' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'consignacoes', label: 'Consignações' },
    { value: 'seguros', label: 'Seguros' },
    { value: 'usuarios', label: 'Usuários' },
    { value: 'lojas', label: 'Lojas' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'relatorios', label: 'Relatórios' },
    { value: 'ocorrencias', label: 'Ocorrências' },
    { value: 'seguradoras', label: 'Seguradoras' },
    { value: 'bens', label: 'Bens' },
    { value: 'cotacoes', label: 'Cotações' },
    { value: 'pre_venda', label: 'Pré-Venda' },
    { value: 'notificacoes', label: 'Notificações' },
    { value: 'documentos', label: 'Documentos' },
    { value: 'chaves', label: 'Chaves' },
    { value: 'pagamentos', label: 'Pagamentos' },
    { value: 'planos_seguro', label: 'Planos de Seguro' },
    { value: 'sistema', label: 'Sistema' },
  ];

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getUsuarios();
      
      if (response && response.results) {
        setUsuarios(response.results);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários. Verifique sua conexão e tente novamente.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPermissoesModulo = useCallback(async (usuarioId: number) => {
    try {
      const response = await apiService.getPermissoesModulo(usuarioId);
      if (response && response.data) {
        setPermissoesModulo(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar permissões de módulo:', error);
    }
  }, []);

  const loadPermissoesItem = useCallback(async (usuarioId: number, modulo: string) => {
    try {
      const response = await apiService.getPermissoesItem(usuarioId, modulo);
      if (response && response.data) {
        setPermissoesItem(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar permissões de item:', error);
    }
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const handleUsuarioSelect = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    loadPermissoesModulo(usuario.id);
    setShowModal(true);
  };

  const handleModuloSelect = (modulo: string) => {
    setSelectedModulo(modulo);
    if (selectedUsuario) {
      loadPermissoesItem(selectedUsuario.id, modulo);
    }
    setShowItemModal(true);
  };

  const handlePermissaoModuloChange = async (permissaoId: number, campo: string, valor: boolean) => {
    try {
      await apiService.updatePermissaoModulo(permissaoId, { [campo]: valor });
      // Recarregar permissões
      if (selectedUsuario) {
        loadPermissoesModulo(selectedUsuario.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      setError('Erro ao atualizar permissão. Tente novamente.');
    }
  };

  const handlePermissaoItemChange = async (permissaoId: number, campo: string, valor: boolean) => {
    try {
      await apiService.updatePermissaoItem(permissaoId, { [campo]: valor });
      // Recarregar permissões
      if (selectedUsuario && selectedModulo) {
        loadPermissoesItem(selectedUsuario.id, selectedModulo);
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão de item:', error);
      setError('Erro ao atualizar permissão de item. Tente novamente.');
    }
  };

  const getModuloLabel = (modulo: string) => {
    const moduloObj = modulos.find(m => m.value === modulo);
    return moduloObj ? moduloObj.label : modulo;
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge bg="success">Ativo</Badge>
    ) : (
      <Badge bg="secondary">Inativo</Badge>
    );
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
              Apenas administradores e usuários de TI podem gerenciar permissões.
            </p>
          </div>
        </Container>
      }
    >
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>🔐 Gerenciador de Permissões</h2>
            <p className="text-muted mb-0">Gerencie permissões de módulos e itens para cada usuário</p>
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
          <Card.Header>
            <h5 className="mb-0">Usuários do Sistema</h5>
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
                    <th>Tipo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
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
                          <Badge bg="info">{usuario.perfil.nome}</Badge>
                        ) : (
                          <Badge bg="secondary">Não definido</Badge>
                        )}
                      </td>
                      <td>{usuario.loja?.nome || 'Não definida'}</td>
                      <td>{getStatusBadge(usuario.user?.is_active || false)}</td>
                      <td>
                        {usuario.tem_usuario_sistema ? (
                          <Badge bg="success">Completo</Badge>
                        ) : (
                          <Badge bg="warning">Básico</Badge>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => handleUsuarioSelect(usuario)}
                          disabled={!usuario.tem_usuario_sistema}
                        >
                          🔐 Gerenciar Permissões
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Modal de Permissões de Módulo */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>
              Gerenciar Permissões - {selectedUsuario?.user?.first_name} {selectedUsuario?.user?.last_name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUsuario && (
              <div>
                <h6>Permissões por Módulo</h6>
                <Accordion>
                  {modulos.map((modulo) => {
                    const permissao = permissoesModulo.find(p => p.modulo === modulo.value);
                    return (
                      <Accordion.Item key={modulo.value} eventKey={modulo.value}>
                        <Accordion.Header>
                          <div className="d-flex justify-content-between align-items-center w-100 me-3">
                            <span>{modulo.label}</span>
                            {permissao && (
                              <div>
                                {permissao.pode_visualizar && <Badge bg="success" className="me-1">Ver</Badge>}
                                {permissao.pode_criar && <Badge bg="primary" className="me-1">Criar</Badge>}
                                {permissao.pode_editar && <Badge bg="warning" className="me-1">Editar</Badge>}
                                {permissao.pode_excluir && <Badge bg="danger" className="me-1">Excluir</Badge>}
                              </div>
                            )}
                          </div>
                        </Accordion.Header>
                        <Accordion.Body>
                          {permissao ? (
                            <Row>
                              <Col md={6}>
                                <Form.Check
                                  type="checkbox"
                                  label="Pode Visualizar"
                                  checked={permissao.pode_visualizar}
                                  onChange={(e) => handlePermissaoModuloChange(permissao.id, 'pode_visualizar', e.target.checked)}
                                />
                                <Form.Check
                                  type="checkbox"
                                  label="Pode Criar"
                                  checked={permissao.pode_criar}
                                  onChange={(e) => handlePermissaoModuloChange(permissao.id, 'pode_criar', e.target.checked)}
                                />
                                <Form.Check
                                  type="checkbox"
                                  label="Pode Editar"
                                  checked={permissao.pode_editar}
                                  onChange={(e) => handlePermissaoModuloChange(permissao.id, 'pode_editar', e.target.checked)}
                                />
                              </Col>
                              <Col md={6}>
                                <Form.Check
                                  type="checkbox"
                                  label="Pode Excluir"
                                  checked={permissao.pode_excluir}
                                  onChange={(e) => handlePermissaoModuloChange(permissao.id, 'pode_excluir', e.target.checked)}
                                />
                                <Form.Check
                                  type="checkbox"
                                  label="Pode Exportar"
                                  checked={permissao.pode_exportar}
                                  onChange={(e) => handlePermissaoModuloChange(permissao.id, 'pode_exportar', e.target.checked)}
                                />
                                <Form.Check
                                  type="checkbox"
                                  label="Pode Importar"
                                  checked={permissao.pode_importar}
                                  onChange={(e) => handlePermissaoModuloChange(permissao.id, 'pode_importar', e.target.checked)}
                                />
                              </Col>
                              <Col md={12} className="mt-3">
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => handleModuloSelect(modulo.value)}
                                >
                                  🔍 Gerenciar Itens Específicos
                                </Button>
                              </Col>
                            </Row>
                          ) : (
                            <p className="text-muted">Nenhuma permissão configurada para este módulo.</p>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Modal de Permissões de Item */}
        <Modal show={showItemModal} onHide={() => setShowItemModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Permissões de Itens - {getModuloLabel(selectedModulo)}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {permissoesItem.length > 0 ? (
              <Table responsive>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>ID</th>
                    <th>Ver</th>
                    <th>Editar</th>
                    <th>Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {permissoesItem.map((permissao) => (
                    <tr key={permissao.id}>
                      <td>{permissao.tipo_item}</td>
                      <td>{permissao.item_id}</td>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={permissao.pode_visualizar}
                          onChange={(e) => handlePermissaoItemChange(permissao.id, 'pode_visualizar', e.target.checked)}
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={permissao.pode_editar}
                          onChange={(e) => handlePermissaoItemChange(permissao.id, 'pode_editar', e.target.checked)}
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={permissao.pode_excluir}
                          onChange={(e) => handlePermissaoItemChange(permissao.id, 'pode_excluir', e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted">Nenhuma permissão específica de item configurada para este módulo.</p>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </PermissionGuard>
  );
};

export default GerenciadorPermissoes;
