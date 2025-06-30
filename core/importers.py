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
                # latin1 primeiro porque o teste mostrou que funciona
                encodings = ['latin1', 'utf-8-sig', 'utf-8', 'cp1252', 'iso-8859-1', 'windows-1252']
                
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
    def import_clientes(self, file: UploadedFile, column_mapping=None):
        """Importa clientes de um arquivo CSV/Excel com mapeamento de colunas opcional"""
        try:
            df = self.read_file(file)
            if df is None:
                return False
            
            # Se não foi fornecido mapeamento, usar o padrão
            if not column_mapping:
                column_mapping = {
                    'nome': ['nome'],
                    'cpf_cnpj': ['cpf_cnpj', 'cpf'],
                    'rg': ['rg'],
                    'data_nascimento': ['data_nascimento', 'nascimento'],
                    'telefone': ['telefone', 'fone'],
                    'email': ['email'],
                    'endereco': ['endereco', 'endereço'],
                    'cidade': ['cidade'],
                    'estado': ['estado', 'uf'],
                    'cep': ['cep'],
                    'tipo': ['tipo'],
                    'observacoes': ['observacoes', 'observações']
                }
            
            def get_mapped_value(row, field_name):
                """Obtém o valor mapeado para um campo"""
                if field_name in column_mapping:
                    for col_name in column_mapping[field_name]:
                        if col_name in row and pd.notna(row[col_name]) and str(row[col_name]).strip():
                            return row[col_name]
                return None
                
            success_count = 0
            error_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Verificar se o cliente já existe
                    cpf = self._clean_string(get_mapped_value(row, 'cpf_cnpj'))
                    if not cpf:
                        self.log_error(f"CPF vazio (Linha {index + 2})")
                        error_count += 1
                        continue
                        
                    if Cliente.objects.filter(cpf_cnpj=cpf).exists():
                        self.log_duplicate(f"Cliente com CPF {cpf} já existe", index + 2)
                        continue
                    
                    # Criar cliente
                    cliente = Cliente.objects.create(
                        nome=self._clean_string(get_mapped_value(row, 'nome')),
                        cpf_cnpj=cpf,
                        rg=self._clean_string(get_mapped_value(row, 'rg')),
                        data_nascimento=self._parse_date(get_mapped_value(row, 'data_nascimento')),
                        telefone=self._clean_string(get_mapped_value(row, 'telefone')),
                        email=self._clean_string(get_mapped_value(row, 'email')),
                        endereco=self._clean_string(get_mapped_value(row, 'endereco')),
                        cidade=self._clean_string(get_mapped_value(row, 'cidade')),
                        estado=self._clean_string(get_mapped_value(row, 'estado')),
                        cep=self._clean_string(get_mapped_value(row, 'cep')),
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
    def import_motocicletas(self, file: UploadedFile, column_mapping=None):
        """Importa motocicletas do arquivo com mapeamento de colunas opcional"""
        logger.info(f"Iniciando importação de motocicletas")
        logger.info(f"Column mapping: {column_mapping}")
        
        df = self.read_file(file)
        if df is None:
            logger.error("Falha ao ler arquivo")
            return False
        
        logger.info(f"DataFrame carregado com {len(df)} linhas")
        logger.info(f"Colunas do DataFrame: {list(df.columns)}")
        
        self.total_count = len(df)
        success_count = 0
        error_count = 0
        skipped_count = 0
        skipped_motos = []  # Lista para armazenar motos ignoradas
        
        # Se não foi fornecido mapeamento, usar o padrão
        if not column_mapping:
            column_mapping = {
                'marca': ['Marca', 'marca'],
                'modelo': ['Modelo', 'modelo'],
                'ano': ['Ano Modelo', 'ano_modelo', 'ano'],
                'ano_fabricacao': ['Ano Fabricação', 'ano_fabricacao', 'fab', 'fabricação'],
                'cor': ['Cor', 'cor'],
                'placa': ['Placa', 'placa'],
                'chassi': ['Chassi', 'chassi'],
                'rodagem': ['Rodagem', 'rodagem', 'km', 'quilometragem'],
                'valor_entrada': ['valor_entrada', 'valor_compra'],
                'valor_atual': ['valor_atual', 'valor_venda'],
                'status': ['Situação', 'status'],
                'observacoes': ['OBSERVAÇÃO', 'observacoes']
            }
        
        def get_mapped_value(row, field_name):
            """Obtém o valor mapeado para um campo"""
            if field_name in column_mapping:
                for col_name in column_mapping[field_name]:
                    if col_name in row and pd.notna(row[col_name]) and str(row[col_name]).strip():
                        return row[col_name]
            return None
        
        for index, row in df.iterrows():
            with transaction.atomic():
                try:
                    # Extrair dados usando o mapeamento
                    dados = {}
                    for campo, possiveis_nomes in column_mapping.items():
                        valor = None
                        for nome in possiveis_nomes:
                            if nome in row:
                                valor = row[nome]
                                break
                        dados[campo] = valor
                    
                    logger.debug(f"Linha {index + 1} - Dados extraídos: {dados}")
                    
                    # Validar chassi - PERMITIR IMPORTAR MESMO COM CHASSI INVÁLIDO
                    chassi = str(dados.get('chassi', '')).strip()
                    chassi_valido = True
                    
                    if not chassi or chassi in ['0', '*', 'N/LOCALIZADO', 'nan', 'None', '']:
                        logger.warning(f"Linha {index + 1} - Chassi inválido: '{chassi}' - IMPORTANDO MESMO ASSIM")
                        chassi_valido = False
                        # Gerar chassi temporário para permitir importação
                        chassi = f"TEMP_{index + 1}_{int(timezone.now().timestamp())}"
                    
                    # Verificar se chassi já existe (apenas se for válido)
                    if chassi_valido and Motocicleta.objects.filter(chassi=chassi).exists():
                        marca = self._clean_string(get_mapped_value(row, 'marca')) or 'N/A'
                        modelo = self._clean_string(get_mapped_value(row, 'modelo')) or 'N/A'
                        
                        skipped_motos.append({
                            'linha': index + 2,
                            'marca': marca,
                            'modelo': modelo,
                            'placa': self._clean_string(get_mapped_value(row, 'placa')) or 'N/A',
                            'chassi': chassi,
                            'motivo': 'Chassi já existe no sistema'
                        })
                        
                        self.log_duplicate(f"Motocicleta com chassi {chassi} já existe", index + 2)
                        skipped_count += 1
                        continue
                    
                    # Buscar proprietário se especificado (formato original)
                    proprietario = None
                    proprietario_cpf = self._clean_string(row.get('CPF Proprietário', ''))
                    if proprietario_cpf and proprietario_cpf != '0':
                        try:
                            proprietario = Cliente.objects.get(cpf_cnpj=proprietario_cpf)
                        except Cliente.DoesNotExist:
                            # Criar cliente proprietário se não existir
                            proprietario_nome = self._clean_string(row.get('Proprietário', ''))
                            if proprietario_nome:
                                try:
                                    proprietario = Cliente.objects.create(
                                        nome=proprietario_nome,
                                        cpf_cnpj=proprietario_cpf,
                                        telefone=self._clean_string(row.get('Tel Proprietário', '')),
                                        tipo='proprietario',
                                        ativo=self._parse_boolean(row.get('ativo', True))
                                    )
                                except Exception as e:
                                    logger.warning(f"Erro ao criar proprietário: {str(e)}")
                    
                    # Buscar fornecedor se especificado (formato original)
                    fornecedor = None
                    fornecedor_cpf = self._clean_string(row.get('CPF fornecedor ', ''))
                    if fornecedor_cpf and fornecedor_cpf != '0':
                        try:
                            fornecedor = Cliente.objects.get(cpf_cnpj=fornecedor_cpf)
                        except Cliente.DoesNotExist:
                            # Criar cliente fornecedor se não existir
                            fornecedor_nome = self._clean_string(row.get('Fornecedor ', ''))
                            if fornecedor_nome:
                                try:
                                    fornecedor = Cliente.objects.create(
                                        nome=fornecedor_nome,
                                        cpf_cnpj=fornecedor_cpf,
                                        telefone=self._clean_string(row.get('Tel Fornecedor', '')),
                                        tipo='fornecedor',
                                        ativo=self._parse_boolean(row.get('ativo', True))
                                    )
                                except Exception as e:
                                    logger.warning(f"Erro ao criar fornecedor: {str(e)}")
                    
                    # Mapear campos usando o mapeamento fornecido
                    marca = self._clean_string(get_mapped_value(row, 'marca')) or 'NÃO INFORMADO'
                    modelo = self._clean_string(get_mapped_value(row, 'modelo')) or 'NÃO INFORMADO'
                    placa = self._clean_string(get_mapped_value(row, 'placa')) or ''
                    renavam = self._clean_string(row.get('Renavam', row.get('renavam', ''))) or ''
                    cor = self._clean_string(get_mapped_value(row, 'cor')) or 'NÃO INFORMADO'
                    
                    # Extrair ano do campo mapeado
                    ano_field = self._clean_string(get_mapped_value(row, 'ano'))
                    ano = ano_field or '0000'
                    ano_fabricacao_field = self._clean_string(get_mapped_value(row, 'ano_fabricacao'))
                    ano_fabricacao = ano_fabricacao_field or ano
                    
                    # Validar se o ano tem no máximo 4 caracteres
                    if len(ano) > 4:
                        ano = ano[:4]  # Truncar para 4 caracteres
                    if ano_fabricacao and len(ano_fabricacao) > 4:
                        ano_fabricacao = ano_fabricacao[:4]  # Truncar para 4 caracteres
                    
                    # Determinar status baseado no campo mapeado
                    status_field = self._clean_string(get_mapped_value(row, 'status'))
                    if status_field:
                        status_text = status_field.lower()
                        
                        if 'vendida' in status_text:
                            status = 'vendida'
                        elif 'salão' in status_text or 'salao' in status_text:
                            status = 'estoque'
                        elif 'oficina' in status_text:
                            status = 'manutencao'
                        elif 'pendência' in status_text or 'pendencia' in status_text:
                            status = 'estoque'  # Tratar como estoque por enquanto
                        else:
                            status = 'estoque'
                    else:
                        status = 'estoque'
                    
                    # Determinar tipo de entrada
                    km_field = str(row.get('KM', '0'))
                    if ano_field and ('0km' in ano_field.lower() or '0' in km_field or '0km' in ano_field.lower()):
                        tipo_entrada = '0km'
                    else:
                        tipo_entrada = 'usada'
                    
                    # Valores usando mapeamento
                    valor_entrada = self._parse_decimal(get_mapped_value(row, 'valor_entrada'), 0)
                    valor_atual = self._parse_decimal(get_mapped_value(row, 'valor_atual'), valor_entrada)
                    
                    # Processar rodagem
                    rodagem_valor = get_mapped_value(row, 'rodagem')
                    rodagem = None
                    if rodagem_valor is not None and str(rodagem_valor).strip():
                        try:
                            rodagem = int(float(str(rodagem_valor).replace(',', '').replace('.', '')))
                        except (ValueError, TypeError):
                            rodagem = None
                    
                    # Data de entrada
                    data_chegada = self._clean_string(row.get('Data de Chegada', ''))
                    data_entrada = self._parse_date(data_chegada) if data_chegada else timezone.now().date()
                    
                    # Observações
                    observacoes = self._clean_string(get_mapped_value(row, 'observacoes')) or ''
                    
                    # Adicionar informação sobre chassi temporário nas observações
                    if not chassi_valido:
                        observacoes = f"CHASSI TEMPORÁRIO - Dados originais divergentes. {observacoes}".strip()
                    
                    # Criar a motocicleta com tratamento de erros mais robusto
                    try:
                        motocicleta = Motocicleta.objects.create(
                            marca=marca,
                            modelo=modelo,
                            ano=ano,
                            ano_fabricacao=ano_fabricacao,
                            cor=cor,
                            placa=placa,
                            chassi=chassi,
                            renavam=renavam,
                            rodagem=rodagem,
                            valor_entrada=valor_entrada,
                            valor_atual=valor_atual,
                            status=status,
                            tipo_entrada=tipo_entrada,
                            origem='cliente',
                            observacoes=observacoes,
                            proprietario=proprietario,
                            fornecedor=fornecedor,
                            data_entrada=data_entrada,
                            ativo=self._parse_boolean(row.get('ativo', True))
                        )
                        
                        logger.info(f"Linha {index + 1} - Motocicleta criada com sucesso: {motocicleta.marca} {motocicleta.modelo} (Chassi: {motocicleta.chassi})")
                        success_count += 1
                        
                    except Exception as e:
                        logger.error(f"Erro ao criar motocicleta na linha {index + 1}: {str(e)}")
                        # Tentar criar com dados mínimos
                        try:
                            motocicleta = Motocicleta.objects.create(
                                marca=marca,
                                modelo=modelo,
                                ano=ano,
                                ano_fabricacao=ano_fabricacao,
                                cor=cor,
                                placa=placa,
                                chassi=chassi,
                                valor_entrada=0,
                                valor_atual=0,
                                status='estoque',
                                tipo_entrada='usada',
                                origem='cliente',
                                observacoes=f"IMPORTADO COM DADOS MÍNIMOS - Erro: {str(e)}. {observacoes}",
                                ativo=self._parse_boolean(row.get('ativo', True))
                            )
                            logger.info(f"Linha {index + 1} - Motocicleta criada com dados mínimos: {motocicleta.marca} {motocicleta.modelo}")
                            success_count += 1
                        except Exception as e2:
                            logger.error(f"Erro fatal ao criar motocicleta na linha {index + 1}: {str(e2)}")
                            skipped_motos.append({
                                'linha': index + 2,
                                'marca': marca,
                                'modelo': modelo,
                                'placa': placa,
                                'chassi': chassi,
                                'motivo': f'Erro fatal: {str(e2)}'
                            })
                            error_count += 1
                
                except Exception as e:
                    marca = self._clean_string(get_mapped_value(row, 'marca')) or 'N/A'
                    modelo = self._clean_string(get_mapped_value(row, 'modelo')) or 'N/A'
                    
                    skipped_motos.append({
                        'linha': index + 2,
                        'marca': marca,
                        'modelo': modelo,
                        'placa': self._clean_string(get_mapped_value(row, 'placa')) or 'N/A',
                        'chassi': self._clean_string(get_mapped_value(row, 'chassi')) or 'N/A',
                        'motivo': f'Erro: {str(e)}'
                    })
                    
                    self.log_error(f"Erro ao importar motocicleta: {str(e)}", index + 2)
                    error_count += 1
        
        self.success_count = success_count
        self.error_count = error_count
        self.skipped_count = skipped_count
        self.skipped_motos = skipped_motos  # Armazenar lista de motos ignoradas
        return error_count == 0
    
    @transaction.atomic
    def import_vendas(self, file: UploadedFile, column_mapping=None):
        """Importa vendas do arquivo com mapeamento de colunas opcional"""
        df = self.read_file(file)
        if df is None:
            return False
        
        # Se não foi fornecido mapeamento, usar o padrão
        if not column_mapping:
            column_mapping = {
                'moto_chassi': ['moto_chassi', 'chassi'],
                'comprador_cpf': ['comprador_cpf', 'cpf_comprador'],
                'vendedor_username': ['vendedor_username', 'vendedor'],
                'loja_nome': ['loja_nome', 'loja'],
                'origem': ['origem'],
                'forma_pagamento': ['forma_pagamento', 'pagamento'],
                'status': ['status'],
                'valor_venda': ['valor_venda', 'valor'],
                'valor_entrada': ['valor_entrada'],
                'comissao_vendedor': ['comissao_vendedor', 'comissao'],
                'data_atendimento': ['data_atendimento'],
                'data_venda': ['data_venda', 'data'],
                'observacoes': ['observacoes', 'observações']
            }
        
        def get_mapped_value(row, field_name):
            """Obtém o valor mapeado para um campo"""
            if field_name in column_mapping:
                for col_name in column_mapping[field_name]:
                    if col_name in row and pd.notna(row[col_name]) and str(row[col_name]).strip():
                        return row[col_name]
            return None
        
        self.total_count = len(df)
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Buscar moto
                moto_chassi = self._clean_string(get_mapped_value(row, 'moto_chassi'))
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
                comprador_cpf = self._clean_string(get_mapped_value(row, 'comprador_cpf'))
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
                vendedor_username = self._clean_string(get_mapped_value(row, 'vendedor_username'))
                if not vendedor_username:
                    self.log_error(f"Username do vendedor vazio (Linha {index + 2})")
                    error_count += 1
                    continue
                    
                try:
                    vendedor = Usuario.objects.get(username=vendedor_username)
                except Usuario.DoesNotExist:
                    self.log_error(f"Vendedor com username {vendedor_username} não encontrado", index + 2)
                    error_count += 1
                    continue
                
                # Buscar loja
                loja_nome = self._clean_string(get_mapped_value(row, 'loja_nome'))
                loja = None
                if loja_nome:
                    try:
                        loja = Loja.objects.get(nome=loja_nome)
                    except Loja.DoesNotExist:
                        self.log_error(f"Loja {loja_nome} não encontrada", index + 2)
                        error_count += 1
                        continue
                
                # Criar venda
                venda = Venda.objects.create(
                    moto=moto,
                    comprador=comprador,
                    vendedor=vendedor,
                    loja=loja,
                    origem=self._clean_string(get_mapped_value(row, 'origem')),
                    forma_pagamento=self._clean_string(get_mapped_value(row, 'forma_pagamento')),
                    status=self._clean_string(get_mapped_value(row, 'status')),
                    valor_venda=self._parse_decimal(get_mapped_value(row, 'valor_venda')),
                    valor_entrada=self._parse_decimal(get_mapped_value(row, 'valor_entrada')),
                    comissao_vendedor=self._parse_decimal(get_mapped_value(row, 'comissao_vendedor')),
                    data_atendimento=self._parse_date(get_mapped_value(row, 'data_atendimento')),
                    data_venda=self._parse_date(get_mapped_value(row, 'data_venda')),
                    observacoes=self._clean_string(get_mapped_value(row, 'observacoes')),
                    ativo=self._parse_boolean(row.get('ativo', True))
                )
                
                self.log_success(f"Venda da moto {moto.marca} {moto.modelo} importada com sucesso")
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
        summary = {
            'total_count': self.total_count,
            'success_count': self.success_count,
            'error_count': self.error_count,
            'duplicates_count': self.duplicates_count,
            'errors': self.errors
        }
        
        # Adicionar informações sobre motos ignoradas se disponível
        if hasattr(self, 'skipped_count'):
            summary['skipped_count'] = self.skipped_count
        if hasattr(self, 'skipped_motos'):
            summary['skipped_motos'] = self.skipped_motos
            
        return summary
    
    def clear_logs(self):
        """Limpa os logs de importação"""
        self.errors = []
        self.success_count = 0
        self.total_count = 0
        self.duplicates_count = 0 