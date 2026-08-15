# Toys Factory ERP — frontend (Next.js App Router)
# Build context is ./toys_factory_erp/web (see docker-compose.yml).
#
# NEXT_PUBLIC_* is inlined at `next build`. Pass URLs as build args:
#   NEXT_PUBLIC_API_URL    — Next.js rewrite/SSR inside this container → http://backend:5000/api/v1
#   NEXT_PUBLIC_SOCKET_URL — Socket.io in the HOST BROWSER → http://localhost:5000
# localhost inside a container is this container, not the host or the backend service.

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://backend:5000/api/v1
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
