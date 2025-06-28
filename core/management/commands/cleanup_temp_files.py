from django.core.management.base import BaseCommand
import os
from django.conf import settings
import glob

class Command(BaseCommand):
    help = 'Limpa arquivos temporários de upload antigos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra quais arquivos seriam removidos sem removê-los',
        )

    def handle(self, *args, **options):
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
        
        if not os.path.exists(temp_dir):
            self.stdout.write(
                self.style.WARNING(f'Diretório temporário não encontrado: {temp_dir}')
            )
            return
        
        # Buscar arquivos temporários (mais de 1 hora de idade)
        import time
        current_time = time.time()
        files_to_remove = []
        
        for file_path in glob.glob(os.path.join(temp_dir, 'temp_*')):
            file_age = current_time - os.path.getmtime(file_path)
            # Remover arquivos com mais de 1 hora
            if file_age > 3600:  # 1 hora em segundos
                files_to_remove.append(file_path)
        
        if not files_to_remove:
            self.stdout.write(
                self.style.SUCCESS('Nenhum arquivo temporário antigo encontrado.')
            )
            return
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(f'Seriam removidos {len(files_to_remove)} arquivos:')
            )
            for file_path in files_to_remove:
                self.stdout.write(f'  - {os.path.basename(file_path)}')
        else:
            removed_count = 0
            for file_path in files_to_remove:
                try:
                    os.remove(file_path)
                    removed_count += 1
                    self.stdout.write(f'Removido: {os.path.basename(file_path)}')
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Erro ao remover {os.path.basename(file_path)}: {e}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'Removidos {removed_count} arquivos temporários.')
            ) 