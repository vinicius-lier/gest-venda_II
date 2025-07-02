from django.urls import path
from . import views

app_name = 'pre_venda'

urlpatterns = [
    # Dashboard
    path('', views.dashboard_pre_venda, name='dashboard_pre_venda'),
    
    # Pré-vendas
    path('pre-venda/nova/', views.pre_venda_form, name='pre_venda_form'),
    path('pre-venda/lista/', views.lista_pre_vendas, name='lista_pre_vendas'),
    path('pre-venda/<uuid:pre_venda_id>/', views.detalhes_pre_venda, name='detalhes_pre_venda'),
    path('pre-venda/<uuid:pre_venda_id>/status/', views.alterar_status_pre_venda, name='alterar_status_pre_venda'),
    

    
    # API
    path('api/buscar-pre-venda/', views.buscar_pre_venda_por_telefone, name='buscar_pre_venda_por_telefone'),
] 