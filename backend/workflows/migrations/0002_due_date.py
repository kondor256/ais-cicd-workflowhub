
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workflows', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='workflowitem',
            name='due_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
