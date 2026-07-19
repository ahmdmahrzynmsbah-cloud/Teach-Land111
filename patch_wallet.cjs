const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  'className="flex items-center gap-2 bg-gradient-to-r',
  'className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r'
);

code = code.replace(
  'px-3.5 py-1.5 rounded-2xl',
  'px-2 md:px-3.5 py-1 md:py-1.5 rounded-xl md:rounded-2xl'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
