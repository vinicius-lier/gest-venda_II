# Generated by Django 5.2.1 on 2025-07-01 18:20

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_despesa_receitaextra_pagamento_vendafinanceira'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vendafinanceira',
            name='venda',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='financeiro', to='core.venda'),
        ),
    ]
