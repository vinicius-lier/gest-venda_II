# -*- coding: utf-8 -*-
"""
Comando para limpar arquivos temporários de importação
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import os
import glob
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Limpa arquivos temporários de importação'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a limpeza sem confirmação',
        )
        parser.add_argument(
            '--older-than',
            type=int,
            default=24,
            help='Remove arquivos mais antigos que X horas (padrão: 24)',
        )

    def handle(self, *args, **options):
        force = options['force']
        older_than_hours = options['older_than']
        
        # Determinar diretório temporário
        if hasattr(settings, 'TEMP_DIR'):
            temp_dir = settings.TEMP_DIR
        else:
            temp_dir = '/tmp'
        
        self.stdout.write(f"Procurando arquivos temporários em: {temp_dir}")
        
        if not os.path.exists(temp_dir):
            self.stdout.write(self.style.WARNING(f"Diretório {temp_dir} não existe"))
            return
        
        # Padrões de arquivos temporários
        patterns = [
            os.path.join(temp_dir, 'temp_*.csv'),
            os.path.join(temp_dir, 'temp_*.xlsx'),
            os.path.join(temp_dir, 'temp_*.xls'),
            os.path.join(temp_dir, 'temp_clientes_*'),
            os.path.join(temp_dir, 'temp_vendas_*'),
        ]
        
        files_to_remove = []
        
        for pattern in patterns:
            files = glob.glob(pattern)
            for file_path in files:
                try:
                    # Verificar idade do arquivo
                    file_age_hours = (os.path.getmtime(file_path) - os.path.getctime(file_path)) / 3600
                    
                    if file_age_hours > older_than_hours:
                        files_to_remove.append((file_path, file_age_hours))
                except Exception as e:
                    logger.warning(f"Erro ao verificar arquivo {file_path}: {str(e)}")
        
        if not files_to_remove:
            self.stdout.write(self.style.SUCCESS("Nenhum arquivo temporário encontrado para remoção"))
            return
        
        self.stdout.write(f"Encontrados {len(files_to_remove)} arquivos temporários:")
        for file_path, age_hours in files_to_remove:
            self.stdout.write(f"  - {os.path.basename(file_path)} (idade: {age_hours:.1f}h)")
        
        if not force:
            confirm = input("\nDeseja remover estes arquivos? (y/N): ")
            if confirm.lower() != 'y':
                self.stdout.write("Operação cancelada")
                return
        
        removed_count = 0
        for file_path, age_hours in files_to_remove:
            try:
                os.remove(file_path)
                removed_count += 1
                self.stdout.write(f"Removido: {os.path.basename(file_path)}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Erro ao remover {file_path}: {str(e)}"))
        
        self.stdout.write(
            self.style.SUCCESS(f"Limpeza concluída: {removed_count} arquivos removidos")
        ) 