const { spawn } = require('node:child_process');
const { resolve } = require('node:path');
const backend = resolve(__dirname, '../LebFlow');
const server = spawn('php', [
  '-d', 'upload_max_filesize=6M', '-d', 'post_max_size=13M',
  '-S', '127.0.0.1:8000',
  resolve(backend, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'),
], {cwd:resolve(backend,'public'),env:{...process.env,XDEBUG_MODE:'off'},stdio:'inherit'});
server.on('error', error=>{console.error(error.message);process.exit(1);});
server.on('exit',code=>process.exit(code ?? 0));
