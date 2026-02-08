# Multi-stage Dockerfile: Build frontend, then run backend
# Uses Node 20 (required for AWS SDK; latest LTS)

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

# Build React app
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install --only=production

# Copy entire project
WORKDIR /app
COPY . .

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Use unprivileged user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port (Render will override if needed)
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start backend via npm script
CMD ["npm", "start"]

