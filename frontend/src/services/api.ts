import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  Usuario, 
  Loja, 
  Cliente, 
  Motocicleta, 
  Venda, 
  Consignacao, 
  Seguradora, 
  PlanoSeguro, 
  Bem, 
  Seguro, 
  Ocorrencia, 
  Notificacao, 
  DocumentoMotocicleta, 
  ControleChave,
  ControleChaveForm,
  LoginForm,
  VendaForm,
  ClienteForm,
  MotocicletaForm,
  ApiResponse,
  PaginatedResponse,
  FiltroVenda,
  FiltroCliente,
  FiltroMotocicleta,
  ApiError,
  LojaForm,
  Contrato,
  GerarContratoRequest,
  AtualizarStatusContratoRequest
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://127.0.0.1:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token adicionado ao header:', config.headers.Authorization);
      }
      return config;
    });

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Autenticação
  async login(credentials: LoginForm): Promise<ApiResponse<{ token: string; user: User }>> {
    console.log('🔍 API Service - Fazendo requisição para:', this.api.defaults.baseURL + '/auth/simple-login/');
    console.log('🔍 API Service - Credenciais:', credentials);
    
    try {
      const response = await this.api.post('/auth/simple-login/', credentials);
      console.log('🔍 API Service - Resposta recebida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Service - Erro na requisição:', error);
      const apiError = error as ApiError;
      console.error('❌ API Service - Detalhes do erro:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        config: apiError.config
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout/');
    localStorage.removeItem('token');
  }

  async getCurrentUser(): Promise<ApiResponse<Usuario>> {
    const response = await this.api.get('/auth/user/');
    return response.data;
  }

  // Usuários
  async getUsuarios(): Promise<PaginatedResponse<Usuario>> {
    const response = await this.api.get('/usuarios/');
    if (response.data.success && response.data.data) {
      return {
        results: response.data.data,
        count: response.data.data.length,
        next: null,
        previous: null
      };
    }
    return response.data;
  }

  async getUsuario(id: number): Promise<ApiResponse<Usuario>> {
    const response = await this.api.get(`/usuarios/${id}/`);
    return response.data;
  }

  async createUsuario(data: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    const response = await this.api.post('/usuarios/create/', data);
    return response.data;
  }

  async updateUsuario(id: number, data: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    const response = await this.api.put(`/usuarios/${id}/update/`, data);
    return response.data;
  }

  async deleteUsuario(id: number): Promise<void> {
    await this.api.delete(`/usuarios/${id}/delete/`);
  }

  // Lojas
  async getLojas(): Promise<PaginatedResponse<Loja>> {
    const response = await this.api.get('/lojas/');
    
    // A API retorna {success: true, data: [...]} mas o frontend espera {results: [...]}
    if (response.data.success && response.data.data) {
      return {
        results: response.data.data,
        count: response.data.data.length,
        next: null,
        previous: null
      };
    }
    
    // Fallback para estrutura padrão
    return response.data;
  }

  async getLoja(id: number): Promise<ApiResponse<Loja>> {
    const response = await this.api.get(`/lojas/${id}/`);
    return response.data;
  }

  async createLoja(data: LojaForm): Promise<ApiResponse<Loja>> {
    const response = await this.api.post('/lojas/create/', data);
    return response.data;
  }

  async updateLoja(id: number, data: Partial<LojaForm>): Promise<ApiResponse<Loja>> {
    const response = await this.api.put(`/lojas/${id}/update/`, data);
    return response.data;
  }

  async deleteLoja(id: number): Promise<void> {
    await this.api.delete(`/lojas/${id}/delete/`);
  }

  // Clientes
  async getClientes(filtros?: FiltroCliente): Promise<PaginatedResponse<Cliente>> {
    const response = await this.api.get('/clientes/', { params: filtros });
    
    // A API retorna {success: true, data: [...]} mas o frontend espera {results: [...]}
    if (response.data.success && response.data.data) {
      return {
        results: response.data.data,
        count: response.data.data.length,
        next: null,
        previous: null
      };
    }
    
    // Fallback para estrutura padrão
    return response.data;
  }

  async getCliente(id: number): Promise<ApiResponse<Cliente>> {
    const response = await this.api.get(`/clientes/${id}/`);
    return response.data;
  }

  async createCliente(data: ClienteForm): Promise<ApiResponse<Cliente>> {
    const response = await this.api.post('/clientes/create/', data);
    return response.data;
  }

  async updateCliente(id: number, data: Partial<ClienteForm>): Promise<ApiResponse<Cliente>> {
    const response = await this.api.put(`/clientes/${id}/update/`, data);
    return response.data;
  }

  async deleteCliente(id: number): Promise<void> {
    await this.api.delete(`/clientes/${id}/delete/`);
  }

  // Motocicletas
  async getMotocicletas(filtros?: FiltroMotocicleta): Promise<PaginatedResponse<Motocicleta>> {
    const response = await this.api.get('/motocicletas/', { params: filtros });
    
    // A API retorna {success: true, data: [...]} mas o frontend espera {results: [...]}
    if (response.data.success && response.data.data) {
      return {
        results: response.data.data,
        count: response.data.data.length,
        next: null,
        previous: null
      };
    }
    
    // Fallback para estrutura padrão
    return response.data;
  }

  async getMotocicleta(id: number): Promise<ApiResponse<Motocicleta>> {
    const response = await this.api.get(`/motocicletas/${id}/`);
    return response.data;
  }

  async createMotocicleta(data: MotocicletaForm): Promise<ApiResponse<Motocicleta>> {
    const response = await this.api.post('/motocicletas/create/', data);
    return response.data;
  }

  async updateMotocicleta(id: number, data: Partial<MotocicletaForm>): Promise<ApiResponse<Motocicleta>> {
    console.log('🔍 API Service - Atualizando motocicleta ID:', id);
    console.log('🔍 API Service - Dados sendo enviados:', data);
    console.log('🔍 API Service - URL:', `${this.api.defaults.baseURL}/motocicletas/${id}/update/`);
    
    try {
      const response = await this.api.put(`/motocicletas/${id}/update/`, data);
      console.log('🔍 API Service - Resposta de atualização:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Service - Erro na atualização:', error);
      const apiError = error as ApiError;
      console.error('❌ API Service - Detalhes do erro de atualização:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        config: apiError.config
      });
      throw error;
    }
  }

  async deleteMotocicleta(id: number): Promise<void> {
    await this.api.delete(`/motocicletas/${id}/delete/`);
  }

  // Upload de fotos de motocicletas (sistema unificado)
  async uploadFotosMotocicleta(id: number, fotos: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    fotos.forEach((foto, index) => {
      formData.append('fotos', foto);
    });
    
    const response = await this.api.post(`/motocicletas/${id}/upload-fotos/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async setFotoPrincipalMotocicleta(id: number, fotoIndex: number): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/motocicletas/${id}/set-foto-principal/`, {
      foto_index: fotoIndex
    });
    return response.data;
  }

  async deleteFotoMotocicleta(id: number, fotoIndex: number): Promise<void> {
    await this.api.delete(`/motocicletas/${id}/delete-foto/`, {
      data: { foto_index: fotoIndex }
    });
  }

  // Vendas
  async getVendas(filtros?: FiltroVenda): Promise<PaginatedResponse<Venda>> {
    const response = await this.api.get('/vendas/', { params: filtros });
    
    // A API retorna {success: true, data: [...]} mas o frontend espera {results: [...]}
    if (response.data.success && response.data.data) {
      return {
        results: response.data.data,
        count: response.data.data.length,
        next: null,
        previous: null
      };
    }
    
    // Fallback para estrutura padrão
    return response.data;
  }

  async getVenda(id: number): Promise<ApiResponse<Venda>> {
    const response = await this.api.get(`/vendas/${id}/`);
    return response.data;
  }

  async createVenda(data: VendaForm): Promise<ApiResponse<Venda>> {
    const response = await this.api.post('/vendas/create/', data);
    return response.data;
  }

  async updateVenda(id: number, data: Partial<VendaForm>): Promise<ApiResponse<Venda>> {
    const response = await this.api.put(`/vendas/${id}/update/`, data);
    return response.data;
  }

  async deleteVenda(id: number): Promise<void> {
    await this.api.delete(`/vendas/${id}/delete/`);
  }

  // Consignações
  async getConsignacoes(): Promise<PaginatedResponse<Consignacao>> {
    const response = await this.api.get('/consignacoes/');
    return response.data;
  }

  async getConsignacao(id: number): Promise<ApiResponse<Consignacao>> {
    const response = await this.api.get(`/consignacoes/${id}/`);
    return response.data;
  }

  async createConsignacao(data: Partial<Consignacao>): Promise<ApiResponse<Consignacao>> {
    const response = await this.api.post('/consignacoes/', data);
    return response.data;
  }

  async updateConsignacao(id: number, data: Partial<Consignacao>): Promise<ApiResponse<Consignacao>> {
    const response = await this.api.put(`/consignacoes/${id}/`, data);
    return response.data;
  }

  async deleteConsignacao(id: number): Promise<void> {
    await this.api.delete(`/consignacoes/${id}/`);
  }

  // Seguradoras
  async getSeguradoras(): Promise<PaginatedResponse<Seguradora>> {
    const response = await this.api.get('/seguradoras/');
    return response.data;
  }

  async getSeguradora(id: number): Promise<ApiResponse<Seguradora>> {
    const response = await this.api.get(`/seguradoras/${id}/`);
    return response.data;
  }

  // Planos de Seguro
  async getPlanosSeguro(): Promise<PaginatedResponse<PlanoSeguro>> {
    const response = await this.api.get('/planos-seguro/');
    return response.data;
  }

  async getPlanoSeguro(id: number): Promise<ApiResponse<PlanoSeguro>> {
    const response = await this.api.get(`/planos-seguro/${id}/`);
    return response.data;
  }

  // Bens
  async getBens(): Promise<PaginatedResponse<Bem>> {
    const response = await this.api.get('/bens/');
    return response.data;
  }

  async getBem(id: number): Promise<ApiResponse<Bem>> {
    const response = await this.api.get(`/bens/${id}/`);
    return response.data;
  }

  // Seguros
  async getSeguros(): Promise<PaginatedResponse<Seguro>> {
    const response = await this.api.get('/seguros/');
    return response.data;
  }

  async getSeguro(id: number): Promise<ApiResponse<Seguro>> {
    const response = await this.api.get(`/seguros/${id}/`);
    return response.data;
  }

  async createSeguro(data: Partial<Seguro>): Promise<ApiResponse<Seguro>> {
    const response = await this.api.post('/seguros/', data);
    return response.data;
  }

  async updateSeguro(id: number, data: Partial<Seguro>): Promise<ApiResponse<Seguro>> {
    const response = await this.api.put(`/seguros/${id}/`, data);
    return response.data;
  }

  async deleteSeguro(id: number): Promise<void> {
    await this.api.delete(`/seguros/${id}/`);
  }

  // Ocorrências
  async getOcorrencias(): Promise<PaginatedResponse<Ocorrencia>> {
    const response = await this.api.get('/ocorrencias/');
    return response.data;
  }

  async getOcorrencia(id: number): Promise<ApiResponse<Ocorrencia>> {
    const response = await this.api.get(`/ocorrencias/${id}/`);
    return response.data;
  }

  async createOcorrencia(data: Partial<Ocorrencia>): Promise<ApiResponse<Ocorrencia>> {
    const response = await this.api.post('/ocorrencias/', data);
    return response.data;
  }

  async updateOcorrencia(id: number, data: Partial<Ocorrencia>): Promise<ApiResponse<Ocorrencia>> {
    const response = await this.api.put(`/ocorrencias/${id}/`, data);
    return response.data;
  }

  async deleteOcorrencia(id: number): Promise<void> {
    await this.api.delete(`/ocorrencias/${id}/`);
  }

  // Notificações
  async getNotificacoes(): Promise<PaginatedResponse<Notificacao>> {
    const response = await this.api.get('/notificacoes/');
    return response.data;
  }

  async getNotificacao(id: number): Promise<ApiResponse<Notificacao>> {
    const response = await this.api.get(`/notificacoes/${id}/`);
    return response.data;
  }

  async marcarNotificacaoComoLida(id: number): Promise<void> {
    await this.api.post(`/notificacoes/${id}/marcar-lida/`);
  }

  // Documentos de Motocicleta
  async getDocumentosMotocicleta(): Promise<PaginatedResponse<DocumentoMotocicleta>> {
    const response = await this.api.get('/documentos-motocicleta/');
    return response.data;
  }

  async getDocumentoMotocicleta(id: number): Promise<ApiResponse<DocumentoMotocicleta>> {
    const response = await this.api.get(`/documentos-motocicleta/${id}/`);
    return response.data;
  }

  async createDocumentoMotocicleta(data: FormData): Promise<ApiResponse<DocumentoMotocicleta>> {
    const response = await this.api.post('/documentos-motocicleta/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteDocumentoMotocicleta(id: number): Promise<void> {
    await this.api.delete(`/documentos-motocicleta/${id}/`);
  }

  // Controle de Chaves
  async getControleChaves(): Promise<PaginatedResponse<ControleChave>> {
    const response = await this.api.get('/controle-chaves/');
    return response.data;
  }

  async getControleChave(id: number): Promise<ApiResponse<ControleChave>> {
    const response = await this.api.get(`/controle-chaves/${id}/`);
    return response.data;
  }

  async createControleChave(data: ControleChaveForm): Promise<ApiResponse<ControleChave>> {
    const response = await this.api.post('/controle-chaves/', data);
    return response.data;
  }

  async updateControleChave(id: number, data: Partial<ControleChaveForm>): Promise<ApiResponse<ControleChave>> {
    const response = await this.api.put(`/controle-chaves/${id}/`, data);
    return response.data;
  }

  async deleteControleChave(id: number): Promise<void> {
    await this.api.delete(`/controle-chaves/${id}/`);
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/dashboard/stats/');
    return response.data;
  }

  // Relatórios
  async getRelatorioVendas(dataInicio: string, dataFim: string): Promise<ApiResponse<any>> {
    const response = await this.api.get('/relatorios/vendas/', {
      params: { data_inicio: dataInicio, data_fim: dataFim }
    });
    return response.data;
  }

  async getRelatorioEstoque(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/relatorios/estoque/');
    return response.data;
  }

  async getRelatorioFinanceiro(dataInicio: string, dataFim: string): Promise<ApiResponse<any>> {
    const response = await this.api.get('/relatorios/financeiro/', {
      params: { data_inicio: dataInicio, data_fim: dataFim }
    });
    return response.data;
  }

  // Permissões de Módulo
  async getPermissoesModulo(usuarioId: number): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/usuarios/${usuarioId}/permissoes-modulo/`);
    return response.data;
  }

  async updatePermissaoModulo(permissaoId: number, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/permissoes-modulo/${permissaoId}/`, data);
    return response.data;
  }

  // Permissões de Item
  async getPermissoesItem(usuarioId: number, modulo: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/usuarios/${usuarioId}/permissoes-item/`, {
      params: { modulo }
    });
    return response.data;
  }

  async updatePermissaoItem(permissaoId: number, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/permissoes-item/${permissaoId}/`, data);
    return response.data;
  }

  // Métodos genéricos para compatibilidade
  async get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }

  // Métodos para Contratos
  async getContratos(): Promise<ApiResponse<{ contratos: Contrato[] }>> {
    const response = await this.api.get('/contratos/');
    return response.data;
  }

  async visualizarContratoHtml(id: number): Promise<ApiResponse<{ html: string }>> {
    const response = await this.api.get(`/contratos/${id}/html/`);
    return response.data;
  }

  async baixarContratoPdf(id: number): Promise<Blob> {
    const response = await this.api.get(`/contratos/${id}/pdf/`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async atualizarStatusContrato(id: number, data: AtualizarStatusContratoRequest): Promise<ApiResponse<Contrato>> {
    const response = await this.api.put(`/contratos/${id}/status/`, data);
    return response.data;
  }

  async cancelarContrato(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/contratos/${id}/cancelar/`);
    return response.data;
  }

  async gerarContrato(data: GerarContratoRequest): Promise<ApiResponse<Contrato>> {
    const response = await this.api.post('/contratos/gerar/', data);
    return response.data;
  }
}

export const api = new ApiService();
export default api;

// Serviços para Contratos
export const contratosApi = {
  // Listar todos os contratos
  listar: async (): Promise<ApiResponse<Contrato[]>> => {
    const response = await api.get('/contratos/');
    return response.data;
  },

  // Buscar contrato por ID
  buscar: async (id: number): Promise<ApiResponse<Contrato>> => {
    const response = await api.get(`/contratos/${id}/`);
    return response.data;
  },

  // Gerar contrato automaticamente
  gerar: async (data: GerarContratoRequest): Promise<ApiResponse<Contrato>> => {
    const response = await api.post('/contratos/gerar/', data);
    return response.data;
  },

  // Visualizar HTML do contrato
  visualizarHtml: async (id: number): Promise<ApiResponse<{ html: string }>> => {
    const response = await api.get(`/contratos/${id}/html/`);
    return response.data;
  },

  // Baixar PDF do contrato
  baixarPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/contratos/${id}/pdf/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Atualizar status do contrato
  atualizarStatus: async (id: number, data: AtualizarStatusContratoRequest): Promise<ApiResponse<Contrato>> => {
    const response = await api.put(`/contratos/${id}/status/`, data);
    return response.data;
  },

  // Cancelar contrato
  cancelar: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/contratos/${id}/cancelar/`);
    return response.data;
  }
};
