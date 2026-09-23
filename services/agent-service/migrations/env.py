from __future__ import annotations

import os
from urllib.parse import quote_plus

from alembic import context
from sqlalchemy import engine_from_config, pool


config = context.config


def _database_url() -> str:
    explicit = os.getenv("DATABASE_URL", "").strip()
    if explicit:
        return explicit
    host = os.getenv("MYSQL_HOST", "127.0.0.1").strip()
    port = os.getenv("MYSQL_PORT", "3306").strip()
    user = quote_plus(os.getenv("MYSQL_USER", "root"))
    password = quote_plus(os.getenv("MYSQL_PASSWORD", ""))
    database = quote_plus(os.getenv("MYSQL_DATABASE", "industry_agent"))
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"


config.set_main_option("sqlalchemy.url", _database_url().replace("%", "%%"))
target_metadata = None


def run_migrations_offline() -> None:
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
