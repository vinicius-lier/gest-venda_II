#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_vendas.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Usuario, Loja, Perfil

def fix_vinicius():
    print("Verificando usuário vinicius...")
    
    try:
        # Buscar usuário vinicius
        user = User.objects.get(username='vinicius')
        print(f"User encontrado: {user.username}, superuser: {user.is_superuser}")
        
        # Verificar se já tem Usuario
        try:
            usuario = Usuario.objects.get(user=user)
            print(f"Usuario já existe: {usuario.loja.nome}, {usuario.perfil.nome}")
            return
        except Usuario.DoesNotExist:
            print("Usuario não encontrado, criando...")
        
        # Buscar ou criar loja padrão
        loja, created = Loja.objects.get_or_create(
            nome='Prado Motors',
            defaults={
                'cnpj': '00.000.000/0001-00',
                'cidade': 'Angra dos Reis',
                'endereco': 'Endereço padrão',
                'telefone': '(11) 0000-0000',
                'email': 'contato@pradomotors.com',
                'ativo': True
            }
        )
        print(f"Loja: {loja.nome}")
        
        # Buscar ou criar perfil admin
        perfil, created = Perfil.objects.get_or_create(
            nome='admin',
            defaults={'descricao': 'Administrador do sistema'}
        )
        print(f"Perfil: {perfil.nome}")
        
        # Criar Usuario para vinicius
        usuario = Usuario.objects.create(
            user=user,
            loja=loja,
            perfil=perfil,
            status='ativo'
        )
        print(f"Usuario criado com sucesso: {usuario.user.username} -> {usuario.loja.nome}, {usuario.perfil.nome}")
        
    except User.DoesNotExist:
        print("Usuário vinicius não encontrado!")
    except Exception as e:
        print(f"Erro: {str(e)}")

if __name__ == "__main__":
    fix_vinicius() 