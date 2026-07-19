const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  /                  \{settings\.logoChar\}\n                <\/div>\n                      <span/g,
  '                  {settings.logoChar}\n                </div>\n              )}\n                      <span'
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
