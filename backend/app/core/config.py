import os
from dotenv import load_dotenv
from functools import lru_cache

# Load environment variables from .env file
load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_NOT_SET")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_NOT_SET")
    # Add other settings if needed
    PROJECT_NAME: str = "FarmGenius Backend"

# Use lru_cache to load settings only once
@lru_cache
def get_settings() -> Settings:
    return Settings()

