const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules', 'vendor', '.git', '.runtime', '.codex', '.agents', 'storage', 'dist', '.vercel', 'my-laravel-app', 'test-results', 'test-results-backend', 'test-results-pages', 'test-results-vercel', 'playwright-report', 'artifacts']);
const findings = [];
let count = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if ((entry.name.startsWith('.env') && !entry.name.endsWith('.example')) || !/\.(?:php|tsx?|[cm]?js|json|ya?ml|md|example|ini|conf|xml)$/.test(entry.name)) continue;
    if (fs.statSync(file).size > 2 * 1024 * 1024) continue;
    const text = fs.readFileSync(file, 'utf8');
    count++;
    if (/sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}/.test(text)) findings.push(path.relative(root, file));
  }
}
walk(root);
const tracked = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
if (tracked.status === 0) {
  for (const file of tracked.stdout.split('\0').filter(Boolean)) {
    if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.example') || /\.(?:sqlite(?:-wal|-shm)?|pem|key)$/.test(file) || /storage\/(?:app|logs)\/.*[^/]$/.test(file) && !file.endsWith('.gitignore')) findings.push(file);
  }
}
if (findings.length) { console.error('Publication check failed; review these paths (contents withheld):\n' + [...new Set(findings)].join('\n')); process.exitCode = 1; }
else console.log(`Publication check passed for ${count} source/config files. ${tracked.status === 0 ? 'Tracked paths checked.' : 'No Git index yet; rerun after staging.'} This is a limited pattern check, not a complete secret audit.`);
