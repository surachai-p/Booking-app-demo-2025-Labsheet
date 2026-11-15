# Use Node.js 20 Debian-based for better library compatibility
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install netcat for database readiness check
RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema first for better caching
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nextjs

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application with entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
#CMD ["npm", "start"]