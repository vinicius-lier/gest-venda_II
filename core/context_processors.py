from .menus import MENUS
from django.urls import reverse, NoReverseMatch

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

def montar_menu(usuario):
    def tem_permissao(item):
        # Se não houver permissão definida, mostra para todos
        if not item.get('perms'):
            return True
        return any(usuario.has_perm(perm) for perm in item['perms'])

    menu_final = []
    for item in MENUS:
        if tem_permissao(item):
            novo_item = item.copy()
            # Resolve URL reversa se possível
            if 'url' in novo_item:
                try:
                    novo_item['url_resolved'] = reverse(novo_item['url'])
                except NoReverseMatch:
                    novo_item['url_resolved'] = '#'
            # Submenus
            if 'submenus' in item:
                submenus = [s.copy() for s in item['submenus'] if tem_permissao(s)]
                for s in submenus:
                    if 'url' in s:
                        try:
                            s['url_resolved'] = reverse(s['url'])
                        except NoReverseMatch:
                            s['url_resolved'] = '#'
                novo_item['submenus'] = submenus
            menu_final.append(novo_item)
    return menu_final

def menu_dinamico(request):
    usuario = getattr(request, 'user', None)
    if not usuario or not usuario.is_authenticated:
        return {}
    return {'menu_dinamico': montar_menu(usuario)} 