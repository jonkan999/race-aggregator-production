from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple, Optional
import os
import yaml
import PIL.Image

class BaseAIResponse(ABC):
    def __init__(self, config_type: str = 'cheap'):
        self.config = self.load_config(config_type)
        self.api_key = self.load_api_key()
        self._initialize_client()

    @abstractmethod
    def _initialize_client(self):
        """Initialize the specific AI client."""
        pass

    def load_config(self, config_type: str) -> Dict[str, Any]:
        """Load configuration from the appropriate YAML file."""
        config_filename = self._get_config_filename()
        config_path = os.path.join(os.path.dirname(__file__), 'config', config_filename)
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        return config[config_type]

    @abstractmethod
    def _get_config_filename(self) -> str:
        """Return the configuration filename for the specific AI service."""
        pass

    def load_api_key(self) -> str:
        """Load API key from the appropriate credentials file."""
        credentials_filename = self._get_credentials_filename()
        api_key_path = os.path.join(os.path.dirname(__file__), 'keys', credentials_filename)
        with open(api_key_path, 'r') as file:
            credentials = yaml.safe_load(file)
        return credentials['loppkartan_1']['secret_key']

    @abstractmethod
    def _get_credentials_filename(self) -> str:
        """Return the credentials filename for the specific AI service."""
        pass

    @abstractmethod
    def calculate_cost(self, input_tokens: int, output_tokens: int, **kwargs) -> float:
        """Calculate the cost for the API call."""
        pass

    @abstractmethod
    def get_response(self, messages: List[Dict[str, Any]], max_output_tokens: Optional[int] = None) -> Dict[str, Any]:
        """Get a response from the AI model."""
        pass

    @abstractmethod
    def get_vision_response(self, prompt: str, image: PIL.Image, max_output_tokens: Optional[int] = None) -> Dict[str, Any]:
        """Get a vision-based response from the AI model."""
        pass