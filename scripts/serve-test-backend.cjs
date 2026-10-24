const { spawnSync, spawn } = require('node:child_process');
const { resolve } = require('node:path');
const { writeFileSync } = require('node:fs');
const cwd = resolve(__dirname, '../LebFlow');
const database = resolve(cwd, 'database', `browser-test-${Date.now()}.sqlite`);
writeFileSync(database, '');
const env = {...process.env, RAG_VECTOR_ENABLED:'false', OPENAI_API_KEY:'', OPENAI_MODEL:'', XDEBUG_MODE:'off', APP_ENV:'local', APP_URL:'http://127.0.0.1:8010', FRONTEND_URL:process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:8010', DB_CONNECTION:'sqlite', DB_DATABASE:database, IDENTITY_STORAGE_PATH:resolve(cwd,'storage/app/browser-test-identity'), SESSION_DRIVER:'file', SESSION_DOMAIN:'null', SESSION_SECURE_COOKIE:'false', CACHE_STORE:'database', MAIL_MAILER:'array', SANCTUM_STATEFUL_DOMAINS:'127.0.0.1:8010'};
for (const args of [['artisan','migrate','--force','--no-interaction'],['artisan','db:seed','--force','--no-interaction']]) {
  const result = spawnSync('php', args, {cwd,env,stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const server = spawn('php', ['-d','upload_max_filesize=6M','-d','post_max_size=13M','-S','127.0.0.1:8010',resolve(cwd,'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], {cwd:resolve(cwd,'public'),env,stdio:'inherit'});
server.on('exit', code=>process.exit(code ?? 0));
