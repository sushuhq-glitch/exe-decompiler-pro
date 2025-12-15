"""
Conversation States for Telegram Bot
=====================================

This module defines all conversation states used in the bot's
conversation flow for project creation and management.

States follow a logical flow:
1. Start -> New Project
2. URL Input
3. Website Analysis
4. Credentials Input
5. Credential Validation
6. API Discovery
7. Checker Generation
8. Complete

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from enum import IntEnum, auto
from typing import Dict, List, Any


class ConversationStates(IntEnum):
    """
    Enumeration of all conversation states.
    
    These states are used by the ConversationHandler to manage
    the flow of user interactions through the bot.
    """
    
    # Initial states
    START = auto()
    MAIN_MENU = auto()
    
    # Project creation flow
    WAITING_URL = auto()
    ANALYZING_WEBSITE = auto()
    WAITING_CREDENTIALS = auto()
    VALIDATING_CREDENTIALS = auto()
    DISCOVERING_APIS = auto()
    GENERATING_CHECKER = auto()
    COMPLETE = auto()
    
    # Settings and configuration
    SETTINGS_MENU = auto()
    LANGUAGE_SELECTION = auto()
    PROXY_CONFIGURATION = auto()
    
    # Project management
    PROJECT_LIST = auto()
    PROJECT_DETAIL = auto()
    PROJECT_EDIT = auto()
    PROJECT_DELETE = auto()
    
    # Advanced features
    CUSTOM_ENDPOINT_INPUT = auto()
    CUSTOM_HEADER_INPUT = auto()
    CUSTOM_PAYLOAD_INPUT = auto()
    
    # Error and recovery states
    ERROR_STATE = auto()
    RETRY_STATE = auto()
    CANCEL_STATE = auto()


class StateMetadata:
    """
    Metadata and helper information for conversation states.
    
    This class provides descriptions, expected inputs, and validation
    rules for each conversation state.
    """
    
    STATE_DESCRIPTIONS: Dict[ConversationStates, str] = {
        ConversationStates.START: "Initial bot start",
        ConversationStates.MAIN_MENU: "Main menu display",
        ConversationStates.WAITING_URL: "Waiting for website URL input",
        ConversationStates.ANALYZING_WEBSITE: "Analyzing website structure",
        ConversationStates.WAITING_CREDENTIALS: "Waiting for valid credentials",
        ConversationStates.VALIDATING_CREDENTIALS: "Validating credentials with API",
        ConversationStates.DISCOVERING_APIS: "Discovering API endpoints",
        ConversationStates.GENERATING_CHECKER: "Generating Python checker",
        ConversationStates.COMPLETE: "Process completed successfully"
    }
    
    STATE_EMOJIS: Dict[ConversationStates, str] = {
        ConversationStates.START: "🚀",
        ConversationStates.MAIN_MENU: "📋",
        ConversationStates.WAITING_URL: "🌐",
        ConversationStates.ANALYZING_WEBSITE: "🔍",
        ConversationStates.WAITING_CREDENTIALS: "🔐",
        ConversationStates.VALIDATING_CREDENTIALS: "✅",
        ConversationStates.DISCOVERING_APIS: "📡",
        ConversationStates.GENERATING_CHECKER: "⚙️",
        ConversationStates.COMPLETE: "🎉"
    }
    
    @classmethod
    def get_description(cls, state: ConversationStates) -> str:
        """Get human-readable description for a state."""
        return cls.STATE_DESCRIPTIONS.get(state, "Unknown state")
    
    @classmethod
    def get_emoji(cls, state: ConversationStates) -> str:
        """Get emoji for a state."""
        return cls.STATE_EMOJIS.get(state, "❓")
    
    @classmethod
    def get_progress_percentage(cls, state: ConversationStates) -> int:
        """Get progress percentage for a state."""
        progress_map = {
            ConversationStates.START: 0,
            ConversationStates.MAIN_MENU: 0,
            ConversationStates.WAITING_URL: 10,
            ConversationStates.ANALYZING_WEBSITE: 30,
            ConversationStates.WAITING_CREDENTIALS: 40,
            ConversationStates.VALIDATING_CREDENTIALS: 50,
            ConversationStates.DISCOVERING_APIS: 70,
            ConversationStates.GENERATING_CHECKER: 90,
            ConversationStates.COMPLETE: 100
        }
        return progress_map.get(state, 0)


class StateTransitions:
    """
    Defines valid state transitions and their conditions.
    
    This class helps validate that state transitions are valid and
    provides logic for determining the next state based on conditions.
    """
    
    # Valid transitions: current_state -> [possible_next_states]
    VALID_TRANSITIONS: Dict[ConversationStates, List[ConversationStates]] = {
        ConversationStates.START: [
            ConversationStates.MAIN_MENU
        ],
        ConversationStates.MAIN_MENU: [
            ConversationStates.WAITING_URL,
            ConversationStates.PROJECT_LIST,
            ConversationStates.SETTINGS_MENU
        ],
        ConversationStates.WAITING_URL: [
            ConversationStates.ANALYZING_WEBSITE,
            ConversationStates.ERROR_STATE,
            ConversationStates.CANCEL_STATE
        ],
        ConversationStates.ANALYZING_WEBSITE: [
            ConversationStates.WAITING_CREDENTIALS,
            ConversationStates.ERROR_STATE,
            ConversationStates.RETRY_STATE
        ],
        ConversationStates.WAITING_CREDENTIALS: [
            ConversationStates.VALIDATING_CREDENTIALS,
            ConversationStates.ERROR_STATE,
            ConversationStates.CANCEL_STATE
        ],
        ConversationStates.VALIDATING_CREDENTIALS: [
            ConversationStates.DISCOVERING_APIS,
            ConversationStates.ERROR_STATE,
            ConversationStates.WAITING_CREDENTIALS  # Retry with new credentials
        ],
        ConversationStates.DISCOVERING_APIS: [
            ConversationStates.GENERATING_CHECKER,
            ConversationStates.CUSTOM_ENDPOINT_INPUT,
            ConversationStates.ERROR_STATE
        ],
        ConversationStates.GENERATING_CHECKER: [
            ConversationStates.COMPLETE,
            ConversationStates.ERROR_STATE
        ],
        ConversationStates.COMPLETE: [
            ConversationStates.MAIN_MENU,
            ConversationStates.PROJECT_LIST
        ]
    }
    
    @classmethod
    def is_valid_transition(
        cls,
        from_state: ConversationStates,
        to_state: ConversationStates
    ) -> bool:
        """
        Check if a state transition is valid.
        
        Args:
            from_state: Current state
            to_state: Target state
            
        Returns:
            True if transition is valid, False otherwise
        """
        valid_next_states = cls.VALID_TRANSITIONS.get(from_state, [])
        return to_state in valid_next_states
    
    @classmethod
    def get_next_states(cls, current_state: ConversationStates) -> List[ConversationStates]:
        """
        Get list of possible next states from current state.
        
        Args:
            current_state: Current conversation state
            
        Returns:
            List of possible next states
        """
        return cls.VALID_TRANSITIONS.get(current_state, [])


class StateContext:
    """
    Context manager for conversation state.
    
    Provides utility methods for managing state data and transitions.
    """
    
    def __init__(self):
        """Initialize state context."""
        self.current_state: Optional[ConversationStates] = None
        self.state_data: Dict[str, Any] = {}
        self.state_history: List[ConversationStates] = []
    
    def transition_to(self, new_state: ConversationStates) -> bool:
        """
        Transition to a new state.
        
        Args:
            new_state: Target state
            
        Returns:
            True if transition successful, False otherwise
        """
        if self.current_state is None or StateTransitions.is_valid_transition(
            self.current_state, new_state
        ):
            if self.current_state:
                self.state_history.append(self.current_state)
            self.current_state = new_state
            return True
        return False
    
    def go_back(self) -> Optional[ConversationStates]:
        """
        Go back to previous state.
        
        Returns:
            Previous state or None if no history
        """
        if self.state_history:
            self.current_state = self.state_history.pop()
            return self.current_state
        return None
    
    def reset(self) -> None:
        """Reset state context."""
        self.current_state = None
        self.state_data.clear()
        self.state_history.clear()
    
    def set_data(self, key: str, value: Any) -> None:
        """Set state data."""
        self.state_data[key] = value
    
    def get_data(self, key: str, default: Any = None) -> Any:
        """Get state data."""
        return self.state_data.get(key, default)
    
    def get_progress(self) -> int:
        """Get current progress percentage."""
        if self.current_state:
            return StateMetadata.get_progress_percentage(self.current_state)
        return 0


# Export all state-related classes
__all__ = [
    "ConversationStates",
    "StateMetadata",
    "StateTransitions",
    "StateContext"
]
