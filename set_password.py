import os
import django

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_vendas.settings')
django.setup()

from django.contrib.auth.models import User

# Buscar o usuário vinicius
user = User.objects.get(username='vinicius')

# Definir a senha
user.set_password('V1n1c1u5')
user.save()

print("Senha definida com sucesso para o usuário vinicius!") 