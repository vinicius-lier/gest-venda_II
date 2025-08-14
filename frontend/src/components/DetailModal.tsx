import React, { useState } from 'react';
import { Modal, Button, Badge, Image, Row, Col } from 'react-bootstrap';
import PhotoViewer from './PhotoViewer';

interface DetailModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  data?: any;
  type?: 'motocicleta' | 'cliente' | 'venda' | 'ocorrencia' | 'usuario' | 'loja';
  children?: React.ReactNode;
  size?: string;
}

const DetailModal: React.FC<DetailModalProps> = ({ show, onHide, title, data, type, children, size = "xl" }) => {
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const formatCurrency = (value: number) => {
    return value?.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    }) || 'R$ 0,00';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      'ativo': 'success',
      'inativo': 'danger',
      'pendente': 'warning',
      'concluido': 'success',
      'cancelado': 'danger',
      'estoque': 'success',
      'vendida': 'danger',
      'reservada': 'warning',
      'manutencao': 'info',
      'pendencia': 'secondary',
      'bloqueada': 'dark'
    };
    
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const renderMotocicletaDetails = () => (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>📋 Identificação</h6>
          <p><strong>Marca:</strong> {data.marca}</p>
          <p><strong>Modelo:</strong> {data.modelo}</p>
          <p><strong>Ano:</strong> {data.ano}</p>
          <p><strong>Ano de Fabricação:</strong> {data.ano_fabricacao || 'N/A'}</p>
          <p><strong>Chassi:</strong> {data.chassi}</p>
          <p><strong>Placa:</strong> {data.placa || 'N/A'}</p>
          <p><strong>Renavam:</strong> {data.renavam || 'N/A'}</p>
        </div>
        <div className="col-md-6">
          <h6>🎨 Características</h6>
          <p><strong>Cor:</strong> {data.cor}</p>
          <p><strong>Cilindrada:</strong> {data.cilindrada || 'N/A'}</p>
          <p><strong>Km Atual:</strong> {data.rodagem?.toLocaleString('pt-BR') || 'N/A'}</p>
          <p><strong>Status:</strong> {getStatusBadge(data.status)}</p>
          <p><strong>Tipo de Entrada:</strong> {data.tipo_entrada}</p>
          <p><strong>Origem:</strong> {data.origem}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>💰 Valores</h6>
          <p><strong>Valor de Compra:</strong> {formatCurrency(data.valor_entrada)}</p>
          <p><strong>Valor Atual:</strong> {formatCurrency(data.valor_atual)}</p>
        </div>
        <div className="col-md-6">
          <h6>👥 Relacionamentos</h6>
          <p><strong>Proprietário:</strong> {data.proprietario?.nome || 'N/A'}</p>
          <p><strong>Fornecedor:</strong> {data.fornecedor?.nome || 'N/A'}</p>
          <p><strong>Loja de Origem:</strong> {data.loja_origem?.nome || 'N/A'}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>📅 Datas</h6>
          <p><strong>Data de Entrada:</strong> {formatDate(data.data_entrada)}</p>
          <p><strong>Data de Venda:</strong> {formatDate(data.data_venda)}</p>
        </div>
        <div className="col-md-6">
          <h6>📝 Observações</h6>
          <p>{data.observacoes || 'Nenhuma observação registrada.'}</p>
        </div>
      </div>
      
      {/* Histórico de Proprietários */}
      <div className="row mb-3">
        <div className="col-md-12">
          <h6>👥 Histórico de Proprietários</h6>
          {data.historico_proprietarios && data.historico_proprietarios.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Proprietário</th>
                    <th>Data Início</th>
                    <th>Data Fim</th>
                    <th>Motivo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.historico_proprietarios.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{item.proprietario?.nome}</td>
                      <td>{formatDate(item.data_inicio)}</td>
                      <td>{item.data_fim ? formatDate(item.data_fim) : 'Atual'}</td>
                      <td>
                        <Badge bg="info">
                          {item.motivo === 'compra' ? 'Compra' : 
                           item.motivo === 'venda' ? 'Venda' : 
                           item.motivo === 'consignacao' ? 'Consignação' : 
                           item.motivo === 'repasse' ? 'Repasse' : 
                           item.motivo === 'remocao' ? 'Remoção' : 
                           item.motivo === 'exclusao_cliente' ? 'Exclusão' : item.motivo}
                        </Badge>
                      </td>
                      <td>{item.valor_transacao ? formatCurrency(item.valor_transacao) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">Nenhum histórico de proprietários registrado.</p>
          )}
        </div>
      </div>
      
      {/* Seção de Fotos */}
      {data.fotos && data.fotos.length > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <h6 className="photo-section-title">📸 Fotos da Motocicleta</h6>
            
            {/* Debug: Log das fotos */}
            {(() => {
              console.log(`🔍 DetailModal - Fotos da moto ${data.id}:`, {
                fotos: data.fotos,
                fotos_length: data.fotos.length,
                foto_principal_index: data.foto_principal_index,
                tem_foto_principal: data.foto_principal_index >= 0 && data.foto_principal_index < data.fotos.length
              });
              return null;
            })()}
            
            {/* Foto Principal em Destaque */}
            {data.foto_principal_index >= 0 && data.foto_principal_index < data.fotos.length ? (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="text-center">
                    <Image
                      src={`data:image/jpeg;base64,${data.fotos[data.foto_principal_index]}`}
                      alt="Foto Principal"
                      fluid
                      className="mb-2 photo-main"
                      style={{ 
                        maxHeight: '300px', 
                        objectFit: 'cover', 
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        console.error(`❌ Erro ao carregar foto principal no DetailModal:`, e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <small className="text-muted">
                      <strong>Foto Principal</strong>
                    </small>
                  </div>
                </div>
              </div>
            ) : data.fotos.length > 0 ? (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="text-center">
                    <Image
                      src={`data:image/jpeg;base64,${data.fotos[0]}`}
                      alt="Primeira Foto"
                      fluid
                      className="mb-2 photo-main-no-primary"
                      style={{ 
                        maxHeight: '300px', 
                        objectFit: 'cover', 
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        console.error(`❌ Erro ao carregar primeira foto no DetailModal:`, e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <small className="text-muted">
                      <strong>Primeira Foto</strong> (nenhuma foto principal definida)
                    </small>
                  </div>
                </div>
              </div>
            ) : null}
            
            {/* Outras Fotos como Thumbnails */}
            {(() => {
              const outrasFotos = data.fotos.filter((_: string, index: number) => {
                if (data.foto_principal_index >= 0 && data.foto_principal_index < data.fotos.length) {
                  return index !== data.foto_principal_index;
                }
                return index > 0; // Se não há foto principal, mostra todas exceto a primeira
              });
              
              return outrasFotos.length > 0 ? (
                <div className="row">
                  <div className="col-12">
                    <h6 className="photo-section-title">📷 Outras Fotos ({outrasFotos.length})</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {data.fotos.map((foto: string, index: number) => {
                        const isOutraFoto = data.foto_principal_index >= 0 && data.foto_principal_index < data.fotos.length 
                          ? index !== data.foto_principal_index 
                          : index > 0;
                        
                        return isOutraFoto ? (
                          <div key={index} className="position-relative">
                            <Image
                              src={`data:image/jpeg;base64,${foto}`}
                              alt={`Foto ${index + 1}`}
                              className="photo-thumbnail"
                              style={{ 
                                width: '80px', 
                                height: '60px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setCurrentPhotoIndex(index);
                                setShowPhotoViewer(true);
                              }}
                              title={`Clique para ver Foto ${index + 1}`}
                              onError={(e) => {
                                console.error(`❌ Erro ao carregar miniatura ${index + 1}:`, e);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                                                      <small className="photo-number-badge">
                            {index + 1}
                          </small>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <small className="photo-instructions">
                      Clique nas miniaturas para visualizar em tamanho completo
                    </small>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
      
      {/* Fallback para foto_principal antiga */}
      {(!data.fotos || data.fotos.length === 0) && data.foto_principal && (
        <div className="row mb-3">
          <div className="col-12">
            <h6>📸 Foto Principal</h6>
            <div className="text-center">
              <Image
                src={data.foto_principal}
                alt="Foto Principal"
                fluid
                className="mb-2"
                style={{ maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <small className="text-muted">
                Foto principal da motocicleta
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClienteDetails = () => (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>👤 Informações Pessoais</h6>
          <p><strong>Nome:</strong> {data.nome}</p>
          <p><strong>CPF/CNPJ:</strong> {data.cpf_cnpj}</p>
          <p><strong>Tipo:</strong> {data.tipo}</p>
          <p><strong>Data de Nascimento:</strong> {formatDate(data.data_nascimento)}</p>
          <p><strong>Status:</strong> {getStatusBadge(data.ativo ? 'ativo' : 'inativo')}</p>
        </div>
        <div className="col-md-6">
          <h6>📞 Contato</h6>
          <p><strong>Telefone:</strong> {data.telefone || 'N/A'}</p>
          <p><strong>WhatsApp:</strong> {data.whatsapp || 'N/A'}</p>
          <p><strong>Email:</strong> {data.email || 'N/A'}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-12">
          <h6>📍 Endereço</h6>
          <p><strong>Endereço:</strong> {data.endereco || 'N/A'}</p>
          <p><strong>Cidade:</strong> {data.cidade || 'N/A'}</p>
          <p><strong>Estado:</strong> {data.estado || 'N/A'}</p>
          <p><strong>CEP:</strong> {data.cep || 'N/A'}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-12">
          <h6>📝 Observações</h6>
          <p>{data.observacoes || 'Nenhuma observação registrada.'}</p>
        </div>
      </div>
      
      {/* Histórico de Compras e Vendas */}
      <div className="row mb-3">
        <div className="col-md-12">
          <h6>🛒 Histórico de Compras e Vendas</h6>
          {data.historico_vendas && data.historico_vendas.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Motocicleta</th>
                    <th>Valor</th>
                    <th>Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.historico_vendas.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{formatDate(item.data_transacao)}</td>
                      <td>
                        <Badge bg={item.tipo === 'compra' ? 'success' : 'primary'}>
                          {item.tipo === 'compra' ? 'Compra' : 'Venda'}
                        </Badge>
                      </td>
                      <td>{item.moto?.marca} {item.moto?.modelo} {item.moto?.ano}</td>
                      <td>{formatCurrency(item.valor_transacao)}</td>
                      <td>{item.vendedor?.user?.first_name} {item.vendedor?.user?.last_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">Nenhum histórico de compras ou vendas registrado.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderVendaDetails = () => (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>🏍️ Motocicleta</h6>
          <p><strong>Marca/Modelo:</strong> {data.moto?.marca} {data.moto?.modelo}</p>
          <p><strong>Ano:</strong> {data.moto?.ano}</p>
          <p><strong>Chassi:</strong> {data.moto?.chassi}</p>
          <p><strong>Placa:</strong> {data.moto?.placa || 'N/A'}</p>
        </div>
        <div className="col-md-6">
          <h6>👤 Comprador</h6>
          <p><strong>Nome:</strong> {data.comprador?.nome}</p>
          <p><strong>CPF/CNPJ:</strong> {data.comprador?.cpf_cnpj}</p>
          <p><strong>Telefone:</strong> {data.comprador?.telefone || 'N/A'}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>💰 Valores</h6>
          <p><strong>Valor de Venda:</strong> {formatCurrency(data.valor_venda)}</p>
          <p><strong>Valor de Entrada:</strong> {formatCurrency(data.valor_entrada)}</p>
          <p><strong>Comissão Vendedor:</strong> {formatCurrency(data.comissao_vendedor)}</p>
        </div>
        <div className="col-md-6">
          <h6>📊 Dados da Venda</h6>
          <p><strong>Status:</strong> {getStatusBadge(data.status)}</p>
          <p><strong>Origem:</strong> {data.origem}</p>
          <p><strong>Forma de Pagamento:</strong> {data.forma_pagamento}</p>
          <p><strong>Vendedor:</strong> {data.vendedor?.user?.first_name} {data.vendedor?.user?.last_name}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>📅 Datas</h6>
          <p><strong>Data de Atendimento:</strong> {formatDate(data.data_atendimento)}</p>
          <p><strong>Data de Venda:</strong> {formatDate(data.data_venda)}</p>
        </div>
        <div className="col-md-6">
          <h6>📝 Observações</h6>
          <p>{data.observacoes || 'Nenhuma observação registrada.'}</p>
        </div>
      </div>
    </div>
  );

  const renderOcorrenciaDetails = () => (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>🚨 Dados da Ocorrência</h6>
          <p><strong>Título:</strong> {data.titulo}</p>
          <p><strong>Tipo:</strong> {data.tipo}</p>
          <p><strong>Prioridade:</strong> {data.prioridade}</p>
          <p><strong>Status:</strong> {getStatusBadge(data.status)}</p>
        </div>
        <div className="col-md-6">
          <h6>👥 Responsáveis</h6>
          <p><strong>Solicitante:</strong> {data.solicitante?.user?.first_name} {data.solicitante?.user?.last_name}</p>
          <p><strong>Responsável:</strong> {data.responsavel?.user?.first_name} {data.responsavel?.user?.last_name}</p>
          <p><strong>Loja:</strong> {data.loja?.nome}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-12">
          <h6>📝 Descrição</h6>
          <p>{data.descricao}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>📅 Datas</h6>
          <p><strong>Data de Criação:</strong> {formatDateTime(data.data_criacao)}</p>
          <p><strong>Data de Conclusão:</strong> {formatDateTime(data.data_conclusao)}</p>
        </div>
        <div className="col-md-6">
          <h6>📝 Observações</h6>
          <p>{data.observacoes || 'Nenhuma observação registrada.'}</p>
        </div>
      </div>
    </div>
  );

  const renderUsuarioDetails = () => (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>👤 Informações do Usuário</h6>
          <p><strong>Nome:</strong> {data.user?.first_name} {data.user?.last_name}</p>
          <p><strong>Username:</strong> {data.user?.username}</p>
          <p><strong>Email:</strong> {data.user?.email}</p>
          <p><strong>Status:</strong> {getStatusBadge(data.status)}</p>
        </div>
        <div className="col-md-6">
          <h6>🏢 Dados Profissionais</h6>
          <p><strong>Loja:</strong> {data.loja?.nome}</p>
          <p><strong>Perfil:</strong> {data.perfil?.nome}</p>
          <p><strong>Telefone:</strong> {data.telefone || 'N/A'}</p>
          <p><strong>Data de Cadastro:</strong> {formatDate(data.data_cadastro)}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>📅 Último Acesso</h6>
          <p><strong>Data:</strong> {formatDateTime(data.ultimo_acesso)}</p>
        </div>
        <div className="col-md-6">
          <h6>🔐 Configurações</h6>
          <p><strong>Precisa Trocar Senha:</strong> {data.precisa_trocar_senha ? 'Sim' : 'Não'}</p>
          <p><strong>Ativo:</strong> {data.user?.is_active ? 'Sim' : 'Não'}</p>
        </div>
      </div>
    </div>
  );

  const renderLojaDetails = () => (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>🏢 Informações da Loja</h6>
          <p><strong>Nome:</strong> {data.nome}</p>
          <p><strong>CNPJ:</strong> {data.cnpj}</p>
          <p><strong>Status:</strong> {getStatusBadge(data.ativo ? 'ativo' : 'inativo')}</p>
        </div>
        <div className="col-md-6">
          <h6>📞 Contato</h6>
          <p><strong>Telefone:</strong> {data.telefone || 'N/A'}</p>
          <p><strong>Email:</strong> {data.email || 'N/A'}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-12">
          <h6>📍 Endereço</h6>
          <p><strong>Endereço:</strong> {data.endereco || 'N/A'}</p>
          <p><strong>Cidade:</strong> {data.cidade || 'N/A'}</p>
          <p><strong>Estado:</strong> {data.estado || 'N/A'}</p>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <h6>📅 Data de Cadastro</h6>
          <p><strong>Data:</strong> {formatDate(data.data_cadastro)}</p>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (children) {
      return children;
    }
    
    if (!type || !data) {
      return <p>Detalhes não disponíveis para este tipo.</p>;
    }
    
    switch (type) {
      case 'motocicleta':
        return renderMotocicletaDetails();
      case 'cliente':
        return renderClienteDetails();
      case 'venda':
        return renderVendaDetails();
      case 'ocorrencia':
        return renderOcorrenciaDetails();
      case 'usuario':
        return renderUsuarioDetails();
      case 'loja':
        return renderLojaDetails();
      default:
        return <p>Detalhes não disponíveis para este tipo.</p>;
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size={size as any}>
        <Modal.Header closeButton>
          <Modal.Title>
            👁️ {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {data ? renderDetails() : <p>Carregando detalhes...</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* PhotoViewer Modal */}
      {data?.fotos && data.fotos.length > 0 && (
        <PhotoViewer
          show={showPhotoViewer}
          onHide={() => setShowPhotoViewer(false)}
          photos={data.fotos}
          currentIndex={currentPhotoIndex}
          title={`Fotos da ${data.marca} ${data.modelo}`}
        />
      )}
    </>
  );
};

export default DetailModal;
