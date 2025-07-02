from django.core.management.base import BaseCommand
from core.models import Perfil, Permissao


class Command(BaseCommand):
    help = 'Configura o perfil de recepcionista com suas permissões específicas'

    def handle(self, *args, **options):
        # Criar ou obter o perfil de recepcionista
        perfil, created = Perfil.objects.get_or_create(
            nome='recepcionista',
            defaults={'descricao': 'Recepcionista - Atendimento ao cliente e suporte básico'}
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Perfil de recepcionista criado com sucesso!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Perfil de recepcionista já existe.')
            )

        # Definir permissões específicas para recepcionista
        permissoes_recepcionista = [
            # Clientes - Acesso básico
            ('clientes', 'visualizar'),
            ('clientes', 'criar'),
            ('clientes', 'editar'),
            ('clientes', 'listar'),
            
            # Motocicletas - Acesso básico
            ('motos', 'visualizar'),
            ('motos', 'listar'),
            
            # Vendas - Apenas visualização
            ('vendas', 'visualizar'),
            ('vendas', 'listar'),
            
            # Consignações - Apenas visualização
            ('consignacoes', 'visualizar'),
            ('consignacoes', 'listar'),
            
            # Seguros - Apenas visualização
            ('seguros', 'visualizar'),
            ('seguros', 'listar'),
            
            # Ocorrências - Pode criar e visualizar
            ('ocorrencias', 'criar'),
            ('ocorrencias', 'visualizar'),
            ('ocorrencias', 'editar'),
            ('ocorrencias', 'listar'),
        ]

        # Criar permissões
        for modulo, acao in permissoes_recepcionista:
            permissao, created = Permissao.objects.get_or_create(
                modulo=modulo,
                acao=acao,
                perfil=perfil
            )
            
            if created:
                self.stdout.write(
                    f'Permissão criada: {modulo} - {acao}'
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Perfil de recepcionista configurado com {len(permissoes_recepcionista)} permissões!'
            )
        ) 