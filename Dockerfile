FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* pnpm-lock.yaml* bun.lockb* ./
RUN npm ci --legacy-peer-deps || true

# Copy source and build
COPY . .
RUN npm run build

# Use a simple Node runtime stage (no nginx)
FROM node:18-alpine
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy the simple proxy server
COPY server.js ./server.js

# Install express and http-proxy-middleware for the proxy server
RUN npm install express http-proxy-middleware

EXPOSE 3000
# Run the proxy server that serves static files and proxies API calls
CMD ["node", "server.js"]
