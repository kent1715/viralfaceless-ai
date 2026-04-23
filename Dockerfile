# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install 2>/dev/null || bun install

COPY prisma ./prisma/
RUN npx prisma generate 2>/dev/null || bunx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build 2>/dev/null || bun run build

# Run prisma db push during build to create initial DB schema
RUN DATABASE_URL=file:/app/data/init.db npx prisma db push --skip-generate 2>/dev/null || echo "Build-time DB init skipped"

# ── Stage 2: Production ──────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache python3 py3-pip dumb-init
RUN pip install --break-system-packages edge-tts

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma client only (for runtime queries)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy schema for reference
COPY --from=builder /app/prisma ./prisma

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy the initialized database from build
COPY --from=builder /app/data/init.db /app/data/prod.db
RUN chown nextjs:nodejs /app/data/prod.db

USER nextjs

EXPOSE 3000

CMD ["dumb-init", "node", "server.js"]
