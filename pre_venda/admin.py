from django.contrib import admin
from .models import PreVenda

@admin.register(PreVenda)
class PreVendaAdmin(admin.ModelAdmin):
    list_display = ['nome_cliente', 'telefone', 'moto_desejada', 'vendedor', 'status', 'data_atendimento']
    list_filter = ['status', 'vendedor', 'data_atendimento']
    search_fields = ['nome_cliente', 'telefone']
    readonly_fields = ['id', 'data_atendimento']
    list_per_page = 20
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('id', 'nome_cliente', 'telefone', 'moto_desejada')
        }),
        ('Responsável', {
            'fields': ('vendedor',)
        }),
        ('Status', {
            'fields': ('status', 'data_atendimento')
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vendedor__user')


