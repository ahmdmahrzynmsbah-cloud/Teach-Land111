const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  /سجل مجاناً دلوقتي\s*<\/Link>\s*<button/g,
  'سجل مجاناً دلوقتي\n                </Link>\n              )}\n              <button'
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
