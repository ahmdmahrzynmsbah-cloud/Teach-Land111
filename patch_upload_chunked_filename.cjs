const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const targetStr = `        formData.append('chunk', chunk);`;
const replacementStr = `        formData.append('chunk', chunk, \`chunk-\${i}.bin\`);`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/lib/upload.ts', code);
