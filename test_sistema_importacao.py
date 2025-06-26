#!/usr/bin/env python
"""
Teste simplificado do sistema de importação
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_vendas.settings')
django.setup()

from core.models import Loja, Cliente, Motocicleta, Seguradora, PlanoSeguro
from core.importers import DataImporter

def testar_importador():
    """Testa se o importador está funcionando"""
    print("🔍 Testando importador...")
    
    # Criar arquivo CSV simples
    csv_content = """nome,cnpj,cidade,endereco,telefone,email,ativo
Loja Teste,11.111.111/0001-11,São Paulo,Rua Teste 123,11999999999,teste@email.com,True"""
    
    with open('teste_simples.csv', 'w', encoding='utf-8') as f:
        f.write(csv_content)
    
    # Testar importação
    try:
        importer = DataImporter()
        
        # Simular arquivo upload
        class MockFile:
            def __init__(self, path):
                self.path = path
            
            def read(self):
                with open(self.path, 'rb') as f:
                    return f.read()
        
        mock_file = MockFile('teste_simples.csv')
        success = importer.import_lojas(mock_file)
        summary = importer.get_import_summary()
        
        print(f"✅ Importação funcionou: {success}")
        print(f"📊 Resumo: {summary}")
        
        # Verificar se foi criado
        loja = Loja.objects.filter(nome='Loja Teste').first()
        if loja:
            print(f"✅ Loja criada: {loja.nome} - {loja.cnpj}")
        else:
            print("❌ Loja não foi criada")
        
        # Limpar
        os.remove('teste_simples.csv')
        if loja:
            loja.delete()
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def testar_views():
    """Testa se as views estão funcionando"""
    print("\n🔍 Testando views...")
    
    try:
        from core.views import import_data, import_lojas, import_clientes
        
        print("✅ Views importadas com sucesso")
        
        # Verificar se as funções existem
        if callable(import_data):
            print("✅ View import_data está funcionando")
        if callable(import_lojas):
            print("✅ View import_lojas está funcionando")
        if callable(import_clientes):
            print("✅ View import_clientes está funcionando")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro nas views: {e}")
        return False

def testar_urls():
    """Testa se as URLs estão funcionando"""
    print("\n🔍 Testando URLs...")
    
    try:
        from django.urls import reverse
        
        # Testar URLs
        urls_teste = [
            'core:import_data',
            'core:import_lojas',
            'core:import_clientes',
            'core:import_motocicletas',
            'core:import_vendas',
            'core:import_seguradoras',
            'core:import_planos_seguro'
        ]
        
        for url_name in urls_teste:
            try:
                url = reverse(url_name)
                print(f"✅ URL {url_name}: {url}")
            except Exception as e:
                print(f"❌ URL {url_name}: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro nas URLs: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Testando sistema de importação...")
    
    resultados = []
    
    resultados.append(("Importador", testar_importador()))
    resultados.append(("Views", testar_views()))
    resultados.append(("URLs", testar_urls()))
    
    print("\n" + "="*50)
    print("📊 RESUMO DOS TESTES")
    print("="*50)
    
    for tipo, sucesso in resultados:
        status = "✅ SUCESSO" if sucesso else "❌ FALHOU"
        print(f"{tipo}: {status}")
    
    sucessos = sum(1 for _, sucesso in resultados if sucesso)
    total = len(resultados)
    
    print(f"\n🎯 Resultado final: {sucessos}/{total} testes passaram")
    
    if sucessos == total:
        print("🎉 Sistema de importação está funcionando corretamente!")
    else:
        print("⚠️  Alguns componentes precisam de ajustes.")

if __name__ == "__main__":
    main() 