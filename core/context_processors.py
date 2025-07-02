def usuario_sistema(request):
    """Context processor para disponibilizar o usuário do sistema em todos os templates"""
    if request.user.is_authenticated:
        # Tenta obter o usuario_sistema, se não existir retorna None
        usuario = getattr(request.user, 'usuario_sistema', None)
        notificacoes_nao_lidas = 0
        notificacoes_importantes = []
        if usuario:
            notificacoes_nao_lidas = usuario.notificacoes.filter(lida=False).count()
            notificacoes_importantes = usuario.notificacoes.filter(lida=False).order_by('-data_criacao')[:3]
        return {
            'usuario_sistema': usuario,
            'notificacoes_nao_lidas': notificacoes_nao_lidas,
            'notificacoes_importantes': notificacoes_importantes,
        }
    return {
        'usuario_sistema': None,
        'notificacoes_nao_lidas': 0,
        'notificacoes_importantes': [],
    } 