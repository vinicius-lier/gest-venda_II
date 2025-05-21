import os
import django

# Configurar ambiente
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_vendas.settings')
django.setup()

from core.models import Venda, Cliente

# Obter todas as vendas que não têm proprietário definido
vendas_sem_proprietario = Venda.objects.filter(proprietario__isnull=True)
print(f"Encontradas {vendas_sem_proprietario.count()} vendas sem proprietário definido")

# Para cada venda, definir o proprietário como o cliente
for venda in vendas_sem_proprietario:
    if venda.cliente:
        venda.proprietario = venda.cliente
        venda.save(update_fields=['proprietario'])
        print(f"Venda {venda.id}: definido proprietário como {venda.cliente.nome}")
    else:
        print(f"Venda {venda.id}: não tem cliente associado, não foi possível definir proprietário")

print("Processo concluído") 