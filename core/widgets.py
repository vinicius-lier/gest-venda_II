from django.forms.widgets import TextInput
import json

class AutocompleteClienteWidget(TextInput):
    """Widget para selecionar clientes com campo de autocomplete"""
    template_name = 'core/widgets/autocomplete_cliente.html'
    
    def __init__(self, attrs=None):
        default_attrs = {'class': 'form-control cliente-autocomplete'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)
    
    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        # Se temos um valor (ID do cliente), precisamos buscar o nome para exibir
        if value:
            from .models import Cliente
            try:
                cliente = Cliente.objects.get(id=value)
                # Definindo o valor do campo como o nome do cliente
                context['widget']['value'] = cliente.nome
                context['cliente_id'] = value
            except Cliente.DoesNotExist:
                pass
        return context

class AutocompleteMotoWidget(TextInput):
    """Widget para selecionar motos com campo de autocomplete"""
    template_name = 'core/widgets/autocomplete_moto.html'
    
    def __init__(self, attrs=None, only_available=True):
        self.only_available = only_available
        default_attrs = {'class': 'form-control moto-autocomplete'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)
    
    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context['widget']['only_available'] = json.dumps(self.only_available)
        
        # Se temos um valor (ID da moto), precisamos buscar as informações para exibir
        if value:
            from .models import EstoqueMoto
            try:
                moto = EstoqueMoto.objects.get(id=value)
                # Definindo o valor do campo como informações da moto
                context['widget']['value'] = f"{moto.marca} {moto.modelo} ({moto.ano}) - {moto.cor}"
                context['moto_id'] = value
            except EstoqueMoto.DoesNotExist:
                pass
        return context 