const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(/                <\/div>\n              \)}/g, '                </div>');

fs.writeFileSync('src/components/LandingPage.tsx', code);
