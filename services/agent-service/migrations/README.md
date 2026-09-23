# Agent Service database migrations

This directory contains the Alembic environment for the Agent Service.

Run migrations from the repository root with:

```powershell
python -m alembic -c services/agent-service/alembic.ini upgrade head
```

The migration URL is resolved from `DATABASE_URL` when set, otherwise from
the `MYSQL_*` environment variables used by the service.
