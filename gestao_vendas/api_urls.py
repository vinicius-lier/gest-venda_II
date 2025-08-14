from django.urls import path
from django.contrib.auth import views as auth_views
from rest_framework_simplejwt.views import TokenRefreshView

# Importar views da API
from core.api_views import (
    test_api,
    LoginView,
    CurrentUserView,
    clientes_list,
    clientes_create,
    clientes_detail,
    clientes_update,
    clientes_delete,
    motocicletas_list,
    motocicletas_create,
    motocicletas_detail,
    motocicletas_update,
    motocicletas_delete,
    motocicletas_upload_fotos,
    motocicletas_set_foto_principal,
    motocicletas_delete_foto,
    vendas_list,
    vendas_create,
    dashboard_stats,
    usuarios_list,
    usuarios_create,
    usuarios_update,
    usuarios_delete,
    lojas_list,
    lojas_create,
    lojas_detail,
    lojas_update,
    lojas_delete,
    OcorrenciaViewSet,
    OcorrenciaDetailView,
    consignacoes_list,
    seguros_list,
    historico_vendas_cliente,
    historico_proprietarios_moto,
    criar_historico_venda,
    criar_historico_proprietario,
    RelatorioVendasView,
    RelatorioEstoqueView,
    RelatorioFinanceiroView,
    DespesaViewSet,
    ReceitaExtraViewSet,
    gerar_contrato,
    listar_contratos,
    detalhes_contrato,
    visualizar_contrato_html,
    baixar_contrato_pdf,
    atualizar_status_contrato,
    cancelar_contrato,
)

# Importar views simples
from core.simple_views import simple_login, simple_test, health_check

# URLs da API
urlpatterns = [
    # Teste
    path('test/', test_api, name='api_test'),
    path('simple-test/', simple_test, name='simple_test'),
    path('health/', health_check, name='health_check'),
    
    # Autenticação
    path('auth/login/', LoginView.as_view(), name='api_login'),
    path('auth/simple-login/', simple_login, name='simple_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api_refresh'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='api_logout'),
    path('auth/user/', CurrentUserView.as_view(), name='api_current_user'),
    
    # Endpoints básicos
    path('clientes/', clientes_list, name='api_clientes'),
    path('clientes/create/', clientes_create, name='api_clientes_create'),
    path('clientes/<int:pk>/', clientes_detail, name='api_clientes_detail'),
    path('clientes/<int:pk>/update/', clientes_update, name='api_clientes_update'),
    path('clientes/<int:pk>/delete/', clientes_delete, name='api_clientes_delete'),
    
    # Lojas
    path('lojas/', lojas_list, name='api_lojas'),
    path('lojas/create/', lojas_create, name='api_lojas_create'),
    path('lojas/<int:pk>/', lojas_detail, name='api_lojas_detail'),
    path('lojas/<int:pk>/update/', lojas_update, name='api_lojas_update'),
    path('lojas/<int:pk>/delete/', lojas_delete, name='api_lojas_delete'),
    
    path('motocicletas/', motocicletas_list, name='api_motocicletas'),
    path('motocicletas/create/', motocicletas_create, name='api_motocicletas_create'),
    path('motocicletas/<int:pk>/', motocicletas_detail, name='api_motocicletas_detail'),
    path('motocicletas/<int:pk>/update/', motocicletas_update, name='api_motocicletas_update'),
    path('motocicletas/<int:pk>/delete/', motocicletas_delete, name='api_motocicletas_delete'),
    path('motocicletas/<int:pk>/upload-fotos/', motocicletas_upload_fotos, name='api_motocicletas_upload_fotos'),
    path('motocicletas/<int:pk>/set-foto-principal/', motocicletas_set_foto_principal, name='api_motocicletas_set_foto_principal'),
    path('motocicletas/<int:pk>/delete-foto/', motocicletas_delete_foto, name='api_motocicletas_delete_foto'),
    
    path('vendas/', vendas_list, name='api_vendas'),
    path('vendas/create/', vendas_create, name='api_vendas_create'),
    
    # Ocorrências
    path('ocorrencias/', OcorrenciaViewSet.as_view(), name='api_ocorrencias'),
    path('ocorrencias/<int:pk>/', OcorrenciaDetailView.as_view(), name='api_ocorrencias_detail'),
    
    # Consignações
    path('consignacoes/', consignacoes_list, name='api_consignacoes'),
    
    # Seguros
    path('seguros/', seguros_list, name='api_seguros'),
    
    # Usuários
    path('usuarios/', usuarios_list, name='api_usuarios'),
    path('usuarios/create/', usuarios_create, name='api_usuarios_create'),
    path('usuarios/<int:pk>/update/', usuarios_update, name='api_usuarios_update'),
    path('usuarios/<int:pk>/delete/', usuarios_delete, name='api_usuarios_delete'),
    
    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='api_dashboard_stats'),
    
    # Históricos
    path('historico/vendas/cliente/<int:cliente_id>/', historico_vendas_cliente, name='api_historico_vendas_cliente'),
    path('historico/proprietarios/moto/<int:moto_id>/', historico_proprietarios_moto, name='api_historico_proprietarios_moto'),
    path('historico/vendas/criar/', criar_historico_venda, name='api_criar_historico_venda'),
    path('historico/proprietarios/criar/', criar_historico_proprietario, name='api_criar_historico_proprietario'),
    
    # Relatórios
    path('relatorios/vendas/', RelatorioVendasView.as_view(), name='api_relatorio_vendas'),
    path('relatorios/estoque/', RelatorioEstoqueView.as_view(), name='api_relatorio_estoque'),
    path('relatorios/financeiro/', RelatorioFinanceiroView.as_view(), name='api_relatorio_financeiro'),
    
    # Despesas e Receitas Extras
    path('despesas/', DespesaViewSet.as_view(), name='api_despesas'),
    path('receitas-extras/', ReceitaExtraViewSet.as_view(), name='api_receitas_extras'),
    
    # Contratos
    path('contratos/gerar/', gerar_contrato, name='gerar_contrato'),
    path('contratos/', listar_contratos, name='listar_contratos'),
    path('contratos/<int:contrato_id>/', detalhes_contrato, name='detalhes_contrato'),
    path('contratos/<int:contrato_id>/html/', visualizar_contrato_html, name='visualizar_contrato_html'),
    path('contratos/<int:contrato_id>/pdf/', baixar_contrato_pdf, name='baixar_contrato_pdf'),
    path('contratos/<int:contrato_id>/status/', atualizar_status_contrato, name='atualizar_status_contrato'),
    path('contratos/<int:contrato_id>/cancelar/', cancelar_contrato, name='cancelar_contrato'),
]
