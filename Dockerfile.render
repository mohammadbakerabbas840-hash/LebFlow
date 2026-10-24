    '        fastcgi_param HTTPS $fastcgi_https;' \
    '        fastcgi_read_timeout 95s;' \
    '    }' \
    '    location ~ /\. { deny all; }' \
    '    location ~ \.php$ { return 404; }' \
    '}' > /etc/nginx/conf.d/default.conf
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

# Prepare Laravel and start Supervisor
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'cd /var/www/html' \
    'mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache database' \
    'touch database/database.sqlite' \
    'chown -R www-data:www-data storage bootstrap/cache database' \
    'chmod -R ug+rwX storage bootstrap/cache database' \
    'php artisan config:clear' \
    'php artisan view:clear' \
    'exec supervisord -n -c /etc/supervisor/supervisord.conf' \
    > /usr/local/bin/start-lebflow \
    && chmod +x /usr/local/bin/start-lebflow

EXPOSE 8080
CMD ["/usr/local/bin/start-lebflow"]
