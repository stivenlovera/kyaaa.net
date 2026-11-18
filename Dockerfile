# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Solo las NEXT_PUBLIC_* se necesitan en build: Next las incrusta en el JS del cliente.
# El resto de variables (BD, JWT, S3, PayPal) se inyectan en runtime desde CapRover,
# así no quedan guardadas en la imagen que se sube al registry.
ARG NEXT_PUBLIC_PACKS_URL_S3
ARG NEXT_PUBLIC_STATIC_URL_S3
ARG NEXT_PUBLIC_API_CLIENT_ID
ARG API_SECRET_KEY
ARG API_PAYPAL
ENV NEXT_PUBLIC_PACKS_URL_S3=${NEXT_PUBLIC_PACKS_URL_S3}
ENV NEXT_PUBLIC_STATIC_URL_S3=${NEXT_PUBLIC_STATIC_URL_S3}
ENV NEXT_PUBLIC_API_CLIENT_ID=${NEXT_PUBLIC_API_CLIENT_ID}
ENV API_SECRET_KEY=${API_SECRET_KEY}
ENV API_PAYPAL=${API_PAYPAL}

# prisma.config.ts y src/app/utils/prisma.ts leen DATABASE_URL al cargarse;
# en build basta un valor ficticio (las páginas son force-dynamic, no consultan la BD)
ENV DATABASE_URL=mysql://build:build@localhost:3306/build
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN npx prisma generate

RUN npm run build

# Stage 2: Run (output: 'standalone' en next.config.ts)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 80
ENV PORT=80
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
