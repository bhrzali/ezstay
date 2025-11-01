from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str
    USERS: str  # Comma-separated list
    ADMIN_PASSWORD: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    BACKEND_PORT: int = 8000
    
    @property
    def user_list(self) -> List[str]:
        return [u.strip() for u in self.USERS.split(",")]
    
    class Config:
        # Look for .env in project root
        # Path: backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> root
        env_file = Path(__file__).parent.parent.parent.parent / ".env"

settings = Settings()

