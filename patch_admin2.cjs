const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(/<div className="grid grid-cols-2 gap-4">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">');

fs.writeFileSync('src/components/AdminPanel.tsx', code);
