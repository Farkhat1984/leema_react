# Multi-stage build for production-ready React app

# Base stage with dependencies
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    autoconf \
    automake \
    libtool \
    nasm \
    libpng-dev \
    zlib-dev \
    pkgconfig

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Development stage (for hot-reload)
FROM base AS development

# Copy source code (will be overridden by volumes)
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with hot-reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Builder stage (for production build)
FROM base AS builder

# Copy source code
COPY . .

# Build the application (fast build without typecheck)
RUN npm run build:fast

# Production stage (Nginx with static files)
FROM nginx:alpine AS production

# Install certbot for SSL (optional, can be handled externally)
RUN apk add --no-cache certbot certbot-nginx

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-site.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directory for SSL certificates
RUN mkdir -p /etc/letsencrypt

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
