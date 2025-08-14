from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from core.models import Usuario, Cliente, Motocicleta, Venda, Loja, Seguro, Ocorrencia, Notificacao, HistoricoVendas, HistoricoProprietario, Despesa, ReceitaExtra, Contrato
import logging
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .serializers import (
    ClienteSerializer, MotocicletaSerializer, VendaSerializer, 
    UsuarioSerializer, OcorrenciaSerializer, MotocicletaCreateSerializer,
    VendaCreateSerializer, OcorrenciaCreateSerializer, LojaSerializer,
    SeguroSerializer, NotificacaoSerializer, HistoricoVendasSerializer,
    HistoricoProprietarioSerializer, DespesaSerializer, ReceitaExtraSerializer,
    ContratoSerializer
)
from django.http import HttpResponse
from django.template.loader import render_to_string
import weasyprint
from io import BytesIO
import json

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_api(request):
    """View de teste para verificar se a API está funcionando"""
    try:
        return Response({
            'message': 'API funcionando!',
            'status': 'success',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Erro na view de teste: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response({
                    'error': 'Username e password são obrigatórios'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Autenticar usuário
            user = authenticate(username=username, password=password)
            
            if user is None:
                return Response({
                    'error': 'Credenciais inválidas'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                return Response({
                    'error': 'Usuário inativo'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Gerar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            # Buscar dados do usuário do sistema
            try:
                usuario_sistema = Usuario.objects.get(user=user)
                user_data = {
                    'id': usuario_sistema.id,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                        'date_joined': user.date_joined.isoformat(),
                    },
                    'loja': {
                        'id': usuario_sistema.loja.id,
                        'nome': usuario_sistema.loja.nome,
                    },
                    'perfil': {
                        'id': usuario_sistema.perfil.id,
                        'nome': usuario_sistema.perfil.nome,
                    },
                    'telefone': usuario_sistema.telefone,
                    'status': usuario_sistema.status,
                    'data_cadastro': usuario_sistema.data_cadastro.isoformat(),
                }
            except Usuario.DoesNotExist:
                # Se não há objeto Usuario, retornar apenas dados básicos
                user_data = {
                    'id': user.id,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                        'date_joined': user.date_joined.isoformat(),
                    },
                    'loja': None,
                    'perfil': None,
                    'telefone': '',
                    'status': 'ativo',
                    'data_cadastro': user.date_joined.isoformat(),
                }
            
            return Response({
                'success': True,
                'message': 'Login realizado com sucesso',
                'data': {
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': user_data
                }
            })
            
        except Exception as e:
            logger.error(f"Erro no login: {e}")
            return Response({
                'error': 'Erro interno do servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Buscar dados do usuário do sistema
            try:
                usuario_sistema = Usuario.objects.get(user=user)
                user_data = {
                    'id': usuario_sistema.id,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                        'date_joined': user.date_joined.isoformat(),
                    },
                    'loja': {
                        'id': usuario_sistema.loja.id,
                        'nome': usuario_sistema.loja.nome,
                    },
                    'perfil': {
                        'id': usuario_sistema.perfil.id,
                        'nome': usuario_sistema.perfil.nome,
                    },
                    'telefone': usuario_sistema.telefone,
                    'status': usuario_sistema.status,
                    'data_cadastro': usuario_sistema.data_cadastro.isoformat(),
                }
            except Usuario.DoesNotExist:
                # Se não há objeto Usuario, retornar apenas dados básicos
                user_data = {
                    'id': user.id,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                        'date_joined': user.date_joined.isoformat(),
                    },
                    'loja': None,
                    'perfil': None,
                    'telefone': '',
                    'status': 'ativo',
                    'data_cadastro': user.date_joined.isoformat(),
                }
            
            return Response({
                'success': True,
                'data': user_data
            })
            
        except Exception as e:
            logger.error(f"Erro ao buscar usuário atual: {e}")
            return Response({
                'error': 'Erro interno do servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Viewsets implementados
class UsuarioViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UsuarioSerializer
    queryset = Usuario.objects.all()

# Views de API para CRUD de usuários
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuarios_list(request):
    """Lista todos os usuários (Users do Django)"""
    try:
        from django.contrib.auth.models import User
        
        # Buscar todos os Users do Django
        users = User.objects.all().order_by('id')
        
        # Serializar os dados dos Users
        usuarios_data = []
        for user in users:
            # Verificar se tem modelo Usuario associado
            tem_usuario = hasattr(user, 'usuario_sistema')
            
            usuario_data = {
                'id': user.id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined
                },
                'loja': None,
                'perfil': None,
                'telefone': '',
                'status': 'ativo' if user.is_active else 'inativo',
                'data_cadastro': user.date_joined,
                'ultimo_acesso': None,
                'precisa_trocar_senha': False,
                'foto': None,
                'tem_usuario_sistema': tem_usuario
            }
            
            # Se tem modelo Usuario, incluir dados adicionais
            if tem_usuario:
                usuario_sistema = user.usuario_sistema
                usuario_data.update({
                    'loja': {
                        'id': usuario_sistema.loja.id,
                        'nome': usuario_sistema.loja.nome,
                        'cnpj': usuario_sistema.loja.cnpj,
                        'cidade': usuario_sistema.loja.cidade,
                        'endereco': usuario_sistema.loja.endereco,
                        'telefone': usuario_sistema.loja.telefone,
                        'email': usuario_sistema.loja.email,
                        'ativo': usuario_sistema.loja.ativo,
                        'data_cadastro': usuario_sistema.loja.data_cadastro
                    },
                    'perfil': {
                        'id': usuario_sistema.perfil.id,
                        'nome': usuario_sistema.perfil.nome,
                        'descricao': usuario_sistema.perfil.descricao
                    },
                    'telefone': usuario_sistema.telefone or '',
                    'status': usuario_sistema.status,
                    'data_cadastro': usuario_sistema.data_cadastro,
                    'ultimo_acesso': usuario_sistema.ultimo_acesso,
                    'precisa_trocar_senha': usuario_sistema.precisa_trocar_senha,
                    'foto': usuario_sistema.foto.url if usuario_sistema.foto else None
                })
            
            usuarios_data.append(usuario_data)
        
        return Response({
            'success': True,
            'data': usuarios_data
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def usuarios_create(request):
    """Cria um novo usuário"""
    try:
        # Tratar dados antes de validar
        data = request.data.copy()
        
        # Converter campos vazios para None/null
        for field in ['telefone', 'observacoes']:
            if field in data and data[field] == '':
                data[field] = None
        
        # Garantir que campos obrigatórios do user sejam strings válidas
        if 'user' in data:
            for field in ['username', 'first_name', 'last_name', 'email']:
                if field in data['user'] and data['user'][field] == '':
                    data['user'][field] = None
        
        # Definir loja padrão se não fornecida
        if not data.get('loja'):
            data['loja'] = request.user.usuario.loja.id
        
        serializer = UsuarioSerializer(data=data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response({
                'success': True,
                'data': UsuarioSerializer(usuario).data,
                'message': 'Usuário criado com sucesso'
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': 'Dados inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Erro ao criar usuário',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def usuarios_update(request, pk):
    """Atualiza um usuário existente"""
    try:
        # Verificar se o usuário tem permissão
        if not (request.user.is_superuser or request.user.has_perm('auth.change_user')):
            return Response({
                'success': False,
                'error': 'Você não tem permissão para editar usuários'
            }, status=status.HTTP_403_FORBIDDEN)

        usuario = Usuario.objects.get(id=pk)
        user = usuario.user

        # Atualizar dados do User
        user_data = request.data.get('user', {})
        user.username = user_data.get('username', user.username)
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.email = user_data.get('email', user.email)
        user.is_active = user_data.get('is_active', user.is_active)
        user.save()

        # Atualizar dados do Usuario
        if request.data.get('loja'):
            from .models import Loja
            usuario.loja = Loja.objects.get(id=request.data.get('loja'))
        if request.data.get('perfil'):
            from .models import Perfil
            usuario.perfil = Perfil.objects.get(id=request.data.get('perfil'))
        usuario.telefone = request.data.get('telefone', usuario.telefone)
        usuario.status = request.data.get('status', usuario.status)
        usuario.save()

        # Atualizar senha se fornecida
        password1 = request.data.get('password1')
        if password1:
            user.set_password(password1)
            user.save()
            usuario.precisa_trocar_senha = True
            usuario.save()

        usuario.refresh_from_db()  # Recarregar para incluir relacionamentos
        serializer = UsuarioSerializer(usuario)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Usuario.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Usuário não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def usuarios_delete(request, pk):
    """Exclui um usuário"""
    try:
        # Verificar se o usuário tem permissão
        if not (request.user.is_superuser or request.user.has_perm('auth.delete_user')):
            return Response({
                'success': False,
                'error': 'Você não tem permissão para excluir usuários'
            }, status=status.HTTP_403_FORBIDDEN)

        # Verificar se não está tentando excluir a si mesmo
        if request.user.id == pk:
            return Response({
                'success': False,
                'error': 'Você não pode excluir seu próprio usuário'
            }, status=status.HTTP_400_BAD_REQUEST)

        usuario = Usuario.objects.get(id=pk)
        user = usuario.user
        
        # Excluir usuário e user
        usuario.delete()
        user.delete()

        return Response({
            'success': True,
            'message': 'Usuário excluído com sucesso'
        })
    except Usuario.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Usuário não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print(f"Erro na exclusão de usuário: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LojaViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LojaSerializer
    queryset = Loja.objects.filter(ativo=True)

class ClienteViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClienteSerializer
    queryset = Cliente.objects.all()

class MotocicletaViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MotocicletaSerializer
    queryset = Motocicleta.objects.all()
    
    def get(self, request):
        """Lista todas as motocicletas com debug"""
        try:
            motocicletas = Motocicleta.objects.all()
            serializer = MotocicletaSerializer(motocicletas, many=True)
            
            # Debug: Verificar dados processados
            for i, moto_data in enumerate(serializer.data):
                print(f"🔍 Motocicleta {i + 1} (ID: {moto_data.get('id')}):")
                print(f"   - Fotos: {moto_data.get('fotos')}")
                print(f"   - Foto principal index: {moto_data.get('foto_principal_index')}")
                print(f"   - Fotos length: {len(moto_data.get('fotos', []))}")
                print(f"   - Fotos type: {type(moto_data.get('fotos'))}")
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            print(f"❌ Erro na view de motocicletas: {e}")
            return Response({
                'error': 'Erro ao buscar motocicletas',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VendaViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VendaSerializer
    queryset = Venda.objects.all()

class ConsignacaoViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class SeguradoraViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class PlanoSeguroViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class BemViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class SeguroViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SeguroSerializer
    queryset = Seguro.objects.all()

class OcorrenciaViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OcorrenciaSerializer
    queryset = Ocorrencia.objects.all()

    def get(self, request):
        """Lista todas as ocorrências"""
        try:
            ocorrencias = Ocorrencia.objects.all().select_related(
                'loja', 'solicitante', 'responsavel', 'solicitante__user', 'responsavel__user'
            )
            serializer = OcorrenciaSerializer(ocorrencias, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'error': 'Erro ao buscar ocorrências',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Cria uma nova ocorrência"""
        try:
            # Tratar dados antes de validar
            data = request.data.copy()
            
            # Definir valores padrão se não fornecidos
            if not data.get('loja'):
                try:
                    data['loja'] = request.user.usuario.loja.id
                except:
                    # Se não conseguir acessar, usar primeira loja disponível
                    from .models import Loja
                    loja = Loja.objects.first()
                    if loja:
                        data['loja'] = loja.id
                    else:
                        return Response({
                            'error': 'É necessário ter pelo menos uma loja cadastrada'
                        }, status=status.HTTP_400_BAD_REQUEST)
            
            if not data.get('solicitante'):
                try:
                    data['solicitante'] = request.user.usuario.id
                except:
                    # Se não conseguir acessar, usar primeiro usuário disponível
                    from .models import Usuario
                    usuario = Usuario.objects.first()
                    if usuario:
                        data['solicitante'] = usuario.id
                    else:
                        return Response({
                            'error': 'É necessário ter pelo menos um usuário cadastrado'
                        }, status=status.HTTP_400_BAD_REQUEST)
            
            if not data.get('responsavel'):
                data['responsavel'] = data['solicitante']  # Usar mesmo usuário como responsável
            
            serializer = OcorrenciaCreateSerializer(data=data)
            if serializer.is_valid():
                ocorrencia = serializer.save()
                return Response({
                    'success': True,
                    'data': OcorrenciaSerializer(ocorrencia).data,
                    'message': 'Ocorrência criada com sucesso'
                }, status=status.HTTP_201_CREATED)
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Erro ao criar ocorrência',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OcorrenciaDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Retorna detalhes de uma ocorrência"""
        try:
            ocorrencia = Ocorrencia.objects.get(pk=pk)
            serializer = OcorrenciaSerializer(ocorrencia)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Ocorrencia.DoesNotExist:
            return Response({
                'error': 'Ocorrência não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Erro ao buscar ocorrência',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, pk):
        """Atualiza uma ocorrência"""
        try:
            ocorrencia = Ocorrencia.objects.get(pk=pk)
            serializer = OcorrenciaSerializer(ocorrencia, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Ocorrência atualizada com sucesso'
                })
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Ocorrencia.DoesNotExist:
            return Response({
                'error': 'Ocorrência não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Erro ao atualizar ocorrência',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, pk):
        """Exclui uma ocorrência"""
        try:
            ocorrencia = Ocorrencia.objects.get(pk=pk)
            ocorrencia.delete()
            return Response({
                'success': True,
                'message': 'Ocorrência excluída com sucesso'
            })
        except Ocorrencia.DoesNotExist:
            return Response({
                'error': 'Ocorrência não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Erro ao excluir ocorrência',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificacaoViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificacaoSerializer
    queryset = Notificacao.objects.all()

class DocumentoMotocicletaViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class ControleChaveViewSet(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class RelatorioVendasView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class RelatorioEstoqueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'data': {'message': 'Endpoint em desenvolvimento'}
        })

class RelatorioFinanceiroView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Parâmetros de filtro
            data_inicio = request.GET.get('data_inicio')
            data_fim = request.GET.get('data_fim')
            loja_id = request.GET.get('loja_id')
            
            # Filtros base
            filtros_vendas = {}
            filtros_despesas = {}
            filtros_receitas = {}
            
            if data_inicio:
                filtros_vendas['data_venda__gte'] = data_inicio
                filtros_despesas['data__gte'] = data_inicio
                filtros_receitas['data__gte'] = data_inicio
            
            if data_fim:
                filtros_vendas['data_venda__lte'] = data_fim
                filtros_despesas['data__lte'] = data_fim
                filtros_receitas['data__lte'] = data_fim
            
            if loja_id:
                filtros_vendas['loja_id'] = loja_id
                filtros_despesas['loja_id'] = loja_id
                filtros_receitas['loja_id'] = loja_id
            
            # Calcular receitas (vendas + receitas extras)
            vendas = Venda.objects.filter(**filtros_vendas, status='vendido')
            receita_vendas = vendas.aggregate(total=Sum('valor_venda'))['total'] or 0
            
            receitas_extras = ReceitaExtra.objects.filter(**filtros_receitas)
            receita_extras = receitas_extras.aggregate(total=Sum('valor'))['total'] or 0
            
            receita_total = receita_vendas + receita_extras
            
            # Calcular despesas
            despesas = Despesa.objects.filter(**filtros_despesas)
            despesas_total = despesas.aggregate(total=Sum('valor'))['total'] or 0
            
            # Calcular lucro líquido
            lucro_liquido = receita_total - despesas_total
            
            # Receitas por período (últimos 12 meses)
            receitas_por_periodo = []
            for i in range(12):
                data = timezone.now() - timedelta(days=30*i)
                mes_inicio = data.replace(day=1)
                mes_fim = (mes_inicio + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                vendas_mes = Venda.objects.filter(
                    data_venda__gte=mes_inicio,
                    data_venda__lte=mes_fim,
                    status='vendido',
                    **({'loja_id': loja_id} if loja_id else {})
                ).aggregate(total=Sum('valor_venda'))['total'] or 0
                
                receitas_mes = ReceitaExtra.objects.filter(
                    data__gte=mes_inicio,
                    data__lte=mes_fim,
                    **({'loja_id': loja_id} if loja_id else {})
                ).aggregate(total=Sum('valor'))['total'] or 0
                
                despesas_mes = Despesa.objects.filter(
                    data__gte=mes_inicio,
                    data__lte=mes_fim,
                    **({'loja_id': loja_id} if loja_id else {})
                ).aggregate(total=Sum('valor'))['total'] or 0
                
                receitas_por_periodo.append({
                    'data': mes_inicio.strftime('%Y-%m'),
                    'receita': float(vendas_mes + receitas_mes),
                    'despesa': float(despesas_mes),
                    'lucro': float(vendas_mes + receitas_mes - despesas_mes)
                })
            
            # Despesas por categoria
            despesas_por_categoria = despesas.values('categoria').annotate(
                total=Sum('valor')
            ).order_by('-total')
            
            # Receitas extras por período
            receitas_extras_por_periodo = receitas_extras.values('data').annotate(
                total=Sum('valor')
            ).order_by('data')
            
            # Últimas transações
            ultimas_vendas = vendas.order_by('-data_venda')[:10]
            ultimas_despesas = despesas.order_by('-data')[:10]
            ultimas_receitas = receitas_extras.order_by('-data')[:10]
            
            return Response({
                'success': True,
                'data': {
                    'receita_total': float(receita_total),
                    'despesas_total': float(despesas_total),
                    'lucro_liquido': float(lucro_liquido),
                    'receita_vendas': float(receita_vendas),
                    'receita_extras': float(receita_extras),
                    'receitas_por_periodo': receitas_por_periodo,
                    'despesas_por_categoria': list(despesas_por_categoria),
                    'receitas_extras_por_periodo': list(receitas_extras_por_periodo),
                    'ultimas_vendas': VendaSerializer(ultimas_vendas, many=True).data,
                    'ultimas_despesas': DespesaSerializer(ultimas_despesas, many=True).data,
                    'ultimas_receitas': ReceitaExtraSerializer(ultimas_receitas, many=True).data,
                    'periodo': {
                        'data_inicio': data_inicio,
                        'data_fim': data_fim
                    }
                }
            })
            
        except Exception as e:
            print(f"❌ Erro no relatório financeiro: {e}")
            return Response({
                'success': False,
                'error': 'Erro ao gerar relatório financeiro',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DespesaViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Listar despesas"""
        try:
            despesas = Despesa.objects.all().order_by('-data')
            serializer = DespesaSerializer(despesas, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Erro ao listar despesas',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Criar nova despesa"""
        try:
            serializer = DespesaSerializer(data=request.data)
            if serializer.is_valid():
                # Adicionar responsável automaticamente
                serializer.save(responsavel=request.user.usuario_sistema)
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Despesa criada com sucesso'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': 'Dados inválidos',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Erro ao criar despesa',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReceitaExtraViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Listar receitas extras"""
        try:
            receitas = ReceitaExtra.objects.all().order_by('-data')
            serializer = ReceitaExtraSerializer(receitas, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Erro ao listar receitas extras',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Criar nova receita extra"""
        try:
            serializer = ReceitaExtraSerializer(data=request.data)
            if serializer.is_valid():
                # Adicionar responsável automaticamente
                serializer.save(responsavel=request.user.usuario_sistema)
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Receita extra criada com sucesso'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': 'Dados inválidos',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Erro ao criar receita extra',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MarcarNotificacaoLidaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            notificacao = Notificacao.objects.get(id=pk)
            notificacao.lida = True
            notificacao.save()
            return Response({
                'success': True,
                'message': 'Notificação marcada como lida'
            })
        except Notificacao.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Notificação não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

# Views para listar dados
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clientes_list(request):
    """Lista todos os clientes"""
    try:
        clientes = Cliente.objects.all()
        serializer = ClienteSerializer(clientes, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar clientes',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clientes_create(request):
    """Cria um novo cliente"""
    try:
        # Tratar dados antes de validar
        data = request.data.copy()
        
        # Converter campos vazios para None/null
        for field in ['data_nascimento', 'rg', 'email', 'endereco', 'cidade', 'estado', 'cep', 'observacoes']:
            if field in data and data[field] == '':
                data[field] = None
        
        serializer = ClienteSerializer(data=data)
        
        if serializer.is_valid():
            cliente = serializer.save()
            return Response({
                'success': True,
                'data': ClienteSerializer(cliente).data,
                'message': 'Cliente criado com sucesso'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Erro ao criar cliente',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clientes_detail(request, pk):
    """Retorna detalhes de um cliente"""
    try:
        cliente = Cliente.objects.get(pk=pk)
        serializer = ClienteSerializer(cliente)
        
        # Buscar histórico de vendas do cliente
        historico_vendas = HistoricoVendas.objects.filter(cliente=cliente).order_by('-data_transacao')
        historico_serializer = HistoricoVendasSerializer(historico_vendas, many=True)
        
        data = serializer.data
        data['historico_vendas'] = historico_serializer.data
        
        return Response({
            'success': True,
            'data': data
        })
    except Cliente.DoesNotExist:
        return Response({
            'error': 'Cliente não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar cliente',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def clientes_update(request, pk):
    """Atualiza um cliente"""
    try:
        cliente = Cliente.objects.get(pk=pk)
        serializer = ClienteSerializer(cliente, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Cliente atualizado com sucesso'
            })
        return Response({
            'error': 'Dados inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Cliente.DoesNotExist:
        return Response({
            'error': 'Cliente não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao atualizar cliente',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clientes_delete(request, pk):
    """Exclui um cliente"""
    try:
        cliente = Cliente.objects.get(pk=pk)
        cliente.delete()
        return Response({
            'success': True,
            'message': 'Cliente excluído com sucesso'
        })
    except Cliente.DoesNotExist:
        return Response({
            'error': 'Cliente não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao excluir cliente',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def motocicletas_list(request):
    """Lista todas as motocicletas"""
    try:
        motocicletas = Motocicleta.objects.all()
        serializer = MotocicletaSerializer(motocicletas, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar motocicletas',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def motocicletas_create(request):
    """Cria uma nova motocicleta"""
    try:
        # Tratar dados antes de validar
        data = request.data.copy()
        
        # Converter campos vazios para None/null
        for field in ['placa', 'renavam', 'ano_fabricacao', 'cilindrada', 'observacoes', 'matricula']:
            if field in data and data[field] == '':
                data[field] = None
        
        # Garantir que valores numéricos sejam válidos
        for field in ['valor_entrada', 'valor_atual', 'rodagem']:
            if field in data and (data[field] is None or data[field] == ''):
                data[field] = 0
        
        # Tratar campos de data
        if 'data_entrada' in data and data['data_entrada']:
            # Se for datetime, converter para date
            if isinstance(data['data_entrada'], str) and 'T' in data['data_entrada']:
                data['data_entrada'] = data['data_entrada'].split('T')[0]
        
        if 'data_venda' in data and data['data_venda']:
            # Se for datetime, converter para date
            if isinstance(data['data_venda'], str) and 'T' in data['data_venda']:
                data['data_venda'] = data['data_venda'].split('T')[0]
        
        # Definir valores padrão para campos obrigatórios se não fornecidos
        if not data.get('proprietario'):
            # Buscar primeiro cliente disponível
            from .models import Cliente
            cliente = Cliente.objects.first()
            if cliente:
                data['proprietario'] = cliente.id
            else:
                return Response({
                    'error': 'É necessário ter pelo menos um cliente cadastrado'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if not data.get('fornecedor'):
            data['fornecedor'] = data['proprietario']  # Usar mesmo cliente como fornecedor
        
        if not data.get('loja_origem'):
            # Usar loja do usuário logado
            try:
                data['loja_origem'] = request.user.usuario.loja.id
            except:
                # Se não conseguir acessar, usar primeira loja disponível
                from .models import Loja
                loja = Loja.objects.first()
                if loja:
                    data['loja_origem'] = loja.id
                else:
                    return Response({
                        'error': 'É necessário ter pelo menos uma loja cadastrada'
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = MotocicletaCreateSerializer(data=data)
        if serializer.is_valid():
            motocicleta = serializer.save()
            return Response({
                'success': True,
                'data': MotocicletaSerializer(motocicleta).data,
                'message': 'Motocicleta criada com sucesso'
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': 'Dados inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Erro ao criar motocicleta',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def motocicletas_detail(request, pk):
    """Retorna detalhes de uma motocicleta"""
    try:
        motocicleta = Motocicleta.objects.get(pk=pk)
        serializer = MotocicletaSerializer(motocicleta)
        
        # Buscar histórico de proprietários da motocicleta
        historico_proprietarios = HistoricoProprietario.objects.filter(moto=motocicleta).order_by('-data_inicio')
        historico_serializer = HistoricoProprietarioSerializer(historico_proprietarios, many=True)
        
        data = serializer.data
        data['historico_proprietarios'] = historico_serializer.data
        
        return Response({
            'success': True,
            'data': data
        })
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar motocicleta',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def motocicletas_update(request, pk):
    """Atualiza uma motocicleta"""
    try:
        motocicleta = Motocicleta.objects.get(pk=pk)
        
        # Log dos dados recebidos
        print(f"🔍 Dados recebidos para atualização: {request.data}")
        
        # Tratar dados antes de validar
        data = request.data.copy()
        
        # Log dos dados após cópia
        print(f"🔍 Dados após cópia: {data}")
        
        # Converter campos vazios para None/null
        for field in ['placa', 'renavam', 'ano_fabricacao', 'cilindrada', 'observacoes', 'matricula']:
            if field in data and data[field] == '':
                data[field] = None
        
        # Garantir que valores numéricos sejam válidos
        for field in ['valor_entrada', 'valor_atual', 'rodagem']:
            if field in data and (data[field] is None or data[field] == ''):
                data[field] = 0
        
        # Tratar campos de data
        if 'data_entrada' in data and data['data_entrada']:
            # Se for datetime, converter para date
            if isinstance(data['data_entrada'], str) and 'T' in data['data_entrada']:
                data['data_entrada'] = data['data_entrada'].split('T')[0]
        
        if 'data_venda' in data and data['data_venda']:
            # Se for datetime, converter para date
            if isinstance(data['data_venda'], str) and 'T' in data['data_venda']:
                data['data_venda'] = data['data_venda'].split('T')[0]
        
        # Tratar campo de fotos - garantir que seja uma lista válida
        if 'fotos' in data:
            if data['fotos'] is None:
                data['fotos'] = []
            elif not isinstance(data['fotos'], list):
                print(f"⚠️ Campo fotos não é uma lista: {type(data['fotos'])}")
                data['fotos'] = []
        
        # Tratar campo foto_principal_index
        if 'foto_principal_index' in data:
            if data['foto_principal_index'] is None:
                data['foto_principal_index'] = -1
            elif not isinstance(data['foto_principal_index'], int):
                try:
                    data['foto_principal_index'] = int(data['foto_principal_index'])
                except (ValueError, TypeError):
                    data['foto_principal_index'] = -1
        
        # Tratar campos de relacionamento opcionais (fornecedor, loja_origem)
        # Se o valor for 0 ou '0', converter para None
        for field in ['fornecedor', 'loja_origem']:
            if field in data and data[field] in [0, '0', '']:
                data[field] = None
        
        # Log dos dados finais
        print(f"🔍 Dados finais para validação: {data}")
        print(f"🔍 Fotos: {data.get('fotos', [])}")
        print(f"🔍 Foto principal index: {data.get('foto_principal_index', -1)}")
        
        serializer = MotocicletaCreateSerializer(motocicleta, data=data, partial=True)
        if serializer.is_valid():
            print(f"✅ Serializer válido, salvando...")
            motocicleta = serializer.save()
            print(f"✅ Motocicleta salva com sucesso. Fotos: {motocicleta.fotos}")
            return Response({
                'success': True,
                'data': MotocicletaSerializer(motocicleta).data,
                'message': 'Motocicleta atualizada com sucesso'
            })
        else:
            print(f"❌ Erros do serializer: {serializer.errors}")
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Erro na atualização: {str(e)}")
        import traceback
        print(f"❌ Traceback completo: {traceback.format_exc()}")
        return Response({
            'error': 'Erro ao atualizar motocicleta',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def motocicletas_delete(request, pk):
    """Exclui uma motocicleta"""
    try:
        motocicleta = Motocicleta.objects.get(pk=pk)
        
        # Verificar se a moto pode ser excluída
        try:
            if motocicleta.vendas.exists():
                return Response({
                    'error': 'Não é possível excluir uma motocicleta que possui vendas registradas'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            # Se não conseguir verificar vendas, continuar
            pass
        
        motocicleta.delete()
        return Response({
            'success': True,
            'message': 'Motocicleta excluída com sucesso'
        })
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao excluir motocicleta',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendas_list(request):
    """Lista todas as vendas"""
    try:
        vendas = Venda.objects.all()
        serializer = VendaSerializer(vendas, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar vendas',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vendas_create(request):
    """Cria uma nova venda"""
    try:
        # Tratar dados antes de validar
        data = request.data.copy()
        
        # Converter campos vazios para None/null
        for field in ['observacoes', 'data_venda']:
            if field in data and data[field] == '':
                data[field] = None
        
        # Garantir que valores numéricos sejam válidos
        for field in ['valor_venda', 'valor_entrada', 'comissao_vendedor']:
            if field in data and (data[field] is None or data[field] == ''):
                data[field] = 0
        
        # Definir loja padrão se não fornecida
        if not data.get('loja'):
            data['loja'] = request.user.usuario.loja.id
        
        # Definir vendedor como usuário logado se não fornecido
        if not data.get('vendedor'):
            data['vendedor'] = request.user.usuario.id
        
        serializer = VendaCreateSerializer(data=data)
        if serializer.is_valid():
            venda = serializer.save()
            return Response({
                'success': True,
                'data': VendaSerializer(venda).data,
                'message': 'Venda criada com sucesso'
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': 'Dados inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Erro ao criar venda',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Estatísticas do dashboard"""
    try:
        total_clientes = Cliente.objects.count()
        total_motocicletas = Motocicleta.objects.count()
        total_vendas = Venda.objects.count()
        
        # Vendas do mês atual
        hoje = timezone.now()
        vendas_mes = Venda.objects.filter(
            data_venda__year=hoje.year,
            data_venda__month=hoje.month
        ).count()
        
        # Valor total das vendas do mês
        valor_vendas_mes = Venda.objects.filter(
            data_venda__year=hoje.year,
            data_venda__month=hoje.month
        ).aggregate(total=Sum('valor_venda'))['total'] or 0
        
        return Response({
            'success': True,
            'data': {
                'total_clientes': total_clientes,
                'total_motocicletas': total_motocicletas,
                'total_vendas': total_vendas,
                'vendas_mes': vendas_mes,
                'valor_vendas_mes': float(valor_vendas_mes),
            }
        })
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar estatísticas',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consignacoes_list(request):
    """Lista todas as consignações"""
    try:
        from core.models import Consignacao
        consignacoes = Consignacao.objects.all()
        from .serializers import ConsignacaoSerializer
        serializer = ConsignacaoSerializer(consignacoes, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar consignações',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seguros_list(request):
    """Lista todos os seguros"""
    try:
        seguros = Seguro.objects.all()
        serializer = SeguroSerializer(seguros, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar seguros',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def motocicletas_upload_fotos(request, pk):
    """Upload de múltiplas fotos para uma motocicleta"""
    try:
        motocicleta = Motocicleta.objects.get(pk=pk)
        
        # Verificar se foram enviados arquivos
        if 'fotos' not in request.FILES:
            return Response({
                'error': 'Nenhum arquivo de foto foi enviado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        fotos_files = request.FILES.getlist('fotos')
        if not fotos_files:
            return Response({
                'error': 'Nenhum arquivo de foto foi enviado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obter fotos existentes
        fotos_existentes = motocicleta.fotos if motocicleta.fotos else []
        novas_fotos = []
        
        for foto_file in fotos_files:
            # Validar tipo de arquivo
            if not foto_file.content_type.startswith('image/'):
                return Response({
                    'error': f'O arquivo "{foto_file.name}" deve ser uma imagem'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar tamanho (máximo 20MB para fotos em 4K)
            if foto_file.size > 20 * 1024 * 1024:
                return Response({
                    'error': f'O arquivo "{foto_file.name}" é muito grande. Máximo: 20MB'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Converter para base64
            import base64
            foto_base64 = base64.b64encode(foto_file.read()).decode('utf-8')
            foto_data = {
                'nome': foto_file.name,
                'tipo': foto_file.content_type,
                'dados': f"data:{foto_file.content_type};base64,{foto_base64}"
            }
            novas_fotos.append(foto_data)
        
        # Adicionar novas fotos às existentes
        todas_fotos = fotos_existentes + novas_fotos
        
        # Atualizar motocicleta
        motocicleta.fotos = todas_fotos
        
        # Se não há foto principal definida e há fotos, definir a primeira como principal
        if motocicleta.foto_principal_index == -1 and todas_fotos:
            motocicleta.foto_principal_index = 0
        
        motocicleta.save()
        
        return Response({
            'success': True,
            'message': f'{len(novas_fotos)} foto(s) enviada(s) com sucesso',
            'data': {
                'id': motocicleta.id,
                'total_fotos': len(todas_fotos),
                'foto_principal_index': motocicleta.foto_principal_index
            }
        })
        
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao fazer upload das fotos',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def motocicletas_set_foto_principal(request, pk):
    """Define uma foto como principal"""
    try:
        motocicleta = Motocicleta.objects.get(pk=pk)
        foto_index = request.data.get('foto_index', 0)
        
        if not motocicleta.fotos:
            return Response({
                'error': 'Não há fotos para definir como principal'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if foto_index < 0 or foto_index >= len(motocicleta.fotos):
            return Response({
                'error': 'Índice de foto inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        motocicleta.foto_principal_index = foto_index
        motocicleta.save()
        
        return Response({
            'success': True,
            'message': f'Foto {foto_index + 1} definida como principal',
            'data': {
                'id': motocicleta.id,
                'foto_principal_index': motocicleta.foto_principal_index
            }
        })
        
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao definir foto principal',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def motocicletas_delete_foto(request, pk):
    """Remove uma foto específica de uma motocicleta"""
    try:
        motocicleta = Motocicleta.objects.get(pk=pk)
        foto_index = request.data.get('foto_index', 0)
        
        if not motocicleta.fotos:
            return Response({
                'error': 'Não há fotos para remover'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if foto_index < 0 or foto_index >= len(motocicleta.fotos):
            return Response({
                'error': 'Índice de foto inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Remover a foto
        fotos_atualizadas = motocicleta.fotos.copy()
        fotos_atualizadas.pop(foto_index)
        
        # Ajustar índice da foto principal
        novo_foto_principal_index = motocicleta.foto_principal_index
        if foto_index == motocicleta.foto_principal_index:
            # Se removemos a foto principal, definir a primeira como principal
            novo_foto_principal_index = 0 if fotos_atualizadas else -1
        elif foto_index < motocicleta.foto_principal_index:
            # Se removemos uma foto antes da principal, ajustar índice
            novo_foto_principal_index = max(0, motocicleta.foto_principal_index - 1)
        
        motocicleta.fotos = fotos_atualizadas
        motocicleta.foto_principal_index = novo_foto_principal_index
        motocicleta.save()
        
        return Response({
            'success': True,
            'message': f'Foto {foto_index + 1} removida com sucesso',
            'data': {
                'id': motocicleta.id,
                'total_fotos': len(fotos_atualizadas),
                'foto_principal_index': motocicleta.foto_principal_index
            }
        })
        
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao remover a foto',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# HISTÓRICOS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historico_vendas_cliente(request, cliente_id):
    """Retorna o histórico de vendas de um cliente"""
    try:
        cliente = Cliente.objects.get(pk=cliente_id)
        historico = HistoricoVendas.objects.filter(cliente=cliente).order_by('-data_transacao')
        
        serializer = HistoricoVendasSerializer(historico, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'cliente': ClienteSerializer(cliente).data
        })
    except Cliente.DoesNotExist:
        return Response({
            'error': 'Cliente não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erro ao buscar histórico: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historico_proprietarios_moto(request, moto_id):
    """Retorna o histórico de proprietários de uma motocicleta"""
    try:
        moto = Motocicleta.objects.get(pk=moto_id)
        historico = HistoricoProprietario.objects.filter(moto=moto).order_by('-data_inicio')
        
        serializer = HistoricoProprietarioSerializer(historico, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'motocicleta': MotocicletaSerializer(moto).data
        })
    except Motocicleta.DoesNotExist:
        return Response({
            'error': 'Motocicleta não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erro ao buscar histórico: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def criar_historico_venda(request):
    """Cria um novo registro no histórico de vendas"""
    try:
        serializer = HistoricoVendasSerializer(data=request.data)
        if serializer.is_valid():
            historico = serializer.save()
            return Response({
                'success': True,
                'data': HistoricoVendasSerializer(historico).data,
                'message': 'Histórico de venda criado com sucesso'
            })
        else:
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Erro ao criar histórico: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def criar_historico_proprietario(request):
    """Cria um novo registro no histórico de proprietários"""
    try:
        serializer = HistoricoProprietarioSerializer(data=request.data)
        if serializer.is_valid():
            historico = serializer.save()
            return Response({
                'success': True,
                'data': HistoricoProprietarioSerializer(historico).data,
                'message': 'Histórico de proprietário criado com sucesso'
            })
        else:
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Erro ao criar histórico: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================================================
# VIEWS DE LOJAS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lojas_list(request):
    """Lista todas as lojas"""
    try:
        print("🔍 lojas_list - Iniciando busca de lojas")
        lojas = Loja.objects.all()
        print(f"🔍 lojas_list - Encontradas {lojas.count()} lojas no banco")
        
        serializer = LojaSerializer(lojas, many=True)
        print(f"🔍 lojas_list - Dados serializados: {serializer.data}")
        
        response_data = {
            'success': True,
            'data': serializer.data
        }
        print(f"🔍 lojas_list - Resposta final: {response_data}")
        
        return Response(response_data)
    except Exception as e:
        print(f"❌ lojas_list - Erro: {e}")
        return Response({
            'error': 'Erro ao buscar lojas',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lojas_create(request):
    """Cria uma nova loja"""
    try:
        serializer = LojaSerializer(data=request.data)
        if serializer.is_valid():
            loja = serializer.save()
            return Response({
                'success': True,
                'data': LojaSerializer(loja).data
            })
        return Response({
            'error': 'Dados inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Erro ao criar loja',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lojas_detail(request, pk):
    """Retorna detalhes de uma loja"""
    try:
        loja = Loja.objects.get(pk=pk)
        serializer = LojaSerializer(loja)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Loja.DoesNotExist:
        return Response({
            'error': 'Loja não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao buscar loja',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def lojas_update(request, pk):
    """Atualiza uma loja"""
    try:
        loja = Loja.objects.get(pk=pk)
        serializer = LojaSerializer(loja, data=request.data, partial=True)
        if serializer.is_valid():
            loja = serializer.save()
            return Response({
                'success': True,
                'data': LojaSerializer(loja).data
            })
        return Response({
            'error': 'Dados inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Loja.DoesNotExist:
        return Response({
            'error': 'Loja não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao atualizar loja',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lojas_delete(request, pk):
    """Exclui uma loja"""
    try:
        loja = Loja.objects.get(pk=pk)
        loja.delete()
        return Response({
            'success': True,
            'message': 'Loja excluída com sucesso'
        })
    except Loja.DoesNotExist:
        return Response({
            'error': 'Loja não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Erro ao excluir loja',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gerar_contrato(request):
    """Gera um contrato automaticamente após a venda"""
    try:
        data = request.data
        venda_id = data.get('venda_id')
        tipo_contrato = data.get('tipo', '0km')  # 0km, seminova, consignacao
        
        # Busca a venda
        venda = Venda.objects.get(id=venda_id)
        
        # Determina o tipo de contrato baseado na origem da moto
        if tipo_contrato == 'auto':
            if venda.moto.origem == '0km':
                tipo_contrato = '0km'
            elif venda.moto.origem == 'seminova':
                tipo_contrato = 'seminova'
            else:
                tipo_contrato = 'seminova'  # padrão
        
        # Cria o contrato
        contrato = Contrato.objects.create(
            tipo=tipo_contrato,
            venda=venda,
            motocicleta=venda.moto,
            comprador=venda.comprador,
            vendedor=venda.vendedor.user,  # Usar o User do Usuario
            loja=venda.loja,
            valor_contrato=venda.valor_venda,
            valor_entrada=venda.valor_entrada,
            forma_pagamento=venda.get_forma_pagamento_display()
        )
        
        # Gera o HTML do contrato
        contrato.gerar_contrato_html()
        
        serializer = ContratoSerializer(contrato)
        return Response({
            'success': True,
            'message': 'Contrato gerado com sucesso',
            'contrato': serializer.data
        })
        
    except Venda.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Venda não encontrada'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao gerar contrato: {str(e)}'
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_contratos(request):
    """Lista todos os contratos"""
    try:
        contratos = Contrato.objects.filter(ativo=True).order_by('-data_geracao')
        serializer = ContratoSerializer(contratos, many=True)
        return Response({
            'success': True,
            'contratos': serializer.data
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao listar contratos: {str(e)}'
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detalhes_contrato(request, contrato_id):
    """Retorna detalhes de um contrato específico"""
    try:
        contrato = Contrato.objects.get(id=contrato_id)
        serializer = ContratoSerializer(contrato)
        return Response({
            'success': True,
            'contrato': serializer.data
        })
    except Contrato.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Contrato não encontrado'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao buscar contrato: {str(e)}'
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def visualizar_contrato_html(request, contrato_id):
    """Retorna o HTML do contrato para visualização"""
    try:
        contrato = Contrato.objects.get(id=contrato_id)
        
        if not contrato.arquivo_html:
            contrato.gerar_contrato_html()
        
        return Response({
            'success': True,
            'html': contrato.arquivo_html
        })
    except Contrato.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Contrato não encontrado'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao gerar HTML: {str(e)}'
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def baixar_contrato_pdf(request, contrato_id):
    """Gera e retorna o PDF do contrato"""
    try:
        contrato = Contrato.objects.get(id=contrato_id)
        
        # Gera o HTML se não existir
        if not contrato.arquivo_html:
            contrato.gerar_contrato_html()
        
        # Converte HTML para PDF
        html_content = contrato.arquivo_html
        
        # Configurações do PDF
        pdf_buffer = BytesIO()
        
        # Gera o PDF
        weasyprint.HTML(string=html_content).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        # Cria a resposta HTTP
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="contrato_{contrato.numero_contrato}.pdf"'
        
        return response
        
    except Contrato.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Contrato não encontrado'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao gerar PDF: {str(e)}'
        }, status=500)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def atualizar_status_contrato(request, contrato_id):
    """Atualiza o status do contrato"""
    try:
        contrato = Contrato.objects.get(id=contrato_id)
        novo_status = request.data.get('status')
        
        if novo_status in dict(Contrato.STATUS_CHOICES):
            contrato.status = novo_status
            if novo_status == 'assinado':
                contrato.data_assinatura = timezone.now()
            contrato.save()
            
            serializer = ContratoSerializer(contrato)
            return Response({
                'success': True,
                'message': 'Status atualizado com sucesso',
                'contrato': serializer.data
            })
        else:
            return Response({
                'success': False,
                'message': 'Status inválido'
            }, status=400)
            
    except Contrato.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Contrato não encontrado'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao atualizar status: {str(e)}'
        }, status=500)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancelar_contrato(request, contrato_id):
    """Cancela um contrato"""
    try:
        contrato = Contrato.objects.get(id=contrato_id)
        contrato.status = 'cancelado'
        contrato.ativo = False
        contrato.save()
        
        return Response({
            'success': True,
            'message': 'Contrato cancelado com sucesso'
        })
    except Contrato.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Contrato não encontrado'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Erro ao cancelar contrato: {str(e)}'
        }, status=500)
