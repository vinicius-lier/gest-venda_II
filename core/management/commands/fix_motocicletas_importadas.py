from django.core.management.base import BaseCommand
from core.models import Motocicleta

class Command(BaseCommand):
    help = 'Ativa todas as motocicletas que foram importadas mas estão inativas'

    def handle(self, *args, **options):
        # Buscar motocicletas inativas
        motos_inativas = Motocicleta.objects.filter(ativo=False)
        
        if motos_inativas.exists():
            # Ativar todas as motocicletas inativas
            motos_inativas.update(ativo=True)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ {motos_inativas.count()} motocicletas foram ativadas com sucesso!'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('ℹ️  Nenhuma motocicleta inativa encontrada.')
            )
        
        # Mostrar estatísticas
        total_motos = Motocicleta.objects.count()
        motos_ativas = Motocicleta.objects.filter(ativo=True).count()
        
        self.stdout.write(
            f'📊 Estatísticas: {motos_ativas}/{total_motos} motocicletas ativas'
        ) 