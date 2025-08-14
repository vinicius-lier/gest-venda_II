// Tipos baseados nos modelos Django

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

export interface Usuario {
  id: number;
  user: User;
  loja: Loja | null;
  perfil: Perfil | null;
  telefone: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  data_cadastro: string;
  ultimo_acesso: string | null;
  precisa_trocar_senha: boolean;
  foto: string | null;
  matricula: string;
  tem_usuario_sistema: boolean;
}

export interface Loja {
  id: number;
  nome: string;
  cnpj: string;
  cidade: string;
  endereco: string;
  telefone: string;
  email: string;
  ativo: boolean;
  data_cadastro: string;
}

export interface LojaForm {
  nome: string;
  cnpj: string;
  cidade: string;
  endereco: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

export interface Perfil {
  id: number;
  nome: 'admin' | 'gerente' | 'vendedor' | 'consultor' | 'financeiro' | 'ti';
  descricao: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string;
  rg: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  tipo: 'comprador' | 'fornecedor' | 'consignado' | 'proprietario' | 'ambos';
  matricula: string;
  data_cadastro: string;
  observacoes: string;
  ativo: boolean;
}

export interface Motocicleta {
  id: number;
  chassi: string;
  placa: string;
  renavam: string;
  marca: string;
  modelo: string;
  ano: string;
  ano_fabricacao: string;
  cor: string;
  cilindrada: string;
  rodagem: number;
  tipo_entrada: '0km' | 'usada' | 'consignada';
  origem: 'cliente' | 'loja_parceira' | 'fornecedor_externo';
  status: 'estoque' | 'vendida' | 'repasse' | 'reservada' | 'manutencao' | 'pendencia' | 'bloqueada';
  proprietario: Cliente;
  fornecedor: Cliente;
  loja_origem: Loja;
  valor_entrada: number;
  valor_atual: number;
  data_entrada: string;
  data_venda: string;
  observacoes: string;
  matricula: string;
  ativo: boolean;
  // Campos antigos de fotos (compatibilidade)
  foto_principal: string;
  foto_frontal: string;
  foto_traseira: string;
  foto_lado_esquerdo: string;
  foto_lado_direito: string;
  // Novos campos de fotos
  fotos: string[];
  foto_principal_index: number;
}

export interface Venda {
  id: number;
  numero_venda: string;
  moto: Motocicleta;
  comprador: Cliente;
  vendedor: Usuario;
  loja: Loja;
  origem: 'presencial' | 'telefone' | 'whatsapp' | 'instagram' | 'facebook' | 'indicacao' | 'site' | 'outros';
  forma_pagamento: 'a_vista' | 'financiamento' | 'consorcio' | 'cartao_credito' | 'outros';
  status: 'pendente' | 'em_negociacao' | 'vendido' | 'cancelado';
  valor_venda: number;
  valor_entrada: number;
  comissao_vendedor: number;
  data_atendimento: string;
  data_venda: string;
  observacoes: string;
  comunicacao_intencao_enviada: boolean;
  comunicacao_pagamento_enviada: boolean;
  comunicacao_documentacao_enviada: boolean;
  comunicacao_entrega_enviada: boolean;
}

export interface Consignacao {
  id: number;
  moto: Motocicleta;
  consignante: Cliente;
  vendedor_responsavel: Usuario;
  loja: Loja;
  valor_pretendido: number;
  valor_minimo: number;
  comissao_percentual: number;
  data_entrada: string;
  data_limite: string;
  data_venda: string;
  status: 'disponivel' | 'vendido' | 'devolvido' | 'cancelado';
  valor_venda: number;
  observacoes: string;
}

export interface Seguradora {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string;
  ativo: boolean;
  data_cadastro: string;
}

export interface PlanoSeguro {
  id: number;
  seguradora: Seguradora;
  nome: string;
  tipo_bem: 'motocicleta' | 'automovel' | 'caminhao' | 'casa' | 'apartamento' | 'empresa' | 'vida' | 'saude' | 'outros';
  descricao: string;
  comissao_padrao: number;
  ativo: boolean;
  data_cadastro: string;
}

export interface Bem {
  id: number;
  tipo: 'motocicleta' | 'automovel' | 'caminhao' | 'casa' | 'apartamento' | 'empresa' | 'vida' | 'saude' | 'outros';
  descricao: string;
  proprietario: Cliente;
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
  chassi: string;
  renavam: string;
  endereco: string;
  area: number;
  valor_atual: number;
  observacoes: string;
  data_cadastro: string;
}

export interface Seguro {
  id: number;
  cliente: Cliente;
  bem: Bem;
  plano: PlanoSeguro;
  cotacao: number;
  vendedor: Usuario;
  loja: Loja;
  apolice: string;
  valor_seguro: number;
  comissao_percentual: number;
  status: 'ativo' | 'cancelado' | 'suspenso' | 'vencido';
  data_inicio: string;
  data_fim: string;
  data_venda: string;
  observacoes: string;
}

export interface Ocorrencia {
  id: number;
  titulo: string;
  descricao: string;
  tipo: 'incidente' | 'problema_tecnico' | 'solicitacao' | 'reclamacao' | 'sugestao' | 'manutencao' | 'seguranca' | 'outros';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberta' | 'em_analise' | 'em_andamento' | 'resolvida' | 'fechada' | 'cancelada';
  loja: Loja;
  solicitante: Usuario;
  responsavel: Usuario;
  data_abertura: string;
  data_limite: string;
  data_resolucao: string;
  data_fechamento: string;
  observacoes: string;
  solucao: string;
  arquivos_anexos: string;
}

export interface Notificacao {
  id: number;
  usuario: Usuario;
  mensagem: string;
  link: string;
  tipo: 'venda' | 'ocorrencia' | 'documento' | 'menção' | 'venda_pendente' | 'outros';
  lida: boolean;
  data_criacao: string;
}

export interface DocumentoMotocicleta {
  id: number;
  moto: Motocicleta;
  venda: Venda;
  tipo: 'compra' | 'venda' | 'consignacao' | 'ficha_cliente' | 'recibo' | 'seguro' | 'financiamento' | 'intencao_venda' | 'outro';
  arquivo: string;
  observacao: string;
  data_upload: string;
}

export interface ControleChave {
  id: number;
  funcionario: User;
  motocicleta: Motocicleta;
  data_saida: string;
  data_retorno: string;
  funcionario_entrega: User;
  funcionario_devolucao: User;
  status: 'aberto' | 'devolvida' | 'atraso';
}

export interface ControleChaveForm {
  funcionario: number;
  motocicleta: number;
  data_saida: string;
  data_retorno?: string;
  funcionario_entrega?: number;
  funcionario_devolucao?: number;
  status?: 'aberto' | 'devolvida' | 'atraso';
  observacoes?: string;
}

// Tipos para formulários
export interface LoginForm {
  username: string;
  password: string;
}

export interface VendaForm {
  moto: number;
  comprador: number;
  vendedor: number;
  loja: number;
  origem: string;
  forma_pagamento: string;
  valor_venda: number;
  valor_entrada: number;
  comissao_vendedor: number;
  data_atendimento: string;
  data_venda: string;
  observacoes: string;
}

export interface ClienteForm {
  nome: string;
  cpf_cnpj: string;
  rg: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  tipo: string;
  observacoes: string;
  ativo: boolean;
}

export interface MotocicletaForm {
  marca: string;
  modelo: string;
  ano: string;
  ano_fabricacao: string;
  cor: string;
  cilindrada: string;
  rodagem: number;
  chassi: string;
  placa: string;
  renavam: string;
  tipo_entrada: string;
  origem: string;
  status: string;
  proprietario: number;
  fornecedor: number;
  loja_origem: number;
  valor_entrada: number;
  valor_atual: number;
  data_entrada: string;
  data_venda: string;
  observacoes: string;
  matricula: string;
  ativo: boolean;
  fotos: string[];
  foto_principal_index: number;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Tipos para filtros
export interface FiltroVenda {
  status?: string;
  vendedor?: number;
  loja?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface FiltroCliente {
  tipo?: string;
  ativo?: boolean;
  search?: string;
}

export interface FiltroMotocicleta {
  status?: string;
  marca?: string;
  proprietario?: number;
  search?: string;
}

// Tipos para tratamento de erros
export interface ApiError {
  message: string;
  response?: {
    data?: any;
    status?: number;
  };
  config?: any;
}

export interface AxiosErrorResponse {
  message: string;
  response?: {
    data?: any;
    status?: number;
  };
  config?: any;
}

// Tipos para Contratos
export interface Contrato {
  id: number;
  numero_contrato: string;
  tipo: '0km' | 'seminova' | 'consignacao';
  tipo_display: string;
  status: 'gerado' | 'assinado' | 'cancelado';
  status_display: string;
  venda: number;
  motocicleta: number;
  comprador: number;
  vendedor: number;
  loja: number;
  valor_contrato: number;
  valor_entrada?: number;
  forma_pagamento?: string;
  data_geracao: string;
  data_assinatura?: string;
  data_vencimento?: string;
  arquivo_pdf?: string;
  arquivo_html?: string;
  observacoes?: string;
  ativo: boolean;
  motocicleta_info?: {
    id: number;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    placa?: string;
    chassi: string;
    quilometragem?: number;
  };
  comprador_info?: {
    id: number;
    nome: string;
    cpf_cnpj: string;
    telefone: string;
    email?: string;
  };
  vendedor_info?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  loja_info?: {
    id: number;
    nome: string;
    cnpj: string;
    endereco: string;
    cidade: string;
    estado: string;
  };
  venda_info?: {
    id: number;
    numero_venda: string;
    valor_venda: number;
    data_venda?: string;
    status: string;
  };
}

export interface GerarContratoRequest {
  venda_id: number;
  tipo?: '0km' | 'seminova' | 'consignacao' | 'auto';
}

export interface AtualizarStatusContratoRequest {
  status: 'gerado' | 'assinado' | 'cancelado';
}
