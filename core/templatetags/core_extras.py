from django import template
import logging
from django.template.defaultfilters import floatformat
from django.utils.safestring import mark_safe
import math

logger = logging.getLogger('core')
register = template.Library()

@register.filter
def abs(value):
    """Retorna o valor absoluto de um número"""
    try:
        return abs(float(value))
    except (ValueError, TypeError):
        return value

@register.filter
def currency(value):
    """Formata um valor como moeda brasileira"""
    try:
        if value is None:
            return "R$ 0,00"
        value = float(value)
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return "R$ 0,00"

@register.filter
def percentage(value):
    """Formata um valor como porcentagem"""
    try:
        if value is None:
            return "0%"
        value = float(value)
        return f"{value:.2f}%"
    except (ValueError, TypeError):
        return "0%"

@register.filter
def days_until(date):
    """Calcula quantos dias faltam até uma data"""
    from datetime import date as date_class
    if not date:
        return 0
    today = date_class.today()
    if hasattr(date, 'date'):
        target_date = date.date()
    else:
        target_date = date
    delta = target_date - today
    return delta.days

@register.filter
def status_badge(status):
    """Retorna uma badge Bootstrap para o status"""
    status_map = {
        'ativo': 'success',
        'cancelado': 'danger',
        'suspenso': 'warning',
        'vencido': 'secondary',
        'pendente': 'warning',
        'aprovada': 'success',
        'rejeitada': 'danger',
    }
    color = status_map.get(status, 'secondary')
    return mark_safe(f'<span class="badge bg-{color}">{status.title()}</span>') 