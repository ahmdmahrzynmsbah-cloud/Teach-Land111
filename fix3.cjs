const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

let lines = code.split('\n');
lines.splice(125, 0, '              )}');

fs.writeFileSync('src/components/LandingPage.tsx', lines.join('\n'));
