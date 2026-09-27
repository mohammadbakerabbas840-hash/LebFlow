const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist');
const destination = path.join(root, 'LebFlow/public');
if (!fs.existsSync(path.join(source, 'index.html'))) throw new Error('Build the API frontend first.');
// Copy only generated frontend files; never replace Laravel's index.php or .htaccess.
fs.cpSync(path.join(source, 'assets'), path.join(destination, 'assets'), {recursive:true});
fs.copyFileSync(path.join(source, 'index.html'), path.join(destination, 'index.html'));
console.log('Frontend published to Laravel. Open http://127.0.0.1:8000');
