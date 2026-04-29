FROM oven/bun:1
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json bun.lock* ./
RUN bun install

# Generate Prisma client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source code
COPY . .

# Build Next.js
RUN bun run build

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

# Start: push schema then run server
CMD ["sh", "-c", "bunx prisma db push && bun run start"]
