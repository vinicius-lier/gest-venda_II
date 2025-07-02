from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from core.models import Venda, Usuario
from datetime import timedelta

class Command(BaseCommand):
    help = 'Notifica administradores e gerentes sobre vendas sem comunicação de intenção após 2 dias.'

    def handle(self, *args, **options):
        hoje = timezone.now().date()
        limite = hoje - timedelta(days=2)

        # Vendas com mais de 2 dias, status "vendido" e sem comunicação de intenção enviada
        vendas_pendentes = Venda.objects.filter(
            status='vendido',
            data_venda__lte=limite
        ).exclude(
            comunicacoes__tipo='intencao',
            comunicacoes__status__in=['enviada', 'confirmada']
        )

        if not vendas_pendentes.exists():
            self.stdout.write(self.style.SUCCESS('Nenhuma venda pendente de comunicação de intenção.'))
            return

        # Buscar administradores e gerentes ativos com e-mail
        admins_gerentes = Usuario.objects.filter(
            status='ativo',
            perfil__nome__in=['admin', 'gerente'],
            user__email__isnull=False
        )

        emails = [u.user.email for u in admins_gerentes if u.user.email]
        if not emails:
            self.stdout.write(self.style.WARNING('Nenhum administrador ou gerente com e-mail cadastrado.'))
            return

        # Montar mensagem
        assunto = 'Vendas sem comunicação de intenção após 2 dias'
        mensagem = 'As seguintes vendas estão há mais de 2 dias sem comunicação de intenção enviada:\n\n'
        for venda in vendas_pendentes:
            mensagem += f'- Venda #{venda.id} | Moto: {venda.moto.marca} {venda.moto.modelo} | Comprador: {venda.comprador.nome} | Data da venda: {venda.data_venda.strftime("%d/%m/%Y")}\n'
        mensagem += '\nPor favor, regularize essas pendências no sistema.'

        # Enviar e-mail
        try:
            send_mail(
                assunto,
                mensagem,
                settings.DEFAULT_FROM_EMAIL,
                emails,
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f'Notificação enviada para: {", ".join(emails)}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Erro ao enviar e-mail: {e}'))
            self.stdout.write(self.style.SUCCESS('Exibindo notificação no console:'))
            self.stdout.write('=' * 50)
            self.stdout.write(assunto)
            self.stdout.write('=' * 50)
            self.stdout.write(mensagem)
            self.stdout.write('=' * 50) 