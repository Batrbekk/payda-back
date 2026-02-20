from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://avtovin:avtovin_secret@localhost:5432/avtovin"
    redis_url: str = "redis://:redis_secret@localhost:6379/0"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 30
    smsc_login: str = "batrbekk"
    smsc_password: str = "Batrbekk031198"
    firebase_credentials_path: str = ""
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
