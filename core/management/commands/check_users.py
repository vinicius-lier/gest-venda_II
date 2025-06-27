from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Usuario, Loja, Perfil
import logging

logger = logging.getLogger('core')

class Command(BaseCommand):
    help = 'Verifica o status dos usuários no sistema'

    def handle(self, *args, **options):
        self.stdout.write('Verificando status dos usuários...')
        
        # Verificar usuários Django
        users = User.objects.filter(is_active=True)
        self.stdout.write(f'Total de usuários Django ativos: {users.count()}')
        
        for user in users:
            self.stdout.write(f'  - {user.username} (superuser: {user.is_superuser})')
        
        # Verificar usuários do sistema
        usuarios = Usuario.objects.all()
        self.stdout.write(f'\nTotal de usuários do sistema: {usuarios.count()}')
        
        for usuario in usuarios:
            self.stdout.write(f'  - {usuario.user.username} -> Loja: {usuario.loja.nome}, Perfil: {usuario.perfil.nome}')
        
        # Verificar usuários sem usuario_sistema
        users_without_sistema = []
        for user in users:
            if not hasattr(user, 'usuario_sistema') or user.usuario_sistema is None:
                users_without_sistema.append(user.username)
        
        if users_without_sistema:
            self.stdout.write(
                self.style.WARNING(f'\nUsuários sem usuario_sistema: {len(users_without_sistema)}')
            )
            for username in users_without_sistema:
                self.stdout.write(f'  - {username}')
        else:
            self.stdout.write(
                self.style.SUCCESS('\nTodos os usuários têm usuario_sistema configurado!')
            )
        
        # Verificar lojas
        lojas = Loja.objects.filter(ativo=True)
        self.stdout.write(f'\nLojas ativas: {lojas.count()}')
        for loja in lojas:
            self.stdout.write(f'  - {loja.nome} ({loja.cidade})')
        
        # Verificar perfis
        perfis = Perfil.objects.all()
        self.stdout.write(f'\nPerfis disponíveis: {perfis.count()}')
        for perfil in perfis:
            self.stdout.write(f'  - {perfil.nome}: {perfil.descricao}')
        
        self.stdout.write('\nVerificação concluída!') 