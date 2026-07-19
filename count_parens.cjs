const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
let open = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let c of line) {
    if (c === '(') open++;
    else if (c === ')') open--;
  }
  console.log(`Line ${i+1}: open = ${open} ` + line.substring(0, 30));
}
