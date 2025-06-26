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
        logger.debug(f"RBACMiddleware: request.user={request.user} (id={getattr(request.user, 'id', None)}) autenticado={request.user.is_authenticated}")
        
        if request.user.is_authenticated:
            # Log detalhado para debug
            logger.debug(f"DEBUG: Usuário autenticado: {request.user.username}")
            logger.debug(f"DEBUG: is_superuser: {request.user.is_superuser}")
            logger.debug(f"DEBUG: is_staff: {request.user.is_staff}")
            logger.debug(f"DEBUG: is_active: {request.user.is_active}")
            
            # Define o perfil baseado no status de superusuário
            perfil_nome = 'admin' if request.user.is_superuser else 'usuario'
            
            # Por enquanto, apenas define um usuário_sistema básico
            request.usuario_sistema = {
                'nome': request.user.username,
                'email': getattr(request.user, 'email', ''),
                'perfil': {'nome': perfil_nome},
                'is_admin': request.user.is_superuser,
                'is_superuser': request.user.is_superuser  # Adicionar também o atributo original
            }
            logger.debug(f"DEBUG: usuario_sistema criado - Perfil: {perfil_nome}, is_admin: {request.user.is_superuser}")
        else:
            logger.debug("DEBUG: Usuário não autenticado")
            
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
        # Por enquanto, não faz log para evitar erros
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 