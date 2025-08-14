# Generated manually to add matricula fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0032_logatividade_permissaomodulo_permissaoitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='cliente',
            name='matricula',
            field=models.CharField(blank=True, help_text='Código único para identificação do cliente', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='usuario',
            name='matricula',
            field=models.CharField(blank=True, help_text='Código único para identificação do usuário', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='venda',
            name='numero_venda',
            field=models.CharField(blank=True, help_text='Número único da venda', max_length=15, null=True),
        ),
    ]
