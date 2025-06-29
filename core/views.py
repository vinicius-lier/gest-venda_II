# -*- coding: utf-8 -*-
"""
Views do sistema de gestão operacional de vendas
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from .models import Cliente, Motocicleta, Venda, Consignacao, Seguro, CotacaoSeguro, Seguradora, PlanoSeguro, Bem, Usuario, Loja, Ocorrencia, MenuPerfil, Perfil, MenuUsuario
from .forms import MotocicletaForm, VendaForm, ConsignacaoForm, SeguroForm, CotacaoSeguroForm, SeguradoraForm, PlanoSeguroForm, BemForm, UsuarioForm, LojaForm, OcorrenciaForm, ComentarioOcorrenciaForm, ClienteForm
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .importers import DataImporter
from django.core.exceptions import ValidationError
from django.db import IntegrityError
import csv
import io
from decimal import Decimal
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.urls import reverse
import os
from django.conf import settings
import pandas as pd
from django.views.decorators.csrf import csrf_exempt
import json

def login_view(request):
    """View de login do sistema"""
    logger = logging.getLogger('core')
    
    if request.method == 'POST':
        logger.info(f"Tentativa de login para usuário: {request.POST.get('username', 'N/A')}")
        
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            
            logger.info(f"Formulário válido para usuário: {username}")
            
            user = authenticate(
                username=username,
                password=password
            )
            
            if user:
                logger.info(f"Usuário autenticado com sucesso: {username}")
                login(request, user)
                logger.info(f"Login realizado para: {username}, redirecionando para dashboard")
                return redirect('core:dashboard')
            else:
                logger.warning(f"Falha na autenticação para usuário: {username}")
                messages.error(request, 'Usuário ou senha inválidos.')
        else:
            logger.warning(f"Formulário inválido para usuário: {request.POST.get('username', 'N/A')} - Erros: {form.errors}")
            messages.error(request, 'Dados inválidos. Verifique usuário e senha.')
    else:
        form = AuthenticationForm()
        logger.debug("Página de login carregada (GET)")
    
    return render(request, 'core/login.html', {'form': form})

def logout_view(request):
    """View de logout do sistema"""
    logout(request)
    messages.success(request, 'Logout realizado com sucesso.')
    return redirect('core:login')

@login_required
def dashboard(request):
    """Dashboard principal do sistema"""
    logger = logging.getLogger('core')
    logger.info(f"Dashboard acessado por: {request.user.username}")
    
    try:
        hoje = timezone.now().date()
        primeiro_dia_mes = hoje.replace(day=1)

        total_clientes = Cliente.objects.filter(ativo=True).count()
        total_motos = Motocicleta.objects.filter(ativo=True).count()
        motos_estoque = Motocicleta.objects.filter(status='estoque', ativo=True).count()
        vendas_mes = Venda.objects.filter(data_venda__gte=primeiro_dia_mes, status='vendido').count()
        consignacoes = Consignacao.objects.filter(status='disponivel', moto__ativo=True).count()

        # Dados para gráfico de ranking de vendedores
        ranking_vendedores = Usuario.objects.filter(
            vendas_realizadas__status='vendido'
        ).annotate(
            total_vendas=Count('vendas_realizadas', filter=Q(vendas_realizadas__status='vendido'))
        ).filter(total_vendas__gt=0).order_by('-total_vendas')[:10]

        # Dados para gráfico de motos mais vendidas
        ranking_motos = Motocicleta.objects.filter(
            vendas__status='vendido'
        ).annotate(
            total_vendas=Count('vendas', filter=Q(vendas__status='vendido'))
        ).filter(total_vendas__gt=0).order_by('-total_vendas')[:10]

        # Preparar dados JSON para os gráficos
        ranking_vendedores_labels = json.dumps([
            vendedor.user.first_name or vendedor.user.username 
            for vendedor in ranking_vendedores
        ])
        ranking_vendedores_data = json.dumps([
            vendedor.total_vendas 
            for vendedor in ranking_vendedores
        ])
        ranking_motos_labels = json.dumps([
            f"{moto.marca} {moto.modelo}" 
            for moto in ranking_motos
        ])
        ranking_motos_data = json.dumps([
            moto.total_vendas 
            for moto in ranking_motos
        ])

        context = {
            'total_clientes': total_clientes,
            'total_motos': total_motos,
            'motos_estoque': motos_estoque,
            'vendas_mes': vendas_mes,
            'consignacoes': consignacoes,
            'ranking_vendedores': ranking_vendedores,
            'ranking_motos': ranking_motos,
            'ranking_vendedores_labels': ranking_vendedores_labels,
            'ranking_vendedores_data': ranking_vendedores_data,
            'ranking_motos_labels': ranking_motos_labels,
            'ranking_motos_data': ranking_motos_data,
            'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
        }
        
        logger.info(f"Dashboard carregado com sucesso para: {request.user.username}")
        return render(request, 'core/dashboard.html', context)
        
    except Exception as e:
        logger.error(f"Erro no dashboard para {request.user.username}: {str(e)}")
        messages.error(request, 'Erro ao carregar dashboard. Tente novamente.')
        return render(request, 'core/dashboard.html', {
            'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
        })

@login_required
def cliente_list(request):
    """Lista de clientes com filtros e paginação"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_cliente')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar clientes.'})
    query = request.GET.get('q', '').strip()
    tipo = request.GET.get('tipo', '')
    status = request.GET.get('status', 'ativo')  # Filtro de status
    tipos = Cliente.TIPO_CHOICES
    
    # Filtrar apenas clientes ativos por padrão
    if status == 'ativo':
        clientes = Cliente.objects.filter(ativo=True).order_by('-data_cadastro')
    elif status == 'inativo':
        clientes = Cliente.objects.filter(ativo=False).order_by('-data_cadastro')
    else:
        clientes = Cliente.objects.all().order_by('-data_cadastro')
    
    # Filtro de busca
    if query:
        clientes = clientes.filter(
            Q(nome__icontains=query) |
            Q(cpf_cnpj__icontains=query) |
            Q(telefone__icontains=query)
        )
    # Filtro de tipo
    if tipo:
        clientes = clientes.filter(tipo=tipo)
    
    # Paginação
    paginator = Paginator(clientes, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'query': query,
        'tipo': tipo,
        'status': status,
        'tipos': tipos,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/cliente_list.html', context)

@login_required
def cliente_create(request):
    """Criação de novo cliente"""
    if request.method == 'POST':
        form = ClienteForm(request.POST)
        if form.is_valid():
            cliente = form.save()
            messages.success(request, 'Cliente registrado com sucesso!')
            return redirect('core:cliente_list')
        else:
            messages.error(request, 'Erro ao registrar cliente. Verifique os dados.')
    else:
        form = ClienteForm()
    
    return render(request, 'core/cliente_form.html', {
        'form': form,
        'cliente': None,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def cliente_detail(request, pk):
    """Detalhes do cliente"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_cliente')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar clientes.'})
    
    cliente = get_object_or_404(Cliente, pk=pk)
    
    # Buscar dados relacionados
    compras = cliente.compras.all().order_by('-data_venda')[:5]
    motos_propriedade = cliente.motos_propriedade.all()
    consignacoes = cliente.consignacoes.all().order_by('-data_entrada')[:5]
    seguros = cliente.seguros.all().order_by('-data_venda')[:5]
    
    context = {
        'cliente': cliente,
        'compras': compras,
        'motos_propriedade': motos_propriedade,
        'consignacoes': consignacoes,
        'seguros': seguros,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/cliente_detail.html', context)

@login_required
def cliente_update(request, pk):
    """Atualização de cliente"""
    if not (request.user.is_superuser or request.user.has_perm('core.change_cliente')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para editar clientes.'})
    
    cliente = get_object_or_404(Cliente, pk=pk)
    if request.method == 'POST':
        form = ClienteForm(request.POST, instance=cliente)
        if form.is_valid():
            form.save()
            messages.success(request, 'Cliente atualizado com sucesso!')
            return redirect('core:cliente_detail', pk=cliente.pk)
    else:
        form = ClienteForm(instance=cliente)
    
    return render(request, 'core/cliente_form.html', {
        'form': form,
        'cliente': cliente,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def cliente_delete(request, pk):
    """Exclusão de cliente"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_cliente')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir clientes.'})
    
    cliente = get_object_or_404(Cliente, pk=pk)
    if request.method == 'POST':
        cliente.ativo = False
        cliente.save()
        messages.success(request, 'Cliente marcado como inativo com sucesso!')
        return redirect('core:cliente_list')
    
    return render(request, 'core/cliente_confirm_delete.html', {
        'cliente': cliente,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def motocicleta_list(request):
    """Lista de motocicletas com filtros e paginação"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_motocicleta')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar motocicletas.'})
    
    query = request.GET.get('q', '').strip()
    marca = request.GET.get('marca', '')
    modelo = request.GET.get('modelo', '')
    ano = request.GET.get('ano', '')
    status = request.GET.get('status', '')
    ativo = request.GET.get('ativo', 'ativo')  # Filtro de ativo/inativo
    
    # Filtrar apenas motocicletas ativas por padrão
    if ativo == 'ativo':
        motocicletas = Motocicleta.objects.filter(ativo=True).order_by('-data_entrada')
    elif ativo == 'inativo':
        motocicletas = Motocicleta.objects.filter(ativo=False).order_by('-data_entrada')
    else:
        motocicletas = Motocicleta.objects.all().order_by('-data_entrada')
    
    # Filtros
    if query:
        motocicletas = motocicletas.filter(
            Q(marca__icontains=query) |
            Q(modelo__icontains=query) |
            Q(placa__icontains=query) |
            Q(chassi__icontains=query)
        )
    if marca:
        motocicletas = motocicletas.filter(marca__icontains=marca)
    if modelo:
        motocicletas = motocicletas.filter(modelo__icontains=modelo)
    if ano:
        motocicletas = motocicletas.filter(ano=ano)
    if status:
        motocicletas = motocicletas.filter(status=status)
    
    # Paginação
    paginator = Paginator(motocicletas, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'motocicletas': page_obj,
        'query': query,
        'marca': marca,
        'modelo': modelo,
        'ano': ano,
        'status': status,
        'ativo': ativo,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/motocicleta_list.html', context)

@login_required
def motocicleta_create(request):
    """Criação de nova motocicleta"""
    if request.method == 'POST':
        form = MotocicletaForm(request.POST, request.FILES)
        if form.is_valid():
            motocicleta = form.save(commit=False)
            motocicleta.save()
            messages.success(request, 'Motocicleta registrada com sucesso!')
            return redirect('core:motocicleta_list')
        else:
            messages.error(request, 'Erro ao registrar motocicleta. Verifique os dados.')
    else:
        form = MotocicletaForm()
    
    return render(request, 'core/motocicleta_form.html', {
        'form': form, 
        'motocicleta': None, 
        'usuario_sistema': request.user
    })

@login_required
def motocicleta_update(request, pk):
    """Atualização de motocicleta"""
    motocicleta = get_object_or_404(Motocicleta, pk=pk)
    if request.method == 'POST':
        form = MotocicletaForm(request.POST, request.FILES, instance=motocicleta)
        if form.is_valid():
            form.save()
            return redirect('core:motocicleta_list')
    else:
        form = MotocicletaForm(instance=motocicleta)
    return render(request, 'core/motocicleta_form.html', {
        'form': form, 
        'motocicleta': motocicleta, 
        'usuario_sistema': request.user
    })

@login_required
def motocicleta_detail(request, pk):
    """Detalhes da motocicleta"""
    motocicleta = get_object_or_404(Motocicleta, pk=pk)
    return render(request, 'core/motocicleta_detail.html', {
        'motocicleta': motocicleta,
        'usuario_sistema': request.user
    })

@login_required
def motocicleta_delete(request, pk):
    """Exclusão de motocicleta"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_motocicleta')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir motocicletas.'})
    
    motocicleta = get_object_or_404(Motocicleta, pk=pk)
    if request.method == 'POST':
        # Verificar se a moto pode ser excluída
        if motocicleta.vendas.exists():
            messages.error(request, 'Não é possível excluir uma motocicleta que possui vendas registradas.')
            return redirect('core:motocicleta_detail', pk=motocicleta.pk)
        
        # Verificar se tem consignação
        try:
            consignacao = motocicleta.consignacao
            if consignacao:
                messages.error(request, 'Não é possível excluir uma motocicleta que possui consignação ativa.')
                return redirect('core:motocicleta_detail', pk=motocicleta.pk)
        except Exception:
            pass  # Não tem consignação, pode continuar
        
        # Verificar se tem seguro
        try:
            seguro = motocicleta.seguro
            if seguro:
                messages.error(request, 'Não é possível excluir uma motocicleta que possui seguro ativo.')
                return redirect('core:motocicleta_detail', pk=motocicleta.pk)
        except Exception:
            pass  # Não tem seguro, pode continuar
        
        if motocicleta.repasses.exists():
            messages.error(request, 'Não é possível excluir uma motocicleta que possui repasses registrados.')
            return redirect('core:motocicleta_detail', pk=motocicleta.pk)
        
        # Marcar como inativo (soft delete)
        motocicleta.ativo = False
        motocicleta.save()
        messages.success(request, 'Motocicleta marcada como inativa com sucesso!')
        return redirect('core:motocicleta_list')
    
    return render(request, 'core/motocicleta_confirm_delete.html', {
        'moto': motocicleta,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def venda_list(request):
    """Lista de vendas com filtros"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_venda')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar vendas.'})
    
    # Obter parâmetros de filtro
    status = request.GET.get('status', '')
    vendedor = request.GET.get('vendedor', '')
    data_inicio = request.GET.get('data_inicio', '')
    data_fim = request.GET.get('data_fim', '')
    
    # Query base
    vendas = Venda.objects.all().order_by('-data_venda', '-data_atendimento')
    
    # Aplicar filtros
    if status:
        vendas = vendas.filter(status=status)
    
    if vendedor:
        vendas = vendas.filter(
            Q(vendedor__user__first_name__icontains=vendedor) |
            Q(vendedor__user__last_name__icontains=vendedor) |
            Q(vendedor__user__username__icontains=vendedor)
        )
    
    if data_inicio:
        try:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            vendas = vendas.filter(data_venda__gte=data_inicio)
        except ValueError:
            pass
    
    if data_fim:
        try:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
            vendas = vendas.filter(data_venda__lte=data_fim)
        except ValueError:
            pass
    
    context = {
        'vendas': vendas,
        'status': status,
        'vendedor': vendedor,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/venda_list.html', context)

@login_required
def venda_create(request):
    """Criação de nova venda"""
    if request.method == 'POST':
        form = VendaForm(request.POST)
        if form.is_valid():
            venda = form.save(commit=False)
            # Definir o vendedor como o usuário logado se não foi especificado
            if not venda.vendedor:
                venda.vendedor = request.user
            venda.save()
            messages.success(request, 'Venda registrada com sucesso!')
            return redirect('core:venda_list')
    else:
        form = VendaForm()
        # Definir vendedor padrão como usuário logado
        form.fields['vendedor'].initial = request.user
    
    return render(request, 'core/venda_form.html', {
        'form': form,
        'venda': None,
        'usuario_sistema': request.user
    })

@login_required
def venda_update(request, pk):
    """Atualização de venda"""
    venda = get_object_or_404(Venda, pk=pk)
    if request.method == 'POST':
        form = VendaForm(request.POST, instance=venda)
        if form.is_valid():
            form.save()
            messages.success(request, 'Venda atualizada com sucesso!')
            return redirect('core:venda_list')
    else:
        form = VendaForm(instance=venda)
    
    return render(request, 'core/venda_form.html', {
        'form': form,
        'venda': venda,
        'usuario_sistema': request.user
    })

@login_required
def venda_detail(request, pk):
    """Detalhes da venda"""
    venda = get_object_or_404(Venda, pk=pk)
    return render(request, 'core/venda_detail.html', {
        'venda': venda,
        'usuario_sistema': request.user
    })

@login_required
def venda_delete(request, pk):
    """Exclusão de venda"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_venda')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir vendas.'})
    
    venda = get_object_or_404(Venda, pk=pk)
    if request.method == 'POST':
        # Verificar se a venda pode ser excluída
        if venda.status == 'vendido':
            messages.error(request, 'Não é possível excluir uma venda já concluída.')
            return redirect('core:venda_detail', pk=venda.pk)
        
        venda.delete()
        messages.success(request, 'Venda excluída com sucesso!')
        return redirect('core:venda_list')
    
    return render(request, 'core/venda_confirm_delete.html', {
        'venda': venda,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def venda_cancel(request, pk):
    """Cancela uma venda, alterando o status para 'cancelado'"""
    venda = get_object_or_404(Venda, pk=pk)
    if not (request.user.is_superuser or request.user.has_perm('core.change_venda')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para cancelar vendas.'})

    if venda.status == 'cancelado':
        messages.info(request, 'Esta venda já está cancelada.')
        return redirect('core:venda_detail', pk=pk)

    if request.method == 'POST':
        venda.status = 'cancelado'
        venda.save()
        messages.success(request, 'Venda cancelada com sucesso!')
        return redirect('core:venda_detail', pk=pk)

    return render(request, 'core/venda_confirm_cancel.html', {
        'venda': venda,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def consignacao_list(request):
    """Lista de consignações com filtros"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_consignacao')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar consignações.'})
    
    # Obter parâmetros de filtro
    status = request.GET.get('status', '')
    vendedor = request.GET.get('vendedor', '')
    data_inicio = request.GET.get('data_inicio', '')
    data_fim = request.GET.get('data_fim', '')
    
    # Query base
    consignacoes = Consignacao.objects.all().order_by('-data_entrada')
    
    # Aplicar filtros
    if status:
        consignacoes = consignacoes.filter(status=status)
    
    if vendedor:
        consignacoes = consignacoes.filter(
            Q(vendedor_responsavel__user__first_name__icontains=vendedor) |
            Q(vendedor_responsavel__user__last_name__icontains=vendedor) |
            Q(vendedor_responsavel__user__username__icontains=vendedor)
        )
    
    if data_inicio:
        try:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            consignacoes = consignacoes.filter(data_entrada__gte=data_inicio)
        except ValueError:
            pass
    
    if data_fim:
        try:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
            consignacoes = consignacoes.filter(data_entrada__lte=data_fim)
        except ValueError:
            pass
    
    context = {
        'consignacoes': consignacoes,
        'status': status,
        'vendedor': vendedor,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/consignacao_list.html', context)

@login_required
def consignacao_create(request):
    """Criação de nova consignação"""
    if request.method == 'POST':
        form = ConsignacaoForm(request.POST)
        if form.is_valid():
            consignacao = form.save(commit=False)
            # Definir o vendedor responsável como o usuário logado se não foi especificado
            if not consignacao.vendedor_responsavel:
                consignacao.vendedor_responsavel = request.user
            consignacao.save()
            messages.success(request, 'Consignação registrada com sucesso!')
            return redirect('core:consignacao_list')
    else:
        form = ConsignacaoForm()
        # Definir vendedor responsável padrão como usuário logado
        form.fields['vendedor_responsavel'].initial = request.user
    
    return render(request, 'core/consignacao_form.html', {
        'form': form,
        'consignacao': None,
        'usuario_sistema': request.user
    })

@login_required
def consignacao_update(request, pk):
    """Atualização de consignação"""
    consignacao = get_object_or_404(Consignacao, pk=pk)
    if request.method == 'POST':
        form = ConsignacaoForm(request.POST, instance=consignacao)
        if form.is_valid():
            form.save()
            messages.success(request, 'Consignação atualizada com sucesso!')
            return redirect('core:consignacao_list')
    else:
        form = ConsignacaoForm(instance=consignacao)
    
    return render(request, 'core/consignacao_form.html', {
        'form': form,
        'consignacao': consignacao,
        'usuario_sistema': request.user
    })

@login_required
def consignacao_detail(request, pk):
    """Detalhes da consignação"""
    consignacao = get_object_or_404(Consignacao, pk=pk)
    return render(request, 'core/consignacao_detail.html', {
        'consignacao': consignacao,
        'usuario_sistema': request.user
    })

@login_required
def consignacao_delete(request, pk):
    """Exclusão de consignação"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_consignacao')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir consignações.'})
    
    consignacao = get_object_or_404(Consignacao, pk=pk)
    if request.method == 'POST':
        # Verificar se a consignação pode ser excluída
        if consignacao.status == 'vendido':
            messages.error(request, 'Não é possível excluir uma consignação já vendida.')
            return redirect('core:consignacao_detail', pk=consignacao.pk)
        
        consignacao.delete()
        messages.success(request, 'Consignação excluída com sucesso!')
        return redirect('core:consignacao_list')
    
    return render(request, 'core/consignacao_confirm_delete.html', {
        'consignacao': consignacao,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def seguro_list(request):
    """Lista de seguros com filtros"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_seguro')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar seguros.'})
    
    # Obter parâmetros de filtro
    status = request.GET.get('status', '')
    vendedor = request.GET.get('vendedor', '')
    seguradora = request.GET.get('seguradora', '')
    data_vencimento = request.GET.get('data_vencimento', '')
    
    # Query base
    seguros = Seguro.objects.all().order_by('-data_venda')
    
    # Aplicar filtros
    if status:
        seguros = seguros.filter(status=status)
    
    if vendedor:
        seguros = seguros.filter(
            Q(vendedor__user__first_name__icontains=vendedor) |
            Q(vendedor__user__last_name__icontains=vendedor) |
            Q(vendedor__user__username__icontains=vendedor)
        )
    
    if seguradora:
        seguros = seguros.filter(
            Q(plano__seguradora__nome__icontains=seguradora)
        )
    
    if data_vencimento:
        try:
            data_vencimento = datetime.strptime(data_vencimento, '%Y-%m-%d').date()
            seguros = seguros.filter(data_fim=data_vencimento)
        except ValueError:
            pass
    
    context = {
        'seguros': seguros,
        'status': status,
        'vendedor': vendedor,
        'seguradora': seguradora,
        'data_vencimento': data_vencimento,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/seguro_list.html', context)

@login_required
def seguro_create(request):
    """Criação de novo seguro"""
    if request.method == 'POST':
        form = SeguroForm(request.POST)
        if form.is_valid():
            seguro = form.save(commit=False)
            # Definir o vendedor como o usuário logado se não foi especificado
            if not seguro.vendedor:
                seguro.vendedor = request.user
            seguro.save()
            messages.success(request, 'Seguro registrado com sucesso!')
            return redirect('core:seguro_list')
    else:
        form = SeguroForm()
        # Definir vendedor padrão como usuário logado
        form.fields['vendedor'].initial = request.user
    
    return render(request, 'core/seguro_form.html', {
        'form': form,
        'seguro': None,
        'usuario_sistema': request.user
    })

@login_required
def seguro_update(request, pk):
    """Atualização de seguro"""
    seguro = get_object_or_404(Seguro, pk=pk)
    if request.method == 'POST':
        form = SeguroForm(request.POST, instance=seguro)
        if form.is_valid():
            form.save()
            messages.success(request, 'Seguro atualizado com sucesso!')
            return redirect('core:seguro_list')
    else:
        form = SeguroForm(instance=seguro)
    
    return render(request, 'core/seguro_form.html', {
        'form': form,
        'seguro': seguro,
        'usuario_sistema': request.user
    })

@login_required
def seguro_detail(request, pk):
    """Detalhes do seguro"""
    seguro = get_object_or_404(Seguro, pk=pk)
    return render(request, 'core/seguro_detail.html', {
        'seguro': seguro,
        'usuario_sistema': request.user
    })

@login_required
def seguro_delete(request, pk):
    """Exclusão de seguro"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_seguro')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir seguros.'})
    
    seguro = get_object_or_404(Seguro, pk=pk)
    if request.method == 'POST':
        # Verificar se o seguro pode ser excluído
        if seguro.status == 'ativo':
            messages.error(request, 'Não é possível excluir um seguro ativo. Cancele-o primeiro.')
            return redirect('core:seguro_detail', pk=seguro.pk)
        
        seguro.delete()
        messages.success(request, 'Seguro excluído com sucesso!')
        return redirect('core:seguro_list')
    
    return render(request, 'core/seguro_confirm_delete.html', {
        'seguro': seguro,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def cotacao_seguro_list(request):
    """Lista de cotações de seguro"""
    cotacoes = CotacaoSeguro.objects.all().order_by('-data_cotacao')
    return render(request, 'core/cotacao_seguro_list.html', {'cotacoes': cotacoes})

@login_required
def cotacao_seguro_create(request):
    """Criação de nova cotação de seguro"""
    if request.method == 'POST':
        form = CotacaoSeguroForm(request.POST)
        if form.is_valid():
            cotacao = form.save(commit=False)
            # Definir o consultor como o usuário logado se não foi especificado
            if not cotacao.consultor:
                cotacao.consultor = request.user
            cotacao.save()
            messages.success(request, 'Cotação de seguro registrada com sucesso!')
            return redirect('core:cotacao_seguro_list')
    else:
        form = CotacaoSeguroForm()
        # Definir consultor padrão como usuário logado
        form.fields['consultor'].initial = request.user
    
    return render(request, 'core/cotacao_seguro_form.html', {
        'form': form,
        'cotacao': None,
        'usuario_sistema': request.user
    })

@login_required
def cotacao_seguro_update(request, pk):
    """Atualização de cotação de seguro"""
    cotacao = get_object_or_404(CotacaoSeguro, pk=pk)
    if request.method == 'POST':
        form = CotacaoSeguroForm(request.POST, instance=cotacao)
        if form.is_valid():
            form.save()
            messages.success(request, 'Cotação de seguro atualizada com sucesso!')
            return redirect('core:cotacao_seguro_list')
    else:
        form = CotacaoSeguroForm(instance=cotacao)
    
    return render(request, 'core/cotacao_seguro_form.html', {
        'form': form,
        'cotacao': cotacao,
        'usuario_sistema': request.user
    })

@login_required
def cotacao_seguro_detail(request, pk):
    """Detalhes da cotação de seguro"""
    cotacao = get_object_or_404(CotacaoSeguro, pk=pk)
    return render(request, 'core/cotacao_seguro_detail.html', {
        'cotacao': cotacao,
        'usuario_sistema': request.user
    })

@login_required
def cotacao_seguro_delete(request, pk):
    """Exclusão de cotação de seguro"""
    cotacao = get_object_or_404(CotacaoSeguro, pk=pk)
    if request.method == 'POST':
        cotacao.delete()
        messages.success(request, 'Cotação de seguro excluída com sucesso!')
        return redirect('core:cotacao_seguro_list')
    return render(request, 'core/cotacao_seguro_confirm_delete.html', {
        'cotacao': cotacao,
        'usuario_sistema': request.user
    })

@login_required
def seguradora_list(request):
    """Lista de seguradoras"""
    seguradoras = Seguradora.objects.all().order_by('nome')
    return render(request, 'core/seguradora_list.html', {'seguradoras': seguradoras})

@login_required
def seguradora_create(request):
    """Criação de nova seguradora"""
    if request.method == 'POST':
        form = SeguradoraForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Seguradora registrada com sucesso!')
            return redirect('core:seguradora_list')
    else:
        form = SeguradoraForm()
    
    return render(request, 'core/seguradora_form.html', {
        'form': form,
        'seguradora': None,
        'usuario_sistema': request.user
    })

@login_required
def seguradora_update(request, pk):
    """Atualização de seguradora"""
    seguradora = get_object_or_404(Seguradora, pk=pk)
    if request.method == 'POST':
        form = SeguradoraForm(request.POST, instance=seguradora)
        if form.is_valid():
            form.save()
            messages.success(request, 'Seguradora atualizada com sucesso!')
            return redirect('core:seguradora_list')
    else:
        form = SeguradoraForm(instance=seguradora)
    
    return render(request, 'core/seguradora_form.html', {
        'form': form,
        'seguradora': seguradora,
        'usuario_sistema': request.user
    })

@login_required
def seguradora_detail(request, pk):
    """Detalhes da seguradora"""
    seguradora = get_object_or_404(Seguradora, pk=pk)
    return render(request, 'core/seguradora_detail.html', {
        'seguradora': seguradora,
        'usuario_sistema': request.user
    })

@login_required
def seguradora_delete(request, pk):
    """Exclusão de seguradora"""
    seguradora = get_object_or_404(Seguradora, pk=pk)
    if request.method == 'POST':
        seguradora.delete()
        messages.success(request, 'Seguradora excluída com sucesso!')
        return redirect('core:seguradora_list')
    return render(request, 'core/seguradora_confirm_delete.html', {
        'seguradora': seguradora,
        'usuario_sistema': request.user
    })

@login_required
def plano_seguro_list(request):
    """Lista de planos de seguro"""
    planos = PlanoSeguro.objects.all().order_by('seguradora__nome', 'nome')
    return render(request, 'core/plano_seguro_list.html', {'planos': planos})

@login_required
def plano_seguro_create(request):
    """Criação de novo plano de seguro"""
    if request.method == 'POST':
        form = PlanoSeguroForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Plano de seguro registrado com sucesso!')
            return redirect('core:plano_seguro_list')
    else:
        form = PlanoSeguroForm()
    
    return render(request, 'core/plano_seguro_form.html', {
        'form': form,
        'plano': None,
        'usuario_sistema': request.user
    })

@login_required
def plano_seguro_update(request, pk):
    """Atualização de plano de seguro"""
    plano = get_object_or_404(PlanoSeguro, pk=pk)
    if request.method == 'POST':
        form = PlanoSeguroForm(request.POST, instance=plano)
        if form.is_valid():
            form.save()
            messages.success(request, 'Plano de seguro atualizado com sucesso!')
            return redirect('core:plano_seguro_list')
    else:
        form = PlanoSeguroForm(instance=plano)
    
    return render(request, 'core/plano_seguro_form.html', {
        'form': form,
        'plano': plano,
        'usuario_sistema': request.user
    })

@login_required
def plano_seguro_detail(request, pk):
    """Detalhes do plano de seguro"""
    plano = get_object_or_404(PlanoSeguro, pk=pk)
    return render(request, 'core/plano_seguro_detail.html', {
        'plano': plano,
        'usuario_sistema': request.user
    })

@login_required
def plano_seguro_delete(request, pk):
    """Exclusão de plano de seguro"""
    plano = get_object_or_404(PlanoSeguro, pk=pk)
    if request.method == 'POST':
        plano.delete()
        messages.success(request, 'Plano de seguro excluído com sucesso!')
        return redirect('core:plano_seguro_list')
    return render(request, 'core/plano_seguro_confirm_delete.html', {
        'plano': plano,
        'usuario_sistema': request.user
    })

@login_required
def bem_list(request):
    """Lista de bens"""
    bens = Bem.objects.all().order_by('tipo', 'descricao')
    return render(request, 'core/bem_list.html', {'bens': bens})

@login_required
def bem_create(request):
    """Criação de novo bem"""
    if request.method == 'POST':
        form = BemForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Bem registrado com sucesso!')
            return redirect('core:bem_list')
    else:
        form = BemForm()
    
    return render(request, 'core/bem_form.html', {
        'form': form,
        'bem': None,
        'usuario_sistema': request.user
    })

@login_required
def bem_update(request, pk):
    """Atualização de bem"""
    bem = get_object_or_404(Bem, pk=pk)
    if request.method == 'POST':
        form = BemForm(request.POST, instance=bem)
        if form.is_valid():
            form.save()
            messages.success(request, 'Bem atualizado com sucesso!')
            return redirect('core:bem_list')
    else:
        form = BemForm(instance=bem)
    
    return render(request, 'core/bem_form.html', {
        'form': form,
        'bem': bem,
        'usuario_sistema': request.user
    })

@login_required
def bem_detail(request, pk):
    """Detalhes do bem"""
    bem = get_object_or_404(Bem, pk=pk)
    return render(request, 'core/bem_detail.html', {
        'bem': bem,
        'usuario_sistema': request.user
    })

@login_required
def bem_delete(request, pk):
    """Exclusão de bem"""
    bem = get_object_or_404(Bem, pk=pk)
    if request.method == 'POST':
        bem.delete()
        messages.success(request, 'Bem excluído com sucesso!')
        return redirect('core:bem_list')
    return render(request, 'core/bem_confirm_delete.html', {
        'bem': bem,
        'usuario_sistema': request.user
    })

# Views administrativas
@login_required
def usuario_list(request):
    """Lista de usuários do sistema com filtros"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_usuario')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar usuários.'})
    
    # Obter parâmetros de filtro
    search = request.GET.get('search', '')
    perfil = request.GET.get('perfil', '')
    status = request.GET.get('status', 'todos')  # Agora o padrão é 'todos'
    loja = request.GET.get('loja', '')
    
    # Query base
    usuarios = Usuario.objects.all().order_by('user__first_name', 'user__last_name')
    
    # Aplicar filtros
    if search:
        usuarios = usuarios.filter(
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(user__username__icontains=search) |
            Q(user__email__icontains=search)
        )
    
    if perfil:
        usuarios = usuarios.filter(perfil__nome=perfil)
    
    if status == 'ativo':
        usuarios = usuarios.filter(status='ativo')
    elif status == 'inativo':
        usuarios = usuarios.filter(status='inativo')
    elif status == 'bloqueado':
        usuarios = usuarios.filter(status='bloqueado')
    # Se status == 'todos', não aplica filtro
    
    if loja:
        usuarios = usuarios.filter(loja_id=loja)
    
    lojas = Loja.objects.filter(ativo=True).order_by('nome')
    
    context = {
        'usuarios': usuarios,
        'lojas': lojas,
        'status': status,
        'search': search,
        'perfil': perfil,
        'loja': loja,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/usuario_list.html', context)

@login_required
def usuario_create(request):
    """Criação de novo usuário"""
    if request.method == 'POST':
        form = UsuarioForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Usuário registrado com sucesso!')
            return redirect('core:usuario_list')
    else:
        form = UsuarioForm()
    
    return render(request, 'core/usuario_form.html', {
        'form': form,
        'usuario': None,
        'usuario_sistema': request.user
    })

@login_required
def usuario_update(request, pk):
    """Atualização de usuário"""
    usuario = get_object_or_404(Usuario, pk=pk)
    if request.method == 'POST':
        form = UsuarioForm(request.POST, instance=usuario)
        if form.is_valid():
            form.save()
            messages.success(request, 'Usuário atualizado com sucesso!')
            return redirect('core:usuario_list')
    else:
        form = UsuarioForm(instance=usuario)
    
    return render(request, 'core/usuario_form.html', {
        'form': form,
        'usuario': usuario,
        'usuario_sistema': request.user
    })

@login_required
def usuario_detail(request, pk):
    """Detalhes do usuário"""
    usuario = get_object_or_404(Usuario, pk=pk)
    return render(request, 'core/usuario_detail.html', {
        'usuario': usuario,
        'usuario_sistema': request.user
    })

@login_required
def usuario_delete(request, pk):
    """Exclusão de usuário"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_usuario')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir usuários.'})
    
    usuario = get_object_or_404(Usuario, pk=pk)
    if request.method == 'POST':
        # Verificar se o usuário pode ser excluído
        if usuario.vendas_realizadas.exists():
            messages.error(request, 'Não é possível excluir um usuário que possui vendas registradas.')
            return redirect('core:usuario_detail', pk=usuario.pk)
        
        if usuario.consignacoes_responsavel.exists():
            messages.error(request, 'Não é possível excluir um usuário que possui consignações responsável.')
            return redirect('core:usuario_detail', pk=usuario.pk)
        
        if usuario.seguros_vendidos.exists():
            messages.error(request, 'Não é possível excluir um usuário que possui seguros vendidos.')
            return redirect('core:usuario_detail', pk=usuario.pk)
        
        usuario.status = 'inativo'
        usuario.save()
        messages.success(request, 'Usuário marcado como inativo com sucesso!')
        return redirect('core:usuario_list')
    
    return render(request, 'core/usuario_confirm_delete.html', {
        'usuario': usuario,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def loja_list(request):
    """Lista de lojas com filtros"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_loja')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar lojas.'})
    
    # Obter parâmetros de filtro
    search = request.GET.get('search', '')
    cidade = request.GET.get('cidade', '')
    status = request.GET.get('status', 'ativo')
    
    # Query base
    lojas = Loja.objects.all().order_by('nome')
    
    # Aplicar filtros
    if search:
        lojas = lojas.filter(
            Q(nome__icontains=search) |
            Q(cnpj__icontains=search) |
            Q(cidade__icontains=search)
        )
    
    if cidade:
        lojas = lojas.filter(cidade__icontains=cidade)
    
    if status == 'ativo':
        lojas = lojas.filter(ativo=True)
    elif status == 'inativo':
        lojas = lojas.filter(ativo=False)
    # Se status == 'todos', não aplica filtro
    
    context = {
        'lojas': lojas,
        'status': status,
        'search': search,
        'cidade': cidade,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    return render(request, 'core/loja_list.html', context)

@login_required
def loja_create(request):
    """Criação de nova loja"""
    if request.method == 'POST':
        form = LojaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Loja registrada com sucesso!')
            return redirect('core:loja_list')
    else:
        form = LojaForm()
    # Não existe loja ainda, então não há usuários ativos
    return render(request, 'core/loja_form.html', {
        'form': form,
        'loja': None,
        'usuarios_ativos': 0,
        'usuario_sistema': request.user
    })

@login_required
def loja_update(request, pk):
    """Atualização de loja"""
    loja = get_object_or_404(Loja, pk=pk)
    if request.method == 'POST':
        form = LojaForm(request.POST, instance=loja)
        if form.is_valid():
            form.save()
            messages.success(request, 'Loja atualizada com sucesso!')
            return redirect('core:loja_list')
    else:
        form = LojaForm(instance=loja)
    usuarios_ativos = loja.usuarios.filter(status='ativo').count()
    return render(request, 'core/loja_form.html', {
        'form': form,
        'loja': loja,
        'usuarios_ativos': usuarios_ativos,
        'usuario_sistema': request.user
    })

@login_required
def loja_detail(request, pk):
    """Detalhes da loja"""
    loja = get_object_or_404(Loja, pk=pk)
    usuarios_ativos = loja.usuarios.filter(status='ativo').count()
    return render(request, 'core/loja_detail.html', {
        'loja': loja,
        'usuarios_ativos': usuarios_ativos,
        'usuario_sistema': request.user
    })

@login_required
def loja_delete(request, pk):
    """Exclusão de loja"""
    if not (request.user.is_superuser or request.user.has_perm('core.delete_loja')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para excluir lojas.'})
    
    loja = get_object_or_404(Loja, pk=pk)
    if request.method == 'POST':
        # Verificar se a loja pode ser excluída
        if loja.usuarios.exists():
            messages.error(request, 'Não é possível excluir uma loja que possui usuários cadastrados.')
            return redirect('core:loja_detail', pk=loja.pk)
        
        if loja.vendas.exists():
            messages.error(request, 'Não é possível excluir uma loja que possui vendas registradas.')
            return redirect('core:loja_detail', pk=loja.pk)
        
        loja.ativo = False
        loja.save()
        messages.success(request, 'Loja marcada como inativa com sucesso!')
        return redirect('core:loja_list')
    
    return render(request, 'core/loja_confirm_delete.html', {
        'loja': loja,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

# Views de ocorrências
@login_required
def ocorrencia_list(request):
    """Lista de ocorrências com filtros"""
    if not (request.user.is_superuser or request.user.has_perm('core.view_ocorrencia')):
        return render(request, 'core/acesso_negado.html', {'mensagem': 'Você não tem permissão para visualizar ocorrências.'})
    
    # Obter parâmetros de filtro
    search = request.GET.get('search', '')
    tipo = request.GET.get('tipo', '')
    prioridade = request.GET.get('prioridade', '')
    status = request.GET.get('status', '')
    
    # Query base
    ocorrencias = Ocorrencia.objects.all().order_by('-data_abertura')
    
    # Aplicar filtros
    if search:
        ocorrencias = ocorrencias.filter(
            Q(titulo__icontains=search) |
            Q(descricao__icontains=search)
        )
    
    if tipo:
        ocorrencias = ocorrencias.filter(tipo=tipo)
    
    if prioridade:
        ocorrencias = ocorrencias.filter(prioridade=prioridade)
    
    if status:
        ocorrencias = ocorrencias.filter(status=status)
    
    # Estatísticas para o dashboard
    total_ocorrencias = Ocorrencia.objects.count()
    
    # Ocorrências por status
    ocorrencias_por_status = Ocorrencia.objects.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Ocorrências por tipo
    ocorrencias_por_tipo = Ocorrencia.objects.values('tipo').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Ocorrências por prioridade
    ocorrencias_por_prioridade = Ocorrencia.objects.values('prioridade').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Top solicitantes (pessoas que mais abrem ocorrências)
    top_solicitantes = Ocorrencia.objects.values(
        'solicitante__user__first_name', 
        'solicitante__user__last_name',
        'solicitante__loja__nome'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Top responsáveis (pessoas que mais resolvem ocorrências)
    top_responsaveis = Ocorrencia.objects.exclude(
        responsavel__isnull=True
    ).values(
        'responsavel__user__first_name', 
        'responsavel__user__last_name',
        'responsavel__loja__nome'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Ocorrências por loja
    ocorrencias_por_loja = Ocorrencia.objects.values('loja__nome').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Ocorrências dos últimos 30 dias
    data_30_dias_atras = datetime.now() - timedelta(days=30)
    ocorrencias_ultimos_30_dias = Ocorrencia.objects.filter(
        data_abertura__gte=data_30_dias_atras
    ).count()
    
    # Ocorrências atrasadas
    ocorrencias_atrasadas = Ocorrencia.objects.filter(
        Q(data_limite__lt=datetime.now()) & 
        ~Q(status__in=['resolvida', 'fechada'])
    ).count()
    
    # Ocorrências críticas
    ocorrencias_criticas = Ocorrencia.objects.filter(
        prioridade='critica',
        status__in=['aberta', 'em_analise', 'em_andamento']
    ).count()
    
    context = {
        'ocorrencias': ocorrencias,
        'search': search,
        'tipo': tipo,
        'prioridade': prioridade,
        'status': status,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
        # Estatísticas
        'total_ocorrencias': total_ocorrencias,
        'ocorrencias_por_status': ocorrencias_por_status,
        'ocorrencias_por_tipo': ocorrencias_por_tipo,
        'ocorrencias_por_prioridade': ocorrencias_por_prioridade,
        'top_solicitantes': top_solicitantes,
        'top_responsaveis': top_responsaveis,
        'ocorrencias_por_loja': ocorrencias_por_loja,
        'ocorrencias_ultimos_30_dias': ocorrencias_ultimos_30_dias,
        'ocorrencias_atrasadas': ocorrencias_atrasadas,
        'ocorrencias_criticas': ocorrencias_criticas,
    }
    return render(request, 'core/ocorrencia_list.html', context)

@login_required
def ocorrencia_create(request):
    """Criação de nova ocorrência"""
    logger = logging.getLogger('core')
    
    logger.info(f"ocorrencia_create: Usuário {request.user.username} tentando criar ocorrência")
    
    # Verificar se o usuário tem usuario_sistema
    if not hasattr(request.user, 'usuario_sistema') or request.user.usuario_sistema is None:
        logger.error(f"ocorrencia_create: Usuário {request.user.username} não tem usuario_sistema")
        messages.error(request, 'Seu usuário não está vinculado a um perfil do sistema. Contate o administrador.')
        return redirect('core:dashboard')
    
    # Verificar se o usuario_sistema tem loja
    if not hasattr(request.user.usuario_sistema, 'loja') or request.user.usuario_sistema.loja is None:
        logger.error(f"ocorrencia_create: Usuário {request.user.username} não tem loja associada")
        messages.error(request, 'Seu usuário não está vinculado a uma loja. Contate o administrador.')
        return redirect('core:dashboard')
    
    logger.info(f"ocorrencia_create: Usuário {request.user.username} tem usuario_sistema e loja válidos")
    
    if request.method == 'POST':
        form = OcorrenciaForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                ocorrencia = form.save(commit=False)
                ocorrencia.solicitante = request.user.usuario_sistema
                ocorrencia.save()
                logger.info(f"ocorrencia_create: Ocorrência criada com sucesso por {request.user.username}")
                messages.success(request, 'Ocorrência registrada com sucesso!')
                return redirect('core:ocorrencia_list')
            except Exception as e:
                logger.error(f"ocorrencia_create: Erro ao salvar ocorrência: {str(e)}")
                messages.error(request, f'Erro ao registrar ocorrência: {str(e)}')
        else:
            logger.warning(f"ocorrencia_create: Formulário inválido para {request.user.username}: {form.errors}")
    else:
        try:
            loja_inicial = request.user.usuario_sistema.loja
            form = OcorrenciaForm(initial={'loja': loja_inicial} if loja_inicial else {})
            logger.info(f"ocorrencia_create: Formulário criado para {request.user.username} com loja {loja_inicial}")
        except Exception as e:
            logger.error(f"ocorrencia_create: Erro ao criar formulário: {str(e)}")
            messages.error(request, f'Erro ao carregar formulário: {str(e)}')
            return redirect('core:dashboard')
    
    return render(request, 'core/ocorrencia_form.html', {
        'form': form,
        'ocorrencia': None,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None)
    })

@login_required
def ocorrencia_update(request, pk):
    """Atualização de ocorrência"""
    ocorrencia = get_object_or_404(Ocorrencia, pk=pk)
    if request.method == 'POST':
        form = OcorrenciaForm(request.POST, request.FILES, instance=ocorrencia)
        if form.is_valid():
            form.save()
            messages.success(request, 'Ocorrência atualizada com sucesso!')
            return redirect('core:ocorrencia_list')
    else:
        form = OcorrenciaForm(instance=ocorrencia)
    
    return render(request, 'core/ocorrencia_form.html', {
        'form': form,
        'ocorrencia': ocorrencia,
        'usuario_sistema': request.user
    })

@login_required
def ocorrencia_detail(request, pk):
    """Detalhes da ocorrência"""
    ocorrencia = get_object_or_404(Ocorrencia, pk=pk)
    comentarios = ocorrencia.comentarios.all()
    
    if request.method == 'POST':
        comentario_form = ComentarioOcorrenciaForm(request.POST)
        if comentario_form.is_valid():
            comentario = comentario_form.save(commit=False)
            comentario.ocorrencia = ocorrencia
            comentario.autor = request.user
            comentario.save()
            messages.success(request, 'Comentário adicionado com sucesso!')
            return redirect('core:ocorrencia_detail', pk=pk)
    else:
        comentario_form = ComentarioOcorrenciaForm()
    
    return render(request, 'core/ocorrencia_detail.html', {
        'ocorrencia': ocorrencia,
        'comentarios': comentarios,
        'comentario_form': comentario_form,
        'usuario_sistema': request.user
    })

# Views de Importação
@login_required
def import_data(request):
    """Redireciona para a tela de pré-visualização de motocicletas"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')
    
    # Redirecionar diretamente para a tela de pré-visualização de motocicletas
    return redirect('core:preview_import_motocicletas')

@login_required
def import_lojas(request):
    """Importação de lojas"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')
    
    if request.method == 'POST' and request.FILES.get('file'):
        try:
            importer = DataImporter()
            success = importer.import_lojas(request.FILES['file'])
            summary = importer.get_import_summary()
            
            if success:
                messages.success(request, f'Importação concluída! {summary["success_count"]} lojas importadas com sucesso.')
            else:
                messages.warning(request, f'Importação concluída com erros. {summary["success_count"]} lojas importadas, {summary["error_count"]} erros.')
                for error in summary.get('errors', [])[:5]:  # Mostra apenas os primeiros 5 erros
                    messages.error(request, f'Erro: {error}')
            
            return redirect('core:preview_import_motocicletas')
        except Exception as e:
            messages.error(request, f'Erro durante a importação: {str(e)}')
            return redirect('core:preview_import_motocicletas')
    
    return render(request, 'core/import_lojas.html', {
        'usuario_sistema': request.user
    })

@login_required
def import_clientes(request):
    """Importação de clientes"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')
    
    if request.method == 'POST':
        try:
            importer = DataImporter()
            
            # Verificar se há mapeamento de colunas (vindo da pré-visualização)
            column_mapping = {}
            temp_file_path = None
            if 'map_nome' in request.POST:
                # Mapeamento personalizado foi enviado - usar arquivo temporário
                if 'temp_file_path_clientes' not in request.session:
                    messages.error(request, 'Arquivo não encontrado. Faça o upload novamente.')
                    return redirect('core:preview_import_clientes')
                
                # Usar o arquivo temporário
                temp_file_path = request.session['temp_file_path_clientes']
                
                # Criar mapeamento de colunas
                column_mapping = {
                    'nome': [request.POST.get('map_nome')],
                    'cpf_cnpj': [request.POST.get('map_cpf_cnpj')],
                    'rg': [request.POST.get('map_rg')],
                    'data_nascimento': [request.POST.get('map_data_nascimento')],
                    'telefone': [request.POST.get('map_telefone')],
                    'email': [request.POST.get('map_email')],
                    'endereco': [request.POST.get('map_endereco')],
                    'cidade': [request.POST.get('map_cidade')],
                    'estado': [request.POST.get('map_estado')],
                    'cep': [request.POST.get('map_cep')],
                    'tipo': [request.POST.get('map_tipo')],
                    'observacoes': [request.POST.get('map_observacoes')]
                }
                
                # Remover campos vazios
                column_mapping = {k: v for k, v in column_mapping.items() if v[0]}
                
                # Limpar sessão
                del request.session['temp_file_path_clientes']
                
            else:
                # Upload direto (sem mapeamento)
                if not request.FILES.get('file'):
                    messages.error(request, 'Nenhum arquivo foi enviado.')
                    return redirect('core:preview_import_clientes')
                temp_file_path = request.FILES['file']
            
            success = importer.import_motocicletas(temp_file_path, column_mapping)
            summary = importer.get_import_summary()
            
            # Limpar arquivo temporário se existir
            if temp_file_path and isinstance(temp_file_path, str) and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except:
                    pass  # Ignorar erros de limpeza
            
            if success:
                messages.success(request, f'Importação concluída! {summary["success_count"]} motocicletas importadas com sucesso.')
            else:
                messages.warning(request, f'Importação concluída com erros. {summary["success_count"]} motocicletas importadas, {summary["error_count"]} erros.')
                for error in summary.get('errors', [])[:5]:
                    messages.error(request, f'Erro: {error}')
            
            return redirect('core:preview_import_motocicletas')
        except Exception as e:
            messages.error(request, f'Erro durante a importação: {str(e)}')
            return redirect('core:preview_import_motocicletas')
    
    return render(request, 'core/import_motocicletas.html', {
        'usuario_sistema': request.user
    })

@login_required
def import_vendas(request):
    """Importação de vendas"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')
    
    if request.method == 'POST':
        try:
            importer = DataImporter()
            
            # Verificar se há mapeamento de colunas (vindo da pré-visualização)
            column_mapping = {}
            temp_file_path = None
            if 'map_moto_chassi' in request.POST:
                # Mapeamento personalizado foi enviado - usar arquivo temporário
                if 'temp_file_path_vendas' not in request.session:
                    messages.error(request, 'Arquivo não encontrado. Faça o upload novamente.')
                    return redirect('core:preview_import_vendas')
                
                # Usar o arquivo temporário
                temp_file_path = request.session['temp_file_path_vendas']
                
                # Criar mapeamento de colunas
                column_mapping = {
                    'moto_chassi': [request.POST.get('map_moto_chassi')],
                    'comprador_cpf': [request.POST.get('map_comprador_cpf')],
                    'vendedor_username': [request.POST.get('map_vendedor_username')],
                    'loja_nome': [request.POST.get('map_loja_nome')],
                    'origem': [request.POST.get('map_origem')],
                    'forma_pagamento': [request.POST.get('map_forma_pagamento')],
                    'status': [request.POST.get('map_status')],
                    'valor_venda': [request.POST.get('map_valor_venda')],
                    'valor_entrada': [request.POST.get('map_valor_entrada')],
                    'comissao_vendedor': [request.POST.get('map_comissao_vendedor')],
                    'data_atendimento': [request.POST.get('map_data_atendimento')],
                    'data_venda': [request.POST.get('map_data_venda')],
                    'observacoes': [request.POST.get('map_observacoes')]
                }
                
                # Remover campos vazios
                column_mapping = {k: v for k, v in column_mapping.items() if v[0]}
                
                # Limpar sessão
                del request.session['temp_file_path_vendas']
                
            else:
                # Upload direto (sem mapeamento)
                if not request.FILES.get('file'):
                    messages.error(request, 'Nenhum arquivo foi enviado.')
                    return redirect('core:preview_import_vendas')
                temp_file_path = request.FILES['file']
            
            success = importer.import_vendas(temp_file_path, column_mapping)
            summary = importer.get_import_summary()
            
            # Limpar arquivo temporário se existir
            if temp_file_path and isinstance(temp_file_path, str) and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except:
                    pass  # Ignorar erros de limpeza
            
            if success:
                messages.success(request, f'Importação concluída! {summary["success_count"]} vendas importadas com sucesso.')
            else:
                messages.warning(request, f'Importação concluída com erros. {summary["success_count"]} vendas importadas, {summary["error_count"]} erros.')
                for error in summary.get('errors', [])[:5]:
                    messages.error(request, f'Erro: {error}')
            
            return redirect('core:preview_import_vendas')
        except Exception as e:
            messages.error(request, f'Erro durante a importação: {str(e)}')
            return redirect('core:preview_import_vendas')
    
    return render(request, 'core/import_vendas.html', {
        'usuario_sistema': request.user
    })

@login_required
def import_seguradoras(request):
    """Importação de seguradoras"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')
    
    if request.method == 'POST' and request.FILES.get('file'):
        try:
            importer = DataImporter()
            success = importer.import_seguradoras(request.FILES['file'])
            summary = importer.get_import_summary()
            
            if success:
                messages.success(request, f'Importação concluída! {summary["success_count"]} seguradoras importadas com sucesso.')
            else:
                messages.warning(request, f'Importação concluída com erros. {summary["success_count"]} seguradoras importadas, {summary["error_count"]} erros.')
                for error in summary.get('errors', [])[:5]:
                    messages.error(request, f'Erro: {error}')
            
            return redirect('core:preview_import_motocicletas')
        except Exception as e:
            messages.error(request, f'Erro durante a importação: {str(e)}')
            return redirect('core:preview_import_motocicletas')
    
    return render(request, 'core/import_seguradoras.html', {
        'usuario_sistema': request.user
    })

@login_required
def import_planos_seguro(request):
    """Importação de planos de seguro"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')
    
    if request.method == 'POST' and request.FILES.get('file'):
        try:
            importer = DataImporter()
            success = importer.import_planos_seguro(request.FILES['file'])
            summary = importer.get_import_summary()
            
            if success:
                messages.success(request, f'Importação concluída! {summary["success_count"]} planos importados com sucesso.')
            else:
                messages.warning(request, f'Importação concluída com erros. {summary["success_count"]} planos importados, {summary["error_count"]} erros.')
                for error in summary.get('errors', [])[:5]:
                    messages.error(request, f'Erro: {error}')
            
            return redirect('core:preview_import_motocicletas')
        except Exception as e:
            messages.error(request, f'Erro durante a importação: {str(e)}')
            return redirect('core:preview_import_motocicletas')
    
    return render(request, 'core/import_planos_seguro.html', {
        'usuario_sistema': request.user
    })

@require_GET
def buscar_motocicleta(request):
    id_moto = request.GET.get('id_moto')
    placa = request.GET.get('placa')
    chassi = request.GET.get('chassi')
    moto = None
    if id_moto:
        moto = Motocicleta.objects.filter(id=id_moto, ativo=True).first()
    elif placa:
        moto = Motocicleta.objects.filter(placa__iexact=placa, ativo=True).first()
    elif chassi:
        moto = Motocicleta.objects.filter(chassi__iexact=chassi, ativo=True).first()
    if moto:
        return JsonResponse({
            'id': moto.id,
            'placa': moto.placa,
            'chassi': moto.chassi,
            'descricao': f"ID: {moto.id} | Placa: {moto.placa or '-'} | Chassi: {moto.chassi} | {moto.marca} {moto.modelo} {moto.ano}"
        })
    return JsonResponse({}, status=404)

@login_required
def download_modelo_csv(request, tipo):
    """Download de modelo CSV para importação"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem baixar modelos.')
        return redirect('core:dashboard')
    
    modelos = {
        'clientes': 'clientes_modelo.csv',
        'lojas': 'lojas_modelo.csv',
        'motocicletas': 'motocicletas_modelo.csv',
        'vendas': 'vendas_modelo.csv',
        'seguradoras': 'seguradoras_modelo.csv',
        'planos_seguro': 'planos_seguro_modelo.csv',
    }
    
    if tipo not in modelos:
        messages.error(request, 'Tipo de modelo inválido.')
        return redirect('core:preview_import_motocicletas')
    
    arquivo_path = os.path.join(settings.STATIC_ROOT, 'modelos', modelos[tipo])
    
    if not os.path.exists(arquivo_path):
        # Se não existir no STATIC_ROOT, tenta no diretório static do projeto
        arquivo_path = os.path.join(settings.BASE_DIR, 'static', 'modelos', modelos[tipo])
    
    if not os.path.exists(arquivo_path):
        messages.error(request, 'Arquivo de modelo não encontrado.')
        return redirect('core:preview_import_motocicletas')
    
    with open(arquivo_path, 'rb') as f:
        response = HttpResponse(f.read(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{modelos[tipo]}"'
        return response

@csrf_exempt
@login_required
def preview_import_motocicletas(request):
    """Pré-visualização do CSV para importação de motocicletas"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')

    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        
        # Salvar o arquivo temporariamente
        import tempfile
        import os
        
        # Criar arquivo temporário
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file_path = os.path.join(temp_dir, f"temp_{request.user.id}_{file.name}")
        with open(temp_file_path, 'wb+') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
        
        # Armazenar o caminho do arquivo temporário na sessão
        request.session['temp_file_path'] = temp_file_path
        
        encodings = ['latin1', 'utf-8-sig', 'utf-8', 'cp1252', 'iso-8859-1', 'windows-1252']
        df = None
        for encoding in encodings:
            try:
                df = pd.read_csv(temp_file_path, encoding=encoding, nrows=10)
                break
            except Exception:
                continue
        if df is None:
            messages.error(request, 'Não foi possível ler o arquivo CSV. Tente salvar como CSV (separado por vírgula) e tente novamente.')
            return redirect('core:preview_import_motocicletas')
        colunas = list(df.columns)
        preview = df.head(5).values.tolist()
        
        # Lista de campos para mapeamento
        campos = ['marca', 'modelo', 'ano', 'cor', 'placa', 'chassi', 'valor_entrada', 'valor_atual', 'status', 'observacoes']
        
        return render(request, 'core/preview_import_motocicletas.html', {
            'colunas': colunas,
            'preview': preview,
            'arquivo_nome': file.name,
            'campos': campos,
        })
    
    # Lista de campos para mapeamento (mesmo quando não há arquivo)
    campos = ['marca', 'modelo', 'ano', 'cor', 'placa', 'chassi', 'valor_entrada', 'valor_atual', 'status', 'observacoes']
    
    # Verificar se há relatório de importação na sessão
    import_report = request.session.get('import_report')
    if import_report:
        # Remover o relatório da sessão após exibir
        del request.session['import_report']
        return render(request, 'core/preview_import_motocicletas.html', {
            'campos': campos,
            'import_report': import_report
        })
    
    return render(request, 'core/preview_import_motocicletas.html', {'campos': campos})

@csrf_exempt
@login_required
def preview_import_clientes(request):
    """Pré-visualização do CSV para importação de clientes"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')

    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        
        # Salvar o arquivo temporariamente
        import tempfile
        import os
        
        # Criar arquivo temporário
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file_path = os.path.join(temp_dir, f"temp_clientes_{request.user.id}_{file.name}")
        with open(temp_file_path, 'wb+') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
        
        # Armazenar o caminho do arquivo temporário na sessão
        request.session['temp_file_path_clientes'] = temp_file_path
        
        encodings = ['latin1', 'utf-8-sig', 'utf-8', 'cp1252', 'iso-8859-1', 'windows-1252']
        df = None
        for encoding in encodings:
            try:
                df = pd.read_csv(temp_file_path, encoding=encoding, nrows=10)
                break
            except Exception:
                continue
        if df is None:
            messages.error(request, 'Não foi possível ler o arquivo CSV. Tente salvar como CSV (separado por vírgula) e tente novamente.')
            return redirect('core:preview_import_clientes')
        colunas = list(df.columns)
        preview = df.head(5).values.tolist()
        
        # Lista de campos para mapeamento de clientes
        campos = ['nome', 'cpf_cnpj', 'rg', 'data_nascimento', 'telefone', 'email', 'endereco', 'cidade', 'estado', 'cep', 'tipo', 'observacoes']
        
        return render(request, 'core/preview_import_clientes.html', {
            'colunas': colunas,
            'preview': preview,
            'arquivo_nome': file.name,
            'campos': campos,
        })
    
    # Lista de campos para mapeamento (mesmo quando não há arquivo)
    campos = ['nome', 'cpf_cnpj', 'rg', 'data_nascimento', 'telefone', 'email', 'endereco', 'cidade', 'estado', 'cep', 'tipo', 'observacoes']
    return render(request, 'core/preview_import_clientes.html', {'campos': campos})

@csrf_exempt
@login_required
def preview_import_vendas(request):
    """Pré-visualização do CSV para importação de vendas"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')

    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        
        # Salvar o arquivo temporariamente
        import tempfile
        import os
        
        # Criar arquivo temporário
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file_path = os.path.join(temp_dir, f"temp_vendas_{request.user.id}_{file.name}")
        with open(temp_file_path, 'wb+') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
        
        # Armazenar o caminho do arquivo temporário na sessão
        request.session['temp_file_path_vendas'] = temp_file_path
        
        encodings = ['latin1', 'utf-8-sig', 'utf-8', 'cp1252', 'iso-8859-1', 'windows-1252']
        df = None
        for encoding in encodings:
            try:
                df = pd.read_csv(temp_file_path, encoding=encoding, nrows=10)
                break
            except Exception:
                continue
        if df is None:
            messages.error(request, 'Não foi possível ler o arquivo CSV. Tente salvar como CSV (separado por vírgula) e tente novamente.')
            return redirect('core:preview_import_vendas')
        colunas = list(df.columns)
        preview = df.head(5).values.tolist()
        
        # Lista de campos para mapeamento de vendas
        campos = ['moto_chassi', 'comprador_cpf', 'vendedor_username', 'loja_nome', 'origem', 'forma_pagamento', 'status', 'valor_venda', 'valor_entrada', 'comissao_vendedor', 'data_atendimento', 'data_venda', 'observacoes']
        
        return render(request, 'core/preview_import_vendas.html', {
            'colunas': colunas,
            'preview': preview,
            'arquivo_nome': file.name,
            'campos': campos,
        })
    
    # Lista de campos para mapeamento (mesmo quando não há arquivo)
    campos = ['moto_chassi', 'comprador_cpf', 'vendedor_username', 'loja_nome', 'origem', 'forma_pagamento', 'status', 'valor_venda', 'valor_entrada', 'comissao_vendedor', 'data_atendimento', 'data_venda', 'observacoes']
    return render(request, 'core/preview_import_vendas.html', {'campos': campos})

@login_required
def test_template(request):
    """View de teste para verificar se o template base está funcionando"""
    return render(request, 'core/test_template.html', {
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    })

@login_required
def usuario_menu_manage(request, usuario_id):
    """Gerencia os menus específicos de um usuário"""
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
    except Usuario.DoesNotExist:
        messages.error(request, 'Usuário não encontrado.')
        return redirect('core:usuario_list')
    
    # Verificar permissões
    if not (request.user.is_superuser or 
            (hasattr(request.user, 'usuario_sistema') and 
             request.user.usuario_sistema.perfil.nome in ['admin', 'gerente', 'ti'])):
        return render(request, 'core/acesso_negado.html', {
            'mensagem': 'Você não tem permissão para acessar esta funcionalidade.'
        })
    
    if request.method == 'POST':
        # Processar o formulário
        modulos = [
            ('clientes', 'Clientes'),
            ('motocicletas', 'Motocicletas'),
            ('vendas', 'Vendas'),
            ('consignacoes', 'Consignações'),
            ('seguros', 'Seguros'),
            ('usuarios', 'Usuários'),
            ('lojas', 'Lojas'),
            ('relatorios', 'Relatórios'),
            ('ocorrencias', 'Ocorrências'),
            ('seguradoras', 'Seguradoras'),
            ('bens', 'Bens'),
            ('cotacoes', 'Cotações'),
        ]
        
        # Limpar configurações existentes do usuário
        usuario.menus_usuario.all().delete()
        
        # Criar novas configurações baseadas no formulário
        for cod, nome in modulos:
            if request.POST.get(f'{usuario.pk}_{cod}'):
                MenuUsuario.objects.create(
                    usuario=usuario,
                    modulo=cod,
                    ativo=True
                )
        
        messages.success(request, f'Menus do usuário {usuario.user.get_full_name()} atualizados com sucesso!')
        return redirect('core:usuario_list')
    
    # Preparar dados para o template
    modulos = [
        ('clientes', 'Clientes'),
        ('motocicletas', 'Motocicletas'),
        ('vendas', 'Vendas'),
        ('consignacoes', 'Consignações'),
        ('seguros', 'Seguros'),
        ('usuarios', 'Usuários'),
        ('lojas', 'Lojas'),
        ('relatorios', 'Relatórios'),
        ('ocorrencias', 'Ocorrências'),
        ('seguradoras', 'Seguradoras'),
        ('bens', 'Bens'),
        ('cotacoes', 'Cotações'),
    ]
    
    # Verificar quais módulos estão ativos para o usuário
    menus_usuario = {}
    for cod, nome in modulos:
        menus_usuario[cod] = usuario.modulo_ativo(cod)
    
    context = {
        'usuario': usuario,
        'modulos': modulos,
        'menus_usuario': menus_usuario,
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None),
    }
    
    return render(request, 'core/usuario_menu_manage.html', context)

@login_required
def import_motocicletas(request):
    """Processa a importação de motocicletas com base no mapeamento"""
    if not request.user.is_superuser:
        messages.error(request, 'Apenas administradores podem importar dados.')
        return redirect('core:dashboard')

    if request.method == 'POST':
        # Verificar se existe arquivo temporário na sessão
        temp_file_path = request.session.get('temp_file_path')
        if not temp_file_path or not os.path.exists(temp_file_path):
            messages.error(request, 'Arquivo não encontrado. Faça upload novamente.')
            return redirect('core:preview_import_motocicletas')

        # Extrair mapeamento das colunas
        column_mapping = {}
        campos = ['marca', 'modelo', 'ano', 'cor', 'placa', 'chassi', 'valor_entrada', 'valor_atual', 'status', 'observacoes']
        
        for campo in campos:
            map_key = f'map_{campo}'
            if map_key in request.POST and request.POST[map_key]:
                # Converter para o formato esperado pelo importador (lista de possíveis nomes)
                column_mapping[campo] = [request.POST[map_key]]

        # Verificar campos obrigatórios
        campos_obrigatorios = ['marca', 'modelo', 'chassi']
        campos_faltando = [campo for campo in campos_obrigatorios if campo not in column_mapping]
        
        if campos_faltando:
            messages.error(request, f'Campos obrigatórios não mapeados: {", ".join(campos_faltando)}')
            return redirect('core:preview_import_motocicletas')

        try:
            # Importar usando o importador
            from .importers import DataImporter
            importer = DataImporter()
            success = importer.import_motocicletas(temp_file_path, column_mapping)
            summary = importer.get_import_summary()
            
            # Limpar arquivo temporário
            try:
                os.remove(temp_file_path)
                del request.session['temp_file_path']
            except:
                pass

            if success:
                messages.success(request, f'Importação concluída! {summary["success_count"]} motocicletas importadas com sucesso.')
                if summary.get("skipped_count", 0) > 0:
                    messages.warning(request, f'{summary["skipped_count"]} motocicletas foram ignoradas (sem chassi válido ou duplicadas).')
                if summary["error_count"] > 0:
                    messages.warning(request, f'{summary["error_count"]} registros com erros foram ignorados.')
                
                # Armazenar relatório na sessão para exibição
                if summary.get("skipped_motos"):
                    request.session['import_report'] = {
                        'success_count': summary["success_count"],
                        'skipped_count': summary.get("skipped_count", 0),
                        'error_count': summary["error_count"],
                        'skipped_motos': summary["skipped_motos"][:50]  # Limitar a 50 para não sobrecarregar a sessão
                    }
            else:
                messages.error(request, f'Erro na importação: {summary.get("errors", ["Erro desconhecido"])[0] if summary.get("errors") else "Erro desconhecido"}')

        except Exception as e:
            messages.error(request, f'Erro durante a importação: {str(e)}')
            # Limpar arquivo temporário em caso de erro
            try:
                os.remove(temp_file_path)
                del request.session['temp_file_path']
            except:
                pass

        return redirect('core:preview_import_motocicletas')

    return redirect('core:preview_import_motocicletas')