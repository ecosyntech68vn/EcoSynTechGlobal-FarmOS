# EcoSynTech IoT Backend - Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init tini

COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/data && \
    chown -R node:node /app && \
    chmod +x /app/scripts/*.js 2>/dev/null || true

USER node

EXPOSE 3000 1883 8884

ENV NODE_ENV=production
ENV PORT=3000
ENV MQTT_PORT=1883
ENV MQTT_WS_PORT=8884

VOLUME [ "/app/data" ]

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
