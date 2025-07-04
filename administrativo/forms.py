from django import forms
from .models import ControleChave
from django.contrib.auth.models import User

class ControleChaveForm(forms.ModelForm):
    class Meta:
        model = ControleChave
        fields = ['funcionario']
        widgets = {
            'funcionario': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs) 