from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse
from .models import PreVenda
from .forms import PreVendaForm
import re

@login_required
def dashboard_pre_venda(request):
    """Dashboard com KPIs de pré-venda"""
    
    # KPIs principais
    total_pre_vendas = PreVenda.objects.count()
    total_vendas_convertidas = PreVenda.objects.filter(status='convertida').count()
    total_vendas_abertas = PreVenda.objects.filter(status='aberta').count()
    
    # Taxa de conversão
    taxa_conversao = 0
    if total_pre_vendas > 0:
        taxa_conversao = (total_vendas_convertidas / total_pre_vendas) * 100
    
    # Pré-vendas abertas há mais de 7 dias
    data_limite = timezone.now() - timedelta(days=7)
    pre_vendas_atrasadas = PreVenda.objects.filter(
        status='aberta',
        data_atendimento__lt=data_limite
    ).order_by('data_atendimento')
    
    # Pré-vendas por status
    pre_vendas_por_status = PreVenda.objects.values('status').annotate(
        total=Count('id')
    ).order_by('status')
    
    # Pré-vendas por vendedor
    pre_vendas_por_vendedor = PreVenda.objects.values('vendedor__user__first_name').annotate(
        total=Count('id')
    ).order_by('-total')[:10]
    
    context = {
        'total_pre_vendas': total_pre_vendas,
        'total_vendas_convertidas': total_vendas_convertidas,
        'total_vendas_abertas': total_vendas_abertas,
        'taxa_conversao': round(taxa_conversao, 1),
        'pre_vendas_atrasadas': pre_vendas_atrasadas,
        'pre_vendas_por_status': pre_vendas_por_status,
        'pre_vendas_por_vendedor': pre_vendas_por_vendedor,
    }
    
    return render(request, 'pre_venda/dashboard.html', context)

@login_required
def pre_venda_form(request):
    """Formulário para registrar nova pré-venda"""
    
    if request.method == 'POST':
        form = PreVendaForm(request.POST)
        if form.is_valid():
            pre_venda = form.save()
            
            messages.success(request, 'Pré-venda registrada com sucesso!')
            return redirect('pre_venda:lista_pre_vendas')
    else:
        form = PreVendaForm()
    
    return render(request, 'pre_venda/pre_venda_form.html', {'form': form})

@login_required
def lista_pre_vendas(request):
    """Lista de pré-vendas com filtros"""
    
    # Filtros
    status_filter = request.GET.get('status', '')
    vendedor_filter = request.GET.get('vendedor', '')
    search = request.GET.get('search', '')
    
    pre_vendas = PreVenda.objects.select_related('vendedor').all()
    
    # Aplicar filtros
    if status_filter:
        pre_vendas = pre_vendas.filter(status=status_filter)
    
    if vendedor_filter:
        pre_vendas = pre_vendas.filter(vendedor__id=vendedor_filter)
    
    if search:
        pre_vendas = pre_vendas.filter(
            Q(nome_cliente__icontains=search) |
            Q(telefone__icontains=search) |
            Q(moto_desejada__icontains=search)
        )
    
    # Ordenação
    pre_vendas = pre_vendas.order_by('-data_atendimento')
    
    # Vendedores para filtro
    vendedores = PreVenda.objects.values('vendedor__id', 'vendedor__user__first_name').distinct()
    
    context = {
        'pre_vendas': pre_vendas,
        'vendedores': vendedores,
        'status_filter': status_filter,
        'vendedor_filter': vendedor_filter,
        'search': search,
    }
    
    return render(request, 'pre_venda/lista_pre_vendas.html', context)



@login_required
def buscar_pre_venda_por_telefone(request):
    """API para buscar pré-venda por telefone (AJAX)"""
    
    telefone = request.GET.get('telefone', '')
    
    if telefone:
        # Remove caracteres não numéricos para comparação
        telefone_limpo = re.sub(r'[^\d]', '', telefone)
        
        # Busca pré-vendas com telefone similar
        pre_vendas = PreVenda.objects.filter(
            status='aberta',
            telefone__icontains=telefone_limpo
        )[:5]
        
        resultados = []
        for pre_venda in pre_vendas:
            resultados.append({
                'id': pre_venda.id,
                'nome_cliente': pre_venda.nome_cliente,
                'telefone': pre_venda.telefone,
                'moto_desejada': pre_venda.moto_desejada,
                'data_atendimento': pre_venda.data_atendimento.strftime('%d/%m/%Y %H:%M'),
            })
        
        return JsonResponse({'resultados': resultados})
    
    return JsonResponse({'resultados': []})

@login_required
def detalhes_pre_venda(request, pre_venda_id):
    """Detalhes de uma pré-venda específica"""
    
    pre_venda = get_object_or_404(PreVenda, id=pre_venda_id)
    
    context = {
        'pre_venda': pre_venda,
    }
    
    return render(request, 'pre_venda/detalhes_pre_venda.html', context)

@login_required
def alterar_status_pre_venda(request, pre_venda_id):
    """Alterar status de uma pré-venda"""
    
    pre_venda = get_object_or_404(PreVenda, id=pre_venda_id)
    novo_status = request.POST.get('status')
    
    if novo_status in ['aberta', 'convertida', 'descartada']:
        pre_venda.status = novo_status
        pre_venda.save()
        
        messages.success(request, f'Status alterado para "{pre_venda.get_status_display()}"')
    else:
        messages.error(request, 'Status inválido')
    
    return redirect('pre_venda:detalhes_pre_venda', pre_venda_id=pre_venda_id)
