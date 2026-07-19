const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(/student\.points \|\| 0/g, 'student.stars || 0');
code = code.replace(/تجميع النقاط/g, 'تجميع النجوم');
code = code.replace(/points: totalStars/g, 'stars: totalStars');

fs.writeFileSync('src/components/Dashboard.tsx', code);
