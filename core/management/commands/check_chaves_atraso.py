from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import ControleChave, Ocorrencia, Usuario
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Verifica chaves não devolvidas até 23:59 do dia da retirada e cria ocorrência automática.'

    def handle(self, *args, **options):
        agora = timezone.now()
        hoje = agora.date()
        chaves_atrasadas = ControleChave.objects.filter(
            status='aberto',
            data_saida__date__lt=hoje
        )
        for chave in chaves_atrasadas:
            # Cria ocorrência apenas se ainda não existe para esta chave
            titulo = f"Chave não devolvida: {chave.motocicleta} por {chave.funcionario.get_full_name() or chave.funcionario.username}"
            descricao = f"A chave da motocicleta {chave.motocicleta} retirada por {chave.funcionario.get_full_name() or chave.funcionario.username} não foi devolvida até 23:59 do dia {chave.data_saida.date()}"
            usuario_sistema = Usuario.objects.filter(user=chave.funcionario).first()
            if not Ocorrencia.objects.filter(titulo=titulo, status='aberta').exists():
                Ocorrencia.objects.create(
                    titulo=titulo,
                    descricao=descricao,
                    solicitante=usuario_sistema,
                    responsavel=None,
                    status='aberta',
                    tipo='chave',
                    prioridade='media',
                    loja=getattr(chave.motocicleta, 'loja', None)
                )
                chave.status = 'atraso'
                chave.save()
                self.stdout.write(self.style.WARNING(f'Ocorrência criada para chave em atraso: {titulo}'))
            else:
                self.stdout.write(f'Ocorrência já existe para: {titulo}')
        if not chaves_atrasadas:
            self.stdout.write('Nenhuma chave em atraso encontrada.') 