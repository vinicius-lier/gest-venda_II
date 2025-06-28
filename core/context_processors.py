def usuario_sistema(request):
    """Context processor para disponibilizar o usuário do sistema em todos os templates"""
    if request.user.is_authenticated:
        # Tenta obter o usuario_sistema, se não existir retorna None
        usuario = getattr(request.user, 'usuario_sistema', None)
        return {
            'usuario_sistema': usuario
        }
    return {
        'usuario_sistema': None
    } 