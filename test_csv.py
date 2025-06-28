#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de diagnóstico para testar leitura de arquivo CSV
"""
import pandas as pd
import os
import sys

def test_csv_reading(file_path):
    """Testa diferentes métodos de leitura do CSV"""
    print(f"Testando arquivo: {file_path}")
    print("=" * 50)
    
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False
    
    # Verificar tamanho do arquivo
    file_size = os.path.getsize(file_path)
    print(f"📁 Tamanho do arquivo: {file_size} bytes")
    
    # Ler primeiras linhas como texto
    try:
        with open(file_path, 'rb') as f:
            raw_data = f.read(1000)  # Primeiros 1000 bytes
        print(f"🔍 Primeiros bytes: {raw_data[:100]}")
    except Exception as e:
        print(f"❌ Erro ao ler arquivo como binário: {e}")
        return False
    
    # Tentar diferentes encodings
    encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1', 'windows-1252']
    
    for encoding in encodings:
        print(f"\n🔄 Testando encoding: {encoding}")
        try:
            # Ler como texto primeiro
            with open(file_path, 'r', encoding=encoding) as f:
                first_lines = [f.readline() for _ in range(5)]
            
            print(f"✅ Encoding {encoding} funciona para leitura de texto")
            print("Primeiras linhas:")
            for i, line in enumerate(first_lines, 1):
                print(f"  Linha {i}: {line.strip()}")
            
            # Tentar com pandas
            try:
                df = pd.read_csv(file_path, encoding=encoding, nrows=5)
                print(f"✅ Pandas conseguiu ler com encoding {encoding}")
                print(f"   Colunas encontradas: {list(df.columns)}")
                print(f"   Número de linhas: {len(df)}")
                return True
            except Exception as e:
                print(f"❌ Pandas falhou com encoding {encoding}: {e}")
                
        except UnicodeDecodeError as e:
            print(f"❌ Encoding {encoding} falhou: {e}")
        except Exception as e:
            print(f"❌ Erro inesperado com encoding {encoding}: {e}")
    
    # Tentar com chardet
    try:
        import chardet
        with open(file_path, 'rb') as f:
            raw_data = f.read()
        
        detected = chardet.detect(raw_data)
        print(f"\n🔍 Detecção automática: {detected}")
        
        if detected['confidence'] > 0.7:
            detected_encoding = detected['encoding']
            print(f"🔄 Tentando encoding detectado: {detected_encoding}")
            
            try:
                df = pd.read_csv(file_path, encoding=detected_encoding, nrows=5)
                print(f"✅ Pandas conseguiu ler com encoding detectado {detected_encoding}")
                print(f"   Colunas encontradas: {list(df.columns)}")
                return True
            except Exception as e:
                print(f"❌ Pandas falhou com encoding detectado: {e}")
    except ImportError:
        print("⚠️  chardet não disponível")
    except Exception as e:
        print(f"❌ Erro na detecção automática: {e}")
    
    # Tentar com engine python
    print(f"\n🔄 Tentando com engine='python'")
    for encoding in ['utf-8', 'latin1', 'cp1252']:
        try:
            df = pd.read_csv(file_path, encoding=encoding, engine='python', nrows=5)
            print(f"✅ Pandas conseguiu ler com engine='python' e encoding {encoding}")
            print(f"   Colunas encontradas: {list(df.columns)}")
            return True
        except Exception as e:
            print(f"❌ Engine python falhou com encoding {encoding}: {e}")
    
    print("\n❌ Nenhum método funcionou para ler o arquivo CSV")
    return False

if __name__ == "__main__":
    file_path = "dados/Motos estoque.csv"
    
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    
    success = test_csv_reading(file_path)
    
    if success:
        print("\n✅ Arquivo pode ser lido com sucesso!")
    else:
        print("\n❌ Arquivo não pode ser lido. Verifique o formato e encoding.") 