from django.core.management.base import BaseCommand
from core.models import Perfil, MenuPerfil

class Command(BaseCommand):
    help = 'Atualiza os menus de todos os perfis para garantir que o módulo pre_venda apareça.'

    def handle(self, *args, **options):
        modulos_por_perfil = {
            'admin': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                'seguros', 'usuarios', 'lojas', 'relatorios', 'ocorrencias',
                'seguradoras', 'bens', 'cotacoes', 'financeiro', 'pre_venda'
            ],
            'gerente': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                'seguros', 'relatorios', 'ocorrencias',
                'seguradoras', 'bens', 'cotacoes', 'financeiro', 'pre_venda'
            ],
            'vendedor': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes',
                'seguradoras', 'bens', 'cotacoes', 'pre_venda'
            ],
            'consultor': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 'seguros',
                'seguradoras', 'bens', 'cotacoes', 'pre_venda'
            ],
            'financeiro': [
                'clientes', 'vendas', 'consignacoes', 'seguros', 'relatorios',
                'seguradoras', 'bens', 'cotacoes', 'financeiro', 'pre_venda'
            ],
            'ti': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes', 
                'seguros', 'usuarios', 'lojas', 'relatorios', 'ocorrencias',
                'seguradoras', 'bens', 'cotacoes', 'financeiro', 'pre_venda'
            ],
            'recepcionista': [
                'clientes', 'motocicletas', 'vendas', 'consignacoes',
                'seguradoras', 'bens', 'cotacoes', 'ocorrencias', 'pre_venda'
            ]
        }

        total = 0
        for perfil in Perfil.objects.all():
            modulos = modulos_por_perfil.get(perfil.nome, [])
            for modulo in modulos:
                obj, created = MenuPerfil.objects.get_or_create(perfil=perfil, modulo=modulo, defaults={'ativo': True})
                if created:
                    self.stdout.write(f"Menu criado: {perfil.nome} - {modulo}")
                    total += 1
        self.stdout.write(self.style.SUCCESS(f"Menus atualizados! Total de novos menus criados: {total}")) 