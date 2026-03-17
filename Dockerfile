FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js pre-renders pages at build time, which triggers Supabase client
# initialization. Provide placeholder values so the build completes.
# Real values are injected at runtime via env_file.
ENV NEXT_PUBLIC_SUPABASE_URL=http://placeholder
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder

RUN npm run build

# --- Production ---
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
