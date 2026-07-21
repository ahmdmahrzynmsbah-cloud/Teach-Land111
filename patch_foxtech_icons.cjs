const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace('<MessageCircle', '<LucideIcons.MessageCircle');
code = code.replace('<Send', '<LucideIcons.Send');

fs.writeFileSync('src/components/LandingPage.tsx', code);
