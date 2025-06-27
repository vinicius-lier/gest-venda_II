# -*- coding: utf-8 -*-
"""
Sistema de importação de dados para o sistema de gestão operacional de vendas
"""
import pandas as pd
import os
from django.core.files.uploadedfile import UploadedFile
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from datetime import datetime
import logging

from .models import (
    Loja, Usuario, Cliente, Motocicleta, Venda, Consignacao, 
    Seguradora, PlanoSeguro, Bem, Seguro, CotacaoSeguro
)

logger = logging.getLogger(__name__)

class DataImporter:
    """Classe principal para importação de dados"""
    
    def __init__(self):
        self.errors = []
        self.success_count = 0
        self.total_count = 0
    
    def log_error(self, message, row=None):
        """Registra um erro de importação"""
        error_msg = f"Erro: {message}"
        if row is not None:
            error_msg += f" (Linha {row})"
        self.errors.append(error_msg)
        logger.error(error_msg)
    
    def log_success(self, message):
        """Registra um sucesso de importação"""
        self.success_count += 1
        logger.info(f"Sucesso: {message}")
    
    def read_file(self, file):
        """Lê arquivo CSV ou Excel"""
        try:
            # Verificar se é um caminho de arquivo ou UploadedFile
            if isinstance(file, str):
                file_path = file
                file_extension = os.path.splitext(file_path)[1].lower()
            else:
                # É um UploadedFile
                file_extension = os.path.splitext(file.name)[1].lower()
                file_path = file
            
            if file_extension in ['.csv']:
                # Tentar diferentes encodings
                for encoding in ['utf-8', 'latin1', 'cp1252']:
                    try:
                        if isinstance(file, str):
                            return pd.read_csv(file_path, encoding=encoding)
                        else:
                            return pd.read_csv(file, encoding=encoding)
                    except UnicodeDecodeError:
                        continue
                raise ValueError("Não foi possível decodificar o arquivo CSV")
            
            elif file_extension in ['.xlsx', '.xls']:
                if isinstance(file, str):
                    return pd.read_excel(file_path)
                else:
                    return pd.read_excel(file)
            
            else:
                raise ValueError(f"Formato de arquivo não suportado: {file_extension}")
                
        except Exception as e:
            self.log_error(f"Erro ao ler arquivo: {str(e)}")
            return None
    
    @transaction.atomic
    def import_lojas(self, file: UploadedFile):
        """Importa lojas de um arquivo CSV/Excel"""
        try:
            df = self.read_file(file)
            success_count = 0
            error_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Verificar se a loja já existe
                    cnpj = str(row.get('cnpj', '')).strip()
                    if Loja.objects.filter(cnpj=cnpj).exists():
                        self.log_error(f"Loja com CNPJ {cnpj} já existe (Linha {index + 2})")
                        error_count += 1
                        continue
                    
                    # Criar loja
                    loja = Loja.objects.create(
                        nome=str(row.get('nome', '')).strip(),
                        cnpj=cnpj,
                        cidade=str(row.get('cidade', '')).strip(),
                        endereco=str(row.get('endereco', '')).strip(),
                        telefone=str(row.get('telefone', '')).strip(),
                        email=str(row.get('email', '')).strip(),
                        ativo=self._parse_boolean(row.get('ativo', True))
                    )
                    
                    self.log_success(f"Loja {loja.nome} importada com sucesso")
                    success_count += 1
                    
                except Exception as e:
                    self.log_error(f"Erro ao importar loja: {str(e)} (Linha {index + 2})")
                    error_count += 1
            
            self.total_count = len(df)
            self.success_count = success_count
            self.error_count = error_count
            self.errors = self.errors
            
            return error_count == 0
            
        except Exception as e:
            self.log_error(f"Erro geral na importação: {str(e)}")
            return False
    
    @transaction.atomic
    def import_clientes(self, file: UploadedFile):
        """Importa clientes de um arquivo CSV/Excel"""
        try:
            df = self.read_file(file)
            success_count = 0
            error_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Verificar se o cliente já existe
                    cpf = str(row.get('cpf', '')).strip()
                    if Cliente.objects.filter(cpf=cpf).exists():
                        self.log_error(f"Cliente com CPF {cpf} já existe (Linha {index + 2})")
                        error_count += 1
                        continue
                    
                    # Criar cliente
                    cliente = Cliente.objects.create(
                        nome=str(row.get('nome', '')).strip(),
                        cpf=cpf,
                        rg=str(row.get('rg', '')).strip(),
                        data_nascimento=self._parse_date(row.get('data_nascimento')),
                        telefone=str(row.get('telefone', '')).strip(),
                        email=str(row.get('email', '')).strip(),
                        endereco=str(row.get('endereco', '')).strip(),
                        cidade=str(row.get('cidade', '')).strip(),
                        estado=str(row.get('estado', '')).strip(),
                        cep=str(row.get('cep', '')).strip(),
                        ativo=self._parse_boolean(row.get('ativo', True))
                    )
                    
                    self.log_success(f"Cliente {cliente.nome} importado com sucesso")
                    success_count += 1
                    
                except Exception as e:
                    self.log_error(f"Erro ao importar cliente: {str(e)} (Linha {index + 2})")
                    error_count += 1
            
            self.total_count = len(df)
            self.success_count = success_count
            self.error_count = error_count
            self.errors = self.errors
            
            return error_count == 0
            
        except Exception as e:
            self.log_error(f"Erro geral na importação: {str(e)}")
            return False
    
    @transaction.atomic
    def import_motocicletas(self, file: UploadedFile):
        """Importa motocicletas do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        
        for index, row in df.iterrows():
            try:
                # Verificar se a moto já existe
                if Motocicleta.objects.filter(chassi=row['chassi']).exists():
                    self.log_error(f"Motocicleta com chassi {row['chassi']} já existe", index + 2)
                    continue
                
                # Buscar proprietário se especificado
                proprietario = None
                if 'proprietario_cpf' in row and pd.notna(row['proprietario_cpf']):
                    try:
                        proprietario = Cliente.objects.get(cpf_cnpj=row['proprietario_cpf'])
                    except Cliente.DoesNotExist:
                        self.log_error(f"Proprietário com CPF {row['proprietario_cpf']} não encontrado", index + 2)
                        continue
                
                # Buscar fornecedor se especificado
                fornecedor = None
                if 'fornecedor_cpf' in row and pd.notna(row['fornecedor_cpf']):
                    try:
                        fornecedor = Cliente.objects.get(cpf_cnpj=row['fornecedor_cpf'])
                    except Cliente.DoesNotExist:
                        self.log_error(f"Fornecedor com CPF {row['fornecedor_cpf']} não encontrado", index + 2)
                        continue
                
                moto = Motocicleta.objects.create(
                    chassi=row['chassi'],
                    placa=row.get('placa', ''),
                    renavam=row.get('renavam', ''),
                    marca=row['marca'],
                    modelo=row['modelo'],
                    ano=row['ano'],
                    cor=row['cor'],
                    cilindrada=row.get('cilindrada', ''),
                    tipo_entrada=row.get('tipo_entrada', 'usada'),
                    origem=row.get('origem', 'cliente'),
                    status=row.get('status', 'estoque'),
                    proprietario=proprietario,
                    fornecedor=fornecedor,
                    valor_entrada=row['valor_entrada'],
                    valor_atual=row.get('valor_atual', row['valor_entrada']),
                    data_entrada=pd.to_datetime(row.get('data_entrada', timezone.now().date())).date(),
                    observacoes=row.get('observacoes', ''),
                    ativo=True
                )
                
                self.log_success(f"Motocicleta {moto.marca} {moto.modelo} importada com sucesso")
                
            except Exception as e:
                self.log_error(f"Erro ao importar motocicleta: {str(e)}", index + 2)
        
        return len(self.errors) == 0
    
    @transaction.atomic
    def import_vendas(self, file: UploadedFile):
        """Importa vendas do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        
        for index, row in df.iterrows():
            try:
                # Buscar moto
                try:
                    moto = Motocicleta.objects.get(chassi=row['moto_chassi'])
                except Motocicleta.DoesNotExist:
                    self.log_error(f"Motocicleta com chassi {row['moto_chassi']} não encontrada", index + 2)
                    continue
                
                # Buscar comprador
                try:
                    comprador = Cliente.objects.get(cpf_cnpj=row['comprador_cpf'])
                except Cliente.DoesNotExist:
                    self.log_error(f"Comprador com CPF {row['comprador_cpf']} não encontrado", index + 2)
                    continue
                
                # Buscar vendedor
                try:
                    vendedor = Usuario.objects.get(user__username=row['vendedor_username'])
                except Usuario.DoesNotExist:
                    self.log_error(f"Vendedor com username {row['vendedor_username']} não encontrado", index + 2)
                    continue
                
                # Buscar loja
                try:
                    loja = Loja.objects.get(nome=row['loja_nome'])
                except Loja.DoesNotExist:
                    self.log_error(f"Loja {row['loja_nome']} não encontrada", index + 2)
                    continue
                
                venda = Venda.objects.create(
                    moto=moto,
                    comprador=comprador,
                    vendedor=vendedor,
                    loja=loja,
                    origem=row.get('origem', 'presencial'),
                    forma_pagamento=row.get('forma_pagamento', 'a_vista'),
                    status=row.get('status', 'vendido'),
                    valor_venda=row['valor_venda'],
                    valor_entrada=row.get('valor_entrada', 0),
                    comissao_vendedor=row.get('comissao_vendedor', 0),
                    data_atendimento=pd.to_datetime(row.get('data_atendimento', timezone.now().date())).date(),
                    data_venda=pd.to_datetime(row.get('data_venda', timezone.now().date())).date(),
                    observacoes=row.get('observacoes', '')
                )
                
                self.log_success(f"Venda {venda.id} importada com sucesso")
                
            except Exception as e:
                self.log_error(f"Erro ao importar venda: {str(e)}", index + 2)
        
        return len(self.errors) == 0
    
    @transaction.atomic
    def import_seguradoras(self, file: UploadedFile):
        """Importa seguradoras do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        
        for index, row in df.iterrows():
            try:
                # Verificar se a seguradora já existe
                if Seguradora.objects.filter(cnpj=row['cnpj']).exists():
                    self.log_error(f"Seguradora com CNPJ {row['cnpj']} já existe", index + 2)
                    continue
                
                seguradora = Seguradora.objects.create(
                    nome=row['nome'],
                    cnpj=row['cnpj'],
                    telefone=row.get('telefone', ''),
                    email=row.get('email', ''),
                    site=row.get('site', ''),
                    ativo=row.get('ativo', True)
                )
                
                self.log_success(f"Seguradora {seguradora.nome} importada com sucesso")
                
            except Exception as e:
                self.log_error(f"Erro ao importar seguradora: {str(e)}", index + 2)
        
        return len(self.errors) == 0
    
    @transaction.atomic
    def import_planos_seguro(self, file: UploadedFile):
        """Importa planos de seguro do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        
        for index, row in df.iterrows():
            try:
                # Buscar seguradora
                try:
                    seguradora = Seguradora.objects.get(nome=row['seguradora_nome'])
                except Seguradora.DoesNotExist:
                    self.log_error(f"Seguradora {row['seguradora_nome']} não encontrada", index + 2)
                    continue
                
                plano = PlanoSeguro.objects.create(
                    seguradora=seguradora,
                    nome=row['nome'],
                    tipo_bem=row.get('tipo_bem', 'motocicleta'),
                    descricao=row.get('descricao', ''),
                    comissao_padrao=row.get('comissao_padrao', 10.00),
                    ativo=row.get('ativo', True)
                )
                
                self.log_success(f"Plano de seguro {plano.nome} importado com sucesso")
                
            except Exception as e:
                self.log_error(f"Erro ao importar plano de seguro: {str(e)}", index + 2)
        
        return len(self.errors) == 0
    
    def get_import_summary(self):
        """Retorna resumo da importação"""
        return {
            'total_count': self.total_count,
            'success_count': self.success_count,
            'error_count': self.error_count,
            'errors': self.errors
        }
    
    def clear_logs(self):
        """Limpa os logs de importação"""
        self.errors = []
        self.success_count = 0
        self.total_count = 0 