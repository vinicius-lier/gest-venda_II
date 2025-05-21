from django import forms
from .models import Venda, Consignacao, Perfil, EstoqueMoto, Cliente, HistoricoProprietario
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.forms import UserCreationForm, SetPasswordForm
from django.contrib.auth.models import User, Group
from .widgets import AutocompleteClienteWidget, AutocompleteMotoWidget

class VendaForm(forms.ModelForm):
    class Meta:
        model = Venda
        fields = [
            'cliente',
            'nome_cliente',
            'contato',
            'origem',
            'proprietario',
            'fornecedor',
            'moto',
            'modelo_interesse',
            'forma_pagamento',
            'status',
            'data_venda',
            'valor_venda',
            'observacoes',
            'data_atendimento',
            'vendedor',
        ]
        widgets = {
            'data_atendimento': forms.DateInput(attrs={'type': 'date'}),
            'data_venda': forms.DateInput(attrs={'type': 'date'}),
            'cliente': AutocompleteClienteWidget(),
            'proprietario': AutocompleteClienteWidget(),
            'fornecedor': AutocompleteClienteWidget(),
            'moto': AutocompleteMotoWidget(),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtra apenas motos disponíveis
        self.fields['moto'].queryset = EstoqueMoto.objects.filter(status='DISPONIVEL')
        
        # Melhora a exibição das opções de motos
        self.fields['moto'].label_from_instance = lambda obj: f"{obj.marca} {obj.modelo} ({obj.ano}) - {obj.cor} - Matrícula: {obj.matricula}"
        
        # Se já tem uma moto selecionada, adiciona ela na queryset mesmo que não esteja disponível
        if 'instance' in kwargs and kwargs['instance'] and kwargs['instance'].moto:
            moto_atual = kwargs['instance'].moto
            self.fields['moto'].queryset = self.fields['moto'].queryset | EstoqueMoto.objects.filter(pk=moto_atual.pk)
            
        # Mensagens de ajuda
        self.fields['proprietario'].help_text = "Pessoa cujo nome estará no documento (obrigatório)"
        self.fields['fornecedor'].help_text = "Pessoa que está vendendo a moto (quando diferente do proprietário)"
    
    def clean(self):
        cleaned_data = super().clean()
        
        # Garante que o proprietário é obrigatório
        proprietario = cleaned_data.get('proprietario')
        if not proprietario:
            self.add_error('proprietario', 'Este campo é obrigatório')
            
        # Se o cliente for o mesmo que o proprietário ou fornecedor, usa o cliente
        cliente = cleaned_data.get('cliente')
        nome_cliente = cleaned_data.get('nome_cliente')
        
        # Se foi preenchido apenas o nome do cliente sem selecionar um cliente existente
        if not cliente and nome_cliente:
            # Não adiciona erro para o campo cliente, pois o nome_cliente está preenchido
            # Remove o erro se ele existir
            if 'cliente' in self._errors:
                del self._errors['cliente']
        
        # Valida que o proprietário não pode ser o mesmo que o cliente
        if cliente and proprietario and cliente.id == proprietario.id:
            self.add_error('proprietario', 'O proprietário não pode ser o mesmo que o cliente (comprador)')
            
        # Ajuda a preencher o fornecedor se não estiver definido
        fornecedor = cleaned_data.get('fornecedor')
        if not fornecedor and proprietario:
            cleaned_data['fornecedor'] = proprietario
            
        return cleaned_data

class ConsignacaoForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Define a data limite padrão como 30 dias após a data atual
        if not self.initial.get('data_limite'):
            self.initial['data_limite'] = timezone.now().date() + timedelta(days=30)
        
        # Define a comissão padrão como 5%
        if not self.initial.get('comissao_percentual'):
            self.initial['comissao_percentual'] = 5.00
            
        # Se já estiver com uma moto associada, exibe-a mesmo se não estiver disponível
        if 'instance' in kwargs and kwargs['instance'] and kwargs['instance'].moto:
            moto_atual = kwargs['instance'].moto
            self.fields['moto'].queryset = EstoqueMoto.objects.filter(
                status='DISPONIVEL'
            ) | EstoqueMoto.objects.filter(pk=moto_atual.pk)
        else:
            # Filtra apenas motos disponíveis
            self.fields['moto'].queryset = EstoqueMoto.objects.filter(status='DISPONIVEL')
    
    class Meta:
        model = Consignacao
        fields = [
            # Dados do proprietário
            'proprietario',
            'nome_proprietario',
            'cpf_proprietario',
            'rg_proprietario',
            'endereco_proprietario',
            'contato_proprietario',
            
            # Dados do veículo
            'moto',
            'marca',
            'modelo',
            'ano',
            'cor',
            'placa',
            'renavam',
            'chassi',
            
            # Dados da consignação
            'valor_consignacao',
            'valor_minimo',
            'comissao_percentual',
            'data_entrada',
            'data_limite',
            'status',
            'observacoes',
            'vendedor_responsavel',
        ]
        widgets = {
            'data_entrada': forms.DateInput(attrs={'type': 'date'}),
            'data_limite': forms.DateInput(attrs={'type': 'date'}),
            'observacoes': forms.Textarea(attrs={'rows': 3}),
            'endereco_proprietario': forms.Textarea(attrs={'rows': 2}),
            'proprietario': AutocompleteClienteWidget(),
            'moto': AutocompleteMotoWidget(only_available=True),
        }
        
    def clean(self):
        cleaned_data = super().clean()
        # Se o usuário selecionou um proprietário, valida que os dados estão consistentes
        proprietario = cleaned_data.get('proprietario')
        
        if proprietario:
            # Preenche automaticamente os campos do proprietário
            cleaned_data['nome_proprietario'] = proprietario.nome
            cleaned_data['cpf_proprietario'] = proprietario.cpf
            cleaned_data['rg_proprietario'] = proprietario.rg
            cleaned_data['endereco_proprietario'] = proprietario.endereco
            cleaned_data['contato_proprietario'] = proprietario.telefone
            
        # Se selecionou uma moto, verifica que os dados estão consistentes
        moto = cleaned_data.get('moto')
        if moto:
            # Preenche automaticamente os campos do veículo
            cleaned_data['marca'] = moto.marca
            cleaned_data['modelo'] = moto.modelo
            cleaned_data['ano'] = moto.ano
            cleaned_data['cor'] = moto.cor
            cleaned_data['placa'] = moto.placa or ""
            cleaned_data['renavam'] = moto.renavam
            cleaned_data['chassi'] = moto.chassi
            
        return cleaned_data

class ConsignacaoVendaForm(forms.ModelForm):
    """Formulário para registrar a venda de um veículo em consignação"""
    
    class Meta:
        model = Consignacao
        fields = [
            'comprador',
            'data_venda',
            'valor_venda',
            'nome_comprador',
            'status',
        ]
        widgets = {
            'data_venda': forms.DateInput(attrs={'type': 'date'}),
            'comprador': AutocompleteClienteWidget(),
        }
        
    def clean(self):
        cleaned_data = super().clean()
        comprador = cleaned_data.get('comprador')
        
        if comprador and not cleaned_data.get('nome_comprador'):
            cleaned_data['nome_comprador'] = comprador.nome
            
        return cleaned_data

class UsuarioCreateForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-control'})
            
class UsuarioUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'is_active']
        widgets = {
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'})
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            if field != 'is_active':  # Não aplicar form-control ao checkbox
                self.fields[field].widget.attrs.update({'class': 'form-control'})
            
class PerfilForm(forms.ModelForm):
    class Meta:
        model = Perfil
        fields = ['tipo']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['tipo'].widget.attrs.update({'class': 'form-control'})
        
class AlterarSenhaForm(SetPasswordForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-control'})

class EstoqueMotoForm(forms.ModelForm):
    chassi = forms.CharField(max_length=17, required=True, help_text="Obrigatório e único. Identifica a moto no sistema.")
    
    class Meta:
        model = EstoqueMoto
        fields = [
            'matricula',
            'marca',
            'modelo',
            'ano',
            'cor',
            'placa',
            'chassi',
            'renavam',
            'valor',
            'categoria',
            'status',
            'data_entrada',
            'proprietario',
            'observacoes',
            'foto_principal',
            'foto_frontal',
            'foto_traseira',
            'foto_lado_esquerdo',
            'foto_lado_direito',
        ]
        widgets = {
            'data_entrada': forms.DateInput(attrs={'type': 'date'}),
            'observacoes': forms.Textarea(attrs={'rows': 3}),
            'proprietario': AutocompleteClienteWidget(),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Somente para instâncias existentes (edição)
        if self.instance.pk:
            self.fields['matricula'].widget.attrs['readonly'] = True
            self.fields['matricula'].help_text = "Gerado automaticamente. Não pode ser alterado."
        else:
            # Para novos registros, esconde o campo matrícula
            self.fields['matricula'].widget = forms.HiddenInput()

class ClienteForm(forms.ModelForm):
    # Campo para adicionar motos ao cliente
    motos = forms.ModelChoiceField(
        queryset=EstoqueMoto.objects.filter(status='DISPONIVEL'),
        required=False,
        widget=AutocompleteMotoWidget(),
        help_text="Selecione uma moto para associar a este cliente (opcional)"
    )
    
    class Meta:
        model = Cliente
        fields = [
            'nome',
            'cpf',
            'rg',
            'endereco',
            'telefone',
            'email',
            'tipo',
            'data_cadastro',
            'observacoes',
            'motos',
        ]
        widgets = {
            'data_cadastro': forms.DateInput(attrs={'type': 'date'}),
            'observacoes': forms.Textarea(attrs={'rows': 3}),
            'endereco': forms.Textarea(attrs={'rows': 2}),
            'tipo': forms.Select(attrs={'class': 'form-select', 'onchange': 'toggleFields(this.value)'}),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            # Se estiver editando um cliente existente
            moto_associada = EstoqueMoto.objects.filter(proprietario=self.instance).first()
            if moto_associada:
                self.fields['motos'].initial = moto_associada
            
            # Inclui as motos já associadas, mesmo que não estejam disponíveis
            motos_associadas = EstoqueMoto.objects.filter(proprietario=self.instance)
            self.fields['motos'].queryset = EstoqueMoto.objects.filter(
                status='DISPONIVEL'
            ) | motos_associadas
            
        # Adiciona classes Bootstrap aos campos
        self.fields['tipo'].help_text = "Selecione como este contato será tratado no sistema"
    
    def save(self, commit=True):
        cliente = super().save(commit=commit)
        
        if commit:
            # Salva a relação com a moto selecionada se o cliente for proprietário ou ambos
            moto_selecionada = self.cleaned_data.get('motos')
            
            # Remove relações antigas
            EstoqueMoto.objects.filter(proprietario=cliente).update(proprietario=None)
            
            # Adiciona nova relação se houver moto selecionada e o cliente for proprietário ou ambos
            if moto_selecionada and cliente.tipo in ['PROPRIETARIO', 'AMBOS']:
                moto_selecionada.proprietario = cliente
                moto_selecionada.save()
                
                # Registra no histórico
                HistoricoProprietario.objects.create(
                    moto=moto_selecionada,
                    proprietario=cliente,
                    data_inicio=timezone.now().date(),
                    motivo='COMPRA'
                )
                
        return cliente

class HistoricoProprietarioForm(forms.ModelForm):
    class Meta:
        model = HistoricoProprietario
        fields = [
            'moto',
            'proprietario',
            'data_inicio',
            'data_fim',
            'motivo',
        ]
        widgets = {
            'data_inicio': forms.DateInput(attrs={'type': 'date'}),
            'data_fim': forms.DateInput(attrs={'type': 'date'}),
            'proprietario': AutocompleteClienteWidget(),
            'moto': AutocompleteMotoWidget(only_available=False),
        }
