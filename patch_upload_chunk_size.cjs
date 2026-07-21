const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const targetStr = `const chunkSize = 2 * 1024 * 1024; // 2MB chunks`;
const replacementStr = `const chunkSize = 500 * 1024; // 500KB chunks (safe for 1MB limits)`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/lib/upload.ts', code);
