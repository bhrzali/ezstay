from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path

def _find_env_file() -> Optional[Path]:
    """Find .env file in common locations"""
    # Check /app/.env first (Docker mount location)
    docker_env = Path("/app/.env")
    if docker_env.exists():
        return docker_env
    
    # Check current directory (for Docker)
    current_dir = Path.cwd() / ".env"
    if current_dir.exists():
        return current_dir
    
    # Check project root (for local development)
    # Path: backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> root
    project_root = Path(__file__).parent.parent.parent.parent / ".env"
    if project_root.exists():
        return project_root
    
    return None

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
        # Environment variables take precedence over .env file
        # pydantic-settings will automatically use environment variables if set
        env_file = str(_find_env_file()) if _find_env_file() else None
        # Ensure env vars are read first (default behavior, but being explicit)
        env_file_encoding = 'utf-8'
        case_sensitive = False

settings = Settings()

