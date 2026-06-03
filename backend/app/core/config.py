from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Share Platform"
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:Fzh123456@127.0.0.1:5432/share_platform"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 8
    admin_email: str = "2404646712@qq.com"
    smtp_host: str = "localhost"
    smtp_port: int = 25
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_sender: str = "noreply@example.com"
    smtp_use_tls: bool = False
    smtp_suppress_send: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def log_safe_dict(self) -> dict[str, object]:
        data = self.model_dump()
        data["jwt_secret_key"] = "***" if self.jwt_secret_key else ""
        data["smtp_password"] = "***" if self.smtp_password else ""
        data["smtp_password_configured"] = bool(self.smtp_password)
        return data


@lru_cache
def get_settings() -> Settings:
    return Settings()
