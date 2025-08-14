from django import forms
from .models import PreVenda
from django.contrib.auth.models import User
from core.models import Usuario
import re

class PreVendaForm(forms.ModelForm):
    """Formulário para registro de pré-vendas"""
    
    vendedor = forms.ModelChoiceField(
        queryset=Usuario.objects.filter(status='ativo', perfil__nome__in=['vendedor', 'gerente']).order_by('user__first_name', 'user__last_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        required=True,
        label='Vendedor/Gerente responsável',
        help_text='Selecione o responsável pelo atendimento'
    )

    class Meta:
        model = PreVenda
        fields = ['nome_cliente', 'telefone', 'moto_desejada', 'vendedor', 'observacoes']
        widgets = {
            'nome_cliente': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nome do cliente'
            }),
            'telefone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '(11) 99999-9999'
            }),
            'moto_desejada': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ex: Honda CG 160 2023'
            }),
            'observacoes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Observações sobre o atendimento...'
            }),
        }
    
    def clean_telefone(self):
        telefone = self.cleaned_data['telefone']
        # Remove caracteres não numéricos
        telefone_limpo = re.sub(r'[^\d]', '', telefone)
        
        if len(telefone_limpo) < 10 or len(telefone_limpo) > 11:
            raise forms.ValidationError('Telefone deve ter 10 ou 11 dígitos')
        
        return telefone
    
    def clean_nome_cliente(self):
        nome = self.cleaned_data['nome_cliente']
        if len(nome.strip()) < 2:
            raise forms.ValidationError('Nome deve ter pelo menos 2 caracteres')
        return nome.strip()

 