from django.urls import path
from . import views

urlpatterns = [
    path('chaves/', views.controle_chave_list, name='controle_chave_list'),
    path('chaves/nova/', views.controle_chave_create, name='controle_chave_create'),
    path('chaves/<int:pk>/devolver/', views.controle_chave_devolver, name='controle_chave_devolver'),
] 