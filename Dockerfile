# Multi-stage Dockerfile for HTTP Haiku
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Rails backend with frontend assets
FROM ruby:3.4-slim

# Install dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend Gemfile
COPY backend/Gemfile backend/Gemfile.lock ./

# Install gems
RUN bundle install --without development test

# Copy backend application
COPY backend/ ./

# Copy built frontend from stage 1 to Rails public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Precompile assets (if any)
RUN bundle exec rails assets:precompile 2>/dev/null || true

# Expose port
EXPOSE 3000

# Set environment variables
ENV RAILS_ENV=production
ENV RAILS_SERVE_STATIC_FILES=true
ENV RAILS_LOG_TO_STDOUT=true

# Create a script to run migrations and start server
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running database migrations..."\n\
bundle exec rails db:migrate 2>/dev/null || echo "Migrations skipped"\n\
echo "Starting Rails server..."\n\
bundle exec rails server -b 0.0.0.0' > /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Start server
CMD ["/app/docker-entrypoint.sh"]
