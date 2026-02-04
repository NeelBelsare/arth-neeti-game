import random
import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .models import (
    GameSession, ScenarioCard, Choice, PlayerChoice,
    PlayerProfile, GameHistory, MarketEvent, RecurringExpense
)
from .serializers import (
    GameSessionSerializer, ScenarioCardSerializer, SubmitChoiceSerializer,
    PlayerProfileSerializer, GameHistorySerializer, RecurringExpenseSerializer
)
from .advisor import get_advisor
from .services import GameEngine


# ==================== AUTHENTICATION ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user and create their profile."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip()

    if not username or not password:
        return Response(
            {'error': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 6:
        return Response(
            {'error': 'Password must be at least 6 characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already taken.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create user (signal auto-creates PlayerProfile)
    user = User.objects.create_user(username=username, password=password, email=email)
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'message': 'Registration successful!',
        'token': token.key,
        'username': user.username
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user and return token."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        profile = PlayerProfileSerializer(user.profile).data if hasattr(user, 'profile') else {}
        return Response({
            'message': 'Login successful!',
            'token': token.key,
            'username': user.username,
            'profile': profile
        })

    return Response(
        {'error': 'Invalid username or password.'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get current user's profile and game history."""
    user = request.user
    
    # Ensure profile exists
    profile, _ = PlayerProfile.objects.get_or_create(user=user)
    
    # Get game history
    history = GameHistory.objects.filter(user=user)[:10]
    
    return Response({
        'profile': PlayerProfileSerializer(profile).data,
        'game_history': GameHistorySerializer(history, many=True).data
    })


# ==================== GAME ENDPOINTS ====================



@api_view(['POST'])
def start_game(request):
    """Start a new game session using the Game Engine."""
    
    # Get or create a user for the session
    if request.user.is_authenticated:
        user = request.user
    else:
        # Generate unique guest username to avoid session collision
        guest_username = f"Guest_{uuid.uuid4().hex[:8]}"
        user = User.objects.create(
            username=guest_username,
            email=f"{guest_username}@guest.arthneeti.com"
        )

    # Use Engine to start session
    session = GameEngine.start_new_session(user)

    serializer = GameSessionSerializer(session)
    return Response({
        'message': 'Game started! Welcome to Arth-Neeti.',
        'session': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_card(request, session_id):
    """
    Get a random scenario card appropriate for the current game month.
    """
    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get cards that haven't been shown in this session and are appropriate for current month
    shown_card_ids = PlayerChoice.objects.filter(
        session=session
    ).values_list('card_id', flat=True)

    available_cards = ScenarioCard.objects.filter(
        is_active=True,
        min_month__lte=session.current_month
    ).exclude(id__in=shown_card_ids)

    if not available_cards.exists():
        # If all cards shown, allow repeats (or end game)
        available_cards = ScenarioCard.objects.filter(
            is_active=True,
            min_month__lte=session.current_month
        )

    if not available_cards.exists():
        return Response({
            'message': 'No more scenarios available!',
            'game_complete': True,
            'session': GameSessionSerializer(session).data
        })

    # Weighted random selection based on difficulty
    card = random.choice(list(available_cards))

    serializer = ScenarioCardSerializer(card)
    return Response({
        'card': serializer.data,
        'session': GameSessionSerializer(session).data,
        'cards_remaining': available_cards.count() - 1
    })


@api_view(['POST'])
def submit_choice(request):
    """
    Process a player's choice via the GameEngine.
    """
    serializer = SubmitChoiceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    session_id = serializer.validated_data['session_id']
    card_id = serializer.validated_data['card_id']
    choice_id = serializer.validated_data['choice_id']

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        choice = Choice.objects.get(id=choice_id, card_id=card_id)
    except Choice.DoesNotExist:
        return Response(
            {'error': 'Invalid choice.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # DELEGATE TO ENGINE
    result = GameEngine.process_choice(session, choice.card, choice)
    
    response_data = {
        'feedback': result['feedback'],
        'was_recommended': choice.is_recommended,
        'session': GameSessionSerializer(result['session']).data,
        'game_over': result['game_over'],
    }

    if result['game_over']:
        response_data['game_over_reason'] = result['game_over_reason']
        response_data['final_persona'] = result['final_persona']

    return Response(response_data)


@api_view(['POST'])
def take_loan(request):
    """
    Emergency loan endpoint for low-balance situations.
    """
    session_id = request.data.get('session_id')
    loan_type = request.data.get('loan_type')  # 'FAMILY' or 'INSTANT_APP'

    if not session_id or not loan_type:
        return Response(
            {'error': 'session_id and loan_type are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if session.wealth >= 4000:
        return Response(
            {'error': 'Loan is only available when balance is below ₹4,000.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if loan_type == 'FAMILY':
        session.wealth += 5000
        session.happiness -= 5
        message = "Family helped. You owe them ₹5,000 (No interest)."
    elif loan_type == 'INSTANT_APP':
        session.wealth += 10000
        session.credit_score -= 50
        session.happiness += 5
        message = "Loan approved instantly. Interest rate: 40%! (Credit score dropped.)"
    else:
        return Response(
            {'error': 'Invalid loan_type.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Clamp values
    session.happiness = max(0, min(100, session.happiness))
    session.credit_score = max(300, min(900, session.credit_score))

    session.save()
    return Response({
        'session': GameSessionSerializer(session).data,
        'message': message
    })


@api_view(['POST'])
def skip_card(request):
    """
    Skip the current scenario card.
    Skipping has a small penalty: -5 happiness and -10 credit score.
    The card is recorded as skipped so it won't appear again this session.
    """
    session_id = request.data.get('session_id')
    card_id = request.data.get('card_id')

    if not session_id or not card_id:
        return Response(
            {'error': 'session_id and card_id are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        card = ScenarioCard.objects.get(id=card_id)
    except ScenarioCard.DoesNotExist:
        return Response(
            {'error': 'Card not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Apply skip penalty
    session.happiness = max(0, session.happiness - 5)
    session.credit_score = max(300, session.credit_score - 10)

    # Record as "skipped" choice so card won't appear again
    PlayerChoice.objects.create(
        session=session,
        card=card,
        choice=None  # Null choice indicates skip
    )

    session.save()

    return Response({
        'session': GameSessionSerializer(session).data,
        'message': 'Question skipped! (-5 happiness, -10 credit score)',
        'skipped': True
    })





@api_view(['GET'])
def get_session(request, session_id):
    """Get current session state."""
    try:
        session = GameSession.objects.get(id=session_id)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        'session': GameSessionSerializer(session).data
    })


@api_view(['POST'])
def use_lifeline(request):
    """
    Use a lifeline to reveal the recommended choice for a card.
    Costs 1 lifeline per use.
    """
    session_id = request.data.get('session_id')
    card_id = request.data.get('card_id')

    if not session_id or not card_id:
        return Response(
            {'error': 'session_id and card_id are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if session.lifelines <= 0:
        return Response(
            {'error': 'No lifelines remaining!'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        card = ScenarioCard.objects.get(id=card_id)
    except ScenarioCard.DoesNotExist:
        return Response(
            {'error': 'Card not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Deduct lifeline
    session.lifelines -= 1
    session.save()

    # Get recommended choice hints
    choices = card.choices.all()
    hints = [
        {
            'choice_id': choice.id,
            'is_recommended': choice.is_recommended
        }
        for choice in choices
    ]

    return Response({
        'hints': hints,
        'lifelines_remaining': session.lifelines,
        'session': GameSessionSerializer(session).data
    })


@api_view(['POST'])
def get_ai_advice(request):
    """
    Get AI-powered financial advice for the current scenario.
    Uses Gemini API if available, otherwise returns curated fallback advice.
    """
    session_id = request.data.get('session_id')
    card_id = request.data.get('card_id')

    if not session_id or not card_id:
        return Response(
            {'error': 'session_id and card_id are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        card = ScenarioCard.objects.get(id=card_id)
    except ScenarioCard.DoesNotExist:
        return Response(
            {'error': 'Card not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get choices for the card
    choices = [
        {
            'text': c.text,
            'wealth_impact': c.wealth_impact,
            'happiness_impact': c.happiness_impact,
        }
        for c in card.choices.all()
    ]

    # Get advice from the advisor
    advisor = get_advisor()
    result = advisor.get_advice(
        scenario_title=card.title,
        scenario_description=card.description,
        choices=choices,
        player_wealth=session.wealth,
        player_happiness=session.happiness
    )

    return Response({
        'advice': result['advice'],
        'source': result['source'],
    })


@api_view(['GET'])
def get_leaderboard(request):
    """
    Get top 10 players by final score.
    """
    # Get completed sessions with highest scores
    top_sessions = GameSession.objects.filter(
        is_active=False
    ).order_by('-financial_literacy', '-wealth')[:10]

    leaderboard = []
    for i, session in enumerate(top_sessions, 1):
        # Calculate a composite score
        score = (
            session.financial_literacy * 10 +
            max(0, session.wealth) // 1000 +
            session.credit_score // 10
        )
        leaderboard.append({
            'rank': i,
            'player_name': session.user.username.replace('Guest_', 'Player '),
            'score': score,
            'wealth': session.wealth,
            'credit_score': session.credit_score,
            'persona': _calculate_persona(session)['title'],
        })

    return Response({
        'leaderboard': leaderboard
    })


@api_view(['POST'])
def invest_in_stocks(request):
    """
    Invest a portion of wealth in stocks.
    """
    session_id = request.data.get('session_id')
    amount = request.data.get('amount', 0)

    if not session_id:
        return Response(
            {'error': 'session_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        amount = int(amount)
    except (ValueError, TypeError):
        return Response(
            {'error': 'Amount must be a valid number.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response(
            {'error': 'Session not found or inactive.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if amount <= 0:
        return Response(
            {'error': 'Amount must be positive.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if amount > session.wealth:
        return Response(
            {'error': 'Insufficient funds.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Legacy: Transfer from wealth to general investment pool
    session.wealth -= amount
    session.save()

    return Response({
        'message': f'Invested ₹{amount:,} in stocks!',
        'session': GameSessionSerializer(session).data,
    })


# ==================== STOCK MARKET 2.0 ====================

STOCK_SECTORS = ['gold', 'tech', 'real_estate']





@api_view(['POST'])
def buy_stock(request):
    """Buy units of a stock sector."""
    session_id = request.data.get('session_id')
    sector = request.data.get('sector', '').lower()
    amount = request.data.get('amount', 0)

    if not session_id:
        return Response({'error': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if sector not in STOCK_SECTORS:
        return Response(
            {'error': f'Invalid sector. Choose from: {", ".join(STOCK_SECTORS)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        amount = int(amount)
        if amount <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return Response({'error': 'Amount must be a positive number.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    if amount > session.wealth:
        return Response({'error': 'Insufficient funds.'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate units at current price
    price = session.market_prices.get(sector, 100)
    units = amount / price
    
    # Update portfolio and wealth
    session.wealth -= amount
    current_units = session.portfolio.get(sector, 0)
    session.portfolio[sector] = current_units + units
    session.save()

    return Response({
        'message': f'Bought {units:.2f} units of {sector.upper()} at ₹{price}/unit',
        'session': GameSessionSerializer(session).data,
        'purchase': {
            'sector': sector,
            'units': units,
            'price_per_unit': price,
            'total_spent': amount
        }
    })


@api_view(['POST'])
def sell_stock(request):
    """Sell units of a stock sector."""
    session_id = request.data.get('session_id')
    sector = request.data.get('sector', '').lower()
    units = request.data.get('units', 0)

    if not session_id:
        return Response({'error': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if sector not in STOCK_SECTORS:
        return Response(
            {'error': f'Invalid sector. Choose from: {", ".join(STOCK_SECTORS)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        units = float(units)
        if units <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return Response({'error': 'Units must be a positive number.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    current_units = session.portfolio.get(sector, 0)
    if units > current_units:
        return Response({'error': f'Insufficient {sector} units. You have {current_units:.2f}'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate sale value at current price
    price = session.market_prices.get(sector, 100)
    sale_value = int(units * price)
    
    # Update portfolio and wealth
    session.wealth += sale_value
    session.portfolio[sector] = current_units - units
    session.save()

    return Response({
        'message': f'Sold {units:.2f} units of {sector.upper()} for ₹{sale_value:,}',
        'session': GameSessionSerializer(session).data,
        'sale': {
            'sector': sector,
            'units': units,
            'price_per_unit': price,
            'total_received': sale_value
        }
    })


@api_view(['GET'])
def market_status(request, session_id):
    """Get current market prices and portfolio value."""
    try:
        session = GameSession.objects.get(id=session_id, is_active=True)
    except GameSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Calculate portfolio value
    portfolio_value = 0
    holdings = []
    for sector in STOCK_SECTORS:
        units = session.portfolio.get(sector, 0)
        price = session.market_prices.get(sector, 100)
        value = int(units * price)
        portfolio_value += value
        holdings.append({
            'sector': sector,
            'units': round(units, 2),
            'current_price': price,
            'value': value
        })

    return Response({
        'market_prices': session.market_prices,
        'portfolio': holdings,
        'total_portfolio_value': portfolio_value,
        'net_worth': session.wealth + portfolio_value
    })
