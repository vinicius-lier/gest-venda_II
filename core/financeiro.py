# -*- coding: utf-8 -*-
"""
Módulo de cálculos financeiros para análise de vendas, lucros e despesas
"""
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import VendaFinanceira, Despesa, ReceitaExtra, Pagamento, Venda, Loja, Motocicleta


class CalculadoraFinanceira:
    """Classe principal para cálculos financeiros"""
    
    def __init__(self, loja=None, data_inicio=None, data_fim=None):
        self.loja = loja
        self.data_inicio = data_inicio or (timezone.now().date() - timedelta(days=30))
        self.data_fim = data_fim or timezone.now().date()
    
    def get_filtros_periodo(self):
        """Retorna filtros de período para queries (para modelos com campo 'data')"""
        filtros = {}
        if self.data_inicio:
            filtros['data__gte'] = self.data_inicio
        if self.data_fim:
            filtros['data__lte'] = self.data_fim
        return filtros
    
    def get_filtros_periodo_venda(self):
        """Retorna filtros de período para queries de Venda (usa data_venda)"""
        filtros = {}
        if self.data_inicio:
            filtros['data_venda__gte'] = self.data_inicio
        if self.data_fim:
            filtros['data_venda__lte'] = self.data_fim
        return filtros
    
    def get_filtros_periodo_pagamento(self):
        """Retorna filtros de período para queries de Pagamento (usa data_pagamento)"""
        return {
            'data_pagamento__gte': self.data_inicio,
            'data_pagamento__lte': self.data_fim
        }
    
    def get_filtros_loja(self):
        """Retorna filtros de loja para queries"""
        if self.loja:
            return {'loja': self.loja}
        return {}
    

    
    def calcular_lucro_venda(self, venda):
        """Calcula lucro de uma venda específica"""
        return venda.valor_venda - (venda.valor_entrada or 0)
    
    def calcular_lucro_total_periodo(self):
        """Calcula lucro total no período"""
        # Soma dos lucros das vendas
        vendas = Venda.objects.filter(
            **self.get_filtros_periodo_venda(),
            **self.get_filtros_loja()
        )
        lucro_vendas = sum(venda.valor_venda - (venda.valor_entrada or 0) for venda in vendas)
        
        # Soma das receitas extras
        receitas = ReceitaExtra.objects.filter(
            **self.get_filtros_periodo(),
            **self.get_filtros_loja()
        )
        receitas_totais = receitas.aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        # Soma das despesas
        despesas = Despesa.objects.filter(
            **self.get_filtros_periodo(),
            **self.get_filtros_loja()
        )
        despesas_totais = despesas.aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        return lucro_vendas + receitas_totais - despesas_totais
    
    def calcular_receita_bruta_periodo(self):
        """Calcula receita bruta no período"""
        vendas = Venda.objects.filter(
            **self.get_filtros_periodo_venda(),
            **self.get_filtros_loja()
        )
        receita_vendas = sum(venda.valor_venda for venda in vendas)
        
        receitas = ReceitaExtra.objects.filter(
            **self.get_filtros_periodo(),
            **self.get_filtros_loja()
        )
        receitas_totais = receitas.aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        return receita_vendas + receitas_totais
    
    def calcular_margem_lucro_periodo(self):
        """Calcula margem de lucro bruta no período (%)"""
        receita_bruta = self.calcular_receita_bruta_periodo()
        if receita_bruta > 0:
            lucro_total = self.calcular_lucro_total_periodo()
            return (lucro_total / receita_bruta) * 100
        return 0
    
    def calcular_fluxo_caixa_atual(self):
        """Calcula fluxo de caixa atual (receitas confirmadas - despesas pagas)"""
        # Receitas confirmadas (pagamentos de entrada pagos)
        receitas_confirmadas = Pagamento.objects.filter(
            tipo='entrada',
            pago=True,
            **self.get_filtros_periodo_pagamento(),
            **self.get_filtros_loja()
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        # Despesas pagas
        despesas_pagas = Pagamento.objects.filter(
            tipo='saida',
            pago=True,
            **self.get_filtros_periodo_pagamento(),
            **self.get_filtros_loja()
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        return receitas_confirmadas - despesas_pagas
    
    def calcular_projecao_caixa(self, dias_futuros=30):
        """Calcula projeção de caixa baseada em pagamentos futuros"""
        fluxo_atual = self.calcular_fluxo_caixa_atual()
        
        # Data limite para projeção
        data_limite = timezone.now().date() + timedelta(days=dias_futuros)
        
        # Receitas a receber
        receitas_a_receber = Pagamento.objects.filter(
            tipo='entrada',
            pago=False,
            vencimento__lte=data_limite,
            **self.get_filtros_loja()
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        # Despesas a pagar
        despesas_a_pagar = Pagamento.objects.filter(
            tipo='saida',
            pago=False,
            vencimento__lte=data_limite,
            **self.get_filtros_loja()
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
        
        return fluxo_atual + receitas_a_receber - despesas_a_pagar
    
    def get_lucro_por_canal_venda(self):
        """Retorna lucro por canal de venda"""
        vendas = Venda.objects.filter(
            **self.get_filtros_periodo_venda(),
            **self.get_filtros_loja()
        )
        
        lucro_por_canal = {}
        for venda in vendas:
            canal = venda.get_origem_display()
            if canal not in lucro_por_canal:
                lucro_por_canal[canal] = Decimal('0')
            lucro_por_canal[canal] += venda.valor_venda - (venda.valor_entrada or 0)
        
        return lucro_por_canal
    
    def get_evolucao_lucro_diario(self):
        """Retorna evolução do lucro por dia"""
        vendas = Venda.objects.filter(
            **self.get_filtros_periodo_venda(),
            **self.get_filtros_loja()
        ).order_by('data_venda')
        
        evolucao = {}
        for venda in vendas:
            if venda.data_venda:
                data_str = venda.data_venda.strftime('%Y-%m-%d')
                if data_str not in evolucao:
                    evolucao[data_str] = Decimal('0')
                evolucao[data_str] += venda.valor_venda - (venda.valor_entrada or 0)
        
        return evolucao
    
    def get_distribuicao_despesas_categoria(self):
        """Retorna distribuição de despesas por categoria"""
        despesas = Despesa.objects.filter(
            **self.get_filtros_periodo(),
            **self.get_filtros_loja()
        )
        
        distribuicao = {}
        for despesa in despesas:
            categoria = despesa.get_categoria_display()
            if categoria not in distribuicao:
                distribuicao[categoria] = Decimal('0')
            distribuicao[categoria] += despesa.valor
        
        return distribuicao
    
    def get_fluxo_caixa_tempo(self):
        """Retorna fluxo de caixa ao longo do tempo"""
        pagamentos = Pagamento.objects.filter(
            **self.get_filtros_periodo_pagamento(),
            **self.get_filtros_loja()
        ).order_by('data_pagamento')
        
        fluxo = {}
        saldo = Decimal('0')
        
        for pagamento in pagamentos:
            if pagamento.data_pagamento:
                data_str = pagamento.data_pagamento.strftime('%Y-%m-%d')
                if data_str not in fluxo:
                    fluxo[data_str] = saldo
                
                if pagamento.tipo == 'entrada':
                    saldo += pagamento.valor
                else:
                    saldo -= pagamento.valor
                
                fluxo[data_str] = saldo
        
        return fluxo
    
    def get_alertas_financeiros(self):
        """Retorna alertas financeiros baseados em regras"""
        alertas = []
        
        # Alerta: Margem de lucro baixa (< 20%)
        margem = self.calcular_margem_lucro_periodo()
        if margem < 20:
            alertas.append({
                'tipo': 'margem_baixa',
                'titulo': 'Margem de Lucro Baixa',
                'mensagem': f'Margem de lucro está em {margem:.1f}%, abaixo do recomendado (20%)',
                'severidade': 'warning'
            })
        
        # Alerta: Projeção de caixa negativa
        projecao = self.calcular_projecao_caixa()
        if projecao < 0:
            alertas.append({
                'tipo': 'caixa_negativo',
                'titulo': 'Projeção de Caixa Negativa',
                'mensagem': f'Projeção de caixa para os próximos 30 dias: R$ {projecao:.2f}',
                'severidade': 'danger'
            })
        
        # Alerta: Pagamentos atrasados
        from datetime import date
        pagamentos_atrasados = Pagamento.objects.filter(
            pago=False,
            vencimento__lt=date.today(),
            **self.get_filtros_loja()
        ).count()
        
        if pagamentos_atrasados > 0:
            alertas.append({
                'tipo': 'pagamentos_atrasados',
                'titulo': 'Pagamentos Atrasados',
                'mensagem': f'{pagamentos_atrasados} pagamento(s) em atraso',
                'severidade': 'danger'
            })
        
        # Alerta: Despesas acima da média
        despesas_periodo = Despesa.objects.filter(
            **self.get_filtros_periodo(),
            **self.get_filtros_loja()
        )
        
        if despesas_periodo.exists():
            media_despesas = despesas_periodo.aggregate(media=Sum('valor') / Count('id'))['media']
            despesas_altas = despesas_periodo.filter(valor__gt=media_despesas * 1.5).count()
            
            if despesas_altas > 0:
                alertas.append({
                    'tipo': 'despesas_altas',
                    'titulo': 'Despesas Acima da Média',
                    'mensagem': f'{despesas_altas} despesa(s) com valor acima de 150% da média',
                    'severidade': 'warning'
                })
        
        return alertas
    
    def get_totais_motos_estoque(self):
        filtros_loja = self.get_filtros_loja()
        motos_estoque = Motocicleta.objects.filter(status='estoque', ativo=True, **filtros_loja)
        total = motos_estoque.count()
        total_0km = motos_estoque.filter(tipo_entrada='0km').count()
        total_usadas = motos_estoque.filter(tipo_entrada='usada').count()
        total_consignacao = motos_estoque.filter(tipo_entrada='consignada').count()
        valor_estoque = motos_estoque.aggregate(total=Sum('valor_atual'))['total'] or Decimal('0')
        valor_gasto = motos_estoque.aggregate(total=Sum('valor_entrada'))['total'] or Decimal('0')
        return {
            'total': total,
            'total_0km': total_0km,
            'total_usadas': total_usadas,
            'total_consignacao': total_consignacao,
            'valor_estoque': valor_estoque,
            'valor_gasto': valor_gasto,
        }
    
    def get_resumo_financeiro(self):
        """Retorna resumo completo financeiro"""
        totais_motos = self.get_totais_motos_estoque()
        return {
            'receita_bruta': self.calcular_receita_bruta_periodo(),
            'lucro_total': self.calcular_lucro_total_periodo(),
            'margem_lucro': self.calcular_margem_lucro_periodo(),
            'despesas_totais': Despesa.objects.filter(
                **self.get_filtros_periodo(),
                **self.get_filtros_loja()
            ).aggregate(total=Sum('valor'))['total'] or Decimal('0'),
            'fluxo_caixa_atual': self.calcular_fluxo_caixa_atual(),
            'projecao_caixa': self.calcular_projecao_caixa(),
            'lucro_por_canal': self.get_lucro_por_canal_venda(),
            'evolucao_lucro': self.get_evolucao_lucro_diario(),
            'distribuicao_despesas': self.get_distribuicao_despesas_categoria(),
            'fluxo_tempo': self.get_fluxo_caixa_tempo(),
            'alertas': self.get_alertas_financeiros(),
            'total_motos_estoque': totais_motos['total'],
            'total_0km': totais_motos['total_0km'],
            'total_usadas': totais_motos['total_usadas'],
            'total_consignacao': totais_motos['total_consignacao'],
            'valor_estoque': totais_motos['valor_estoque'],
            'valor_gasto_motos': totais_motos['valor_gasto'],
        }


class RelatorioFinanceiro:
    """Classe para geração de relatórios financeiros"""
    
    @staticmethod
    def relatorio_vendas_detalhado(loja=None, data_inicio=None, data_fim=None):
        """Gera relatório detalhado de vendas"""
        calc = CalculadoraFinanceira(loja, data_inicio, data_fim)
        
        vendas = Venda.objects.filter(
            **calc.get_filtros_periodo_venda(),
            **calc.get_filtros_loja()
        ).select_related('moto', 'comprador', 'vendedor')
        
        return {
            'periodo': {
                'inicio': calc.data_inicio,
                'fim': calc.data_fim
            },
            'resumo': calc.get_resumo_financeiro(),
            'vendas_detalhadas': [
                {
                    'id': venda.id,
                    'data': venda.data,
                    'produto': venda.produto,
                    'canal': venda.get_canal_venda_display(),
                    'valor_total': venda.valor_total,
                    'valor_liquido': venda.valor_liquido,
                    'custo_total': venda.custo_total,
                    'lucro': venda.lucro,
                    'margem': venda.margem_lucro,
                    'cliente': venda.venda.comprador.nome if venda.venda else 'N/A',
                    'vendedor': venda.venda.vendedor.user.get_full_name() if venda.venda else 'N/A'
                }
                for venda in vendas
            ]
        }
    
    @staticmethod
    def relatorio_despesas_detalhado(loja=None, data_inicio=None, data_fim=None):
        """Gera relatório detalhado de despesas"""
        calc = CalculadoraFinanceira(loja, data_inicio, data_fim)
        
        despesas = Despesa.objects.filter(
            **calc.get_filtros_periodo(),
            **calc.get_filtros_loja()
        ).select_related('loja', 'responsavel')
        
        return {
            'periodo': {
                'inicio': calc.data_inicio,
                'fim': calc.data_fim
            },
            'total_despesas': despesas.aggregate(total=Sum('valor'))['total'] or Decimal('0'),
            'despesas_por_categoria': calc.get_distribuicao_despesas_categoria(),
            'despesas_detalhadas': [
                {
                    'id': despesa.id,
                    'data': despesa.data,
                    'descricao': despesa.descricao,
                    'categoria': despesa.get_categoria_display(),
                    'valor': despesa.valor,
                    'tipo': despesa.get_fixa_variavel_display(),
                    'centro_custo': despesa.centro_custo,
                    'responsavel': despesa.responsavel.user.get_full_name()
                }
                for despesa in despesas
            ]
        }
    
    @staticmethod
    def relatorio_fluxo_caixa(loja=None, data_inicio=None, data_fim=None):
        """Gera relatório de fluxo de caixa"""
        calc = CalculadoraFinanceira(loja, data_inicio, data_fim)
        
        pagamentos = Pagamento.objects.filter(
            **calc.get_filtros_periodo_pagamento(),
            **calc.get_filtros_loja()
        ).select_related('loja', 'responsavel')
        
        return {
            'periodo': {
                'inicio': calc.data_inicio,
                'fim': calc.data_fim
            },
            'fluxo_atual': calc.calcular_fluxo_caixa_atual(),
            'projecao_30_dias': calc.calcular_projecao_caixa(30),
            'projecao_60_dias': calc.calcular_projecao_caixa(60),
            'pagamentos_pendentes': [
                {
                    'id': pagamento.id,
                    'tipo': pagamento.get_tipo_display(),
                    'referente': pagamento.get_referente_a_display(),
                    'valor': pagamento.valor,
                    'vencimento': pagamento.vencimento,
                    'pago': pagamento.pago,
                    'atrasado': pagamento.atrasado,
                    'dias_atraso': pagamento.dias_atraso
                }
                for pagamento in pagamentos.filter(pago=False)
            ],
            'evolucao_fluxo': calc.get_fluxo_caixa_tempo()
        } 