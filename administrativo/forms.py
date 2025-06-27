from django import forms
from .models import ControleChave
from django.contrib.auth.models import User

class ControleChaveForm(forms.ModelForm):
    id_moto = forms.IntegerField(
        required=False,
        label='ID da Motocicleta',
        widget=forms.NumberInput(attrs={'class': 'form-control', 'autocomplete': 'off', 'min': 1})
    )
    placa_moto = forms.CharField(
        required=False,
        label='Placa',
        widget=forms.TextInput(attrs={'class': 'form-control', 'autocomplete': 'off', 'maxlength': 8, 'style': 'text-transform:uppercase;'})
    )
    chassi_moto = forms.CharField(
        required=False,
        label='Chassi',
        widget=forms.TextInput(attrs={'class': 'form-control', 'autocomplete': 'off', 'maxlength': 17, 'style': 'text-transform:uppercase;'})
    )

    class Meta:
        model = ControleChave
        fields = ['funcionario', 'id_moto', 'placa_moto', 'chassi_moto', 'motocicleta']
        widgets = {
            'funcionario': forms.Select(attrs={'class': 'form-control'}),
            'motocicleta': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from core.models import Motocicleta
        self.fields['motocicleta'].queryset = Motocicleta.objects.filter(ativo=True).order_by('-id')
        self.fields['motocicleta'].label_from_instance = lambda obj: f"ID: {obj.id} | Placa: {obj.placa or '-'} | Chassi: {obj.chassi} | {obj.marca} {obj.modelo} {obj.ano}" 