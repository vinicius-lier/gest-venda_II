from django.shortcuts import redirect
from django.contrib import messages
from django.urls import reverse
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
import re
import logging
logger = logging.getLogger('core')

class RBACMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Só processar se o usuário estiver autenticado
        if request.user.is_authenticated:
            try:
                # Verificar se o usuário tem usuario_sistema real no banco
                from .models import Usuario
                usuario_sistema = Usuario.objects.filter(user=request.user).first()
                
                if usuario_sistema:
                    request.usuario_sistema = usuario_sistema
                else:
                    # Criar um usuario_sistema temporário simples
                    request.usuario_sistema = {
                        'nome': request.user.username,
                        'email': getattr(request.user, 'email', ''),
                        'perfil': {'nome': 'admin' if request.user.is_superuser else 'usuario'},
                        'is_admin': request.user.is_superuser,
                        'is_superuser': request.user.is_superuser,
                        'loja': None  # Será definido quando necessário
                    }
                    
            except Exception as e:
                logger.error(f"Erro no RBACMiddleware: {str(e)}")
                # Em caso de erro, criar um temporário básico
                request.usuario_sistema = {
                    'nome': request.user.username,
                    'email': getattr(request.user, 'email', ''),
                    'perfil': {'nome': 'usuario'},
                    'is_admin': request.user.is_superuser,
                    'is_superuser': request.user.is_superuser,
                    'loja': None
                }
        else:
            request.usuario_sistema = None
            
        return self.get_response(request)

class LoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Adiciona informações ao request para uso posterior
        request.log_info = {
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 