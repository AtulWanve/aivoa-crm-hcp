from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str = ""
    database_url: str = "postgresql://user:password@localhost:5432/crm_db"

    class Config:
        env_file = ".env"

settings = Settings()
