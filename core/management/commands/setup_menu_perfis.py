from django.core.management.base import BaseCommand
from core.models import Perfil, MenuPerfil
from django.db import transaction
import logging

logger = logging.getLogger('core')

class Command(BaseCommand):
    help = 'Configura automaticamente os menus para todos os perfis existentes'

    def handle(self, *args, **options):
        self.stdout.write('Configurando menus para todos os perfis...')
        
        try:
            with transaction.atomic():
                # Módulos padrão por perfil
                modulos_por_perfil = {
                    'admin': [
                        'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                        'seguros', 'usuarios', 'lojas', 'relatorios', 'ocorrencias',
                        'seguradoras', 'bens', 'cotacoes', 'financeiro'
                    ],
                    'gerente': [
                        'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                        'seguros', 'relatorios', 'ocorrencias',
                        'seguradoras', 'bens', 'cotacoes', 'financeiro'
                    ],
                    'vendedor': [
                        'clientes', 'motocicletas', 'vendas', 'consignacoes',
                        'seguradoras', 'bens', 'cotacoes'
                    ],
                    'consultor': [
                        'clientes', 'motocicletas', 'vendas', 'consignacoes', 'seguros',
                        'seguradoras', 'bens', 'cotacoes'
                    ],
                    'financeiro': [
                        'clientes', 'vendas', 'consignacoes', 'seguros', 'relatorios',
                        'seguradoras', 'bens', 'cotacoes', 'financeiro'
                    ],
                    'ti': [
                        'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                        'seguros', 'usuarios', 'lojas', 'relatorios', 'ocorrencias',
                        'seguradoras', 'bens', 'cotacoes', 'financeiro'
                    ]
                }
                
                menus_criados = 0
                perfis_processados = 0
                
                for perfil in Perfil.objects.all():
                    self.stdout.write(f'Processando perfil: {perfil.get_nome_display()}')
                    
                    # Obter módulos para o perfil
                    modulos = modulos_por_perfil.get(perfil.nome, [])
                    
                    if not modulos:
                        self.stdout.write(f'  ⚠️  Nenhum módulo configurado para o perfil {perfil.nome}')
                        continue
                    
                    # Criar registros de MenuPerfil
                    for modulo in modulos:
                        menu_perfil, created = MenuPerfil.objects.get_or_create(
                            perfil=perfil,
                            modulo=modulo,
                            defaults={'ativo': True}
                        )
                        
                        if created:
                            self.stdout.write(f'  ✅ Menu criado: {modulo}')
                            menus_criados += 1
                        else:
                            self.stdout.write(f'  ℹ️  Menu já existe: {modulo}')
                    
                    perfis_processados += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Configuração concluída! '
                        f'Perfis processados: {perfis_processados}, '
                        f'Menus criados: {menus_criados}'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro durante a configuração: {str(e)}')
            )
            logger.error(f'Erro no comando setup_menu_perfis: {str(e)}')
            raise 