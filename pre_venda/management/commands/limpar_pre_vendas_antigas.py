from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from pre_venda.models import PreVenda


class Command(BaseCommand):
    help = 'Limpa pré-vendas abertas há mais de 30 dias'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias',
            type=int,
            default=30,
            help='Número de dias para considerar pré-venda como antiga (padrão: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra o que seria removido sem executar a remoção'
        )

    def handle(self, *args, **options):
        dias = options['dias']
        dry_run = options['dry_run']
        
        # Calcular data limite
        data_limite = timezone.now() - timedelta(days=dias)
        
        # Buscar pré-vendas antigas
        pre_vendas_antigas = PreVenda.objects.filter(
            status='aberta',
            data_atendimento__lt=data_limite
        )
        
        count = pre_vendas_antigas.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'Nenhuma pré-venda aberta há mais de {dias} dias encontrada.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: {count} pré-vendas seriam removidas:')
            )
            
            for pre_venda in pre_vendas_antigas:
                self.stdout.write(
                    f'  - {pre_venda.nome_cliente} ({pre_venda.telefone}) - '
                    f'{pre_venda.moto_desejada} - {pre_venda.data_atendimento.strftime("%d/%m/%Y")}'
                )
        else:
            # Marcar como descartadas
            pre_vendas_antigas.update(status='descartada')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'{count} pré-vendas abertas há mais de {dias} dias foram marcadas como descartadas.'
                )
            ) 