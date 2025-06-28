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
        self.duplicates_count = 0
    
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
    
    def log_duplicate(self, message, row=None):
        """Registra uma duplicata encontrada"""
        duplicate_msg = f"Duplicata ignorada: {message}"
        if row is not None:
            duplicate_msg += f" (Linha {row})"
        self.errors.append(duplicate_msg)
        self.duplicates_count += 1
        logger.warning(duplicate_msg)
    
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
                # Tentar diferentes encodings e configurações
                encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1', 'windows-1252']
                
                for encoding in encodings:
                    try:
                        if isinstance(file, str):
                            return pd.read_csv(
                                file_path, 
                                encoding=encoding,
                                quoting=1,  # QUOTE_ALL
                                escapechar='\\',
                                on_bad_lines='skip',  # Pular linhas problemáticas
                                low_memory=False
                            )
                        else:
                            return pd.read_csv(
                                file, 
                                encoding=encoding,
                                quoting=1,  # QUOTE_ALL
                                escapechar='\\',
                                on_bad_lines='skip',  # Pular linhas problemáticas
                                low_memory=False
                            )
                    except UnicodeDecodeError:
                        continue
                    except Exception as e:
                        # Se falhar com QUOTE_ALL, tentar sem
                        try:
                            if isinstance(file, str):
                                return pd.read_csv(
                                    file_path, 
                                    encoding=encoding,
                                    on_bad_lines='skip',
                                    low_memory=False
                                )
                            else:
                                return pd.read_csv(
                                    file, 
                                    encoding=encoding,
                                    on_bad_lines='skip',
                                    low_memory=False
                                )
                        except:
                            # Se ainda falhar, tentar com engine='python'
                            try:
                                if isinstance(file, str):
                                    return pd.read_csv(
                                        file_path, 
                                        encoding=encoding,
                                        engine='python',
                                        on_bad_lines='skip',
                                        low_memory=False
                                    )
                                else:
                                    return pd.read_csv(
                                        file, 
                                        encoding=encoding,
                                        engine='python',
                                        on_bad_lines='skip',
                                        low_memory=False
                                    )
                            except:
                                continue
                
                # Se nenhum encoding funcionou, tentar detectar automaticamente
                try:
                    import chardet
                    if isinstance(file, str):
                        with open(file_path, 'rb') as f:
                            raw_data = f.read()
                    else:
                        raw_data = file.read()
                        file.seek(0)  # Reset file pointer
                    
                    detected = chardet.detect(raw_data)
                    if detected['confidence'] > 0.7:
                        detected_encoding = detected['encoding']
                        if isinstance(file, str):
                            return pd.read_csv(
                                file_path, 
                                encoding=detected_encoding,
                                on_bad_lines='skip',
                                low_memory=False
                            )
                        else:
                            return pd.read_csv(
                                file, 
                                encoding=detected_encoding,
                                on_bad_lines='skip',
                                low_memory=False
                            )
                except:
                    pass
                
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
    
    def _parse_boolean(self, value):
        """Converte valor para boolean"""
        if pd.isna(value) or value == '':
            return True
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ['true', '1', 'sim', 's', 'yes', 'y']
        return bool(value)
    
    def _parse_date(self, value):
        """Converte valor para data"""
        if pd.isna(value) or value == '':
            return None
        try:
            if isinstance(value, str):
                # Tentar diferentes formatos de data
                for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d/%m/%y', '%Y/%m/%d']:
                    try:
                        return datetime.strptime(value, fmt).date()
                    except ValueError:
                        continue
            return pd.to_datetime(value).date()
        except:
            return None
    
    def _parse_decimal(self, value, default=0):
        """Converte valor para decimal"""
        if pd.isna(value) or value == '':
            return default
        try:
            # Remover caracteres não numéricos exceto ponto e vírgula
            if isinstance(value, str):
                value = value.replace('R$', '').replace(' ', '').replace(',', '.')
            return float(value)
        except:
            return default
    
    def _clean_string(self, value):
        """Limpa string removendo espaços e caracteres especiais"""
        if pd.isna(value):
            return ''
        return str(value).strip()
    
    @transaction.atomic
    def import_lojas(self, file: UploadedFile):
        """Importa lojas de um arquivo CSV/Excel"""
        try:
            df = self.read_file(file)
            if df is None:
                return False
                
            success_count = 0
            error_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Verificar se a loja já existe
                    cnpj = self._clean_string(row.get('cnpj', ''))
                    if not cnpj:
                        self.log_error(f"CNPJ vazio (Linha {index + 2})")
                        error_count += 1
                        continue
                        
                    if Loja.objects.filter(cnpj=cnpj).exists():
                        self.log_duplicate(f"Loja com CNPJ {cnpj} já existe", index + 2)
                        continue
                    
                    # Criar loja
                    loja = Loja.objects.create(
                        nome=self._clean_string(row.get('nome', '')),
                        cnpj=cnpj,
                        cidade=self._clean_string(row.get('cidade', '')),
                        endereco=self._clean_string(row.get('endereco', '')),
                        telefone=self._clean_string(row.get('telefone', '')),
                        email=self._clean_string(row.get('email', '')),
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
            
            return error_count == 0
            
        except Exception as e:
            self.log_error(f"Erro geral na importação: {str(e)}")
            return False
    
    @transaction.atomic
    def import_clientes(self, file: UploadedFile):
        """Importa clientes de um arquivo CSV/Excel"""
        try:
            df = self.read_file(file)
            if df is None:
                return False
                
            success_count = 0
            error_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Verificar se o cliente já existe
                    cpf = self._clean_string(row.get('cpf', ''))
                    if not cpf:
                        self.log_error(f"CPF vazio (Linha {index + 2})")
                        error_count += 1
                        continue
                        
                    if Cliente.objects.filter(cpf_cnpj=cpf).exists():
                        self.log_duplicate(f"Cliente com CPF {cpf} já existe", index + 2)
                        continue
                    
                    # Criar cliente
                    cliente = Cliente.objects.create(
                        nome=self._clean_string(row.get('nome', '')),
                        cpf_cnpj=cpf,
                        rg=self._clean_string(row.get('rg', '')),
                        data_nascimento=self._parse_date(row.get('data_nascimento')),
                        telefone=self._clean_string(row.get('telefone', '')),
                        email=self._clean_string(row.get('email', '')),
                        endereco=self._clean_string(row.get('endereco', '')),
                        cidade=self._clean_string(row.get('cidade', '')),
                        estado=self._clean_string(row.get('estado', '')),
                        cep=self._clean_string(row.get('cep', '')),
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
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Verificar se a moto já existe pelo chassi
                chassi = self._clean_string(row.get('Chassi', ''))
                if not chassi or chassi == '0' or chassi == '*':
                    self.log_error(f"Chassi inválido: {chassi} (Linha {index + 2})")
                    error_count += 1
                    continue
                
                if Motocicleta.objects.filter(chassi=chassi).exists():
                    self.log_duplicate(f"Motocicleta com chassi {chassi} já existe", index + 2)
                    continue
                
                # Buscar proprietário se especificado
                proprietario = None
                proprietario_cpf = self._clean_string(row.get('CPF Proprietário', ''))
                if proprietario_cpf and proprietario_cpf != '0':
                    try:
                        proprietario = Cliente.objects.get(cpf_cnpj=proprietario_cpf)
                    except Cliente.DoesNotExist:
                        # Criar cliente proprietário se não existir
                        proprietario_nome = self._clean_string(row.get('Proprietário', ''))
                        if proprietario_nome:
                            proprietario = Cliente.objects.create(
                                nome=proprietario_nome,
                                cpf_cnpj=proprietario_cpf,
                                telefone=self._clean_string(row.get('Tel Proprietário', '')),
                                tipo='proprietario'
                            )
                
                # Buscar fornecedor se especificado
                fornecedor = None
                fornecedor_cpf = self._clean_string(row.get('CPF fornecedor ', ''))
                if fornecedor_cpf and fornecedor_cpf != '0':
                    try:
                        fornecedor = Cliente.objects.get(cpf_cnpj=fornecedor_cpf)
                    except Cliente.DoesNotExist:
                        # Criar cliente fornecedor se não existir
                        fornecedor_nome = self._clean_string(row.get('Fornecedor ', ''))
                        if fornecedor_nome:
                            fornecedor = Cliente.objects.create(
                                nome=fornecedor_nome,
                                cpf_cnpj=fornecedor_cpf,
                                telefone=self._clean_string(row.get('Tel Fornecedor', '')),
                                tipo='fornecedor'
                            )
                
                # Mapear campos do arquivo para o modelo
                marca = self._clean_string(row.get('Marca', ''))
                modelo = self._clean_string(row.get('Modelo', ''))
                placa = self._clean_string(row.get('Placa', ''))
                renavam = self._clean_string(row.get('Renavam', ''))
                cor = self._clean_string(row.get('Cor', ''))
                
                # Extrair ano do campo FAB/MOD
                fab_mod = self._clean_string(row.get('FAB/MOD', ''))
                ano = ''
                if fab_mod:
                    # Tentar extrair ano do formato "2025/2025" ou "2025"
                    if '/' in fab_mod:
                        ano = fab_mod.split('/')[0]
                    else:
                        ano = fab_mod
                
                # Determinar status baseado na situação
                situacao = self._clean_string(row.get('Situação', '')).lower()
                if 'vendida' in situacao:
                    status = 'vendida'
                elif 'salão' in situacao:
                    status = 'estoque'
                elif 'oficina' in situacao:
                    status = 'manutencao'
                else:
                    status = 'estoque'
                
                # Determinar tipo de entrada
                if '0km' in fab_mod.lower() or '0' in str(row.get('KM', '0')):
                    tipo_entrada = '0km'
                else:
                    tipo_entrada = 'usada'
                
                # Valores (usar valores padrão se não disponíveis ou em branco)
                valor_entrada = self._parse_decimal(row.get('valor_entrada', 0))
                if not valor_entrada:
                    valor_entrada = 0
                valor_atual = self._parse_decimal(row.get('valor_atual', valor_entrada))
                if not valor_atual:
                    valor_atual = 0
                
                # Data de entrada
                data_chegada = self._clean_string(row.get('Data de Chegada', ''))
                data_entrada = self._parse_date(data_chegada) if data_chegada else timezone.now().date()
                
                moto = Motocicleta.objects.create(
                    chassi=chassi,
                    placa=placa if placa else None,
                    renavam=renavam if renavam and renavam != '0' else None,
                    marca=marca,
                    modelo=modelo,
                    ano=ano,
                    cor=cor,
                    cilindrada='',  # Não disponível no arquivo
                    tipo_entrada=tipo_entrada,
                    origem='cliente',
                    status=status,
                    proprietario=proprietario,
                    fornecedor=fornecedor,
                    valor_entrada=valor_entrada,
                    valor_atual=valor_atual,
                    data_entrada=data_entrada,
                    observacoes=self._clean_string(row.get('OBSERVAÇÃO', '')),
                    ativo=True
                )
                
                self.log_success(f"Motocicleta {moto.marca} {moto.modelo} importada com sucesso")
                success_count += 1
                
            except Exception as e:
                self.log_error(f"Erro ao importar motocicleta: {str(e)}", index + 2)
                error_count += 1
        
        self.success_count = success_count
        self.error_count = error_count
        return error_count == 0
    
    @transaction.atomic
    def import_vendas(self, file: UploadedFile):
        """Importa vendas do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Buscar moto
                moto_chassi = self._clean_string(row.get('moto_chassi', ''))
                if not moto_chassi:
                    self.log_error(f"Chassi da moto vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                try:
                    moto = Motocicleta.objects.get(chassi=moto_chassi)
                except Motocicleta.DoesNotExist:
                    self.log_error(f"Motocicleta com chassi {moto_chassi} não encontrada", index + 2)
                    error_count += 1
                    continue
                
                # Buscar comprador
                comprador_cpf = self._clean_string(row.get('comprador_cpf', ''))
                if not comprador_cpf:
                    self.log_error(f"CPF do comprador vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                try:
                    comprador = Cliente.objects.get(cpf_cnpj=comprador_cpf)
                except Cliente.DoesNotExist:
                    self.log_error(f"Comprador com CPF {comprador_cpf} não encontrado", index + 2)
                    error_count += 1
                    continue
                
                # Buscar vendedor
                vendedor_username = self._clean_string(row.get('vendedor_username', ''))
                if not vendedor_username:
                    self.log_error(f"Username do vendedor vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                try:
                    vendedor = Usuario.objects.get(user__username=vendedor_username)
                except Usuario.DoesNotExist:
                    self.log_error(f"Vendedor com username {vendedor_username} não encontrado", index + 2)
                    error_count += 1
                    continue
                
                # Buscar loja
                loja_nome = self._clean_string(row.get('loja_nome', ''))
                if not loja_nome:
                    self.log_error(f"Nome da loja vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                try:
                    loja = Loja.objects.get(nome=loja_nome)
                except Loja.DoesNotExist:
                    self.log_error(f"Loja {loja_nome} não encontrada", index + 2)
                    error_count += 1
                    continue
                
                # Verificar se já existe uma venda para esta moto
                if Venda.objects.filter(moto=moto).exists():
                    self.log_duplicate(f"Venda para moto com chassi {moto_chassi} já existe", index + 2)
                    continue
                
                venda = Venda.objects.create(
                    moto=moto,
                    comprador=comprador,
                    vendedor=vendedor,
                    loja=loja,
                    origem=self._clean_string(row.get('origem', 'presencial')),
                    forma_pagamento=self._clean_string(row.get('forma_pagamento', 'a_vista')),
                    status=self._clean_string(row.get('status', 'vendido')),
                    valor_venda=self._parse_decimal(row.get('valor_venda', 0)),
                    valor_entrada=self._parse_decimal(row.get('valor_entrada', 0)),
                    comissao_vendedor=self._parse_decimal(row.get('comissao_vendedor', 0)),
                    data_atendimento=self._parse_date(row.get('data_atendimento')) or timezone.now().date(),
                    data_venda=self._parse_date(row.get('data_venda')) or timezone.now().date(),
                    observacoes=self._clean_string(row.get('observacoes', ''))
                )
                
                self.log_success(f"Venda {venda.id} importada com sucesso")
                success_count += 1
                
            except Exception as e:
                self.log_error(f"Erro ao importar venda: {str(e)}", index + 2)
                error_count += 1
        
        self.success_count = success_count
        self.error_count = error_count
        return error_count == 0
    
    @transaction.atomic
    def import_seguradoras(self, file: UploadedFile):
        """Importa seguradoras do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Verificar se a seguradora já existe
                cnpj = self._clean_string(row.get('cnpj', ''))
                if not cnpj:
                    self.log_error(f"CNPJ da seguradora vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                if Seguradora.objects.filter(cnpj=cnpj).exists():
                    self.log_duplicate(f"Seguradora com CNPJ {cnpj} já existe", index + 2)
                    continue
                
                seguradora = Seguradora.objects.create(
                    nome=self._clean_string(row.get('nome', '')),
                    cnpj=cnpj,
                    telefone=self._clean_string(row.get('telefone', '')),
                    email=self._clean_string(row.get('email', '')),
                    site=self._clean_string(row.get('site', '')),
                    ativo=self._parse_boolean(row.get('ativo', True))
                )
                
                self.log_success(f"Seguradora {seguradora.nome} importada com sucesso")
                success_count += 1
                
            except Exception as e:
                self.log_error(f"Erro ao importar seguradora: {str(e)}", index + 2)
                error_count += 1
        
        self.success_count = success_count
        self.error_count = error_count
        return error_count == 0
    
    @transaction.atomic
    def import_planos_seguro(self, file: UploadedFile):
        """Importa planos de seguro do arquivo"""
        df = self.read_file(file)
        if df is None:
            return False
        
        self.total_count = len(df)
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Buscar seguradora
                seguradora_nome = self._clean_string(row.get('seguradora_nome', ''))
                if not seguradora_nome:
                    self.log_error(f"Nome da seguradora vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                try:
                    seguradora = Seguradora.objects.get(nome=seguradora_nome)
                except Seguradora.DoesNotExist:
                    self.log_error(f"Seguradora {seguradora_nome} não encontrada", index + 2)
                    error_count += 1
                    continue
                
                # Verificar se o plano já existe
                plano_nome = self._clean_string(row.get('nome', ''))
                if not plano_nome:
                    self.log_error(f"Nome do plano vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                if PlanoSeguro.objects.filter(seguradora=seguradora, nome=plano_nome).exists():
                    self.log_duplicate(f"Plano {plano_nome} da seguradora {seguradora_nome} já existe", index + 2)
                    continue
                
                plano = PlanoSeguro.objects.create(
                    seguradora=seguradora,
                    nome=plano_nome,
                    tipo_bem=self._clean_string(row.get('tipo_bem', 'motocicleta')),
                    descricao=self._clean_string(row.get('descricao', '')),
                    comissao_padrao=self._parse_decimal(row.get('comissao_padrao', 10.00)),
                    ativo=self._parse_boolean(row.get('ativo', True))
                )
                
                self.log_success(f"Plano de seguro {plano.nome} importado com sucesso")
                success_count += 1
                
            except Exception as e:
                self.log_error(f"Erro ao importar plano de seguro: {str(e)}", index + 2)
                error_count += 1
        
        self.success_count = success_count
        self.error_count = error_count
        return error_count == 0
    
    def get_import_summary(self):
        """Retorna resumo da importação"""
        return {
            'total_count': self.total_count,
            'success_count': self.success_count,
            'error_count': self.error_count,
            'duplicates_count': self.duplicates_count,
            'errors': self.errors
        }
    
    def clear_logs(self):
        """Limpa os logs de importação"""
        self.errors = []
        self.success_count = 0
        self.total_count = 0
        self.duplicates_count = 0 