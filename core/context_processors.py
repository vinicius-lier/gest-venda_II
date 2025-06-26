def usuario_sistema(request):
    return {
        'usuario_sistema': getattr(request.user, 'usuario_sistema', None)
    } 