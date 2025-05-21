from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.

class Perfil(models.Model):
    TIPO_CHOICES = [
        ('master', 'Master'),
        ('gerente', 'Gerente'),
        ('vendedor', 'Vendedor'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    
    def __str__(self):
        return f"{self.usuario.username} - {self.tipo}"

class Venda(models.Model):
    ORIGEM_CHOICES = [
        ('LOJA', 'LOJA'),
        ('VENDEDOR', 'VENDEDOR'),
        ('CHATBOT', 'CHATBOT'),
        ('COCKPIT', 'COCKPIT'),
        ('INSTAGRAM', 'INSTAGRAM'),
        ('MONTEIRO', 'MONTEIRO'),
    ]
    FORMA_PAGAMENTO_CHOICES = [
        ('A VISTA', 'A VISTA'),
        ('A VISTA COM TROCA', 'A VISTA COM TROCA'),
        ('FINANCIAMENTO', 'FINANCIAMENTO'),
        ('FINANCIAMENTO COM TROCA', 'FINANCIAMENTO COM TROCA'),
        ('SEM INFORMAÇÃO', 'SEM INFORMAÇÃO'),
    ]
    STATUS_CHOICES = [
        ('VENDIDO', 'VENDIDO'),
        ('EM NEGOCIAÇÃO', 'EM NEGOCIAÇÃO'),
        ('RECUSA DE CRÉDITO', 'RECUSA DE CRÉDITO'),
        ('NEGOCIAÇÃO ENCERRADA', 'NEGOCIAÇÃO ENCERRADA'),
    ]

    # Relacionamento com Cliente
    cliente = models.ForeignKey('Cliente', on_delete=models.CASCADE, related_name='vendas', blank=True, null=True)
    # Mantendo o campo nome_cliente para compatibilidade
    nome_cliente = models.CharField(max_length=100, blank=True, null=True)
    contato = models.CharField(max_length=100, blank=True, null=True)
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES, blank=True, null=True)
    
    # Campos de Proprietário e Fornecedor
    proprietario = models.ForeignKey('Cliente', on_delete=models.CASCADE, related_name='vendas_como_proprietario', null=True, blank=True)
    fornecedor = models.ForeignKey('Cliente', on_delete=models.CASCADE, related_name='vendas_como_fornecedor', blank=True, null=True)
    
    # Relacionamento com moto
    moto = models.ForeignKey('EstoqueMoto', on_delete=models.SET_NULL, related_name='vendas', blank=True, null=True)
    # Mantendo o campo modelo_interesse para compatibilidade
    modelo_interesse = models.CharField(max_length=100, blank=True, null=True)
    
    forma_pagamento = models.CharField(max_length=30, choices=FORMA_PAGAMENTO_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    data_atendimento = models.DateField(blank=True, null=True)
    data_venda = models.DateField(blank=True, null=True)
    valor_venda = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    vendedor = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='vendas_realizadas')
    is_consignacao = False  # Campo virtual, não armazenado no banco

    def __str__(self):
        cliente_nome = self.cliente.nome if self.cliente else self.nome_cliente
        moto_info = self.moto.modelo if self.moto else self.modelo_interesse
        return f"{cliente_nome} - {moto_info} ({self.data_atendimento})"
    
    def save(self, *args, **kwargs):
        # Se a venda foi concluída, atualiza o status da moto
        if self.status == 'VENDIDO' and self.moto:
            self.moto.status = 'VENDIDO'
            self.moto.save()
        
        # Se o cliente está associado, sincroniza com nome_cliente
        if self.cliente and not self.nome_cliente:
            self.nome_cliente = self.cliente.nome
            
        # Salva primeiro para garantir que o objeto tenha um ID
        super().save(*args, **kwargs)
        
        # Se a venda é realizada, adiciona o proprietário ao histórico da moto
        if self.status == 'VENDIDO' and self.moto and self.proprietario:
            # Verifica se já existe um registro para esta moto/proprietário
            if not HistoricoProprietario.objects.filter(
                moto=self.moto, 
                proprietario=self.proprietario,
                motivo='COMPRA'
            ).exists():
                # Fecha registros anteriores
                registros_anteriores = HistoricoProprietario.objects.filter(
                    moto=self.moto, 
                    data_fim__isnull=True
                )
                for registro in registros_anteriores:
                    registro.data_fim = self.data_venda or timezone.now().date()
                    registro.save()
                
                # Cria novo registro
                HistoricoProprietario.objects.create(
                    moto=self.moto,
                    proprietario=self.proprietario,
                    motivo='COMPRA',
                    data_inicio=self.data_venda or timezone.now().date()
                )
                
                # Atualiza o proprietário na moto
                self.moto.proprietario = self.proprietario
                self.moto.save(update_fields=['proprietario'])

class Consignacao(models.Model):
    STATUS_CHOICES = [
        ('DISPONÍVEL', 'DISPONÍVEL'),
        ('VENDIDO', 'VENDIDO'),
        ('DEVOLVIDO', 'DEVOLVIDO'),
        ('CANCELADO', 'CANCELADO'),
    ]
    
    # Relacionamento com cliente (proprietário)
    proprietario = models.ForeignKey('Cliente', on_delete=models.CASCADE, related_name='consignacoes', null=True)
    
    # Dados do proprietário - mantidos para compatibilidade
    nome_proprietario = models.CharField(max_length=100)
    cpf_proprietario = models.CharField(max_length=14, blank=True, null=True)
    rg_proprietario = models.CharField(max_length=20, blank=True, null=True)
    endereco_proprietario = models.CharField(max_length=200, blank=True, null=True)
    contato_proprietario = models.CharField(max_length=100)
    
    # Relacionamento com moto
    moto = models.OneToOneField('EstoqueMoto', on_delete=models.CASCADE, null=True, blank=True, related_name='consignacao')
    
    # Dados do veículo (mantidos para compatibilidade)
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=100)
    ano = models.CharField(max_length=4)
    cor = models.CharField(max_length=50)
    placa = models.CharField(max_length=8)
    renavam = models.CharField(max_length=11, blank=True, null=True)
    chassi = models.CharField(max_length=17, blank=True, null=True)
    
    # Dados da consignação
    valor_consignacao = models.DecimalField(max_digits=10, decimal_places=2)
    valor_minimo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    comissao_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    data_entrada = models.DateField(default=timezone.now)
    data_limite = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DISPONÍVEL')
    observacoes = models.TextField(blank=True, null=True)
    
    # Relacionamentos
    vendedor_responsavel = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consignacoes_responsavel')
    
    # Relacionamento com comprador (quando for vendido)
    comprador = models.ForeignKey('Cliente', on_delete=models.SET_NULL, related_name='compras_consignacao', null=True, blank=True)
    
    # Campos para quando for vendido
    data_venda = models.DateField(blank=True, null=True)
    valor_venda = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    nome_comprador = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Consignação'
        verbose_name_plural = 'Consignações'
    
    def __str__(self):
        return f"{self.modelo} - {self.placa} ({self.nome_proprietario})"
    
    def save(self, *args, **kwargs):
        # Sincroniza dados do proprietário se estiver associado
        if self.proprietario:
            self.nome_proprietario = self.proprietario.nome
            self.cpf_proprietario = self.proprietario.cpf
            self.rg_proprietario = self.proprietario.rg
            self.endereco_proprietario = self.proprietario.endereco
            self.contato_proprietario = self.proprietario.telefone
            
        # Sincroniza dados do comprador se estiver associado
        if self.comprador and not self.nome_comprador:
            self.nome_comprador = self.comprador.nome
            
        # Sincroniza dados da moto se estiver associada
        if self.moto:
            self.marca = self.moto.marca
            self.modelo = self.moto.modelo
            self.ano = self.moto.ano
            self.cor = self.moto.cor
            self.placa = self.moto.placa or ""
            self.renavam = self.moto.renavam
            self.chassi = self.moto.chassi
            
        super().save(*args, **kwargs)
        
    @property
    def valor_comissao(self):
        if self.valor_venda:
            return (self.valor_venda * self.comissao_percentual) / 100
        return 0
        
    @property
    def valor_proprietario(self):
        if self.valor_venda:
            return self.valor_venda - self.valor_comissao
        return 0

class AssinaturaDigital(models.Model):
    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name='assinaturas', null=True, blank=True)
    consignacao = models.ForeignKey(Consignacao, on_delete=models.CASCADE, null=True, blank=True, related_name='assinaturas')
    data_criacao = models.DateTimeField(auto_now_add=True)
    imagem_assinatura = models.TextField()  # Armazena a assinatura em formato base64
    tipo = models.CharField(max_length=20, choices=[
        ('cliente', 'Assinatura do Cliente'),
        ('vendedor', 'Assinatura do Vendedor'),
    ])
    
    class Meta:
        verbose_name = 'Assinatura Digital'
        verbose_name_plural = 'Assinaturas Digitais'
        
    def __str__(self):
        if self.venda:
            return f"Assinatura {self.tipo} - Venda {self.venda.id}"
        return f"Assinatura {self.tipo} - Consignação {self.consignacao.id}"


class EstoqueMoto(models.Model):
    CATEGORIA_CHOICES = [
        ('SEMI NOVA', 'SEMI NOVA'),
        ('0 KM', '0 KM'),
        ('CONSIGNACAO', 'CONSIGNACAO'),
    ]
    
    matricula = models.CharField(max_length=10, blank=True, null=True, verbose_name="Matrícula", help_text="Código para identificação no chaveiro", unique=True)
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=100)
    ano = models.CharField(max_length=4)
    cor = models.CharField(max_length=50)
    placa = models.CharField(max_length=8, blank=True, null=True)
    chassi = models.CharField(max_length=17, blank=True, null=True, unique=True)
    renavam = models.CharField(max_length=11, blank=True, null=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='SEMI NOVA')
    status = models.CharField(max_length=20, default='DISPONIVEL', 
                             choices=[
                                 ('DISPONIVEL', 'DISPONIVEL'),
                                 ('VENDIDO', 'VENDIDO'),
                                 ('RESERVADO', 'RESERVADO'),
                                 ('MANUTENCAO', 'MANUTENCAO')
                             ])
    data_entrada = models.DateField(default=timezone.now)
    observacoes = models.TextField(blank=True, null=True)
    
    # Campo para fotos da moto
    foto_principal = models.ImageField(upload_to='motos/', blank=True, null=True, verbose_name="Foto Principal")
    foto_frontal = models.ImageField(upload_to='motos/', blank=True, null=True, verbose_name="Foto Frontal")
    foto_traseira = models.ImageField(upload_to='motos/', blank=True, null=True, verbose_name="Foto Traseira")
    foto_lado_esquerdo = models.ImageField(upload_to='motos/', blank=True, null=True, verbose_name="Foto Lado Esquerdo")
    foto_lado_direito = models.ImageField(upload_to='motos/', blank=True, null=True, verbose_name="Foto Lado Direito")
    
    # Adiciona relação com proprietário atual para motos em consignação
    proprietario = models.ForeignKey('Cliente', on_delete=models.SET_NULL, blank=True, null=True, related_name='motos_propriedade')
    
    # Histórico de proprietários
    historico_proprietarios = models.ManyToManyField('Cliente', through='HistoricoProprietario', related_name='historico_motos')
    
    class Meta:
        verbose_name = 'Estoque de Moto'
        verbose_name_plural = 'Estoque de Motos'
    
    def __str__(self):
        return f"{self.modelo} - {self.placa or self.chassi}"
    
    def get_ultimo_proprietario(self):
        """Retorna o último proprietário da moto"""
        ultimo = self.historico.order_by('-data_inicio').first()
        return ultimo.proprietario if ultimo else None
    
    def save(self, *args, **kwargs):
        # Se não tem matrícula, gera uma nova
        if not self.matricula:
            # Verifica se a moto já esteve no estoque antes (pelo chassi)
            if self.chassi:
                moto_anterior = EstoqueMoto.objects.filter(chassi=self.chassi, status='VENDIDO').order_by('-id').first()
                if moto_anterior and moto_anterior.matricula:
                    # Reutiliza a matrícula anterior
                    self.matricula = moto_anterior.matricula
                    return super().save(*args, **kwargs)
            
            # Gera uma nova matrícula no formato "M0001", "M0002", etc.
            ultimas_matriculas = EstoqueMoto.objects.all().order_by('-matricula')
            if ultimas_matriculas.exists() and ultimas_matriculas[0].matricula:
                try:
                    ultimo_numero = int(ultimas_matriculas[0].matricula[1:])
                    nova_matricula = f"M{ultimo_numero+1:04d}"
                except (ValueError, IndexError):
                    # Se não conseguir extrair o número, começa do 1
                    nova_matricula = "M0001"
            else:
                nova_matricula = "M0001"
            
            self.matricula = nova_matricula
        
        super().save(*args, **kwargs)

class Cliente(models.Model):
    TIPO_CHOICES = [
        ('CLIENTE', 'Cliente'),
        ('PROPRIETARIO', 'Proprietário'), 
        ('FORNECEDOR', 'Fornecedor'),
        ('AMBOS', 'Cliente e Fornecedor'),
    ]
    
    nome = models.CharField(max_length=100)
    cpf = models.CharField(max_length=14, blank=True, null=True)
    rg = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=200, blank=True, null=True)
    telefone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    data_cadastro = models.DateField(default=timezone.now)
    observacoes = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='CLIENTE')
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"

    def get_compras(self):
        """Retorna todas as compras feitas pelo cliente"""
        return self.vendas.all()

    def get_motos(self):
        """Retorna todas as motos compradas pelo cliente"""
        return EstoqueMoto.objects.filter(venda__cliente=self)
    
    def get_motos_como_proprietario(self):
        """Retorna todas as motos em que o cliente é proprietário"""
        return self.motos_propriedade.all()
    
    def get_vendas_como_fornecedor(self):
        """Retorna todas as vendas em que o cliente é fornecedor"""
        return self.vendas_como_fornecedor.all()

class HistoricoProprietario(models.Model):
    """Modelo para manter histórico de proprietários de uma moto"""
    moto = models.ForeignKey(EstoqueMoto, on_delete=models.CASCADE, related_name='historico')
    proprietario = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    data_inicio = models.DateField(default=timezone.now)
    data_fim = models.DateField(blank=True, null=True)
    motivo = models.CharField(max_length=20, choices=[
        ('COMPRA', 'Compra'),
        ('VENDA', 'Venda'),
        ('CONSIGNACAO', 'Consignação'),
        ('TROCA', 'Troca'),
    ])
    
    def __str__(self):
        return f"{self.moto.modelo} - {self.proprietario.nome} ({self.data_inicio})"
