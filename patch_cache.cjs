const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });`;

const replacementStr = `    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', code);
