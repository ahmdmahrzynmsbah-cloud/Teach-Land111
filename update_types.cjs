const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('walletBalance?: number;')) {
  code = code.replace(/studentPhone\?: string;/, "studentPhone?: string;\n  walletBalance?: number;");
  fs.writeFileSync('src/types.ts', code);
}
