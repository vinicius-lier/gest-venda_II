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
    path('clientes/<int:pk>/reativar/', views.cliente_reactivate, name='cliente_reactivate'),
    path('clientes/exportar/', views.exportar_clientes_xlsx, name='exportar_clientes_xlsx'),
    
    # Motocicletas
    path('motocicletas/', views.motocicleta_list, name='motocicleta_list'),
    path('motocicletas/novo/', views.motocicleta_create, name='motocicleta_create'),
    path('motocicletas/<int:pk>/', views.motocicleta_detail, name='motocicleta_detail'),
    path('motocicletas/<int:pk>/editar/', views.motocicleta_update, name='motocicleta_update'),
    path('motocicletas/<int:pk>/excluir/', views.motocicleta_delete, name='motocicleta_delete'),
    path('motocicletas/<int:pk>/remover-proprietario/', views.motocicleta_remove_proprietario, name='motocicleta_remove_proprietario'),
    path('motocicletas/<int:pk>/transferir-propriedade/', views.motocicleta_transferir_propriedade, name='motocicleta_transferir_propriedade'),
    path('motocicletas/exportar/', views.exportar_motocicletas_xlsx, name='exportar_motocicletas_xlsx'),
    
    # Documentos de Motocicletas
    path('documentos-motocicletas/', views.documento_motocicleta_list, name='documento_motocicleta_list'),
    path('documentos-motocicletas/novo/', views.documento_motocicleta_create, name='documento_motocicleta_create'),
    path('documentos-motocicletas/<int:pk>/', views.documento_motocicleta_detail, name='documento_motocicleta_detail'),
    path('documentos-motocicletas/<int:pk>/editar/', views.documento_motocicleta_update, name='documento_motocicleta_update'),
    path('documentos-motocicletas/<int:pk>/excluir/', views.documento_motocicleta_delete, name='documento_motocicleta_delete'),
    path('motocicletas/<int:moto_id>/documentos/', views.motocicleta_documentos, name='motocicleta_documentos'),
    
    # Vendas
    path('vendas/', views.venda_list, name='venda_list'),
    path('vendas/novo/', views.venda_create, name='venda_create'),
    path('vendas/<int:pk>/editar/', views.venda_update, name='venda_update'),
    path('vendas/<int:pk>/', views.venda_detail, name='venda_detail'),
    path('vendas/<int:pk>/excluir/', views.venda_delete, name='venda_delete'),
    path('vendas/<int:pk>/cancelar/', views.venda_cancel, name='venda_cancel'),
    path('vendas/<int:venda_id>/comunicacoes/', views.venda_comunicacoes, name='venda_comunicacoes'),
    path('vendas/<int:venda_id>/criar-comunicacoes/', views.venda_criar_comunicacoes_obrigatorias, name='venda_criar_comunicacoes_obrigatorias'),
    path('vendas/exportar/', views.exportar_vendas_xlsx, name='exportar_vendas_xlsx'),
    
    # Comunicações de Venda
    path('comunicacoes-venda/', views.comunicacao_venda_list, name='comunicacao_venda_list'),
    path('comunicacoes-venda/novo/', views.comunicacao_venda_create, name='comunicacao_venda_create'),
    path('comunicacoes-venda/<int:pk>/', views.comunicacao_venda_detail, name='comunicacao_venda_detail'),
    path('comunicacoes-venda/<int:pk>/editar/', views.comunicacao_venda_update, name='comunicacao_venda_update'),
    path('comunicacoes-venda/<int:pk>/excluir/', views.comunicacao_venda_delete, name='comunicacao_venda_delete'),
    path('comunicacoes-venda/<int:pk>/marcar-enviada/', views.comunicacao_venda_marcar_enviada, name='comunicacao_venda_marcar_enviada'),
    path('comunicacoes-venda/<int:pk>/marcar-confirmada/', views.comunicacao_venda_marcar_confirmada, name='comunicacao_venda_marcar_confirmada'),
    
    # Notificações
    path('notificacoes/', views.notificacao_list, name='notificacao_list'),
    path('notificacoes/<int:pk>/marcar-lida/', views.notificacao_marcar_lida, name='notificacao_marcar_lida'),
    path('notificacoes/<int:pk>/excluir/', views.notificacao_delete, name='notificacao_delete'),
    path('notificacoes/count/', views.notificacao_count, name='notificacao_count'),
    
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
    path('ocorrencias/<int:pk>/excluir/', views.ocorrencia_delete, name='ocorrencia_delete'),
    
    # Importação de Dados
    path('importar/', views.import_data, name='import_data'),
    path('importar/lojas/', views.import_lojas, name='import_lojas'),
    path('importar/clientes/', views.import_clientes, name='import_clientes'),
    path('importar/clientes/processar/', views.import_clientes_process, name='import_clientes_process'),
    path('importar/motocicletas/', views.import_motocicletas, name='import_motocicletas'),
    path('importar/preview-motocicletas/', views.preview_import_motocicletas, name='preview_import_motocicletas'),
    path('importar/preview-clientes/', views.preview_import_clientes, name='preview_import_clientes'),
    path('importar/preview-vendas/', views.preview_import_vendas, name='preview_import_vendas'),
    path('download-modelo/<str:tipo>/', views.download_modelo_csv, name='download_modelo_csv'),
    
    # AJAX
    path('ajax/buscar-motocicleta/', views.buscar_motocicleta, name='buscar_motocicleta'),
    
    # Administração de Menu por Usuário
    path('usuario/<int:usuario_id>/menu/', views.usuario_menu_manage, name='usuario_menu_manage'),
    
    # ============================================================================
    # MÓDULO FINANCEIRO
    # ============================================================================
    
    # Dashboard Financeiro
    path('financeiro/', views.dashboard_financeiro, name='dashboard_financeiro'),
    path('financeiro/exportar_xlsx/', views.exportar_dashboard_financeiro_xlsx, name='exportar_dashboard_financeiro_xlsx'),
    
    # Vendas Financeiras
    path('financeiro/vendas/', views.venda_financeira_list, name='venda_financeira_list'),
    path('financeiro/vendas/novo/', views.venda_financeira_create, name='venda_financeira_create'),
    path('financeiro/vendas/<int:pk>/', views.venda_financeira_detail, name='venda_financeira_detail'),
    
    # Despesas
    path('financeiro/despesas/', views.despesa_list, name='despesa_list'),
    path('financeiro/despesas/novo/', views.despesa_create, name='despesa_create'),
    path('financeiro/despesas/<int:pk>/', views.despesa_detail, name='despesa_detail'),
    path('financeiro/despesas/<int:pk>/editar/', views.despesa_update, name='despesa_update'),
    path('financeiro/despesas/<int:pk>/excluir/', views.despesa_delete, name='despesa_delete'),
    path('financeiro/despesas/exportar/', views.exportar_despesas_xlsx, name='exportar_despesas_xlsx'),
    
    # Receitas Extras
    path('financeiro/receitas/', views.receita_extra_list, name='receita_extra_list'),
    path('financeiro/receitas/novo/', views.receita_extra_create, name='receita_extra_create'),
    path('financeiro/receitas/<int:pk>/', views.receita_extra_detail, name='receita_extra_detail'),
    path('financeiro/receitas/<int:pk>/editar/', views.receita_extra_update, name='receita_extra_update'),
    path('financeiro/receitas/<int:pk>/excluir/', views.receita_extra_delete, name='receita_extra_delete'),
    path('financeiro/receitas/exportar/', views.exportar_receitas_extras_xlsx, name='exportar_receitas_extras_xlsx'),
    
    # Pagamentos
    path('financeiro/pagamentos/', views.pagamento_list, name='pagamento_list'),
    path('financeiro/pagamentos/novo/', views.pagamento_create, name='pagamento_create'),
    path('financeiro/pagamentos/<int:pk>/', views.pagamento_detail, name='pagamento_detail'),
    path('financeiro/pagamentos/<int:pk>/editar/', views.pagamento_update, name='pagamento_update'),
    path('financeiro/pagamentos/<int:pk>/excluir/', views.pagamento_delete, name='pagamento_delete'),
    
    # ============================================================================
    # EXPORTAÇÕES XLSX
    # ============================================================================
    
    # Exportações do módulo financeiro
    path('financeiro/vendas/exportar/', views.exportar_vendas_xlsx, name='exportar_vendas_xlsx'),
    path('financeiro/despesas/exportar/', views.exportar_despesas_xlsx, name='exportar_despesas_xlsx'),
    path('financeiro/receitas/exportar/', views.exportar_receitas_extras_xlsx, name='exportar_receitas_extras_xlsx'),
    path('financeiro/pagamentos/exportar/', views.exportar_pagamentos_xlsx, name='exportar_pagamentos_xlsx'),
    
    # Exportações gerais
    path('vendas/exportar/', views.exportar_vendas_xlsx, name='exportar_vendas_xlsx_geral'),
    path('motocicletas/exportar/', views.exportar_motocicletas_xlsx, name='exportar_motocicletas_xlsx'),
    path('clientes/exportar/', views.exportar_clientes_xlsx, name='exportar_clientes_xlsx'),
    
    # API para autocomplete de motocicletas
    path('api/motocicletas/buscar/', views.buscar_motocicleta_api, name='buscar_motocicleta_api'),
] 