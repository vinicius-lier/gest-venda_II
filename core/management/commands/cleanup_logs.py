from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import LogAcesso, Notificacao
import os

class Command(BaseCommand):
    help = 'Limpa logs antigos para otimizar performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de dias para manter logs (padrão: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra o que seria deletado sem executar'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Limpar logs de acesso antigos
        old_logs = LogAcesso.objects.filter(data_hora__lt=cutoff_date)
        logs_count = old_logs.count()
        
        # Limpar notificações antigas e lidas
        old_notifications = Notificacao.objects.filter(
            data_criacao__lt=cutoff_date,
            lida=True
        )
        notifications_count = old_notifications.count()
        
        # Limpar arquivo de log do Django
        log_file = 'logs/django.log'
        log_size = 0
        if os.path.exists(log_file):
            log_size = os.path.getsize(log_file)
            log_size_mb = log_size / (1024 * 1024)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN - Seriam deletados:\n'
                    f'- {logs_count} logs de acesso antigos\n'
                    f'- {notifications_count} notificações antigas e lidas\n'
                    f'- Arquivo de log atual: {log_size_mb:.2f} MB'
                )
            )
        else:
            # Deletar logs antigos
            old_logs.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deletados {logs_count} logs de acesso antigos')
            )
            
            # Deletar notificações antigas
            old_notifications.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deletadas {notifications_count} notificações antigas')
            )
            
            # Limpar arquivo de log se muito grande (> 10MB)
            if log_size > 10 * 1024 * 1024:  # 10MB
                try:
                    with open(log_file, 'w') as f:
                        f.write('')
                    self.stdout.write(
                        self.style.SUCCESS('Arquivo de log limpo')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Erro ao limpar arquivo de log: {e}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS('Limpeza concluída com sucesso!')
            ) 