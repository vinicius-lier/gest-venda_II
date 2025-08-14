# Generated manually for Contrato model

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0033_add_matriculas_manual'),
    ]

    operations = [
        migrations.CreateModel(
            name='Contrato',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_contrato', models.CharField(help_text='Número único do contrato', max_length=50, unique=True)),
                ('tipo', models.CharField(choices=[('0km', 'Veículo 0km'), ('seminova', 'Veículo Seminova'), ('consignacao', 'Contrato de Consignação')], max_length=20)),
                ('status', models.CharField(choices=[('gerado', 'Gerado'), ('assinado', 'Assinado'), ('cancelado', 'Cancelado')], default='gerado', max_length=20)),
                ('valor_contrato', models.DecimalField(decimal_places=2, max_digits=10)),
                ('valor_entrada', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('forma_pagamento', models.CharField(blank=True, max_length=50, null=True)),
                ('data_geracao', models.DateTimeField(default=django.utils.timezone.now)),
                ('data_assinatura', models.DateTimeField(blank=True, null=True)),
                ('data_vencimento', models.DateField(blank=True, null=True)),
                ('arquivo_pdf', models.FileField(blank=True, null=True, upload_to='contratos/')),
                ('arquivo_html', models.TextField(blank=True, help_text='HTML do contrato gerado', null=True)),
                ('observacoes', models.TextField(blank=True, null=True)),
                ('ativo', models.BooleanField(default=True)),
                ('comprador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contratos_compra', to='core.cliente')),
                ('loja', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contratos', to='core.loja')),
                ('motocicleta', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contratos', to='core.motocicleta')),
                ('venda', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='contratos', to='core.venda')),
                ('vendedor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contratos_venda', to='core.usuario')),
            ],
            options={
                'verbose_name': 'Contrato',
                'verbose_name_plural': 'Contratos',
                'ordering': ['-data_geracao'],
            },
        ),
    ]
