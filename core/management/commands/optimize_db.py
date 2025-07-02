from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache
import time

class Command(BaseCommand):
    help = 'Otimiza o banco de dados para melhor performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--analyze',
            action='store_true',
            help='Executa ANALYZE nas tabelas'
        )
        parser.add_argument(
            '--vacuum',
            action='store_true',
            help='Executa VACUUM nas tabelas (apenas SQLite)'
        )
        parser.add_argument(
            '--clear-cache',
            action='store_true',
            help='Limpa o cache do Django'
        )

    def handle(self, *args, **options):
        self.stdout.write('Iniciando otimização do banco de dados...')
        
        start_time = time.time()
        
        with connection.cursor() as cursor:
            # Verificar tipo de banco
            db_engine = connection.vendor
            
            if options['analyze']:
                self.stdout.write('Executando ANALYZE...')
                if db_engine == 'sqlite':
                    cursor.execute('ANALYZE')
                elif db_engine == 'postgresql':
                    cursor.execute('ANALYZE')
                elif db_engine == 'mysql':
                    cursor.execute('ANALYZE TABLE core_cliente, core_motocicleta, core_venda, core_usuario')
                self.stdout.write(self.style.SUCCESS('ANALYZE executado com sucesso'))
            
            if options['vacuum'] and db_engine == 'sqlite':
                self.stdout.write('Executando VACUUM...')
                cursor.execute('VACUUM')
                self.stdout.write(self.style.SUCCESS('VACUUM executado com sucesso'))
            
            # Otimizações específicas por banco
            if db_engine == 'sqlite':
                self.stdout.write('Otimizando SQLite...')
                cursor.execute('PRAGMA optimize')
                cursor.execute('PRAGMA wal_checkpoint(TRUNCATE)')
                self.stdout.write(self.style.SUCCESS('SQLite otimizado'))
            
            elif db_engine == 'postgresql':
                self.stdout.write('Otimizando PostgreSQL...')
                cursor.execute('REINDEX DATABASE current_database()')
                self.stdout.write(self.style.SUCCESS('PostgreSQL otimizado'))
            
            elif db_engine == 'mysql':
                self.stdout.write('Otimizando MySQL...')
                cursor.execute('OPTIMIZE TABLE core_cliente, core_motocicleta, core_venda, core_usuario')
                self.stdout.write(self.style.SUCCESS('MySQL otimizado'))
        
        if options['clear_cache']:
            self.stdout.write('Limpando cache...')
            cache.clear()
            self.stdout.write(self.style.SUCCESS('Cache limpo'))
        
        end_time = time.time()
        duration = end_time - start_time
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Otimização concluída em {duration:.2f} segundos!'
            )
        ) 