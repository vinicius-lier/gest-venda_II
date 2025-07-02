from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import verificar_vendas_pendentes_comunicacao
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Verifica vendas com mais de 2 dias sem comunicação de intenção e notifica o administrativo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a verificação mesmo se já foi feita hoje',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Iniciando verificação de vendas pendentes de comunicação...')
        )
        
        try:
            # Executar verificação
            vendas_pendentes = verificar_vendas_pendentes_comunicacao()
            
            if vendas_pendentes > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'Encontradas {vendas_pendentes} vendas pendentes de comunicação de intenção!'
                    )
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Notificações enviadas para o setor administrativo.'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        'Nenhuma venda pendente de comunicação encontrada.'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro durante a verificação: {str(e)}')
            )
            logger.error(f"Erro no comando check_vendas_pendentes: {str(e)}") 