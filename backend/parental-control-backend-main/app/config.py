# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://apt_parentctrl_app:Par%40intern_aepttas@dpg-dail4sh5efls73dvr100-a.oregon-postgres.render.com:5432/aepttas_xdr"
    JWT_SECRET_KEY: str = "super_secret_parent_control_key_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()