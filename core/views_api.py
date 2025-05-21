from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from .models import Cliente, EstoqueMoto
from django.contrib.auth.decorators import login_required
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

@login_required
def cliente_search(request):
    """
    API para buscar clientes pelo nome, cpf ou telefone
    """
    search_term = request.GET.get('term', '')
    if len(search_term) < 3:
        return JsonResponse([], safe=False)
        
    clientes = Cliente.objects.filter(
        Q(nome__icontains=search_term) | 
        Q(cpf__icontains=search_term) | 
        Q(telefone__icontains=search_term)
    )[:20]  # Limita a 20 resultados
    
    results = []
    for cliente in clientes:
        info_adicional = []
        if cliente.cpf:
            info_adicional.append(f"CPF: {cliente.cpf}")
        if cliente.telefone:
            info_adicional.append(f"Tel: {cliente.telefone}")
            
        display_text = f"{cliente.nome}"
        if info_adicional:
            display_text += f" ({', '.join(info_adicional)})"
            
        results.append({
            'id': cliente.id,
            'text': display_text,
            'nome': cliente.nome
        })
    
    return JsonResponse(results, safe=False)

@login_required
def moto_search(request):
    """
    API para buscar motos pelo modelo, placa ou chassi
    """
    search_term = request.GET.get('term', '')
    if len(search_term) < 3:
        return JsonResponse([], safe=False)
        
    motos = EstoqueMoto.objects.filter(
        Q(modelo__icontains=search_term) | 
        Q(placa__icontains=search_term) | 
        Q(chassi__icontains=search_term) |
        Q(matricula__icontains=search_term)
    )[:20]  # Limita a 20 resultados
    
    results = []
    for moto in motos:
        display_text = f"{moto.marca} {moto.modelo} ({moto.ano}) - {moto.cor}"
        if moto.matricula:
            display_text += f" - Matrícula: {moto.matricula}"
        if moto.placa:
            display_text += f" - Placa: {moto.placa}"
            
        results.append({
            'id': moto.id,
            'text': display_text
        })
    
    return JsonResponse(results, safe=False)

@login_required
def cliente_detail(request, cliente_id):
    """
    API para obter detalhes de um cliente
    """
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        data = {
            'id': cliente.id,
            'nome': cliente.nome,
            'cpf': cliente.cpf or '',
            'rg': cliente.rg or '',
            'endereco': cliente.endereco or '',
            'telefone': cliente.telefone or '',
            'email': cliente.email or ''
        }
        return JsonResponse(data)
    except Cliente.DoesNotExist:
        return JsonResponse({'error': 'Cliente não encontrado'}, status=404)

@login_required
@require_http_methods(["POST"])
def novo_cliente(request):
    """
    API para criar um novo cliente
    """
    try:
        nome = request.POST.get('nome')
        if not nome:
            return JsonResponse({'success': False, 'message': 'Nome é obrigatório'}, status=400)
            
        cliente = Cliente(
            nome=nome,
            cpf=request.POST.get('cpf', ''),
            rg=request.POST.get('rg', ''),
            endereco=request.POST.get('endereco', ''),
            telefone=request.POST.get('telefone', ''),
            email=request.POST.get('email', '')
        )
        cliente.save()
        
        return JsonResponse({
            'success': True,
            'cliente': {
                'id': cliente.id,
                'nome': cliente.nome,
                'cpf': cliente.cpf or '',
                'telefone': cliente.telefone or ''
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@login_required
def buscar_clientes(request):
    """API para buscar clientes por nome, CPF, RG, email ou telefone"""
    termo = request.GET.get('termo', '')
    tipo = request.GET.get('tipo', '')  # Filtro opcional por tipo
    
    if not termo and not tipo:
        return JsonResponse({'results': []})
    
    query = Q()
    
    if termo:
        query |= Q(nome__icontains=termo)
        query |= Q(cpf__icontains=termo)
        query |= Q(rg__icontains=termo)
        query |= Q(email__icontains=termo)
        query |= Q(telefone__icontains=termo)
    
    if tipo:
        query &= Q(tipo=tipo)
    
    clientes = Cliente.objects.filter(query)[:20]
    
    results = []
    for cliente in clientes:
        info_adicional = []
        if cliente.cpf:
            info_adicional.append(f"CPF: {cliente.cpf}")
        if cliente.telefone:
            info_adicional.append(f"Tel: {cliente.telefone}")
            
        display_text = f"{cliente.nome}"
        if info_adicional:
            display_text += f" ({', '.join(info_adicional)})"
            
        # Adiciona o tipo ao resultado
        tipo_texto = dict(Cliente.TIPO_CHOICES).get(cliente.tipo, 'Cliente')
            
        results.append({
            'id': cliente.id,
            'text': display_text,
            'nome': cliente.nome,
            'cpf': cliente.cpf or '',
            'telefone': cliente.telefone or '',
            'email': cliente.email or '',
            'tipo': cliente.tipo,
            'tipo_texto': tipo_texto,
        })
    
    return JsonResponse({'results': results})

@login_required
def buscar_motos(request):
    """API para buscar motos por modelo, placa, chassi ou matrícula"""
    termo = request.GET.get('termo', '')
    if len(termo) < 2:
        return JsonResponse({'results': []})
    
    # Filtra apenas motos disponíveis por padrão, a menos que se especifique o contrário
    disponivel = request.GET.get('disponivel', 'true').lower() == 'true'
    venda_permitida = request.GET.get('venda_permitida', 'true').lower() == 'true'
    
    # Se precisamos filtrar por status de venda permitida
    if venda_permitida:
        filtro_status = Q(status='DISPONIVEL')
    elif disponivel:
        # Se apenas queremos motos disponíveis (não vendidas), mas pode incluir pendências
        filtro_status = ~Q(status='VENDIDO')
    else:
        # Sem filtro de status
        filtro_status = Q()
    
    motos = EstoqueMoto.objects.filter(
        filtro_status &
        (Q(modelo__icontains=termo) | 
         Q(marca__icontains=termo) | 
         Q(placa__icontains=termo) | 
         Q(chassi__icontains=termo) |
         Q(matricula__icontains=termo))
    )[:10]
    
    resultado = []
    for moto in motos:
        # Adiciona informação se a moto pode ser vendida ou não
        disponivel_para_venda = moto.status == 'DISPONIVEL'
        status_text = ""
        
        if not disponivel_para_venda and moto.status != 'VENDIDO':
            status_text = f" - Status: {moto.status} (não disponível para venda)"
        
        resultado.append({
            'id': moto.id,
            'marca': moto.marca,
            'modelo': moto.modelo,
            'ano': moto.ano,
            'cor': moto.cor,
            'placa': moto.placa or '',
            'chassi': moto.chassi or '',
            'matricula': moto.matricula or '',
            'valor': float(moto.valor),
            'status': moto.status,
            'disponivel_para_venda': disponivel_para_venda,
            'text': f"{moto.marca} {moto.modelo} ({moto.ano}) - {moto.cor} - {moto.matricula or ''}{status_text}"
        })
    
    return JsonResponse({'results': resultado})

@login_required
def criar_cliente_rapido(request):
    """API para criar rapidamente um cliente a partir de dados básicos"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método não permitido'}, status=405)
    
    nome = request.POST.get('nome')
    telefone = request.POST.get('telefone', '')
    cpf = request.POST.get('cpf', '')
    email = request.POST.get('email', '')
    endereco = request.POST.get('endereco', '')
    
    if not nome:
        return JsonResponse({'success': False, 'error': 'Nome é obrigatório'}, status=400)
    
    try:
        cliente = Cliente.objects.create(
            nome=nome,
            telefone=telefone,
            cpf=cpf,
            email=email,
            endereco=endereco
        )
        
        # Formatação para exibição de dados
        cpf_formatado = cliente.cpf if cliente.cpf else "CPF não informado"
        telefone_formatado = cliente.telefone if cliente.telefone else "Tel não informado"
        
        return JsonResponse({
            'success': True, 
            'cliente': {
                'id': cliente.id,
                'nome': cliente.nome,
                'cpf': cliente.cpf or '',
                'telefone': cliente.telefone or '',
                'email': cliente.email or '',
                'endereco': cliente.endereco or '',
                'text': f"{cliente.nome} - {cpf_formatado} ({telefone_formatado})"
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@login_required
def criar_moto_rapida(request):
    """API para criar rapidamente uma moto a partir de dados básicos"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método não permitido'}, status=405)
    
    marca = request.POST.get('marca')
    modelo = request.POST.get('modelo')
    ano = request.POST.get('ano')
    cor = request.POST.get('cor')
    chassi = request.POST.get('chassi')
    placa = request.POST.get('placa', '')
    valor = request.POST.get('valor')
    estado_doc = request.POST.get('estado_doc', 'regular')
    observacoes = request.POST.get('observacoes', '')
    proprietario_id = request.POST.get('proprietario_id')
    
    # Validações básicas
    if not all([marca, modelo, ano, cor, chassi, valor]):
        return JsonResponse({'success': False, 'error': 'Campos obrigatórios não preenchidos'}, status=400)
    
    try:
        # Verifica se o chassi já existe
        if EstoqueMoto.objects.filter(chassi=chassi).exists():
            return JsonResponse({'success': False, 'error': 'Já existe uma moto com este chassi'}, status=400)
        
        # Define o status com base no estado da documentação
        status = 'DISPONIVEL' if estado_doc == 'regular' else 'PENDENCIA'
        
        # Associa ao proprietário, se fornecido
        proprietario = None
        if proprietario_id:
            try:
                proprietario = Cliente.objects.get(id=proprietario_id)
            except Cliente.DoesNotExist:
                # Se não encontrar o cliente, continua sem proprietário
                pass
        
        # Cria a moto
        moto = EstoqueMoto.objects.create(
            marca=marca,
            modelo=modelo,
            ano=ano,
            cor=cor,
            chassi=chassi,
            placa=placa,
            valor=valor,
            status=status,
            categoria='SEMI NOVA',
            data_entrada=timezone.now().date(),
            proprietario=proprietario,
            observacoes=observacoes
        )
        
        # Cria registro no histórico de proprietários, se necessário
        if proprietario:
            from .models import HistoricoProprietario
            HistoricoProprietario.objects.create(
                moto=moto,
                proprietario=proprietario,
                data_inicio=timezone.now().date(),
                motivo='ENTRADA' if estado_doc == 'regular' else 'PENDENTE'
            )
        
        return JsonResponse({
            'success': True, 
            'moto': {
                'id': moto.id,
                'marca': moto.marca,
                'modelo': moto.modelo,
                'ano': moto.ano,
                'cor': moto.cor,
                'chassi': moto.chassi,
                'placa': moto.placa or '',
                'valor': float(moto.valor),
                'text': f"{moto.marca} {moto.modelo} ({moto.ano}) - {moto.cor}"
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@login_required
def moto_detail(request, moto_id):
    """
    API para obter detalhes de uma moto, incluindo seu proprietário se tiver um
    """
    try:
        moto = EstoqueMoto.objects.get(id=moto_id)
        data = {
            'id': moto.id,
            'marca': moto.marca,
            'modelo': moto.modelo,
            'ano': moto.ano,
            'cor': moto.cor,
            'placa': moto.placa or '',
            'chassi': moto.chassi or '',
            'renavam': moto.renavam or '',
            'valor': float(moto.valor),
            'status': moto.status,
            'categoria': moto.categoria,
            'matricula': moto.matricula or '',
            'disponivel_para_venda': moto.status == 'DISPONIVEL'
        }
        
        # Inclui informações do proprietário se existir
        if moto.proprietario:
            cliente = moto.proprietario
            info_adicional = []
            if cliente.cpf:
                info_adicional.append(f"CPF: {cliente.cpf}")
            if cliente.telefone:
                info_adicional.append(f"Tel: {cliente.telefone}")
                
            display_text = f"{cliente.nome}"
            if info_adicional:
                display_text += f" ({', '.join(info_adicional)})"
                
            data['proprietario'] = {
                'id': cliente.id,
                'nome': cliente.nome,
                'cpf': cliente.cpf or '',
                'telefone': cliente.telefone or '',
                'text': display_text
            }
        
        # Inclui mensagem de alerta se a moto não puder ser vendida
        if moto.status in ['PENDENCIA', 'OFICINA', 'MANUTENCAO']:
            data['alerta'] = f"Atenção: Esta moto está com status {moto.status} e não pode ser vendida até que seu status seja alterado para DISPONIVEL."
            
        return JsonResponse(data)
    except EstoqueMoto.DoesNotExist:
        return JsonResponse({'error': 'Moto não encontrada'}, status=404) 