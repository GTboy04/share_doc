# Infra Notes

## Start services

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Initialize first admin

```bash
docker compose -f infra/docker-compose.yml exec backend python scripts/init_admin.py --username admin --password password123
```

## Run migrations manually

```bash
docker compose -f infra/docker-compose.yml exec backend alembic upgrade head
```
