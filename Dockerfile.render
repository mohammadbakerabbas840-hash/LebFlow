
# Stage 1: Build React frontend
FROM node:22-bookworm-slim AS frontend

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:api


# Stage 2: Laravel + Nginx
FROM php:8.4-fpm-bookworm

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       nginx \
       supervisor \
       git \
       unzip \
       libsqlite3-dev \
       libzip-dev \
       libicu-dev \
       libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install -j1 \
    pdo_sqlite \
    zip \
    intl \
    mbstring

# Verify SQLite support
RUN php -r "if (!extension_loaded('pdo_sqlite')) exit(1);"

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel application
COPY LebFlow/ ./

# Install Laravel dependencies and prepare directories
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-progress \
    && mkdir -p \
       storage/framework/cache/data \
       storage/framework/sessions \
       storage/framework/views \
       storage/logs \
       bootstrap/cache \
       database \
    && touch database/database.sqlite \
    && chown -R www-data:www-data \
       storage bootstrap/cache database \
    && chmod -R ug+rwX \
       storage bootstrap/cache database

# Copy compiled frontend assets
COPY --from=frontend /build/dist/ /var/www/html/public/

# Remove default Nginx configurations
RUN rm -f \
    /etc/nginx/conf.d/default.conf \
    /etc/nginx/sites-enabled/default

# Configure Nginx
RUN printf '%s\n' \
    'map $http_x_forwarded_proto $fastcgi_https {' \
    '    default off;' \
    '    https on;' \
    '}' \
    'server {' \
    '    listen 8080;' \
    '    server_tokens off;' \
    '    root /var/www/html/public;' \
    '    index index.php;' \
    '    client_max_body_size 13m;' \
    '    add_header X-Content-Type-Options nosniff always;' \
    '    add_header X-Frame-Options DENY always;' \
    '    location / {' \
    '        try_files $uri $uri/ /index.php?$query_string;' \
    '    }' \
    '    location = /index.php {' \
    '        include fastcgi_params;' \
    '        fastcgi_pass 127.0.0.1:9000;' \
    '        fastcgi_param SCRIPT_FILENAME /var/www/html/public/index.php;' \
    '        fastcgi_param HTTPS $fastcgi_https;' \
    '        fastcgi_read_timeout 95s;' \
    '    }' \
    '    location ~ /\. { deny all; }' \
    '    location ~ \.php$ { return 404; }' \
    '}' > /etc/nginx/conf.d/default.conf

# Verify Nginx configuration
RUN nginx -t

# Configure Supervisor
RUN printf '%s\n' \
    '[supervisord]' \
    'nodaemon=true' \
    'user=root' \
    'logfile=/dev/null' \
    'logfile_maxbytes=0' \
    '[program:php-fpm]' \
    'command=php-fpm -F' \
    'autorestart=true' \
    'stdout_logfile=/dev/stdout' \
    'stdout_logfile_maxbytes=0' \
    'stderr_logfile=/dev/stderr' \
    'stderr_logfile_maxbytes=0' \
    '[program:nginx]' \
    'command=nginx -g "daemon off;"' \
    'autorestart=true' \
    'stdout_logfile=/dev/stdout' \
    'stdout_logfile_maxbytes=0' \
    'stderr_logfile=/dev/stderr' \
    'stderr_logfile_maxbytes=0' \
    > /etc/supervisor/conf.d/lebflow.conf

# Create startup script
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'cd /var/www/html' \
    'mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache database' \
    'touch database/database.sqlite' \
    'chown -R www-data:www-data storage bootstrap/cache database' \
    'chmod -R ug+rwX storage bootstrap/cache database' \
    'php artisan config:clear' \
    'php artisan migrate --force' \
    'php artisan db:seed --force' \
    'php artisan view:clear' \
    'exec supervisord -n -c /etc/supervisor/supervisord.conf' \
    > /usr/local/bin/start-lebflow \
    && chmod +x /usr/local/bin/start-lebflow

EXPOSE 8080

CMD ["/usr/local/bin/start-lebflow"]
