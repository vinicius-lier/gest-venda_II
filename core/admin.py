from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import (
    Loja, Perfil, Permissao, Usuario, LogAcesso,
    Cliente, Motocicleta, HistoricoProprietario,
    Venda, Consignacao, Seguradora, PlanoSeguro, Bem,
    CotacaoSeguro, Seguro, Repasse, AssinaturaDigital, 
    Ocorrencia, ComentarioOcorrencia, MenuUsuario, MenuPerfil
)

# ============================================================================
# ADMINISTRAÇÃO DO SISTEMA RBAC
# ============================================================================

@admin.register(Loja)
class LojaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cidade', 'cnpj', 'telefone', 'ativo']
    list_filter = ['ativo', 'cidade']
    search_fields = ['nome', 'cnpj', 'cidade']
    ordering = ['nome']

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ['nome', 'descricao']
    search_fields = ['nome']
    ordering = ['nome']

@admin.register(Permissao)
class PermissaoAdmin(admin.ModelAdmin):
    list_display = ['perfil', 'modulo', 'acao']
    list_filter = ['perfil', 'modulo', 'acao']
    search_fields = ['perfil__nome', 'modulo', 'acao']
    ordering = ['perfil', 'modulo']

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['user', 'loja', 'perfil', 'status', 'data_cadastro', 'ultimo_acesso']
    list_filter = ['status', 'perfil', 'loja', 'data_cadastro']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'loja__nome']
    ordering = ['user__first_name']
    readonly_fields = ['data_cadastro', 'ultimo_acesso']
    
    fieldsets = (
        ('Informações do Usuário', {
            'fields': ('user', 'loja', 'perfil', 'status')
        }),
        ('Datas', {
            'fields': ('data_cadastro', 'ultimo_acesso'),
            'classes': ('collapse',)
        }),
    )

@admin.register(LogAcesso)
class LogAcessoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'tipo', 'modulo', 'data_hora', 'ip_address']
    list_filter = ['tipo', 'modulo', 'data_hora']
    search_fields = ['usuario__user__username', 'descricao', 'ip_address']
    ordering = ['-data_hora']
    readonly_fields = ['data_hora']
    
    def has_add_permission(self, request):
        return False  # Logs são criados automaticamente

# ============================================================================
# ADMINISTRAÇÃO DE CLIENTES
# ============================================================================

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cpf_cnpj', 'tipo', 'telefone', 'cidade', 'ativo']
    list_filter = ['tipo', 'ativo', 'data_cadastro', 'cidade']
    search_fields = ['nome', 'cpf_cnpj', 'telefone', 'email']
    ordering = ['nome']
    readonly_fields = ['data_cadastro']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('nome', 'cpf_cnpj', 'rg', 'tipo')
        }),
        ('Contatos', {
            'fields': ('telefone', 'email', 'endereco', 'cidade', 'estado', 'cep')
        }),
        ('Metadados', {
            'fields': ('ativo', 'data_cadastro', 'observacoes'),
            'classes': ('collapse',)
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE MOTOCICLETAS
# ============================================================================

@admin.register(Motocicleta)
class MotocicletaAdmin(admin.ModelAdmin):
    list_display = ['marca', 'modelo', 'ano', 'placa', 'chassi', 'status', 'valor_atual']
    list_filter = ['status', 'tipo_entrada', 'origem', 'marca', 'ano']
    search_fields = ['marca', 'modelo', 'placa', 'chassi', 'matricula']
    ordering = ['marca', 'modelo']
    readonly_fields = ['matricula']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('chassi', 'placa', 'renavam', 'matricula')
        }),
        ('Características', {
            'fields': ('marca', 'modelo', 'ano', 'cor', 'cilindrada')
        }),
        ('Classificação', {
            'fields': ('tipo_entrada', 'origem', 'status')
        }),
        ('Relacionamentos', {
            'fields': ('proprietario', 'fornecedor', 'loja_origem')
        }),
        ('Valores', {
            'fields': ('valor_entrada', 'valor_atual')
        }),
        ('Datas', {
            'fields': ('data_entrada', 'data_venda')
        }),
        ('Fotos', {
            'fields': ('foto_principal', 'foto_frontal', 'foto_traseira', 'foto_lado_esquerdo', 'foto_lado_direito'),
            'classes': ('collapse',)
        }),
        ('Metadados', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )

@admin.register(HistoricoProprietario)
class HistoricoProprietarioAdmin(admin.ModelAdmin):
    list_display = ['moto', 'proprietario', 'motivo', 'data_inicio', 'data_fim', 'valor_transacao']
    list_filter = ['motivo', 'data_inicio', 'data_fim']
    search_fields = ['moto__marca', 'moto__modelo', 'proprietario__nome']
    ordering = ['-data_inicio']
    readonly_fields = ['data_inicio']

# ============================================================================
# ADMINISTRAÇÃO DE VENDAS
# ============================================================================

@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    list_display = ['comprador', 'moto', 'vendedor', 'loja', 'status', 'valor_venda', 'data_venda']
    list_filter = ['status', 'origem', 'forma_pagamento', 'data_venda', 'loja']
    search_fields = ['comprador__nome', 'moto__marca', 'moto__modelo', 'vendedor__user__username']
    ordering = ['-data_venda']
    
    fieldsets = (
        ('Relacionamentos', {
            'fields': ('moto', 'comprador', 'vendedor', 'loja')
        }),
        ('Dados da Venda', {
            'fields': ('origem', 'forma_pagamento', 'status')
        }),
        ('Valores', {
            'fields': ('valor_venda', 'valor_entrada', 'comissao_vendedor')
        }),
        ('Datas', {
            'fields': ('data_atendimento', 'data_venda')
        }),
        ('Metadados', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE CONSIGNAÇÕES
# ============================================================================

@admin.register(Consignacao)
class ConsignacaoAdmin(admin.ModelAdmin):
    list_display = ['moto', 'consignante', 'vendedor_responsavel', 'status', 'valor_pretendido', 'valor_venda']
    list_filter = ['status', 'data_entrada', 'data_limite', 'loja']
    search_fields = ['moto__marca', 'moto__modelo', 'consignante__nome']
    ordering = ['-data_entrada']
    
    fieldsets = (
        ('Relacionamentos', {
            'fields': ('moto', 'consignante', 'vendedor_responsavel', 'loja')
        }),
        ('Dados da Consignação', {
            'fields': ('valor_pretendido', 'valor_minimo', 'comissao_percentual')
        }),
        ('Datas', {
            'fields': ('data_entrada', 'data_limite', 'data_venda')
        }),
        ('Status e Valores', {
            'fields': ('status', 'valor_venda')
        }),
        ('Metadados', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['valor_comissao', 'valor_proprietario']

# ============================================================================
# ADMINISTRAÇÃO DE SEGUROS
# ============================================================================

@admin.register(CotacaoSeguro)
class CotacaoSeguroAdmin(admin.ModelAdmin):
    list_display = ['cliente', 'consultor', 'valor_cotacao', 'status', 'data_cotacao']
    list_filter = ['status', 'data_cotacao', 'loja']
    search_fields = ['cliente__nome', 'moto__marca', 'moto__modelo']
    ordering = ['-data_cotacao']
    readonly_fields = ['data_cotacao']

@admin.register(Seguro)
class SeguroAdmin(admin.ModelAdmin):
    list_display = ['cliente', 'apolice', 'valor_seguro', 'data_venda']
    list_filter = ['data_venda', 'data_inicio', 'data_fim', 'loja']
    search_fields = ['cliente__nome', 'apolice']
    ordering = ['-data_venda']
    readonly_fields = ['data_venda']
    
    fieldsets = (
        ('Relacionamentos', {
            'fields': ('cliente', 'bem', 'plano', 'cotacao', 'vendedor', 'loja')
        }),
        ('Dados do Seguro', {
            'fields': ('apolice', 'valor_seguro', 'comissao_percentual', 'status')
        }),
        ('Datas', {
            'fields': ('data_inicio', 'data_fim', 'data_venda')
        }),
        ('Metadados', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE REPASSES
# ============================================================================

@admin.register(Repasse)
class RepasseAdmin(admin.ModelAdmin):
    list_display = ['moto', 'loja_origem', 'loja_destino', 'responsavel', 'status', 'valor_repasse']
    list_filter = ['status', 'data_solicitacao', 'loja_origem', 'loja_destino']
    search_fields = ['moto__marca', 'moto__modelo', 'loja_origem__nome', 'loja_destino__nome']
    ordering = ['-data_solicitacao']
    readonly_fields = ['data_solicitacao']
    
    fieldsets = (
        ('Relacionamentos', {
            'fields': ('moto', 'loja_origem', 'loja_destino', 'responsavel')
        }),
        ('Dados do Repasse', {
            'fields': ('valor_repasse', 'status')
        }),
        ('Datas', {
            'fields': ('data_solicitacao', 'data_aprovacao', 'data_realizacao')
        }),
        ('Metadados', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE ASSINATURAS DIGITAIS
# ============================================================================

@admin.register(AssinaturaDigital)
class AssinaturaDigitalAdmin(admin.ModelAdmin):
    list_display = ['nome_assinante', 'tipo', 'data_criacao', 'ip_address']
    list_filter = ['tipo', 'data_criacao']
    search_fields = ['nome_assinante', 'cpf_assinante']
    ordering = ['-data_criacao']
    readonly_fields = ['data_criacao']
    
    def has_add_permission(self, request):
        return False  # Assinaturas são criadas automaticamente

# ============================================================================
# ADMINISTRAÇÃO DE SEGURADORAS
# ============================================================================

@admin.register(Seguradora)
class SeguradoraAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cnpj', 'telefone', 'email', 'ativo']
    list_filter = ['ativo', 'data_cadastro']
    search_fields = ['nome', 'cnpj', 'telefone', 'email']
    ordering = ['nome']
    readonly_fields = ['data_cadastro']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('nome', 'cnpj')
        }),
        ('Contatos', {
            'fields': ('telefone', 'email', 'site')
        }),
        ('Status', {
            'fields': ('ativo', 'data_cadastro')
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE PLANOS DE SEGURO
# ============================================================================

@admin.register(PlanoSeguro)
class PlanoSeguroAdmin(admin.ModelAdmin):
    list_display = ['nome', 'seguradora', 'tipo_bem', 'comissao_padrao', 'ativo']
    list_filter = ['tipo_bem', 'ativo', 'seguradora', 'data_cadastro']
    search_fields = ['nome', 'seguradora__nome', 'descricao']
    ordering = ['seguradora', 'nome']
    readonly_fields = ['data_cadastro']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('nome', 'seguradora', 'tipo_bem')
        }),
        ('Detalhes', {
            'fields': ('descricao', 'comissao_padrao')
        }),
        ('Status', {
            'fields': ('ativo', 'data_cadastro')
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE BENS
# ============================================================================

@admin.register(Bem)
class BemAdmin(admin.ModelAdmin):
    list_display = ['descricao', 'tipo', 'proprietario', 'valor_atual', 'data_cadastro']
    list_filter = ['tipo', 'data_cadastro']
    search_fields = ['descricao', 'proprietario__nome', 'marca', 'modelo', 'placa', 'chassi']
    ordering = ['tipo', 'descricao']
    readonly_fields = ['data_cadastro']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('tipo', 'descricao', 'proprietario')
        }),
        ('Para Veículos', {
            'fields': ('marca', 'modelo', 'ano', 'placa', 'chassi', 'renavam'),
            'classes': ('collapse',)
        }),
        ('Para Imóveis', {
            'fields': ('endereco', 'area'),
            'classes': ('collapse',)
        }),
        ('Valores', {
            'fields': ('valor_atual',)
        }),
        ('Metadados', {
            'fields': ('observacoes', 'data_cadastro'),
            'classes': ('collapse',)
        }),
    )

# ============================================================================
# ADMINISTRAÇÃO DE USUÁRIOS DO DJANGO
# ============================================================================

# ============================================================================
# CONFIGURAÇÃO DO SITE ADMIN
# ============================================================================

admin.site.site_header = "Gestão Operacional de Vendas"
admin.site.site_title = "Admin - Gestão de Vendas"
admin.site.index_title = "Painel de Administração"

# Agrupa os modelos no admin
admin.site.unregister(User)

class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active', 'groups']
    search_fields = ['username', 'first_name', 'last_name', 'email']

admin.site.register(User, CustomUserAdmin)

@admin.register(Ocorrencia)
class OcorrenciaAdmin(admin.ModelAdmin):
    list_display = ['id', 'titulo', 'loja', 'tipo', 'prioridade', 'status', 'solicitante', 'data_abertura', 'dias_aberta']
    list_filter = ['tipo', 'prioridade', 'status', 'loja', 'data_abertura']
    search_fields = ['titulo', 'descricao', 'loja__nome', 'solicitante__user__first_name', 'solicitante__user__last_name']
    readonly_fields = ['data_abertura', 'dias_aberta']
    date_hierarchy = 'data_abertura'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('titulo', 'descricao', 'tipo', 'prioridade', 'status')
        }),
        ('Relacionamentos', {
            'fields': ('loja', 'solicitante', 'responsavel')
        }),
        ('Datas', {
            'fields': ('data_abertura', 'data_limite', 'data_resolucao', 'data_fechamento')
        }),
        ('Detalhes', {
            'fields': ('observacoes', 'solucao', 'arquivos_anexos')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('loja', 'solicitante__user', 'responsavel__user')

@admin.register(ComentarioOcorrencia)
class ComentarioOcorrenciaAdmin(admin.ModelAdmin):
    list_display = ['id', 'ocorrencia', 'autor', 'data_criacao', 'privado']
    list_filter = ['privado', 'data_criacao', 'ocorrencia__loja']
    search_fields = ['conteudo', 'autor__user__first_name', 'autor__user__last_name', 'ocorrencia__titulo']
    readonly_fields = ['data_criacao']
    date_hierarchy = 'data_criacao'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('ocorrencia', 'autor__user')

@admin.register(MenuUsuario)
class MenuUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'modulo', 'ativo']
    list_filter = ['ativo', 'modulo']
    search_fields = ['usuario__user__username', 'usuario__user__first_name', 'modulo']
    list_editable = ['ativo']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('usuario__user')

@admin.register(MenuPerfil)
class MenuPerfilAdmin(admin.ModelAdmin):
    list_display = ['perfil', 'modulo', 'ativo']
    list_filter = ['ativo', 'modulo', 'perfil']
    search_fields = ['perfil__nome', 'modulo']
    list_editable = ['ativo'] 