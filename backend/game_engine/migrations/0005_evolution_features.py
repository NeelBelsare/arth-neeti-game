# Generated migration for Evolution features

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('game_engine', '0004_gamesession_stock_investment'),
    ]

    operations = [
        # 1. PlayerProfile
        migrations.CreateModel(
            name='PlayerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_games', models.IntegerField(default=0)),
                ('highest_wealth', models.IntegerField(default=0)),
                ('highest_score', models.IntegerField(default=0)),
                ('badges', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        
        # 2. GameHistory
        migrations.CreateModel(
            name='GameHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('final_wealth', models.IntegerField()),
                ('final_happiness', models.IntegerField()),
                ('final_credit_score', models.IntegerField()),
                ('financial_literacy_score', models.IntegerField()),
                ('persona', models.CharField(max_length=100)),
                ('end_reason', models.CharField(max_length=20)),
                ('months_played', models.IntegerField()),
                ('played_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_history', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-played_at'],
            },
        ),
        
        # 3. MarketEvent
        migrations.CreateModel(
            name='MarketEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('sector_impacts', models.JSONField()),
                ('trigger_month', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
        
        # 4. RecurringExpense
        migrations.CreateModel(
            name='RecurringExpense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('amount', models.IntegerField()),
                ('started_month', models.IntegerField()),
                ('is_cancelled', models.BooleanField(default=False)),
                ('cancelled_month', models.IntegerField(blank=True, null=True)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='game_engine.gamesession')),
            ],
        ),
        
        # 5. GameSession new fields
        migrations.RemoveField(
            model_name='gamesession',
            name='stock_investment',
        ),
        migrations.AddField(
            model_name='gamesession',
            name='market_prices',
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name='gamesession',
            name='portfolio',
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name='gamesession',
            name='recurring_expenses',
            field=models.IntegerField(default=0),
        ),
        
        # 6. ScenarioCard new fields
        migrations.AddField(
            model_name='scenariocard',
            name='market_event',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='game_engine.marketevent'),
        ),
        migrations.AddField(
            model_name='scenariocard',
            name='adds_recurring_expense',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='scenariocard',
            name='expense_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        
        # 7. ScenarioCard category update (add NEWS and QUIZ)
        migrations.AlterField(
            model_name='scenariocard',
            name='category',
            field=models.CharField(choices=[('NEEDS', 'Needs'), ('WANTS', 'Wants'), ('EMERGENCY', 'Emergency'), ('INVESTMENT', 'Investment'), ('SOCIAL', 'Social Pressure'), ('TRAP', 'Hidden Trap'), ('NEWS', 'Market News'), ('QUIZ', 'Pop Quiz')], default='WANTS', max_length=20),
        ),
        
        # 8. Choice new fields
        migrations.AddField(
            model_name='choice',
            name='adds_recurring_expense',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='choice',
            name='expense_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='choice',
            name='cancels_expense_name',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
