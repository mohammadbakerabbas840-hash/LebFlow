
# Stage 1: Build frontend
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
       libpq-dev \
       libzip-dev \
       libicu-dev \
       libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install -j1 \
    pdo_pgsql \
    zip \
    intl \
    mbstring \
    opcache

# Install Composer
COPY --from=composer:2 \
    /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel application
COPY LebFlow/ ./

# Install Laravel dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-progress \
    && mkdir -p \
       storage/framework/cache \
       storage/framework/sessions \
       storage/framework/views \
       storage/logs \
       bootstrap/cache \
    && chown -R www-data:www-data \
       storage bootstrap/cache

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
    '[program:php-fpm]' \
    'command=php-fpm -F' \
    'autorestart=true' \
    '[program:nginx]' \
    'command=nginx -g "daemon off;"' \
    'autorestart=true' \
    > /etc/supervisor/conf.d/lebflow.conf

EXPOSE 8080

CMD ["supervisord", "-n"]
