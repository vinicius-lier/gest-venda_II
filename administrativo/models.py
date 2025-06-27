from django.db import models
from django.contrib.auth.models import User
from core.models import Motocicleta

# Create your models here.

class ControleChave(models.Model):
    funcionario = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Funcionário')
    motocicleta = models.ForeignKey(Motocicleta, on_delete=models.CASCADE, verbose_name='Motocicleta')
    data_saida = models.DateTimeField(auto_now_add=True, verbose_name='Data/Hora de Saída')
    data_retorno = models.DateTimeField(null=True, blank=True, verbose_name='Data/Hora de Retorno')
    status = models.CharField(
        max_length=20,
        choices=[
            ('aberto', 'Em aberto'),
            ('devolvida', 'Devolvida'),
            ('atraso', 'Em atraso'),
        ],
        default='aberto',
        verbose_name='Status'
    )

    def __str__(self):
        return f"{self.motocicleta} - {self.funcionario}"
