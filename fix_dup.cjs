const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
code = code.replace(/  const handleDeletePayment = async \(paymentId: string\) => {[\s\S]*?toast\.error\('حدث خطأ أثناء الحذف'\);\n    }\n  };\n\n/, "");
fs.writeFileSync('src/components/AdminPanel.tsx', code);
