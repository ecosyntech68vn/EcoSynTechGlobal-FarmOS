FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p logs data && \
    chown -R node:node /app

USER node

EXPOSE 3000

VOLUME ["/app/data", "/app/logs"]

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
