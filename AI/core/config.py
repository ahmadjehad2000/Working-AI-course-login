"""
core/config.py - Smart Configuration Management
Purpose: Centralized config with validation and environment handling
Location: ai_course_pro/core/config.py
"""
from pydantic_settings import BaseSettings
from typing import Optional
import logging

class Settings(BaseSettings):
    """Smart configuration with validation"""
    
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_timeout: int = 60
    max_tokens: int = 4000
    
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "ai_course_pro"
    
    # App
    app_name: str = "AI Course Pro"
    debug: bool = False
    log_level: str = "INFO"
    
    # Performance
    cache_enabled: bool = True
    max_cache_size: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)
logger.info(f"🚀 {settings.app_name} initialized - Model: {settings.openai_model}")