# Generated by Django 3.0.2 on 2020-01-19 10:19

import chat.models
from django.db import migrations, models
import django.db.models.deletion
import django_extensions.db.fields
import mptt.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, verbose_name='created')),
                ('modified', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, verbose_name='modified')),
                ('name', models.CharField(max_length=64, unique=True)),
                ('file', models.FileField(upload_to=chat.models.training_path)),
            ],
            options={
                'verbose_name': 'Conversation',
                'verbose_name_plural': 'Conversation',
                'ordering': ('created',),
            },
        ),
        migrations.CreateModel(
            name='Statement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request', models.TextField()),
                ('response', models.TextField()),
                ('lft', models.PositiveIntegerField(editable=False)),
                ('rght', models.PositiveIntegerField(editable=False)),
                ('tree_id', models.PositiveIntegerField(db_index=True, editable=False)),
                ('level', models.PositiveIntegerField(editable=False)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='statements', to='chat.Conversation')),
                ('parent', mptt.fields.TreeForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='chat.Statement')),
            ],
            options={
                'verbose_name': 'Statement',
                'verbose_name_plural': 'Statements',
                'ordering': ('conversation',),
            },
        ),
    ]
