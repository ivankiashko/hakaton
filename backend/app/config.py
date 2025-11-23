from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Настройки приложения"""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True

    # CORS Configuration
    allowed_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:5174"

    # Rate Limiting
    rate_limit_per_minute: int = 60

    # Security
    secret_key: str = "dev-secret-key-change-in-production"

    # Environment
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins(self) -> List[str]:
        """Получить список разрешенных origins"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        """Проверка production окружения"""
        return self.environment.lower() == "production"


settings = Settings()
