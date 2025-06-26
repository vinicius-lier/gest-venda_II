from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Motocicleta, Venda, Consignacao, Cliente, Loja, Seguradora, PlanoSeguro, Bem, CotacaoSeguro, Seguro, Usuario, Perfil, Ocorrencia, ComentarioOcorrencia
from django.utils import timezone

class MotocicletaForm(forms.ModelForm):
    class Meta:
        model = Motocicleta
        fields = [
            'marca', 'modelo', 'ano', 'cor', 'cilindrada', 'chassi', 'placa', 'renavam',
            'tipo_entrada', 'origem', 'status', 'proprietario', 'fornecedor', 'loja_origem',
            'valor_entrada', 'valor_atual', 'data_entrada', 'observacoes',
            'foto_principal', 'foto_frontal', 'foto_traseira', 'foto_lado_esquerdo', 'foto_lado_direito'
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
            'cor': forms.TextInput(attrs={'class': 'form-control'}),
            'renavam': forms.TextInput(attrs={'class': 'form-control'}),
            'cilindrada': forms.TextInput(attrs={'class': 'form-control'}),
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
        
        return cleaned_data

class VendaForm(forms.ModelForm):
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
        super().__init__(*args, **kwargs)
        from .models import Motocicleta, Cliente
        # Filtrar motos disponíveis (em estoque)
        motos_disponiveis = Motocicleta.objects.filter(status='estoque').order_by('marca', 'modelo')
        self.fields['moto'].queryset = motos_disponiveis
        self.fields['moto'].label_from_instance = lambda obj: f"{obj.marca} {obj.modelo} {obj.ano} - {obj.placa or obj.chassi}"
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
        fields = ['nome', 'cpf_cnpj', 'rg', 'telefone', 'email', 'endereco', 'cidade', 'estado', 'cep', 'tipo', 'observacoes', 'ativo']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'cpf_cnpj': forms.TextInput(attrs={'class': 'form-control'}),
            'rg': forms.TextInput(attrs={'class': 'form-control'}),
            'telefone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'endereco': forms.TextInput(attrs={'class': 'form-control'}),
            'cidade': forms.TextInput(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={'class': 'form-select'}),
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
        # Filtrar motos disponíveis para seguro (não vinculadas a outro seguro)
        from .models import Motocicleta
        self.fields['motocicleta'] = forms.ModelChoiceField(
            queryset=Motocicleta.objects.filter(seguro__isnull=True),
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

class DummyForm(forms.Form):
    pass
