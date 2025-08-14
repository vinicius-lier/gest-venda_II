# Generated manually for LogAtividade, PermissaoModulo, and PermissaoItem models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0031_usuario_telefone'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogAtividade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('login', 'Login'), ('logout', 'Logout'), ('create', 'Criação'), ('update', 'Atualização'), ('delete', 'Exclusão'), ('view', 'Visualização'), ('export', 'Exportação'), ('import', 'Importação'), ('action', 'Ação Específica')], max_length=20)),
                ('modulo', models.CharField(choices=[('dashboard', 'Dashboard'), ('clientes', 'Clientes'), ('motocicletas', 'Motocicletas'), ('vendas', 'Vendas'), ('consignacoes', 'Consignações'), ('seguros', 'Seguros'), ('usuarios', 'Usuários'), ('lojas', 'Lojas'), ('financeiro', 'Financeiro'), ('relatorios', 'Relatórios'), ('ocorrencias', 'Ocorrências'), ('seguradoras', 'Seguradoras'), ('bens', 'Bens'), ('cotacoes', 'Cotações'), ('pre_venda', 'Pré-Venda'), ('notificacoes', 'Notificações'), ('documentos', 'Documentos'), ('chaves', 'Chaves'), ('pagamentos', 'Pagamentos'), ('planos_seguro', 'Planos de Seguro'), ('sistema', 'Sistema')], max_length=20)),
                ('acao', models.CharField(help_text='Descrição da ação realizada', max_length=100)),
                ('detalhes', models.TextField(blank=True, help_text='Detalhes adicionais da ação', null=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('data_hora', models.DateTimeField(auto_now_add=True)),
                ('sucesso', models.BooleanField(default=True, help_text='Se a ação foi bem-sucedida')),
                ('erro', models.TextField(blank=True, help_text='Detalhes do erro, se houver', null=True)),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs_atividade', to='core.usuario')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs_atividade', to='auth.user')),
            ],
            options={
                'verbose_name': 'Log de Atividade',
                'verbose_name_plural': 'Logs de Atividade',
                'ordering': ['-data_hora'],
            },
        ),
        migrations.CreateModel(
            name='PermissaoModulo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('modulo', models.CharField(choices=[('dashboard', 'Dashboard'), ('clientes', 'Clientes'), ('motocicletas', 'Motocicletas'), ('vendas', 'Vendas'), ('consignacoes', 'Consignações'), ('seguros', 'Seguros'), ('usuarios', 'Usuários'), ('lojas', 'Lojas'), ('financeiro', 'Financeiro'), ('relatorios', 'Relatórios'), ('ocorrencias', 'Ocorrências'), ('seguradoras', 'Seguradoras'), ('bens', 'Bens'), ('cotacoes', 'Cotações'), ('pre_venda', 'Pré-Venda'), ('notificacoes', 'Notificações'), ('documentos', 'Documentos'), ('chaves', 'Chaves'), ('pagamentos', 'Pagamentos'), ('planos_seguro', 'Planos de Seguro'), ('sistema', 'Sistema')], max_length=20)),
                ('pode_visualizar', models.BooleanField(default=True)),
                ('pode_criar', models.BooleanField(default=False)),
                ('pode_editar', models.BooleanField(default=False)),
                ('pode_excluir', models.BooleanField(default=False)),
                ('pode_exportar', models.BooleanField(default=False)),
                ('pode_importar', models.BooleanField(default=False)),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
                ('data_atualizacao', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permissoes_modulos', to='core.usuario')),
            ],
            options={
                'verbose_name': 'Permissão de Módulo',
                'verbose_name_plural': 'Permissões de Módulos',
                'ordering': ['usuario', 'modulo'],
                'unique_together': {('usuario', 'modulo')},
            },
        ),
        migrations.CreateModel(
            name='PermissaoItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('modulo', models.CharField(choices=[('dashboard', 'Dashboard'), ('clientes', 'Clientes'), ('motocicletas', 'Motocicletas'), ('vendas', 'Vendas'), ('consignacoes', 'Consignações'), ('seguros', 'Seguros'), ('usuarios', 'Usuários'), ('lojas', 'Lojas'), ('financeiro', 'Financeiro'), ('relatorios', 'Relatórios'), ('ocorrencias', 'Ocorrências'), ('seguradoras', 'Seguradoras'), ('bens', 'Bens'), ('cotacoes', 'Cotações'), ('pre_venda', 'Pré-Venda'), ('notificacoes', 'Notificações'), ('documentos', 'Documentos'), ('chaves', 'Chaves'), ('pagamentos', 'Pagamentos'), ('planos_seguro', 'Planos de Seguro'), ('sistema', 'Sistema')], max_length=20)),
                ('tipo_item', models.CharField(choices=[('cliente', 'Cliente'), ('motocicleta', 'Motocicleta'), ('venda', 'Venda'), ('consignacao', 'Consignação'), ('seguro', 'Seguro'), ('usuario', 'Usuário'), ('loja', 'Loja'), ('ocorrencia', 'Ocorrência'), ('seguradora', 'Seguradora'), ('bem', 'Bem'), ('cotacao', 'Cotação'), ('documento', 'Documento'), ('pagamento', 'Pagamento'), ('plano_seguro', 'Plano de Seguro')], max_length=20)),
                ('item_id', models.IntegerField(help_text='ID do item específico')),
                ('pode_visualizar', models.BooleanField(default=True)),
                ('pode_editar', models.BooleanField(default=False)),
                ('pode_excluir', models.BooleanField(default=False)),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
                ('data_atualizacao', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permissoes_itens', to='core.usuario')),
            ],
            options={
                'verbose_name': 'Permissão de Item',
                'verbose_name_plural': 'Permissões de Itens',
                'ordering': ['usuario', 'modulo', 'tipo_item'],
                'unique_together': {('usuario', 'modulo', 'tipo_item', 'item_id')},
            },
        ),
        migrations.AddIndex(
            model_name='logatividade',
            index=models.Index(fields=['usuario', 'data_hora'], name='core_logati_usuario_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='logatividade',
            index=models.Index(fields=['modulo', 'data_hora'], name='core_logati_modulo_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='logatividade',
            index=models.Index(fields=['tipo', 'data_hora'], name='core_logati_tipo_123456_idx'),
        ),
    ]
