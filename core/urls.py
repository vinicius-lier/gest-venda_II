# -*- coding: utf-8 -*-
"""
URLs do sistema de gestão operacional de vendas
"""
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Autenticação
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Dashboard
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # Clientes
    path('clientes/', views.cliente_list, name='cliente_list'),
    path('clientes/novo/', views.cliente_create, name='cliente_create'),
    path('clientes/<int:pk>/', views.cliente_detail, name='cliente_detail'),
    path('clientes/<int:pk>/editar/', views.cliente_update, name='cliente_update'),
    path('clientes/<int:pk>/excluir/', views.cliente_delete, name='cliente_delete'),
    
    # Motocicletas
    path('motocicletas/', views.motocicleta_list, name='motocicleta_list'),
    path('motocicletas/novo/', views.motocicleta_create, name='motocicleta_create'),
    path('motocicletas/<int:pk>/', views.motocicleta_detail, name='motocicleta_detail'),
    path('motocicletas/<int:pk>/editar/', views.motocicleta_update, name='motocicleta_update'),
    path('motocicletas/<int:pk>/excluir/', views.motocicleta_delete, name='motocicleta_delete'),
    
    # Vendas
    path('vendas/', views.venda_list, name='venda_list'),
    path('vendas/novo/', views.venda_create, name='venda_create'),
    path('vendas/<int:pk>/editar/', views.venda_update, name='venda_update'),
    path('vendas/<int:pk>/', views.venda_detail, name='venda_detail'),
    path('vendas/<int:pk>/excluir/', views.venda_delete, name='venda_delete'),
    path('vendas/<int:pk>/cancelar/', views.venda_cancel, name='venda_cancel'),
    
    # Consignações
    path('consignacoes/', views.consignacao_list, name='consignacao_list'),
    path('consignacoes/novo/', views.consignacao_create, name='consignacao_create'),
    path('consignacoes/<int:pk>/editar/', views.consignacao_update, name='consignacao_update'),
    path('consignacoes/<int:pk>/', views.consignacao_detail, name='consignacao_detail'),
    path('consignacoes/<int:pk>/excluir/', views.consignacao_delete, name='consignacao_delete'),
    
    # Seguros
    path('seguros/', views.seguro_list, name='seguro_list'),
    path('seguros/novo/', views.seguro_create, name='seguro_create'),
    path('seguros/<int:pk>/editar/', views.seguro_update, name='seguro_update'),
    path('seguros/<int:pk>/', views.seguro_detail, name='seguro_detail'),
    path('seguros/<int:pk>/excluir/', views.seguro_delete, name='seguro_delete'),
    
    # Cotações de Seguro
    path('cotacoes-seguro/', views.cotacao_seguro_list, name='cotacao_seguro_list'),
    path('cotacoes-seguro/novo/', views.cotacao_seguro_create, name='cotacao_seguro_create'),
    path('cotacoes-seguro/<int:pk>/editar/', views.cotacao_seguro_update, name='cotacao_seguro_update'),
    path('cotacoes-seguro/<int:pk>/', views.cotacao_seguro_detail, name='cotacao_seguro_detail'),
    path('cotacoes-seguro/<int:pk>/excluir/', views.cotacao_seguro_delete, name='cotacao_seguro_delete'),
    
    # Seguradoras
    path('seguradoras/', views.seguradora_list, name='seguradora_list'),
    path('seguradoras/novo/', views.seguradora_create, name='seguradora_create'),
    path('seguradoras/<int:pk>/editar/', views.seguradora_update, name='seguradora_update'),
    path('seguradoras/<int:pk>/', views.seguradora_detail, name='seguradora_detail'),
    path('seguradoras/<int:pk>/excluir/', views.seguradora_delete, name='seguradora_delete'),
    
    # Planos de Seguro
    path('planos-seguro/', views.plano_seguro_list, name='plano_seguro_list'),
    path('planos-seguro/novo/', views.plano_seguro_create, name='plano_seguro_create'),
    path('planos-seguro/<int:pk>/editar/', views.plano_seguro_update, name='plano_seguro_update'),
    path('planos-seguro/<int:pk>/', views.plano_seguro_detail, name='plano_seguro_detail'),
    path('planos-seguro/<int:pk>/excluir/', views.plano_seguro_delete, name='plano_seguro_delete'),
    
    # Bens
    path('bens/', views.bem_list, name='bem_list'),
    path('bens/novo/', views.bem_create, name='bem_create'),
    path('bens/<int:pk>/editar/', views.bem_update, name='bem_update'),
    path('bens/<int:pk>/', views.bem_detail, name='bem_detail'),
    path('bens/<int:pk>/excluir/', views.bem_delete, name='bem_delete'),
    
    # Administrativo - Usuários
    path('usuarios/', views.usuario_list, name='usuario_list'),
    path('usuarios/novo/', views.usuario_create, name='usuario_create'),
    path('usuarios/<int:pk>/editar/', views.usuario_update, name='usuario_update'),
    path('usuarios/<int:pk>/', views.usuario_detail, name='usuario_detail'),
    path('usuarios/<int:pk>/excluir/', views.usuario_delete, name='usuario_delete'),
    
    # Administrativo - Lojas
    path('lojas/', views.loja_list, name='loja_list'),
    path('lojas/novo/', views.loja_create, name='loja_create'),
    path('lojas/<int:pk>/editar/', views.loja_update, name='loja_update'),
    path('lojas/<int:pk>/', views.loja_detail, name='loja_detail'),
    path('lojas/<int:pk>/excluir/', views.loja_delete, name='loja_delete'),
    
    # Ocorrências
    path('ocorrencias/', views.ocorrencia_list, name='ocorrencia_list'),
    path('ocorrencias/novo/', views.ocorrencia_create, name='ocorrencia_create'),
    path('ocorrencias/<int:pk>/editar/', views.ocorrencia_update, name='ocorrencia_update'),
    path('ocorrencias/<int:pk>/', views.ocorrencia_detail, name='ocorrencia_detail'),
    
    # Importação de Dados
    path('importar/', views.import_data, name='import_data'),
    path('importar/lojas/', views.import_lojas, name='import_lojas'),
    path('importar/clientes/', views.import_clientes, name='import_clientes'),
    path('importar/preview-motocicletas/', views.preview_import_motocicletas, name='preview_import_motocicletas'),
    path('importar/preview-clientes/', views.preview_import_clientes, name='preview_import_clientes'),
    path('importar/preview-vendas/', views.preview_import_vendas, name='preview_import_vendas'),
    path('download-modelo/<str:tipo>/', views.download_modelo_csv, name='download_modelo_csv'),
    
    # AJAX
    path('ajax/buscar-motocicleta/', views.buscar_motocicleta, name='buscar_motocicleta'),
    
    # Administração de Menu por Usuário
    path('usuario/<int:usuario_id>/menu/', views.usuario_menu_manage, name='usuario_menu_manage'),
] 