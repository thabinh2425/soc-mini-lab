import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from alembic import command
from alembic.config import Config

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_URL = "sqlite:///" + (ROOT / "soc_lab.db").as_posix()


def make_engine(url=None):
    engine = create_engine(url or os.getenv("SOC_DATABASE_URL", DEFAULT_URL),
                           connect_args={"check_same_thread": False, "timeout": 15})
    @event.listens_for(engine, "connect")
    def configure(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    return engine


def migrate(engine):
    config = Config()
    config.set_main_option("script_location", str(ROOT / "migrations"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")


if __name__ == "__main__":
    engine = make_engine()
    migrate(engine)
    engine.dispose()
    print("Database migration complete.")
