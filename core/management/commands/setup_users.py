from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Usuario, Loja, Perfil
from django.db import transaction
import logging

logger = logging.getLogger('core')

class Command(BaseCommand):
    help = 'Configura automaticamente os usuários do sistema'

    def handle(self, *args, **options):
        self.stdout.write('Configurando usuários do sistema...')
        
        try:
            with transaction.atomic():
                # Criar loja padrão se não existir
                loja_padrao, created = Loja.objects.get_or_create(
                    nome='Loja Principal',
                    defaults={
                        'cnpj': '00.000.000/0001-00',
                        'cidade': 'São Paulo',
                        'endereco': 'Endereço padrão',
                        'telefone': '(11) 0000-0000',
                        'email': 'contato@loja.com',
                        'ativo': True
                    }
                )
                
                if created:
                    self.stdout.write(f'Loja padrão criada: {loja_padrao.nome}')
                else:
                    self.stdout.write(f'Loja padrão já existe: {loja_padrao.nome}')
                
                # Criar perfil admin se não existir
                perfil_admin, created = Perfil.objects.get_or_create(
                    nome='admin',
                    defaults={'descricao': 'Administrador do sistema'}
                )
                
                if created:
                    self.stdout.write(f'Perfil admin criado: {perfil_admin.nome}')
                else:
                    self.stdout.write(f'Perfil admin já existe: {perfil_admin.nome}')
                
                # Criar perfil usuário se não existir
                perfil_usuario, created = Perfil.objects.get_or_create(
                    nome='usuario',
                    defaults={'descricao': 'Usuário padrão do sistema'}
                )
                
                if created:
                    self.stdout.write(f'Perfil usuário criado: {perfil_usuario.nome}')
                else:
                    self.stdout.write(f'Perfil usuário já existe: {perfil_usuario.nome}')
                
                # Configurar usuários existentes
                users_created = 0
                users_updated = 0
                
                for user in User.objects.filter(is_active=True):
                    usuario_sistema, created = Usuario.objects.get_or_create(
                        user=user,
                        defaults={
                            'loja': loja_padrao,
                            'perfil': perfil_admin if user.is_superuser else perfil_usuario,
                            'status': 'ativo'
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'Usuario_sistema criado para: {user.username}')
                        users_created += 1
                    else:
                        # Atualizar se necessário
                        if usuario_sistema.loja != loja_padrao:
                            usuario_sistema.loja = loja_padrao
                            usuario_sistema.save()
                            self.stdout.write(f'Loja atualizada para: {user.username}')
                            users_updated += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Configuração concluída! '
                        f'Usuários criados: {users_created}, '
                        f'Usuários atualizados: {users_updated}'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro durante a configuração: {str(e)}')
            )
            logger.error(f'Erro no comando setup_users: {str(e)}')
            raise 