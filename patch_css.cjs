const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(
  `@layer base {
  body {`,
  `@layer base {
  html, body {
    overflow-x: hidden;
    width: 100%;
  }
  body {`
);

fs.writeFileSync('src/index.css', code);
