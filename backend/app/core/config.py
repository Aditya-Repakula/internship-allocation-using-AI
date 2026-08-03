from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5
    APP_NAME: str = "Smart Internship Allocation System"
    COMPANY_NAME: str = "Smart Internship Company"
    DEBUG: bool = True

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
