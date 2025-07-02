import os
import django

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_vendas.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Loja, Perfil, Usuario

# Buscar o usuário vinicius
user = User.objects.get(username='vinicius')

# Definir a senha
user.set_password('V1n1c1u5')
user.save()

# Buscar a loja correta
loja = Loja.objects.get(nome='Prado Motors')

# Criar perfil admin se não existir
perfil, _ = Perfil.objects.get_or_create(nome='admin', defaults={'descricao': 'Administrador do sistema'})

# Criar Usuario (usuario_sistema) se não existir
if not hasattr(user, 'usuario_sistema'):
    Usuario.objects.create(user=user, loja=loja, perfil=perfil, status='ativo')
    print("Usuario vinculado ao superuser criado com sucesso!")
else:
    print("Usuario já existe para o superuser.")

print("Senha definida com sucesso para o usuário vinicius!") 