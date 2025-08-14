from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import uuid
from core.models import Usuario

class PreVenda(models.Model):
    """Modelo para registrar pré-vendas de clientes que visitam a loja"""
    
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('convertida', 'Convertida'),
        ('descartada', 'Descartada'),
    ]
    
    # Identificação
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Dados do cliente
    nome_cliente = models.CharField(max_length=100, help_text="Nome simples do cliente")
    telefone = models.CharField(max_length=20, help_text="Telefone com máscara básica")
    
    # Dados da moto
    moto_desejada = models.CharField(max_length=200, help_text="Moto que o cliente demonstrou interesse")
    
    # Relacionamentos
    vendedor = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='pre_vendas',
        limit_choices_to={'perfil__nome__in': ['vendedor', 'gerente']}
    )
    
    # Status e datas
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta')
    data_atendimento = models.DateTimeField(auto_now_add=True)
    
    # Metadados
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Pré-Venda'
        verbose_name_plural = 'Pré-Vendas'
        ordering = ['-data_atendimento']
    
    def __str__(self):
        return f"{self.nome_cliente} - {self.moto_desejada} ({self.get_status_display()})"
    
    def get_status_color(self):
        """Retorna a cor CSS para o status"""
        colors = {
            'aberta': 'warning',
            'convertida': 'success',
            'descartada': 'danger',
        }
        return colors.get(self.status, 'secondary')
    
    @property
    def dias_aberta(self):
        """Retorna quantos dias a pré-venda está aberta"""
        if self.status == 'aberta':
            return (timezone.now() - self.data_atendimento).days
        return 0
    
    @property
    def atrasada(self):
        """Verifica se a pré-venda está aberta há mais de 7 dias"""
        return self.status == 'aberta' and self.dias_aberta > 7


