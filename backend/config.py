from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # iTOP API connection
    itop_url: str = "https://localhost/itop/webservices/rest.php"
    itop_version: str = "1.4"
    itop_user: str = ""
    itop_password: str = ""

    # Your identity
    agent_id: int = 0
    agent_name: str = "Vos"
    team_id: int = 0

    # WIP limits
    wip_max_per_agent: int = 6

    # Backend
    host: str = "0.0.0.0"
    port: int = 8000
    refresh_interval_seconds: int = 30


settings = Settings()
