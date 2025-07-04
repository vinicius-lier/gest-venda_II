from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Motocicleta, Venda, Consignacao, Cliente, Loja, Seguradora, PlanoSeguro, Bem, CotacaoSeguro, Seguro, Usuario, Perfil, Ocorrencia, ComentarioOcorrencia, VendaFinanceira, Despesa, ReceitaExtra, Pagamento, ComunicacaoVenda, DocumentoMotocicleta
from django.utils import timezone
from django.db import models

class MotocicletaForm(forms.ModelForm):
    documento_motocicleta = forms.FileField(
        required=False,
        label='Documento da Motocicleta',
        widget=forms.ClearableFileInput(attrs={'class': 'form-control'})
    )
    class Meta:
        model = Motocicleta
        fields = [
            'marca', 'modelo', 'ano', 'ano_fabricacao', 'cor', 'cilindrada', 'rodagem', 'chassi', 'placa', 'renavam',
            'tipo_entrada', 'origem', 'status', 'proprietario', 'fornecedor', 'loja_origem',
            'valor_entrada', 'valor_atual', 'data_entrada', 'observacoes',
            'foto_principal', 'foto_frontal', 'foto_traseira', 'foto_lado_esquerdo', 'foto_lado_direito',
            'data_venda'
        ]
        widgets = {
            'data_entrada': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'proprietario': forms.Select(attrs={'class': 'form-select'}),
            'fornecedor': forms.Select(attrs={'class': 'form-select'}),
            'loja_origem': forms.Select(attrs={'class': 'form-select'}),
            'marca': forms.TextInput(attrs={'class': 'form-control'}),
            'modelo': forms.TextInput(attrs={'class': 'form-control'}),
            'placa': forms.TextInput(attrs={'class': 'form-control'}),
            'chassi': forms.TextInput(attrs={'class': 'form-control'}),
            'ano': forms.TextInput(attrs={'class': 'form-control'}),
            'ano_fabricacao': forms.TextInput(attrs={'class': 'form-control'}),
            'cor': forms.TextInput(attrs={'class': 'form-control'}),
            'renavam': forms.TextInput(attrs={'class': 'form-control'}),
            'cilindrada': forms.TextInput(attrs={'class': 'form-control'}),
            'rodagem': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'placeholder': 'Ex: 15000'}),
            'tipo_entrada': forms.Select(attrs={'class': 'form-select'}),
            'origem': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'valor_entrada': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'valor_atual': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'foto_principal': forms.FileInput(attrs={'class': 'form-control'}),
            'foto_frontal': forms.FileInput(attrs={'class': 'form-control'}),
            'foto_traseira': forms.FileInput(attrs={'class': 'form-control'}),
            'foto_lado_esquerdo': forms.FileInput(attrs={'class': 'form-control'}),
            'foto_lado_direito': forms.FileInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'valor_entrada': 'Custo',
            'valor_atual': 'Valor (valor de venda)',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personalizar as querysets para mostrar nome completo
        
        # Filtrar clientes ativos e ordenar por nome
        clientes_ativos = Cliente.objects.filter(ativo=True).order_by('nome')
        
        # Configurar o campo proprietário para mostrar nome completo
        self.fields['proprietario'].queryset = clientes_ativos
        self.fields['proprietario'].label_from_instance = lambda obj: f"{obj.nome} - {obj.cpf_cnpj}"
        
        # Configurar o campo fornecedor para mostrar nome completo
        self.fields['fornecedor'].queryset = clientes_ativos
        self.fields['fornecedor'].label_from_instance = lambda obj: f"{obj.nome} - {obj.cpf_cnpj}"
        
        # Configurar o campo loja_origem
        self.fields['loja_origem'].queryset = Loja.objects.filter(ativo=True).order_by('nome')
        
        # Definir valores padrão
        if not self.instance.pk:  # Se for criação
            self.fields['data_entrada'].initial = timezone.now().date()
            self.fields['status'].initial = 'estoque'
            self.fields['valor_atual'].initial = 0.00

    def clean(self):
        cleaned_data = super().clean()
        chassi = cleaned_data.get('chassi')
        placa = cleaned_data.get('placa')
        proprietario = cleaned_data.get('proprietario')
        
        # Verificar se chassi já existe
        if chassi:
            existing = Motocicleta.objects.filter(chassi=chassi)
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise forms.ValidationError('Este chassi já está cadastrado no sistema.')
        
        # Verificar se placa já existe (se fornecida)
        if placa:
            existing = Motocicleta.objects.filter(placa=placa)
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise forms.ValidationError('Esta placa já está cadastrada no sistema.')
        
        # Garantir que o proprietário foi selecionado
        if not proprietario:
            raise forms.ValidationError('Selecione um proprietário para a motocicleta.')
        
        return cleaned_data

class VendaForm(forms.ModelForm):
    documento_intencao = forms.FileField(
        required=False,
        label='Documento de Intenção/Comunicação',
        widget=forms.FileInput(attrs={'class': 'form-control'})
    )
    class Meta:
        model = Venda
        fields = '__all__'
        widgets = {
            'data_atendimento': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'data_venda': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'moto': forms.Select(attrs={'class': 'form-select'}),
            'comprador': forms.Select(attrs={'class': 'form-select'}),
            'vendedor': forms.Select(attrs={'class': 'form-select'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'origem': forms.Select(attrs={'class': 'form-select'}),
            'forma_pagamento': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'valor_venda': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'valor_entrada': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'comissao_vendedor': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        instance = kwargs.get('instance', None)
        super().__init__(*args, **kwargs)
        from .models import Motocicleta, Cliente
        # Filtrar motos disponíveis (em estoque)
        motos_disponiveis = Motocicleta.objects.filter(status='estoque').order_by('marca', 'modelo')
        if instance and instance.moto:
            # Garante que a moto da venda está no queryset
            motos_disponiveis = Motocicleta.objects.filter(pk=instance.moto.pk) | motos_disponiveis
        self.fields['moto'].queryset = motos_disponiveis.distinct()
        self.fields['moto'].label_from_instance = lambda obj: f"{obj.marca} {obj.modelo} {obj.ano} - {obj.placa or obj.chassi}"
        # Se vier inicializado, desabilita o campo
        if self.initial.get('moto'):
            self.fields['moto'].widget.attrs['readonly'] = True
            self.fields['moto'].widget.attrs['disabled'] = True
        # Filtrar clientes ativos
        self.fields['comprador'].queryset = Cliente.objects.filter(ativo=True).order_by('nome')
        # Filtrar vendedores ativos - CORRIGIDO: usar objetos Usuario em vez de User
        vendedores_ativos = Usuario.objects.filter(
            status='ativo',
            perfil__nome__in=['vendedor', 'gerente', 'admin']
        ).order_by('user__first_name', 'user__last_name')
        self.fields['vendedor'].queryset = vendedores_ativos
        self.fields['vendedor'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"
        # Filtrar lojas ativas
        lojas_ativas = Loja.objects.filter(ativo=True).order_by('nome')
        self.fields['loja'].queryset = lojas_ativas

class ConsignacaoForm(forms.ModelForm):
    class Meta:
        model = Consignacao
        fields = '__all__'
        widgets = {
            'moto': forms.Select(attrs={'class': 'form-select'}),
            'consignante': forms.Select(attrs={'class': 'form-select'}),
            'vendedor_responsavel': forms.Select(attrs={'class': 'form-select'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'valor_pretendido': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'valor_minimo': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'comissao_percentual': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'data_entrada': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'data_limite': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'data_venda': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from .models import Motocicleta
        # Filtrar motos disponíveis (em estoque ou consignada e sem consignação ativa)
        motos_disponiveis = Motocicleta.objects.filter(
            status__in=['estoque', 'consignada'],
            consignacao__isnull=True
        ).order_by('marca', 'modelo')
        self.fields['moto'].queryset = motos_disponiveis
        self.fields['moto'].label_from_instance = lambda obj: f"{obj.marca} {obj.modelo} {obj.ano} - {obj.placa or obj.chassi}"
        # Se vier inicializado, desabilita o campo
        if self.initial.get('moto'):
            self.fields['moto'].widget.attrs['readonly'] = True
            self.fields['moto'].widget.attrs['disabled'] = True
        # Filtrar clientes ativos
        from .models import Cliente
        self.fields['consignante'].queryset = Cliente.objects.filter(ativo=True).order_by('nome')
        
        # Filtrar vendedores ativos - CORRIGIDO: usar objetos Usuario em vez de User
        vendedores_ativos = Usuario.objects.filter(
            status='ativo',
            perfil__nome__in=['vendedor', 'gerente', 'admin']
        ).order_by('user__first_name', 'user__last_name')
        self.fields['vendedor_responsavel'].queryset = vendedores_ativos
        self.fields['vendedor_responsavel'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"
        
        # Filtrar lojas ativas
        lojas_ativas = Loja.objects.filter(ativo=True).order_by('nome')
        self.fields['loja'].queryset = lojas_ativas

class ClienteForm(forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nome', 'cpf_cnpj', 'rg', 'data_nascimento', 'telefone', 'email', 'endereco', 'cidade', 'estado', 'cep', 'tipo', 'observacoes', 'ativo']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'cpf_cnpj': forms.TextInput(attrs={'class': 'form-control'}),
            'rg': forms.TextInput(attrs={'class': 'form-control'}),
            'data_nascimento': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'telefone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'endereco': forms.TextInput(attrs={'class': 'form-control'}),
            'cidade': forms.TextInput(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={'class': 'form-select'}, choices=[
                ('', 'Selecione um estado'),
                ('AC', 'Acre'),
                ('AL', 'Alagoas'),
                ('AP', 'Amapá'),
                ('AM', 'Amazonas'),
                ('BA', 'Bahia'),
                ('CE', 'Ceará'),
                ('DF', 'Distrito Federal'),
                ('ES', 'Espírito Santo'),
                ('GO', 'Goiás'),
                ('MA', 'Maranhão'),
                ('MT', 'Mato Grosso'),
                ('MS', 'Mato Grosso do Sul'),
                ('MG', 'Minas Gerais'),
                ('PA', 'Pará'),
                ('PB', 'Paraíba'),
                ('PR', 'Paraná'),
                ('PE', 'Pernambuco'),
                ('PI', 'Piauí'),
                ('RJ', 'Rio de Janeiro'),
                ('RN', 'Rio Grande do Norte'),
                ('RS', 'Rio Grande do Sul'),
                ('RO', 'Rondônia'),
                ('RR', 'Roraima'),
                ('SC', 'Santa Catarina'),
                ('SP', 'São Paulo'),
                ('SE', 'Sergipe'),
                ('TO', 'Tocantins'),
            ]),
            'cep': forms.TextInput(attrs={'class': 'form-control'}),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'ativo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

# Formulários de seguro
class SeguradoraForm(forms.ModelForm):
    class Meta:
        model = Seguradora
        fields = ['nome', 'cnpj', 'telefone', 'email', 'site', 'ativo']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'cnpj': forms.TextInput(attrs={'class': 'form-control'}),
            'telefone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'site': forms.URLInput(attrs={'class': 'form-control'}),
            'ativo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

class PlanoSeguroForm(forms.ModelForm):
    class Meta:
        model = PlanoSeguro
        fields = ['seguradora', 'nome', 'tipo_bem', 'descricao', 'comissao_padrao', 'ativo']
        widgets = {
            'seguradora': forms.Select(attrs={'class': 'form-select'}),
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'tipo_bem': forms.Select(attrs={'class': 'form-select'}),
            'descricao': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'comissao_padrao': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
            'ativo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar seguradoras ativas
        self.fields['seguradora'].queryset = Seguradora.objects.filter(ativo=True).order_by('nome')

class BemForm(forms.ModelForm):
    class Meta:
        model = Bem
        fields = [
            'tipo', 'descricao', 'proprietario', 'marca', 'modelo', 'ano', 'placa', 
            'chassi', 'renavam', 'endereco', 'area', 'valor_atual', 'observacoes'
        ]
        widgets = {
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'descricao': forms.TextInput(attrs={'class': 'form-control'}),
            'proprietario': forms.Select(attrs={'class': 'form-select'}),
            'marca': forms.TextInput(attrs={'class': 'form-control'}),
            'modelo': forms.TextInput(attrs={'class': 'form-control'}),
            'ano': forms.TextInput(attrs={'class': 'form-control'}),
            'placa': forms.TextInput(attrs={'class': 'form-control'}),
            'chassi': forms.TextInput(attrs={'class': 'form-control'}),
            'renavam': forms.TextInput(attrs={'class': 'form-control'}),
            'endereco': forms.TextInput(attrs={'class': 'form-control'}),
            'area': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'valor_atual': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar clientes ativos
        self.fields['proprietario'].queryset = Cliente.objects.filter(ativo=True).order_by('nome')
        self.fields['proprietario'].label_from_instance = lambda obj: f"{obj.nome} - {obj.cpf_cnpj}"

class CotacaoSeguroForm(forms.ModelForm):
    class Meta:
        model = CotacaoSeguro
        fields = [
            'cliente', 'bem', 'plano', 'consultor', 'loja', 'valor_cotacao',
            'comissao_percentual', 'status', 'observacoes'
        ]
        widgets = {
            'cliente': forms.Select(attrs={'class': 'form-select'}),
            'bem': forms.Select(attrs={'class': 'form-select'}),
            'plano': forms.Select(attrs={'class': 'form-select'}),
            'consultor': forms.Select(attrs={'class': 'form-select'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'valor_cotacao': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'comissao_percentual': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Filtrar clientes ativos
        self.fields['cliente'].queryset = Cliente.objects.filter(ativo=True).order_by('nome')
        self.fields['cliente'].label_from_instance = lambda obj: f"{obj.nome} - {obj.cpf_cnpj}"
        
        # Filtrar bens
        self.fields['bem'].queryset = Bem.objects.all().order_by('tipo', 'descricao')
        
        # Filtrar planos ativos
        self.fields['plano'].queryset = PlanoSeguro.objects.filter(ativo=True).order_by('seguradora__nome', 'nome')
        self.fields['plano'].label_from_instance = lambda obj: f"{obj.seguradora.nome} - {obj.nome} ({obj.get_tipo_bem_display()})"
        
        # Filtrar consultores ativos - CORRIGIDO: usar objetos Usuario em vez de User
        consultores_ativos = Usuario.objects.filter(
            status='ativo',
            perfil__nome__in=['consultor', 'vendedor', 'gerente', 'admin']
        ).order_by('user__first_name', 'user__last_name')
        self.fields['consultor'].queryset = consultores_ativos
        self.fields['consultor'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"
        
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')

class SeguroForm(forms.ModelForm):
    class Meta:
        model = Seguro
        fields = '__all__'
        widgets = {
            'cliente': forms.Select(attrs={'class': 'form-select'}),
            'bem': forms.Select(attrs={'class': 'form-select'}),
            'plano': forms.Select(attrs={'class': 'form-select'}),
            'cotacao': forms.Select(attrs={'class': 'form-select'}),
            'vendedor': forms.Select(attrs={'class': 'form-select'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'apolice': forms.TextInput(attrs={'class': 'form-control'}),
            'valor_seguro': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'comissao_percentual': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'data_inicio': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'data_fim': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar clientes ativos
        self.fields['cliente'].queryset = Cliente.objects.filter(ativo=True).order_by('nome')
        self.fields['cliente'].label_from_instance = lambda obj: f"{obj.nome} - {obj.cpf_cnpj}"
        # Filtrar bens
        self.fields['bem'].queryset = Bem.objects.all().order_by('tipo', 'descricao')
        # Filtrar motos disponíveis para seguro
        from .models import Motocicleta
        self.fields['motocicleta'] = forms.ModelChoiceField(
            queryset=Motocicleta.objects.filter(ativo=True),
            required=False,
            label='Motocicleta (opcional)',
            widget=forms.Select(attrs={'class': 'form-select'})
        )
        
        # Filtrar planos ativos
        self.fields['plano'].queryset = PlanoSeguro.objects.filter(ativo=True).order_by('seguradora__nome', 'nome')
        self.fields['plano'].label_from_instance = lambda obj: f"{obj.seguradora.nome} - {obj.nome} ({obj.get_tipo_bem_display()})"
        
        # Filtrar cotações aprovadas
        self.fields['cotacao'].queryset = CotacaoSeguro.objects.filter(status='aprovada').order_by('-data_cotacao')
        self.fields['cotacao'].label_from_instance = lambda obj: f"{obj.cliente.nome} - {obj.bem} (R$ {obj.valor_cotacao})"
        
        # Filtrar vendedores ativos - CORRIGIDO: usar objetos Usuario em vez de User
        vendedores_ativos = Usuario.objects.filter(
            status='ativo',
            perfil__nome__in=['vendedor', 'consultor', 'gerente', 'admin']
        ).order_by('user__first_name', 'user__last_name')
        self.fields['vendedor'].queryset = vendedores_ativos
        self.fields['vendedor'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"
        
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')

# Formulários administrativos
class LojaForm(forms.ModelForm):
    class Meta:
        model = Loja
        fields = ['nome', 'cnpj', 'cidade', 'endereco', 'telefone', 'email', 'ativo']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'cnpj': forms.TextInput(attrs={'class': 'form-control'}),
            'cidade': forms.TextInput(attrs={'class': 'form-control'}),
            'endereco': forms.TextInput(attrs={'class': 'form-control'}),
            'telefone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'ativo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

class UsuarioForm(forms.ModelForm):
    # Campos do User do Django
    username = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'class': 'form-control'}))
    first_name = forms.CharField(max_length=30, widget=forms.TextInput(attrs={'class': 'form-control'}))
    last_name = forms.CharField(max_length=30, widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control'}))
    password1 = forms.CharField(
        label='Senha',
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        required=False,
        help_text='Deixe em branco para manter a senha atual'
    )
    password2 = forms.CharField(
        label='Confirmar Senha',
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        required=False
    )
    is_active = forms.BooleanField(
        label='Usuário Ativo',
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )

    class Meta:
        model = Usuario
        fields = ['loja', 'perfil', 'status']
        widgets = {
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'perfil': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')
        
        # Filtrar perfis
        self.fields['perfil'].queryset = Perfil.objects.all().order_by('nome')
        
        # Se for edição, preencher campos do User
        if self.instance and self.instance.pk:
            user = self.instance.user
            self.fields['username'].initial = user.username
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email
            self.fields['is_active'].initial = user.is_active

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        
        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError('As senhas não coincidem.')
        
        return cleaned_data

    def save(self, commit=True):
        usuario = super().save(commit=False)
        
        if self.instance.pk:
            # Edição - atualizar User existente
            user = self.instance.user
            user.username = self.cleaned_data['username']
            user.first_name = self.cleaned_data['first_name']
            user.last_name = self.cleaned_data['last_name']
            user.email = self.cleaned_data['email']
            user.is_active = self.cleaned_data['is_active']
            
            # Atualizar senha se fornecida
            if self.cleaned_data['password1']:
                user.set_password(self.cleaned_data['password1'])
            
            user.save()
        else:
            # Criação - criar novo User
            user = User.objects.create_user(
                username=self.cleaned_data['username'],
                first_name=self.cleaned_data['first_name'],
                last_name=self.cleaned_data['last_name'],
                email=self.cleaned_data['email'],
                password=self.cleaned_data['password1'],
                is_active=self.cleaned_data['is_active']
            )
            usuario.user = user
        
        if commit:
            usuario.save()
        
        return usuario

# Formulários de ocorrências
class OcorrenciaForm(forms.ModelForm):
    class Meta:
        model = Ocorrencia
        fields = [
            'titulo', 'descricao', 'tipo', 'prioridade', 'status', 'loja', 
            'responsavel', 'data_limite', 'observacoes', 'solucao', 'arquivos_anexos'
        ]
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descricao': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'prioridade': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'responsavel': forms.Select(attrs={'class': 'form-select'}),
            'data_limite': forms.DateTimeInput(attrs={
                'type': 'datetime-local', 
                'class': 'form-control'
            }),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'solucao': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'arquivos_anexos': forms.FileInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')
        
        # Filtrar usuários ativos para responsável - CORRIGIDO: usar objetos Usuario em vez de User
        usuarios_ativos = Usuario.objects.filter(
            status='ativo'
        ).order_by('user__first_name', 'user__last_name')
        self.fields['responsavel'].queryset = usuarios_ativos
        self.fields['responsavel'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"
        
        # Se for criação, definir loja padrão como a do usuário logado
        if not self.instance.pk:
            self.fields['loja'].initial = self.initial.get('loja')

class ComentarioOcorrenciaForm(forms.ModelForm):
    class Meta:
        model = ComentarioOcorrencia
        fields = ['conteudo', 'privado']
        widgets = {
            'conteudo': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3,
                'placeholder': 'Digite seu comentário...'
            }),
            'privado': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'conteudo': 'Comentário',
            'privado': 'Comentário privado (apenas para administradores)'
        }

# ============================================================================
# FORMULÁRIOS DO MÓDULO FINANCEIRO
# ============================================================================

class VendaFinanceiraForm(forms.ModelForm):
    class Meta:
        model = VendaFinanceira
        fields = [
            'venda', 'moto', 'produto', 'quantidade', 'preco_unitario', 
            'desconto', 'custo_unitario', 'canal_venda', 'observacoes'
        ]
        widgets = {
            'venda': forms.Select(attrs={'class': 'form-select'}),
            'moto': forms.Select(attrs={'class': 'form-select'}),
            'produto': forms.TextInput(attrs={'class': 'form-control'}),
            'quantidade': forms.NumberInput(attrs={'class': 'form-control', 'min': '1'}),
            'preco_unitario': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'desconto': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'custo_unitario': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'canal_venda': forms.Select(attrs={'class': 'form-select'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar vendas
        self.fields['venda'].queryset = Venda.objects.all().order_by('-data_venda')
        self.fields['venda'].label_from_instance = lambda obj: f"{obj.comprador.nome} - {obj.moto} (R$ {obj.valor_venda})"
        
        # Filtrar motocicletas
        self.fields['moto'].queryset = Motocicleta.objects.all().order_by('marca', 'modelo')
        self.fields['moto'].label_from_instance = lambda obj: f"{obj.marca} {obj.modelo} {obj.ano} - {obj.placa or obj.chassi}"

class DespesaForm(forms.ModelForm):
    class Meta:
        model = Despesa
        fields = [
            'descricao', 'categoria', 'valor', 'data', 'fixa_variavel', 
            'centro_custo', 'loja', 'responsavel', 'observacoes'
        ]
        widgets = {
            'descricao': forms.TextInput(attrs={'class': 'form-control'}),
            'categoria': forms.Select(attrs={'class': 'form-select'}),
            'valor': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'data': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'fixa_variavel': forms.Select(attrs={'class': 'form-select'}),
            'centro_custo': forms.TextInput(attrs={'class': 'form-control'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'responsavel': forms.Select(attrs={'class': 'form-select'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')
        
        # Filtrar usuários ativos
        usuarios_ativos = Usuario.objects.filter(status='ativo').order_by('user__first_name', 'user__last_name')
        self.fields['responsavel'].queryset = usuarios_ativos
        self.fields['responsavel'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"

class ReceitaExtraForm(forms.ModelForm):
    class Meta:
        model = ReceitaExtra
        fields = ['descricao', 'valor', 'data', 'loja', 'responsavel', 'observacoes']
        widgets = {
            'descricao': forms.TextInput(attrs={'class': 'form-control'}),
            'valor': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'data': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'responsavel': forms.Select(attrs={'class': 'form-select'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')
        
        # Filtrar usuários ativos
        usuarios_ativos = Usuario.objects.filter(status='ativo').order_by('user__first_name', 'user__last_name')
        self.fields['responsavel'].queryset = usuarios_ativos
        self.fields['responsavel'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"

class PagamentoForm(forms.ModelForm):
    class Meta:
        model = Pagamento
        fields = [
            'tipo', 'referente_a', 'valor', 'vencimento', 'pago', 'data_pagamento',
            'loja', 'responsavel', 'venda', 'despesa', 'receita_extra', 'observacoes'
        ]
        widgets = {
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'referente_a': forms.Select(attrs={'class': 'form-select'}),
            'valor': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'vencimento': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'pago': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'data_pagamento': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'loja': forms.Select(attrs={'class': 'form-select'}),
            'responsavel': forms.Select(attrs={'class': 'form-select'}),
            'venda': forms.Select(attrs={'class': 'form-select'}),
            'despesa': forms.Select(attrs={'class': 'form-select'}),
            'receita_extra': forms.Select(attrs={'class': 'form-select'}),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrar lojas ativas
        self.fields['loja'].queryset = Loja.objects.filter(ativo=True).order_by('nome')
        
        # Filtrar usuários ativos
        usuarios_ativos = Usuario.objects.filter(status='ativo').order_by('user__first_name', 'user__last_name')
        self.fields['responsavel'].queryset = usuarios_ativos
        self.fields['responsavel'].label_from_instance = lambda obj: f"{obj.user.get_full_name()} ({obj.loja.nome})"
        
        # Filtrar vendas
        self.fields['venda'].queryset = Venda.objects.all().order_by('-data_venda')
        self.fields['venda'].label_from_instance = lambda obj: f"{obj.comprador.nome} - {obj.moto} (R$ {obj.valor_venda})"
        
        # Filtrar despesas
        self.fields['despesa'].queryset = Despesa.objects.all().order_by('-data')
        self.fields['despesa'].label_from_instance = lambda obj: f"{obj.descricao} - R$ {obj.valor}"
        
        # Filtrar receitas extras
        self.fields['receita_extra'].queryset = ReceitaExtra.objects.all().order_by('-data')
        self.fields['receita_extra'].label_from_instance = lambda obj: f"{obj.descricao} - R$ {obj.valor}"

class ComunicacaoVendaForm(forms.ModelForm):
    class Meta:
        model = ComunicacaoVenda
        fields = [
            'tipo', 'titulo', 'mensagem', 'destinatario', 'telefone', 'email',
            'obrigatoria', 'prazo_limite', 'observacoes', 'documento_anexo', 'comprovante_envio'
        ]
        widgets = {
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'mensagem': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'destinatario': forms.TextInput(attrs={'class': 'form-control'}),
            'telefone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'obrigatoria': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'prazo_limite': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-control'
            }),
            'observacoes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'documento_anexo': forms.FileInput(attrs={'class': 'form-control'}),
            'comprovante_envio': forms.FileInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'tipo': 'Tipo de Comunicação',
            'titulo': 'Título',
            'mensagem': 'Mensagem',
            'destinatario': 'Destinatário',
            'telefone': 'Telefone',
            'email': 'E-mail',
            'obrigatoria': 'Comunicação Obrigatória',
            'prazo_limite': 'Prazo Limite',
            'observacoes': 'Observações',
        }

    def __init__(self, *args, **kwargs):
        venda = kwargs.pop('venda', None)
        super().__init__(*args, **kwargs)
        
        # Se uma venda foi fornecida, preencher automaticamente alguns campos
        if venda:
            self.fields['destinatario'].initial = venda.comprador.nome
            self.fields['telefone'].initial = venda.comprador.telefone
            self.fields['email'].initial = venda.comprador.email
            
            # Definir prazo padrão (24 horas a partir de agora)
            from datetime import timedelta
            prazo_padrao = timezone.now() + timedelta(hours=24)
            self.fields['prazo_limite'].initial = prazo_padrao.strftime('%Y-%m-%dT%H:%M')

    def clean(self):
        cleaned_data = super().clean()
        prazo_limite = cleaned_data.get('prazo_limite')
        
        # Verificar se o prazo limite não é no passado
        if prazo_limite and prazo_limite < timezone.now():
            raise forms.ValidationError('O prazo limite não pode ser no passado.')
        
        return cleaned_data

# ============================================================================
# FORMULÁRIOS DE DOCUMENTOS DE MOTOCICLETAS
# ============================================================================

class DocumentoMotocicletaForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        moto_id = kwargs.pop('moto_id', None)
        venda_id = kwargs.pop('venda_id', None)
        super().__init__(*args, **kwargs)
        
        # Filtrar motocicletas ativas
        self.fields['moto'].queryset = Motocicleta.objects.filter(ativo=True).order_by('marca', 'modelo')
        
        # Filtrar vendas ativas
        self.fields['venda'].queryset = Venda.objects.filter(status__in=['pendente', 'em_negociacao', 'vendido']).order_by('-data_atendimento')
        
        # Definir valores iniciais se fornecidos
        if moto_id:
            self.fields['moto'].initial = moto_id
        if venda_id:
            self.fields['venda'].initial = venda_id

    class Meta:
        model = DocumentoMotocicleta
        fields = ['moto', 'venda', 'tipo', 'arquivo', 'observacao']
        widgets = {
            'moto': forms.Select(attrs={'class': 'form-select'}),
            'venda': forms.Select(attrs={'class': 'form-select'}),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'arquivo': forms.FileInput(attrs={'class': 'form-control'}),
            'observacao': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
        labels = {
            'moto': 'Motocicleta',
            'venda': 'Venda (Opcional)',
            'tipo': 'Tipo de Documento',
            'arquivo': 'Arquivo',
            'observacao': 'Observações',
        }

    def __init__(self, *args, **kwargs):
        moto_id = kwargs.pop('moto_id', None)
        venda_id = kwargs.pop('venda_id', None)
        super().__init__(*args, **kwargs)
        
        # Filtrar motocicletas ativas
        self.fields['moto'].queryset = Motocicleta.objects.filter(ativo=True).order_by('marca', 'modelo')
        self.fields['moto'].label_from_instance = lambda obj: f"{obj.marca} {obj.modelo} {obj.ano} - {obj.placa or obj.chassi}"
        
        # Filtrar vendas
        self.fields['venda'].queryset = Venda.objects.all().order_by('-data_venda')
        self.fields['venda'].label_from_instance = lambda obj: f"{obj.comprador.nome} - {obj.moto} ({obj.data_venda})"
        
        # Definir valores iniciais se fornecidos
        if moto_id:
            self.fields['moto'].initial = moto_id
        if venda_id:
            self.fields['venda'].initial = venda_id

    def clean(self):
        cleaned_data = super().clean()
        moto = cleaned_data.get('moto')
        venda = cleaned_data.get('venda')
        
        # Se uma venda foi selecionada, verificar se a moto da venda corresponde
        if venda and moto and venda.moto != moto:
            raise forms.ValidationError('A motocicleta selecionada deve corresponder à motocicleta da venda.')
        
        return cleaned_data

