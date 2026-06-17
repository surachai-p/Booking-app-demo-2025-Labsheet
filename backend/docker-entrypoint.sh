#!/bin/sh
set -e

echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready!"
echo "Attempting to run Prisma migrations..."
npx prisma migrate deploy || {
  echo "Prisma migrations failed, but continuing startup..."
  echo "You may need to run migrations manually:"
  echo "  docker compose exec backend npx prisma migrate deploy"
}

echo "Starting application..."
exec npm start
