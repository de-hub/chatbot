# Generated by Django 3.0.2 on 2020-02-10 13:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_statement_redirect'),
    ]

    operations = [
        migrations.RenameField(
            model_name='statement',
            old_name='redirect',
            new_name='forward',
        ),
        migrations.RenameField(
            model_name='statement',
            old_name='request',
            new_name='message',
        ),
        migrations.RenameField(
            model_name='statement',
            old_name='response',
            new_name='reply',
        ),
    ]
