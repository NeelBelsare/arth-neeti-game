# services/__init__.py
# Backward-compatible re-export — all existing imports like
#   from .services import GameEngine
# continue to work unchanged.

from .config import GameEngineConfig, REPORT_PROMPT_TEMPLATE
from .game_service import GameService
from .market_service import MarketService
from .advisor_service import AdvisorService
from .report_service import ReportService


class GameEngine(GameService, MarketService, AdvisorService, ReportService):
    """
    Unified GameEngine facade.

    Inherits all static methods from the four service modules so that
    every existing call site (``GameEngine.start_new_session(...)``,
    ``GameEngine.buy_stock(...)``, etc.) keeps working without any
    import changes.

    Configuration lives in ``GameEngineConfig`` (re-exported as
    ``GameEngine.CONFIG`` below).
    """
    CONFIG = GameEngineConfig.CONFIG
    REPORT_PROMPT_TEMPLATE = REPORT_PROMPT_TEMPLATE
