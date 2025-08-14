from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import json

@csrf_exempt
@require_http_methods(["POST"])
def simple_login(request):
    """View de login simples para teste"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({
                'error': 'Username e password são obrigatórios'
            }, status=400)
        
        # Autenticar usuário
        user = authenticate(username=username, password=password)
        
        if user is None:
            return JsonResponse({
                'error': 'Credenciais inválidas'
            }, status=401)
        
        if not user.is_active:
            return JsonResponse({
                'error': 'Usuário inativo'
            }, status=401)
        
        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return JsonResponse({
            'success': True,
            'message': 'Login realizado com sucesso',
            'data': {
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                }
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'JSON inválido'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': 'Erro interno do servidor',
            'details': str(e)
        }, status=500)

@require_http_methods(["GET"])
def simple_test(request):
    """View de teste simples"""
    return JsonResponse({
        'message': 'API funcionando!',
        'status': 'success'
    })

@require_http_methods(["GET"])
def health_check(request):
    """Health check simples"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'Django está funcionando'
    })
