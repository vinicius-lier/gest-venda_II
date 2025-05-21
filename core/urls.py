from django.urls import path
from . import views
from . import views_api
from .views import (
    UsuarioCreateView, UsuarioUpdateView, AlterarSenhaView,
    salvar_assinatura, ContratoDetailView,
)

app_name = 'core'  # Define o namespace 'core'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    
    # URLs para Vendas
    path('vendas/', views.VendaListView.as_view(), name='venda_list'),
    path('vendas/nova/', views.VendaCreateView.as_view(), name='venda_create'),
    path('vendas/<int:pk>/editar/', views.VendaUpdateView.as_view(), name='venda_update'),
    path('vendas/<int:pk>/excluir/', views.VendaDeleteView.as_view(), name='venda_delete'),
    path('contrato/<int:venda_id>/<str:tipo_contrato>/', views.gerar_contrato, name='gerar_contrato'),
    
    # URLs para Consignações
    path('consignacoes/', views.ConsignacaoListView.as_view(), name='consignacao_list'),
    path('consignacoes/nova/', views.ConsignacaoCreateView.as_view(), name='consignacao_create'),
    path('consignacoes/<int:pk>/', views.ConsignacaoDetailView.as_view(), name='consignacao_detail'),
    path('consignacoes/<int:pk>/editar/', views.ConsignacaoUpdateView.as_view(), name='consignacao_update'),
    path('consignacoes/<int:pk>/excluir/', views.ConsignacaoDeleteView.as_view(), name='consignacao_delete'),
    path('consignacoes/<int:pk>/vender/', views.registrar_venda_consignacao, name='consignacao_vender'),
    path('consignacoes/<int:pk>/contrato/', views.gerar_contrato_consignacao, name='gerar_contrato_consignacao'),
    
    # Gerenciamento de Usuários
    path('usuarios/', views.UsuarioListView.as_view(), name='usuario_list'),
    path('usuarios/novo/', UsuarioCreateView.as_view(), name='usuario_create'),
    path('usuarios/<int:pk>/editar/', UsuarioUpdateView.as_view(), name='usuario_update'),
    path('usuarios/<int:pk>/alterar-senha/', AlterarSenhaView.as_view(), name='alterar_senha'),
    
    # URLs para Estoque de Motos
    path('estoque-motos/', views.EstoqueMotoListView.as_view(), name='estoque_moto_list'),
    path('estoque-motos/nova/', views.EstoqueMotoCreateView.as_view(), name='estoque_moto_create'),
    path('estoque-motos/<int:pk>/', views.EstoqueMotoDetailView.as_view(), name='estoque_moto_detail'),
    path('estoque-motos/<int:pk>/editar/', views.EstoqueMotoUpdateView.as_view(), name='estoque_moto_update'),
    path('estoque-motos/<int:pk>/excluir/', views.EstoqueMotoDeleteView.as_view(), name='estoque_moto_delete'),

    # URLs para Clientes
    path('clientes/', views.ClienteListView.as_view(), name='cliente_list'),
    path('clientes/novo/', views.ClienteCreateView.as_view(), name='cliente_create'),
    path('clientes/<int:pk>/editar/', views.ClienteUpdateView.as_view(), name='cliente_update'),
    path('clientes/<int:pk>/excluir/', views.ClienteDeleteView.as_view(), name='cliente_delete'),
    
    # APIs para busca, autocomplete e cadastro rápido
    path('api/buscar-clientes/', views_api.buscar_clientes, name='api_buscar_clientes'),
    path('api/buscar-motos/', views_api.buscar_motos, name='api_buscar_motos'),
    path('api/criar-cliente-rapido/', views_api.criar_cliente_rapido, name='api_criar_cliente_rapido'),
    path('api/criar-moto-rapida/', views_api.criar_moto_rapida, name='api_criar_moto_rapida'),
    
    # APIs para JSON e autocomplete
    path('api/clientes/', views_api.cliente_search, name='cliente_search'),
    path('api/motos/', views_api.moto_search, name='moto_search'),
    path('api/cliente/<int:cliente_id>/', views_api.cliente_detail, name='cliente_detail'),
    path('api/moto/<int:moto_id>/', views_api.moto_detail, name='moto_detail'),
    path('api/cliente/novo/', views_api.novo_cliente, name='api_cliente_novo'),
    
    # Outros URLs
    path('resumo-gerencial/', views.resumo_gerencial, name='resumo_gerencial'),
    path('importar-vendas/', views.importar_vendas, name='importar_vendas'),
    path('modelo-importacao/', views.download_modelo_importacao, name='modelo_importacao'),
    path('api/salvar-assinatura/', salvar_assinatura, name='salvar_assinatura'),
    path('contrato/<int:pk>/', ContratoDetailView.as_view(), name='contrato_detalhes'),
    path('api/motos_cliente/<int:cliente_id>/', views.motos_do_cliente_ajax, name='motos_cliente_ajax'),
    path('api/moto/<int:moto_id>/', views.dados_moto_estoque_ajax, name='dados_moto_ajax'),
] 