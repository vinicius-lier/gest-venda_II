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
    if request.method == 'POST':
        form = ControleChaveForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('controle_chave_list')
    else:
        form = ControleChaveForm()
    return render(request, 'administrativo/controle_chave_form.html', {'form': form})

@login_required
def controle_chave_devolver(request, pk):
    chave = get_object_or_404(ControleChave, pk=pk)
    if chave.status == 'aberto':
        chave.data_retorno = timezone.now()
        chave.status = 'devolvida'
        chave.save()
    return redirect('controle_chave_list')
