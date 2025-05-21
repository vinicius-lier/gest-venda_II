from django.db import connection

# Execute raw SQL queries to add the missing columns
cursor = connection.cursor()

try:
    # Add valor column to EstoqueMoto table if it doesn't exist
    cursor.execute('PRAGMA table_info(core_estoquemoto)')
    columns = [column[1] for column in cursor.fetchall()]
    if 'valor' not in columns:
        cursor.execute('ALTER TABLE core_estoquemoto ADD COLUMN valor DECIMAL DEFAULT 0')
        print("Adicionada coluna 'valor' a tabela EstoqueMoto.")
    
    # Add endereco column to Cliente table if it doesn't exist
    cursor.execute('PRAGMA table_info(core_cliente)')
    columns = [column[1] for column in cursor.fetchall()]
    if 'endereco' not in columns:
        cursor.execute('ALTER TABLE core_cliente ADD COLUMN endereco VARCHAR(200) DEFAULT NULL')
        print("Adicionada coluna 'endereco' a tabela Cliente.")
    
    print('Operações concluídas com sucesso!')
except Exception as e:
    print(f"Erro ao executar as operações: {e}") 