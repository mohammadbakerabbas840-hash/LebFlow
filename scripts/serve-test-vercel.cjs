// Exercise the deployed rewrites against an isolated Laravel database locally.
// The browser uses localhost; the upstream sees 127.0.0.1, as with a remote proxy.
const { preview } = require('vite');
const config = require('../vercel.json');

const proxy = Object.fromEntries(config.rewrites
  .filter(route => route.destination.startsWith('https://'))
  .map(route => {
    const prefix = route.source.replace('/:path*', '');
    const destination = new URL(route.destination);
    if (destination.hostname !== 'lebflow-backend.onrender.com')
      throw new Error('Unexpected upstream in Vercel configuration.');
    return [prefix, {
      target: 'http://127.0.0.1:8010',
      changeOrigin: true,
      rewrite: path => destination.pathname.replace('/:path*', '') + path.slice(prefix.length),
      configure: server => server.on('proxyRes', response => {
        for (const header of config.headers.find(rule => rule.source === route.source)?.headers ?? [])
          response.headers[header.key.toLowerCase()] = header.value;
      }),
    }];
  }));

preview({
  configFile: false,
  base: '/',
  preview: { host: 'localhost', port: 4174, strictPort: true, proxy },
}).catch(error => { console.error(error); process.exitCode = 1; });
