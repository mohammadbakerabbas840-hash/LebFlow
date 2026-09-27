FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build:api

FROM php:8.5-fpm-bookworm AS app
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev libicu-dev libzip-dev libpng-dev unzip clamav tesseract-ocr tesseract-ocr-ara tesseract-ocr-fra \
    && docker-php-ext-install pdo_pgsql intl zip pcntl gd \
    && pecl install redis && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY LebFlow/ ./
RUN mkdir -p storage/app/identity-private storage/app/scan-temp storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod 700 storage/app/identity-private storage/app/scan-temp
COPY --from=frontend /build/dist/ ./public/
COPY deploy/php.ini /usr/local/etc/php/conf.d/lebflow.ini

FROM nginx:stable-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /build/dist/ /var/www/html/public/
