FROM node:22-slim AS deps
WORKDIR /app

# Install netcat and openssl for database readiness check and Prisma
RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd openssl wget && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install && npx prisma generate

FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npm install
COPY src ./src
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

# Runtime OpenSSL and wget required by Prisma and health check
RUN apt-get update && apt-get install -y --no-install-recommends openssl wget && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/app.js"]
