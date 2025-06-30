from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from django.core.exceptions import ValidationError
import uuid
from django.db.models import JSONField

# ============================================================================
# 1. CONTROLE DE USUÁRIOS (RBAC - Role Based Access Control)
# ============================================================================

class Loja(models.Model):
    """Modelo para lojas parceiras"""
    nome = models.CharField(max_length=100)
    cnpj = models.CharField(max_length=18, unique=True)
    cidade = models.CharField(max_length=100)
    endereco = models.CharField(max_length=200)
    telefone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Loja'
        verbose_name_plural = 'Lojas'
    
    def __str__(self):
        return f"{self.nome} - {self.cidade}"

class Perfil(models.Model):
    """Perfis de usuário do sistema"""
    PERFIL_CHOICES = [
        ('admin', 'Administrador'),
        ('gerente', 'Gerente'),
        ('vendedor', 'Vendedor'),
        ('consultor', 'Consultor'),
        ('financeiro', 'Financeiro'),
        ('ti', 'TI'),
    ]
    
    nome = models.CharField(max_length=50, choices=PERFIL_CHOICES, unique=True)
    descricao = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Perfil'
        verbose_name_plural = 'Perfis'
    
    def __str__(self):
        return self.get_nome_display()

class Permissao(models.Model):
    """Permissões por módulo e ação"""
    MODULO_CHOICES = [
        ('usuarios', 'Usuários'),
        ('clientes', 'Clientes'),
        ('motos', 'Motocicletas'),
        ('vendas', 'Vendas'),
        ('consignacoes', 'Consignações'),
        ('seguros', 'Seguros'),
        ('lojas', 'Lojas Parceiras'),
        ('relatorios', 'Relatórios'),
        ('financeiro', 'Financeiro'),
    ]
    
    ACAO_CHOICES = [
        ('criar', 'Criar'),
        ('visualizar', 'Visualizar'),
        ('editar', 'Editar'),
        ('excluir', 'Excluir'),
        ('listar', 'Listar'),
    ]
    
    modulo = models.CharField(max_length=20, choices=MODULO_CHOICES)
    acao = models.CharField(max_length=20, choices=ACAO_CHOICES)
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='permissoes')
    
    class Meta:
        verbose_name = 'Permissão'
        verbose_name_plural = 'Permissões'
        unique_together = ['modulo', 'acao', 'perfil']
    
    def __str__(self):
        return f"{self.get_modulo_display()} - {self.get_acao_display()}"

class Usuario(models.Model):
    """Usuários do sistema com controle de acesso"""
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
        ('bloqueado', 'Bloqueado'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usuario_sistema')
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='usuarios')
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='usuarios')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')
    data_cadastro = models.DateTimeField(auto_now_add=True)
    ultimo_acesso = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.loja.nome}"
    
    def get_status_color(self):
        """Retorna a cor CSS para o status do usuário"""
        colors = {
            'ativo': 'success',
            'inativo': 'secondary',
            'bloqueado': 'danger',
        }
        return colors.get(self.status, 'secondary')
    
    def tem_permissao(self, modulo, acao):
        """Verifica se o usuário tem permissão para uma ação específica"""
        return self.perfil.permissoes.filter(modulo=modulo, acao=acao).exists()

    def save(self, *args, **kwargs):
        # Se é um novo usuário, configurar menus automaticamente
        if not self.pk:  # Novo usuário
            super().save(*args, **kwargs)
            self.configurar_menus_automaticamente()
        else:
            super().save(*args, **kwargs)
    
    def modulo_ativo(self, modulo):
        """Verifica se um módulo está ativo para o usuário"""
        # Primeiro verifica se há configuração específica do usuário
        try:
            menu_usuario = self.menus_usuario.get(modulo=modulo)
            return menu_usuario.ativo
        except MenuUsuario.DoesNotExist:
            # Se não há configuração específica, usa a do perfil
            try:
                menu_perfil = self.perfil.menuperfil_set.get(modulo=modulo)
                return menu_perfil.ativo
            except MenuPerfil.DoesNotExist:
                return False

    def configurar_menus_automaticamente(self):
        """Configura automaticamente os menus baseado no perfil do usuário"""
        # Módulos padrão por perfil
        modulos_por_perfil = {
            'admin': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                'seguros', 'usuarios', 'lojas', 'relatorios', 'ocorrencias',
                'seguradoras', 'bens', 'cotacoes'
            ],
            'gerente': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                'seguros', 'relatorios', 'ocorrencias',
                'seguradoras', 'bens', 'cotacoes'
            ],
            'vendedor': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes',
                'seguradoras', 'bens', 'cotacoes'
            ],
            'consultor': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 'seguros',
                'seguradoras', 'bens', 'cotacoes'
            ],
            'financeiro': [
                'clientes', 'vendas', 'consignacoes', 'seguros', 'relatorios',
                'seguradoras', 'bens', 'cotacoes'
            ],
            'ti': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                'seguros', 'usuarios', 'lojas', 'relatorios', 'ocorrencias',
                'seguradoras', 'bens', 'cotacoes'
            ]
        }
        
        # Obter módulos para o perfil
        modulos = modulos_por_perfil.get(self.perfil.nome, [])
        
        # Criar registros de MenuPerfil
        for modulo in modulos:
            MenuPerfil.objects.get_or_create(
                perfil=self.perfil,
                modulo=modulo,
                defaults={'ativo': True}
            )

class LogAcesso(models.Model):
    """Logs de acesso para rastreamento de ações críticas"""
    TIPO_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('criar', 'Criar'),
        ('editar', 'Editar'),
        ('excluir', 'Excluir'),
        ('visualizar', 'Visualizar'),
        ('relatorio', 'Relatório'),
    ]
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='logs')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    modulo = models.CharField(max_length=50)
    descricao = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    data_hora = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Log de Acesso'
        verbose_name_plural = 'Logs de Acesso'
        ordering = ['-data_hora']
    
    def __str__(self):
        return f"{self.usuario} - {self.tipo} - {self.data_hora}"

# ============================================================================
# 2. CLIENTES
# ============================================================================

class Cliente(models.Model):
    """Modelo unificado para clientes com diferentes tipos"""
    TIPO_CHOICES = [
        ('comprador', 'Comprador'),
        ('fornecedor', 'Fornecedor'),
        ('consignado', 'Consignado'),
        ('proprietario', 'Proprietário'),
        ('ambos', 'Comprador e Fornecedor'),
    ]
    
    # Identificação
    nome = models.CharField(max_length=100)
    cpf_cnpj = models.CharField(max_length=18, unique=True)
    rg = models.CharField(max_length=20, blank=True, null=True)
    
    # Contatos
    telefone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    endereco = models.CharField(max_length=200, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    
    # Classificação
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='comprador')
    
    # Metadados
    data_cadastro = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"
    
    def clean(self):
        pass

    def get_tipo_color(self):
        """Retorna a cor CSS para o tipo do cliente"""
        colors = {
            'comprador': 'primary',
            'fornecedor': 'success',
            'consignado': 'warning',
            'proprietario': 'info',
            'ambos': 'secondary',
        }
        return colors.get(self.tipo, 'secondary')

# ============================================================================
# 3. MOTOCICLETAS
# ============================================================================

class Motocicleta(models.Model):
    """Modelo para motocicletas"""
    TIPO_ENTRADA_CHOICES = [
        ('0km', '0km'),
        ('usada', 'Usada (Entrada)'),
        ('consignada', 'Consignada'),
    ]
    
    ORIGEM_CHOICES = [
        ('cliente', 'Cliente'),
        ('loja_parceira', 'Loja Parceira'),
        ('fornecedor_externo', 'Fornecedor Externo'),
    ]
    
    STATUS_CHOICES = [
        ('estoque', 'Em Estoque'),
        ('vendida', 'Vendida'),
        ('repasse', 'Repasse'),
        ('reservada', 'Reservada'),
        ('manutencao', 'Em Manutenção'),
    ]
    
    # Identificação
    chassi = models.CharField(max_length=17, unique=True)
    placa = models.CharField(max_length=8, blank=True, null=True)
    renavam = models.CharField(max_length=11, blank=True, null=True)
    
    # Características
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=100)
    ano = models.CharField(max_length=4)
    ano_fabricacao = models.CharField(max_length=4, blank=True, null=True, help_text="Ano de fabricação (quando diferente do ano do modelo)")
    cor = models.CharField(max_length=50)
    cilindrada = models.CharField(max_length=20, blank=True, null=True)
    
    # Classificação
    tipo_entrada = models.CharField(max_length=20, choices=TIPO_ENTRADA_CHOICES)
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='estoque')
    
    # Relacionamentos
    proprietario = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='motos_propriedade', blank=True, null=True)
    fornecedor = models.ForeignKey(Cliente, on_delete=models.SET_NULL, related_name='motos_fornecidas', blank=True, null=True)
    loja_origem = models.ForeignKey(Loja, on_delete=models.SET_NULL, related_name='motos_origem', blank=True, null=True)
    
    # Valores
    valor_entrada = models.DecimalField(max_digits=10, decimal_places=2)
    valor_atual = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Datas
    data_entrada = models.DateField(default=timezone.now)
    data_venda = models.DateField(blank=True, null=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    matricula = models.CharField(max_length=10, blank=True, null=True, help_text="Código para identificação no chaveiro")
    ativo = models.BooleanField(default=True)
    
    # Fotos
    foto_principal = models.ImageField(upload_to='motos/', blank=True, null=True)
    foto_frontal = models.ImageField(upload_to='motos/', blank=True, null=True)
    foto_traseira = models.ImageField(upload_to='motos/', blank=True, null=True)
    foto_lado_esquerdo = models.ImageField(upload_to='motos/', blank=True, null=True)
    foto_lado_direito = models.ImageField(upload_to='motos/', blank=True, null=True)
    
    # Novo campo opcional de relacionamento direto entre Motocicleta e Seguro
    seguro = models.OneToOneField('Seguro', on_delete=models.SET_NULL, null=True, blank=True, related_name='motocicleta')
    
    class Meta:
        verbose_name = 'Motocicleta'
        verbose_name_plural = 'Motocicletas'
    
    def __str__(self):
        ano_display = self.ano
        if self.ano_fabricacao and self.ano_fabricacao != self.ano:
            ano_display = f"{self.ano}/{self.ano_fabricacao}"
        return f"{self.marca} {self.modelo} {ano_display} - {self.placa or self.chassi}"
    
    def get_status_color(self):
        """Retorna a cor CSS para o status da motocicleta"""
        colors = {
            'estoque': 'success',
            'vendida': 'danger',
            'repasse': 'warning',
            'reservada': 'info',
            'manutencao': 'secondary',
        }
        return colors.get(self.status, 'secondary')
    
    def save(self, *args, **kwargs):
        # Gera matrícula se não existir
        if not self.matricula:
            self.matricula = f"M{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

class HistoricoProprietario(models.Model):
    """Histórico de proprietários de uma moto"""
    MOTIVO_CHOICES = [
        ('compra', 'Compra'),
        ('venda', 'Venda'),
        ('consignacao', 'Consignação'),
        ('repasse', 'Repasse'),
    ]
    
    moto = models.ForeignKey(Motocicleta, on_delete=models.CASCADE, related_name='historico_proprietarios')
    proprietario = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    data_inicio = models.DateField(default=timezone.now)
    data_fim = models.DateField(blank=True, null=True)
    motivo = models.CharField(max_length=20, choices=MOTIVO_CHOICES)
    valor_transacao = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Histórico de Proprietário'
        verbose_name_plural = 'Históricos de Proprietários'
        ordering = ['-data_inicio']
    
    def __str__(self):
        return f"{self.moto} - {self.proprietario} ({self.data_inicio})"

# ============================================================================
# 4. VENDAS
# ============================================================================

class Venda(models.Model):
    """Modelo para vendas de motocicletas"""
    ORIGEM_CHOICES = [
        ('presencial', 'Presencial'),
        ('telefone', 'Telefone'),
        ('whatsapp', 'WhatsApp'),
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
        ('indicacao', 'Indicação'),
        ('site', 'Site'),
        ('outros', 'Outros'),
    ]
    
    FORMA_PAGAMENTO_CHOICES = [
        ('a_vista', 'À Vista'),
        ('financiamento', 'Financiamento'),
        ('consorcio', 'Consórcio'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('outros', 'Outros'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('em_negociacao', 'Em Negociação'),
        ('vendido', 'Vendido'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Relacionamentos
    moto = models.ForeignKey(Motocicleta, on_delete=models.CASCADE, related_name='vendas')
    comprador = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='compras')
    vendedor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='vendas_realizadas')
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='vendas')
    
    # Dados da venda
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES)
    forma_pagamento = models.CharField(max_length=20, choices=FORMA_PAGAMENTO_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    
    # Valores
    valor_venda = models.DecimalField(max_digits=10, decimal_places=2)
    valor_entrada = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    comissao_vendedor = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Datas
    data_atendimento = models.DateField(default=timezone.now)
    data_venda = models.DateField(blank=True, null=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Venda'
        verbose_name_plural = 'Vendas'
    
    def __str__(self):
        return f"Venda #{self.id} - {self.moto} - {self.comprador.nome}"
    
    def get_status_color(self):
        """Retorna a cor CSS para o status da venda"""
        colors = {
            'pendente': 'info',
            'em_negociacao': 'warning',
            'vendido': 'success',
            'cancelado': 'danger',
        }
        return colors.get(self.status, 'secondary')
    
    def save(self, *args, **kwargs):
        # Se a venda foi concluída, atualiza o status da moto
        if self.status == 'vendido' and self.moto:
            self.moto.status = 'vendida'
            self.moto.data_venda = self.data_venda or timezone.now().date()
            self.moto.save()
            
            # Atualiza o proprietário
            self.moto.proprietario = self.comprador
            self.moto.save()
            
            # Cria histórico de proprietário
            HistoricoProprietario.objects.create(
                moto=self.moto,
                proprietario=self.comprador,
                motivo='compra',
                valor_transacao=self.valor_venda
            )
        
        super().save(*args, **kwargs)

# ============================================================================
# 5. CONSIGNAÇÕES
# ============================================================================

class Consignacao(models.Model):
    """Modelo para consignações"""
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('vendido', 'Vendido'),
        ('devolvido', 'Devolvido'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Relacionamentos
    moto = models.OneToOneField(Motocicleta, on_delete=models.CASCADE, related_name='consignacao')
    consignante = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='consignacoes')
    vendedor_responsavel = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='consignacoes_responsavel')
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='consignacoes')
    
    # Dados da consignação
    valor_pretendido = models.DecimalField(max_digits=10, decimal_places=2)
    valor_minimo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    comissao_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    
    # Datas
    data_entrada = models.DateField(default=timezone.now)
    data_limite = models.DateField()
    data_venda = models.DateField(blank=True, null=True)
    
    # Status e valores
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel')
    valor_venda = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Consignação'
        verbose_name_plural = 'Consignações'
    
    def __str__(self):
        return f"Consignação #{self.id} - {self.moto} - {self.consignante.nome}"
    
    def get_status_color(self):
        """Retorna a cor CSS para o status da consignação"""
        colors = {
            'disponivel': 'primary',
            'vendido': 'success',
            'devolvido': 'warning',
            'cancelado': 'danger',
        }
        return colors.get(self.status, 'secondary')
    
    @property
    def valor_comissao(self):
        """Calcula o valor da comissão"""
        if self.valor_venda and self.comissao_percentual:
            return (self.valor_venda * self.comissao_percentual) / Decimal('100')
        return Decimal('0.00')
    
    @property
    def valor_proprietario(self):
        """Calcula o valor para o proprietário"""
        if self.valor_venda:
            return self.valor_venda - self.valor_comissao
        return Decimal('0.00')
    
    def save(self, *args, **kwargs):
        # Se foi vendida, atualiza o status da moto
        if self.status == 'vendido' and self.moto:
            self.moto.status = 'vendida'
            self.moto.save()
        
        super().save(*args, **kwargs)

# ============================================================================
# 6. SEGUROS
# ============================================================================

class Seguradora(models.Model):
    """Seguradoras parceiras"""
    nome = models.CharField(max_length=100)
    cnpj = models.CharField(max_length=18, unique=True)
    telefone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    site = models.URLField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Seguradora'
        verbose_name_plural = 'Seguradoras'
    
    def __str__(self):
        return self.nome

class PlanoSeguro(models.Model):
    """Planos de seguro disponíveis"""
    TIPO_BEM_CHOICES = [
        ('motocicleta', 'Motocicleta'),
        ('automovel', 'Automóvel'),
        ('caminhao', 'Caminhão'),
        ('casa', 'Casa'),
        ('apartamento', 'Apartamento'),
        ('empresa', 'Empresa'),
        ('vida', 'Vida'),
        ('saude', 'Saúde'),
        ('outros', 'Outros'),
    ]
    
    seguradora = models.ForeignKey(Seguradora, on_delete=models.CASCADE, related_name='planos')
    nome = models.CharField(max_length=100)
    tipo_bem = models.CharField(max_length=20, choices=TIPO_BEM_CHOICES)
    descricao = models.TextField(blank=True, null=True)
    comissao_padrao = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    ativo = models.BooleanField(default=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Plano de Seguro'
        verbose_name_plural = 'Planos de Seguro'
    
    def __str__(self):
        return f"{self.seguradora} - {self.nome} ({self.get_tipo_bem_display()})"

class Bem(models.Model):
    """Bens que podem ser segurados"""
    TIPO_CHOICES = [
        ('motocicleta', 'Motocicleta'),
        ('automovel', 'Automóvel'),
        ('caminhao', 'Caminhão'),
        ('casa', 'Casa'),
        ('apartamento', 'Apartamento'),
        ('empresa', 'Empresa'),
        ('vida', 'Vida'),
        ('saude', 'Saúde'),
        ('outros', 'Outros'),
    ]
    
    # Identificação
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descricao = models.CharField(max_length=200)
    proprietario = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='bens')
    
    # Para veículos
    marca = models.CharField(max_length=50, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    ano = models.CharField(max_length=4, blank=True, null=True)
    placa = models.CharField(max_length=8, blank=True, null=True)
    chassi = models.CharField(max_length=17, blank=True, null=True)
    renavam = models.CharField(max_length=11, blank=True, null=True)
    
    # Para imóveis
    endereco = models.CharField(max_length=200, blank=True, null=True)
    area = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Valores
    valor_atual = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Bem'
        verbose_name_plural = 'Bens'
    
    def __str__(self):
        if self.tipo in ['motocicleta', 'automovel', 'caminhao']:
            return f"{self.marca} {self.modelo} - {self.ano} ({self.placa})"
        elif self.tipo in ['casa', 'apartamento']:
            return f"{self.get_tipo_display()} - {self.endereco}"
        else:
            return f"{self.get_tipo_display()} - {self.descricao}"

class CotacaoSeguro(models.Model):
    """Cotações de seguro"""
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovada', 'Aprovada'),
        ('rejeitada', 'Rejeitada'),
        ('cancelada', 'Cancelada'),
    ]
    
    # Relacionamentos
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='cotacoes_seguro')
    bem = models.ForeignKey(Bem, on_delete=models.CASCADE, null=True, blank=True)
    plano = models.CharField(max_length=100, null=True, blank=True)
    consultor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='cotacoes_realizadas')
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='cotacoes_seguro')
    
    # Dados da cotação
    valor_cotacao = models.DecimalField(max_digits=10, decimal_places=2)
    comissao_percentual = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    
    # Datas
    data_cotacao = models.DateTimeField(auto_now_add=True)
    data_aprovacao = models.DateTimeField(blank=True, null=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Cotação de Seguro'
        verbose_name_plural = 'Cotações de Seguro'
    
    def __str__(self):
        return f"{self.cliente} - {self.bem} ({self.valor_cotacao})"
    
    @property
    def valor_comissao(self):
        """Calcula o valor da comissão"""
        if self.valor_cotacao and self.comissao_percentual:
            return (self.valor_cotacao * Decimal(str(self.comissao_percentual))) / Decimal('100')
        return Decimal('0')

class Seguro(models.Model):
    """Seguros vendidos"""
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('cancelado', 'Cancelado'),
        ('suspenso', 'Suspenso'),
        ('vencido', 'Vencido'),
    ]
    
    # Relacionamentos
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='seguros')
    bem = models.ForeignKey(Bem, on_delete=models.CASCADE, related_name='seguros')
    plano = models.ForeignKey(PlanoSeguro, on_delete=models.CASCADE, related_name='seguros', null=True, blank=True)
    cotacao = models.ForeignKey(CotacaoSeguro, on_delete=models.SET_NULL, related_name='seguros', blank=True, null=True)
    vendedor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='seguros_vendidos')
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='seguros')
    
    # Dados do seguro
    apolice = models.CharField(max_length=50, unique=True)
    valor_seguro = models.DecimalField(max_digits=10, decimal_places=2)
    comissao_percentual = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')
    
    # Datas
    data_inicio = models.DateField()
    data_fim = models.DateField()
    data_venda = models.DateTimeField(auto_now_add=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Seguro'
        verbose_name_plural = 'Seguros'
    
    def __str__(self):
        return f"Seguro {self.apolice} - {self.cliente.nome}"
    
    def get_status_color(self):
        """Retorna a cor CSS para o status do seguro"""
        colors = {
            'ativo': 'success',
            'cancelado': 'danger',
            'suspenso': 'warning',
            'vencido': 'secondary',
        }
        return colors.get(self.status, 'secondary')
    
    @property
    def valor_comissao(self):
        if self.valor_seguro and self.comissao_percentual:
            return (self.valor_seguro * Decimal(str(self.comissao_percentual))) / Decimal('100')
        return Decimal('0')
    
    @property
    def dias_vencimento(self):
        """Calcula quantos dias faltam para vencer"""
        from datetime import date
        hoje = date.today()
        return (self.data_fim - hoje).days

# ============================================================================
# 7. REPASSES
# ============================================================================

class Repasse(models.Model):
    """Repasses de motos para outras lojas"""
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('realizado', 'Realizado'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Relacionamentos
    moto = models.ForeignKey(Motocicleta, on_delete=models.CASCADE, related_name='repasses')
    loja_origem = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='repasses_origem')
    loja_destino = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='repasses_destino')
    responsavel = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='repasses_responsavel')
    
    # Dados do repasse
    valor_repasse = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    
    # Datas
    data_solicitacao = models.DateTimeField(auto_now_add=True)
    data_aprovacao = models.DateTimeField(blank=True, null=True)
    data_realizacao = models.DateTimeField(blank=True, null=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Repasse'
        verbose_name_plural = 'Repasses'
    
    def __str__(self):
        return f"{self.moto} - {self.loja_origem} → {self.loja_destino}"
    
    def save(self, *args, **kwargs):
        # Se foi realizado, atualiza o status da moto
        if self.status == 'realizado' and self.moto:
            self.moto.status = 'repasse'
            self.moto.loja_origem = self.loja_destino
            self.moto.save()
        
        super().save(*args, **kwargs)

# ============================================================================
# 8. ASSINATURAS DIGITAIS
# ============================================================================

class AssinaturaDigital(models.Model):
    """Assinaturas digitais para documentos"""
    TIPO_CHOICES = [
        ('venda', 'Venda'),
        ('consignacao', 'Consignação'),
        ('seguro', 'Seguro'),
        ('repasse', 'Repasse'),
    ]
    
    # Relacionamentos
    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name='assinaturas', blank=True, null=True)
    consignacao = models.ForeignKey(Consignacao, on_delete=models.CASCADE, related_name='assinaturas', blank=True, null=True)
    seguro = models.ForeignKey(Seguro, on_delete=models.CASCADE, related_name='assinaturas', blank=True, null=True)
    repasse = models.ForeignKey(Repasse, on_delete=models.CASCADE, related_name='assinaturas', blank=True, null=True)
    
    # Dados da assinatura
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    imagem_assinatura = models.TextField()  # Base64
    nome_assinante = models.CharField(max_length=100)
    cpf_assinante = models.CharField(max_length=14)
    
    # Metadados
    data_criacao = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Assinatura Digital'
        verbose_name_plural = 'Assinaturas Digitais'
    
    def __str__(self):
        return f"{self.nome_assinante} - {self.get_tipo_display()} ({self.data_criacao})"

# ============================================================================
# 9. OCORRÊNCIAS
# ============================================================================

class Ocorrencia(models.Model):
    """Ocorrências e incidentes nas lojas"""
    TIPO_CHOICES = [
        ('incidente', 'Incidente'),
        ('problema_tecnico', 'Problema Técnico'),
        ('solicitacao', 'Solicitação'),
        ('reclamacao', 'Reclamação'),
        ('sugestao', 'Sugestão'),
        ('manutencao', 'Manutenção'),
        ('seguranca', 'Segurança'),
        ('outros', 'Outros'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]
    
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('em_analise', 'Em Análise'),
        ('em_andamento', 'Em Andamento'),
        ('resolvida', 'Resolvida'),
        ('fechada', 'Fechada'),
        ('cancelada', 'Cancelada'),
    ]
    
    # Identificação
    titulo = models.CharField(max_length=200)
    descricao = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, default='media')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta')
    
    # Relacionamentos
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='ocorrencias')
    solicitante = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ocorrencias_solicitadas')
    responsavel = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ocorrencias_responsavel', blank=True, null=True)
    
    # Datas
    data_abertura = models.DateTimeField(auto_now_add=True)
    data_limite = models.DateTimeField(blank=True, null=True)
    data_resolucao = models.DateTimeField(blank=True, null=True)
    data_fechamento = models.DateTimeField(blank=True, null=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    solucao = models.TextField(blank=True, null=True)
    arquivos_anexos = models.FileField(upload_to='ocorrencias/', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Ocorrência'
        verbose_name_plural = 'Ocorrências'
        ordering = ['-data_abertura']
    
    def __str__(self):
        return f"{self.titulo} - {self.loja.nome} ({self.get_status_display()})"
    
    @property
    def dias_aberta(self):
        """Calcula quantos dias a ocorrência está aberta"""
        from datetime import datetime
        if self.data_fechamento:
            return (self.data_fechamento - self.data_abertura).days
        return (datetime.now() - self.data_abertura.replace(tzinfo=None)).days
    
    @property
    def atrasada(self):
        """Verifica se a ocorrência está atrasada"""
        if self.data_limite and self.status not in ['resolvida', 'fechada']:
            from datetime import datetime
            return datetime.now() > self.data_limite.replace(tzinfo=None)
        return False
    
    def save(self, *args, **kwargs):
        # Atualizar data de resolução quando status mudar para resolvida
        if self.status == 'resolvida' and not self.data_resolucao:
            from django.utils import timezone
            self.data_resolucao = timezone.now()
        
        # Atualizar data de fechamento quando status mudar para fechada
        if self.status == 'fechada' and not self.data_fechamento:
            from django.utils import timezone
            self.data_fechamento = timezone.now()
        
        super().save(*args, **kwargs)

class ComentarioOcorrencia(models.Model):
    """Comentários nas ocorrências"""
    ocorrencia = models.ForeignKey(Ocorrencia, on_delete=models.CASCADE, related_name='comentarios')
    autor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='comentarios_ocorrencias')
    conteudo = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)
    privado = models.BooleanField(default=False, help_text="Comentário visível apenas para administradores")
    
    class Meta:
        verbose_name = 'Comentário de Ocorrência'
        verbose_name_plural = 'Comentários de Ocorrências'
        ordering = ['data_criacao']
    
    def __str__(self):
        return f"Comentário de {self.autor.user.get_full_name()} em {self.ocorrencia.titulo}"

class MenuUsuario(models.Model):
    """Menus específicos por usuário"""
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='menus_usuario')
    modulo = models.CharField(max_length=50)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Menu por Usuário"
        verbose_name_plural = "Menus por Usuário"
        unique_together = ['usuario', 'modulo']

    def __str__(self):
        return f"{self.usuario.user.username} - {self.modulo} ({'Ativo' if self.ativo else 'Inativo'})"

class MenuPerfil(models.Model):
    # Comentário temporário para forçar migração
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    modulo = models.CharField(max_length=50)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Menu por Perfil"
        verbose_name_plural = "Menus por Perfil"

    def __str__(self):
        return f"{self.perfil} - {self.modulo} ({'Ativo' if self.ativo else 'Inativo'})"
