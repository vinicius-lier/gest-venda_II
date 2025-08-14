from rest_framework import serializers
from .models import Usuario, Cliente, Motocicleta, Venda, Loja, Seguro, Ocorrencia, Notificacao, Perfil, Consignacao, HistoricoVendas, HistoricoProprietario, Despesa, ReceitaExtra, Contrato
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff', 'is_superuser', 'date_joined']

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['id', 'nome', 'descricao']

class LojaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loja
        fields = ['id', 'nome', 'cnpj', 'cidade', 'endereco', 'telefone', 'email', 'ativo', 'data_cadastro']

class UsuarioSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    perfil = PerfilSerializer(read_only=True)
    loja = LojaSerializer(read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'user', 'loja', 'perfil', 'telefone', 'status', 'data_cadastro', 'ultimo_acesso', 'precisa_trocar_senha', 'foto', 'matricula']

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

# Serializers para criação (aceitam apenas IDs)
class MotocicletaCreateSerializer(serializers.ModelSerializer):
    fotos = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True
    )
    foto_principal_index = serializers.IntegerField(
        required=False,
        default=-1,
        min_value=-1
    )
    
    class Meta:
        model = Motocicleta
        fields = '__all__'
    
    def validate_fotos(self, value):
        """Validar campo de fotos"""
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Fotos deve ser uma lista")
        return value
    
    def validate_foto_principal_index(self, value):
        """Validar índice da foto principal"""
        if value is None:
            return -1
        if not isinstance(value, int):
            try:
                value = int(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Índice da foto principal deve ser um número inteiro")
        return value
    
    def validate(self, data):
        """Validar dados antes de salvar"""
        # Tratar valores "0" como null para campos opcionais
        optional_fields = ['fornecedor', 'proprietario', 'loja_origem']
        for field in optional_fields:
            if field in data and data[field] in [0, '0', '']:
                data[field] = None
        
        return data

class VendaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venda
        fields = '__all__'

class OcorrenciaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ocorrencia
        fields = '__all__'

# Serializers para leitura (incluem objetos completos)
class MotocicletaSerializer(serializers.ModelSerializer):
    proprietario = ClienteSerializer(required=True, allow_null=False)
    fornecedor = ClienteSerializer(required=False, allow_null=True)
    loja_origem = LojaSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Motocicleta
        fields = '__all__'
    
    def to_representation(self, instance):
        """Personalizar a representação dos dados"""
        data = super().to_representation(instance)
        
        # Garantir que fotos seja sempre uma lista válida
        if data.get('fotos') is None:
            data['fotos'] = []
        elif not isinstance(data['fotos'], list):
            data['fotos'] = []
        
        # Garantir que foto_principal_index seja um inteiro válido
        if data.get('foto_principal_index') is None:
            data['foto_principal_index'] = -1
        elif not isinstance(data['foto_principal_index'], int):
            try:
                data['foto_principal_index'] = int(data['foto_principal_index'])
            except (ValueError, TypeError):
                data['foto_principal_index'] = -1
        
        # Processar fotos de forma mais simples e robusta
        if data['fotos'] and len(data['fotos']) > 0:
            fotos_processadas = []
            for foto in data['fotos']:
                try:
                    if isinstance(foto, dict) and 'dados' in foto:
                        # Extrair base64 do campo 'dados'
                        dados = foto['dados']
                        if dados.startswith('data:image/;base64,'):
                            base64_data = dados.split(',')[1]
                            fotos_processadas.append(base64_data)
                        elif dados.startswith('data:'):
                            base64_data = dados.split(',')[1]
                            fotos_processadas.append(base64_data)
                        else:
                            # Se já é base64 puro
                            fotos_processadas.append(dados)
                    elif isinstance(foto, str):
                        # Se já é uma string base64, verificar se precisa limpar
                        if foto.startswith('data:image/;base64,'):
                            base64_data = foto.split(',')[1]
                            fotos_processadas.append(base64_data)
                        elif foto.startswith('data:'):
                            base64_data = foto.split(',')[1]
                            fotos_processadas.append(base64_data)
                        else:
                            # Se já é base64 puro
                            fotos_processadas.append(foto)
                    else:
                        # Ignorar fotos inválidas
                        continue
                except Exception as e:
                    print(f"❌ Erro ao processar foto: {e}")
                    continue
            
            data['fotos'] = fotos_processadas
        
        return data
    
    def validate(self, data):
        """Validar dados antes de salvar"""
        # Tratar valores "0" como null para campos opcionais
        optional_fields = ['fornecedor', 'proprietario', 'loja_origem']
        for field in optional_fields:
            if field in data and data[field] in [0, '0', '']:
                data[field] = None
        
        return data

class VendaSerializer(serializers.ModelSerializer):
    moto = MotocicletaSerializer(required=False, allow_null=True)
    comprador = ClienteSerializer(required=False, allow_null=True)
    vendedor = UsuarioSerializer(required=False, allow_null=True)
    loja = LojaSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Venda
        fields = '__all__'

class SeguroSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(required=False, allow_null=True)
    vendedor = UsuarioSerializer(required=False, allow_null=True)
    loja = LojaSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Seguro
        fields = '__all__'

class OcorrenciaSerializer(serializers.ModelSerializer):
    solicitante = UsuarioSerializer(required=False, allow_null=True)
    responsavel = UsuarioSerializer(required=False, allow_null=True)
    loja = LojaSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Ocorrencia
        fields = '__all__'

class NotificacaoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Notificacao
        fields = '__all__'

class ConsignacaoSerializer(serializers.ModelSerializer):
    consignante = ClienteSerializer(required=False, allow_null=True)
    vendedor_responsavel = UsuarioSerializer(required=False, allow_null=True)
    loja = LojaSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Consignacao
        fields = '__all__'

class HistoricoVendasSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(required=False, allow_null=True)
    motocicleta = MotocicletaSerializer(required=False, allow_null=True)
    vendedor = UsuarioSerializer(required=False, allow_null=True)
    
    class Meta:
        model = HistoricoVendas
        fields = '__all__'

class HistoricoProprietarioSerializer(serializers.ModelSerializer):
    moto = MotocicletaSerializer(required=False, allow_null=True)
    proprietario = ClienteSerializer(required=False, allow_null=True)
    
    class Meta:
        model = HistoricoProprietario
        fields = '__all__'

class DespesaSerializer(serializers.ModelSerializer):
    loja = LojaSerializer(required=False, allow_null=True)
    responsavel = UsuarioSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Despesa
        fields = '__all__'

class ReceitaExtraSerializer(serializers.ModelSerializer):
    loja = LojaSerializer(required=False, allow_null=True)
    responsavel = UsuarioSerializer(required=False, allow_null=True)
    
    class Meta:
        model = ReceitaExtra
        fields = '__all__'

class ContratoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Contrato"""
    motocicleta_info = serializers.SerializerMethodField()
    comprador_info = serializers.SerializerMethodField()
    vendedor_info = serializers.SerializerMethodField()
    loja_info = serializers.SerializerMethodField()
    venda_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'numero_contrato', 'tipo', 'tipo_display', 'status', 'status_display',
            'venda', 'motocicleta', 'comprador', 'vendedor', 'loja',
            'valor_contrato', 'valor_entrada', 'forma_pagamento',
            'data_geracao', 'data_assinatura', 'data_vencimento',
            'arquivo_pdf', 'arquivo_html', 'observacoes', 'ativo',
            'motocicleta_info', 'comprador_info', 'vendedor_info', 'loja_info', 'venda_info'
        ]
        read_only_fields = ['numero_contrato', 'data_geracao']
    
    def get_motocicleta_info(self, obj):
        if obj.motocicleta:
            return {
                'id': obj.motocicleta.id,
                'marca': obj.motocicleta.marca,
                'modelo': obj.motocicleta.modelo,
                'ano': obj.motocicleta.ano,
                'cor': obj.motocicleta.cor,
                'placa': obj.motocicleta.placa,
                'chassi': obj.motocicleta.chassi,
                'rodagem': obj.motocicleta.rodagem,
            }
        return None
    
    def get_comprador_info(self, obj):
        if obj.comprador:
            return {
                'id': obj.comprador.id,
                'nome': obj.comprador.nome,
                'cpf_cnpj': obj.comprador.cpf_cnpj,
                'telefone': obj.comprador.telefone,
                'email': obj.comprador.email,
            }
        return None
    
    def get_vendedor_info(self, obj):
        if obj.vendedor:
            return {
                'id': obj.vendedor.id,
                'username': obj.vendedor.username,
                'first_name': obj.vendedor.first_name,
                'last_name': obj.vendedor.last_name,
                'email': obj.vendedor.email,
            }
        return None
    
    def get_loja_info(self, obj):
        if obj.loja:
            return {
                'id': obj.loja.id,
                'nome': obj.loja.nome,
                'cnpj': obj.loja.cnpj,
                'endereco': obj.loja.endereco,
                'cidade': obj.loja.cidade,
                'estado': obj.loja.estado,
            }
        return None
    
    def get_venda_info(self, obj):
        if obj.venda:
            return {
                'id': obj.venda.id,
                'numero_venda': obj.venda.numero_venda,
                'valor_venda': obj.venda.valor_venda,
                'data_venda': obj.venda.data_venda or obj.venda.data_atendimento,
                'status': obj.venda.status,
            }
        return None
