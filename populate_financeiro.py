#!/usr/bin/env python
"""
Script para popular o banco com dados de exemplo do módulo financeiro
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_vendas.settings')
django.setup()

from core.models import (
    Loja, Usuario, Cliente, Motocicleta, Venda, 
    VendaFinanceira, Despesa, ReceitaExtra, Pagamento
)

def criar_dados_exemplo():
    """Cria dados de exemplo para o módulo financeiro"""
    print("=== Criando dados de exemplo para o módulo financeiro ===")
    
    # Verificar se já existem dados
    if VendaFinanceira.objects.exists():
        print("⚠️  Dados financeiros já existem. Pulando criação...")
        return
    
    # Obter loja padrão
    try:
        loja = Loja.objects.first()
        if not loja:
            print("❌ Nenhuma loja encontrada. Crie uma loja primeiro.")
            return
    except Exception as e:
        print(f"❌ Erro ao obter loja: {e}")
        return
    
    # Obter usuário padrão
    try:
        usuario = Usuario.objects.first()
        if not usuario:
            print("❌ Nenhum usuário encontrado. Crie um usuário primeiro.")
            return
    except Exception as e:
        print(f"❌ Erro ao obter usuário: {e}")
        return
    
    # Obter cliente padrão
    try:
        cliente = Cliente.objects.first()
        if not cliente:
            print("❌ Nenhum cliente encontrado. Crie um cliente primeiro.")
            return
    except Exception as e:
        print(f"❌ Erro ao obter cliente: {e}")
        return
    
    # Obter motocicleta padrão
    try:
        moto = Motocicleta.objects.first()
        if not moto:
            print("❌ Nenhuma motocicleta encontrada. Crie uma motocicleta primeiro.")
            return
    except Exception as e:
        print(f"❌ Erro ao obter motocicleta: {e}")
        return
    
    # Criar venda padrão se não existir
    venda, created = Venda.objects.get_or_create(
        moto=moto,
        comprador=cliente,
        vendedor=usuario,
        loja=loja,
        defaults={
            'origem': 'presencial',
            'forma_pagamento': 'a_vista',
            'status': 'vendido',
            'valor_venda': Decimal('15000.00'),
            'data_venda': datetime.now().date()
        }
    )
    
    if created:
        print(f"✅ Venda criada: {venda}")
    
    # Criar venda financeira principal
    venda_fin_principal, created = VendaFinanceira.objects.get_or_create(
        venda=venda,
        defaults={
            'moto': moto,
            'produto': f'{moto.marca} {moto.modelo} {moto.ano}',
            'quantidade': 1,
            'preco_unitario': Decimal('15000.00'),
            'desconto': Decimal('500.00'),
            'custo_unitario': Decimal('12000.00'),
            'canal_venda': 'loja',
            'data': datetime.now().date() - timedelta(days=5)
        }
    )
    
    if created:
        print(f"✅ Venda financeira criada: {venda_fin_principal.produto} - R$ {venda_fin_principal.valor_liquido}")
    else:
        print(f"✅ Venda financeira já existe: {venda_fin_principal.produto} - R$ {venda_fin_principal.valor_liquido}")
    
    # Criar vendas financeiras adicionais (sem venda vinculada)
    vendas_financeiras_adicionais = [
        {
            'venda': None,  # Sem venda vinculada
            'moto': moto,
            'produto': f'{moto.marca} {moto.modelo} {moto.ano} - Acessórios',
            'quantidade': 1,
            'preco_unitario': Decimal('800.00'),
            'desconto': Decimal('0.00'),
            'custo_unitario': Decimal('400.00'),
            'canal_venda': 'loja',
            'data': datetime.now().date() - timedelta(days=3)
        },
        {
            'venda': None,  # Sem venda vinculada
            'moto': moto,
            'produto': f'{moto.marca} {moto.modelo} {moto.ano} - Seguro',
            'quantidade': 1,
            'preco_unitario': Decimal('1200.00'),
            'desconto': Decimal('100.00'),
            'custo_unitario': Decimal('800.00'),
            'canal_venda': 'whatsapp',
            'data': datetime.now().date() - timedelta(days=1)
        }
    ]
    
    for dados_venda in vendas_financeiras_adicionais:
        venda_fin = VendaFinanceira.objects.create(**dados_venda)
        print(f"✅ Venda financeira adicional criada: {venda_fin.produto} - R$ {venda_fin.valor_liquido}")
    
    # Criar despesas
    despesas = [
        {
            'descricao': 'Aluguel da Loja',
            'categoria': 'aluguel',
            'valor': Decimal('3000.00'),
            'data': datetime.now().date() - timedelta(days=10),
            'fixa_variavel': 'fixa',
            'centro_custo': 'Loja Principal',
            'loja': loja,
            'responsavel': usuario
        },
        {
            'descricao': 'Energia Elétrica',
            'categoria': 'energia',
            'valor': Decimal('450.00'),
            'data': datetime.now().date() - timedelta(days=8),
            'fixa_variavel': 'variavel',
            'centro_custo': 'Loja Principal',
            'loja': loja,
            'responsavel': usuario
        },
        {
            'descricao': 'Marketing Digital',
            'categoria': 'marketing',
            'valor': Decimal('800.00'),
            'data': datetime.now().date() - timedelta(days=6),
            'fixa_variavel': 'variavel',
            'centro_custo': 'Marketing',
            'loja': loja,
            'responsavel': usuario
        },
        {
            'descricao': 'Manutenção de Equipamentos',
            'categoria': 'manutencao',
            'valor': Decimal('350.00'),
            'data': datetime.now().date() - timedelta(days=4),
            'fixa_variavel': 'variavel',
            'centro_custo': 'Oficina',
            'loja': loja,
            'responsavel': usuario
        }
    ]
    
    for dados_despesa in despesas:
        despesa = Despesa.objects.create(**dados_despesa)
        print(f"✅ Despesa criada: {despesa.descricao} - R$ {despesa.valor}")
    
    # Criar receitas extras
    receitas = [
        {
            'descricao': 'Comissão de Seguro',
            'valor': Decimal('200.00'),
            'data': datetime.now().date() - timedelta(days=2),
            'loja': loja,
            'responsavel': usuario
        },
        {
            'descricao': 'Venda de Acessórios',
            'valor': Decimal('150.00'),
            'data': datetime.now().date() - timedelta(days=1),
            'loja': loja,
            'responsavel': usuario
        }
    ]
    
    for dados_receita in receitas:
        receita = ReceitaExtra.objects.create(**dados_receita)
        print(f"✅ Receita extra criada: {receita.descricao} - R$ {receita.valor}")
    
    # Criar pagamentos
    pagamentos = [
        {
            'tipo': 'entrada',
            'referente_a': 'venda',
            'valor': Decimal('15000.00'),
            'vencimento': datetime.now().date() + timedelta(days=5),
            'pago': False,
            'loja': loja,
            'responsavel': usuario,
            'venda': venda
        },
        {
            'tipo': 'saida',
            'referente_a': 'despesa',
            'valor': Decimal('3000.00'),
            'vencimento': datetime.now().date() + timedelta(days=2),
            'pago': False,
            'loja': loja,
            'responsavel': usuario
        },
        {
            'tipo': 'entrada',
            'referente_a': 'receita_extra',
            'valor': Decimal('200.00'),
            'vencimento': datetime.now().date() - timedelta(days=1),
            'pago': True,
            'data_pagamento': datetime.now().date() - timedelta(days=1),
            'loja': loja,
            'responsavel': usuario
        }
    ]
    
    for dados_pagamento in pagamentos:
        pagamento = Pagamento.objects.create(**dados_pagamento)
        status = "Pago" if pagamento.pago else "Pendente"
        print(f"✅ Pagamento criado: {pagamento.get_tipo_display()} - R$ {pagamento.valor} - {status}")
    
    print("\n🎉 Dados de exemplo criados com sucesso!")
    print(f"📊 Resumo:")
    print(f"   - {VendaFinanceira.objects.count()} vendas financeiras")
    print(f"   - {Despesa.objects.count()} despesas")
    print(f"   - {ReceitaExtra.objects.count()} receitas extras")
    print(f"   - {Pagamento.objects.count()} pagamentos")
    print(f"\n🌐 Acesse o dashboard financeiro em: /financeiro/")

if __name__ == '__main__':
    criar_dados_exemplo() 