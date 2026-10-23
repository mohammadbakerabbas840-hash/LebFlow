
FROM node:22-bookworm-slim AS frontend

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:api


FROM php:8.5-fpm-bookworm

RUN apt-get update && apt-get install -y \
    nginx supervisor git unzip \
    libpq-dev libzip-dev libicu-dev libonig-dev \
    && docker-php-ext-install \
    pdo_pgsql zip intl mbstring opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY LebFlow/ ./

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    && mkdir -p \
       storage/framework/cache \
       storage/framework/sessions \
       storage/framework/views \
       storage/logs \
       bootstrap/cache \
    && chown -R www-data:www-data \
       storage bootstrap/cache

COPY --from=frontend /build/dist/ /var/www/html/public/

RUN rm -f \
    /etc/nginx/conf.d/default.conf \
    /etc/nginx/sites-enabled/default

RUN printf '%s\n' \
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
    '        fastcgi_param HTTPS $http_x_forwarded_proto;' \
    '        fastcgi_read_timeout 95s;' \
    '    }' \
    '    location ~ /\. { deny all; }' \
    '    location ~ \.php$ { return 404; }' \
    '}' > /etc/nginx/conf.d/default.conf

RUN nginx -t

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
