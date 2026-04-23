# ── Stage 1: Dependencies ─────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache python3 py3-pip
RUN pip install --break-system-packages edge-tts

WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install --production 2>/dev/null || bun install --production

# ── Stage 2: Build ───────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install 2>/dev/null || bun install

COPY prisma ./prisma/
RUN npx prisma generate 2>/dev/null || bunx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build 2>/dev/null || bun run build

# ── Stage 3: Production ──────────────────────────────────
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

# Prisma - client, CLI binary, and engine for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Create symlink for prisma binary
RUN ln -sf ../prisma/build/index.js /app/node_modules/.bin/prisma 2>/dev/null; \
    chmod +x /app/node_modules/prisma/build/index.js 2>/dev/null; \
    true

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
