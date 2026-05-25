FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev || npm install
RUN npx playwright install --with-deps chromium

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
    libasound2 libatspi2.0-0 libx11-6 libx11-xcb1 libxcb1 \
    libxext6 libxcursor1 libxi6 libxtst6 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /root/.cache/ms-playwright /root/.cache/ms-playwright
COPY . .
RUN mkdir -p /app/logs 2>/dev/null || true
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',(r)=>{r.on('data',()=>{});r.on('end',()=>process.exit(r.statusCode===200?0:1))}).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]