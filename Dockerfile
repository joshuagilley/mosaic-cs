# Build stage for Next.js
FROM node:20-alpine AS nextjs-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final stage
FROM python:3.11-slim
WORKDIR /app

# Install Node.js and npm
RUN apt-get update && apt-get install -y nodejs npm supervisor && rm -rf /var/lib/apt/lists/*

# Copy Next.js build
COPY --from=nextjs-builder /app/.next ./.next
COPY --from=nextjs-builder /app/node_modules ./node_modules
COPY --from=nextjs-builder /app/package.json ./package.json
COPY --from=nextjs-builder /app/public ./public
COPY --from=nextjs-builder /app/app ./app
COPY --from=nextjs-builder /app/next.config.js ./next.config.js

# Copy FastAPI
COPY api ./api

# Install Python dependencies
RUN pip install --no-cache-dir -r api/requirements.txt

# Create supervisor config
RUN echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nextjs]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=npm start' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:fastapi]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=uvicorn api.main:app --host 0.0.0.0 --port 8000' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000 8000

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
