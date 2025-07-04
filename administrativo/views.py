from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import ControleChave
from .forms import ControleChaveForm
from core.models import Motocicleta

# Create your views here.

@login_required
def controle_chave_list(request):
    chaves = ControleChave.objects.select_related('funcionario', 'motocicleta').order_by('-data_saida')
    return render(request, 'administrativo/controle_chave_list.html', {'chaves': chaves})

@login_required
def controle_chave_create(request):
    motos = Motocicleta.objects.filter(ativo=True).order_by('-id')
    motos_data = [
        {
            'id': str(m.id),
            'placa': m.placa or '',
            'chassi': m.chassi or '',
            'descricao': f"ID: {m.id} | Placa: {m.placa or '-'} | Chassi: {m.chassi} | {m.marca} {m.modelo} {m.ano}"
        }
        for m in motos
    ]
    moto_selecionada = None
    moto_id = request.GET.get('moto_id')
    if moto_id and not request.method == 'POST':
        moto = Motocicleta.objects.filter(id=moto_id, ativo=True).first()
        if moto:
            moto_selecionada = {
                'id': str(moto.id),
                'placa': moto.placa or '',
                'chassi': moto.chassi or '',
                'descricao': f"ID: {moto.id} | Placa: {moto.placa or '-'} | Chassi: {moto.chassi} | {moto.marca} {moto.modelo} {moto.ano}"
            }
    if request.method == 'POST':
        form = ControleChaveForm(request.POST)
        id_moto = request.POST.get('id_id_moto')
        placa_moto = request.POST.get('id_placa_moto')
        chassi_moto = request.POST.get('id_chassi_moto')
        moto = None
        if id_moto:
            moto = Motocicleta.objects.filter(id=id_moto, ativo=True).first()
        elif placa_moto:
            moto = Motocicleta.objects.filter(placa=placa_moto, ativo=True).first()
        elif chassi_moto:
            moto = Motocicleta.objects.filter(chassi=chassi_moto, ativo=True).first()
        if form.is_valid() and moto:
            chave = form.save(commit=False)
            chave.motocicleta = moto
            chave.save()
            return redirect('controle_chave_list')
        if moto:
            moto_selecionada = {
                'id': str(moto.id),
                'placa': moto.placa or '',
                'chassi': moto.chassi or '',
                'descricao': f"ID: {moto.id} | Placa: {moto.placa or '-'} | Chassi: {moto.chassi} | {moto.marca} {moto.modelo} {moto.ano}"
            }
    else:
        form = ControleChaveForm()
    return render(request, 'administrativo/controle_chave_form.html', {'form': form, 'motos_data': motos_data, 'moto_selecionada': moto_selecionada})

@login_required
def controle_chave_devolver(request, pk):
    chave = get_object_or_404(ControleChave, pk=pk)
    if chave.status == 'aberto':
        chave.data_retorno = timezone.now()
        chave.status = 'devolvida'
        chave.save()
    return redirect('controle_chave_list')
