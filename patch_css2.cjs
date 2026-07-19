const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const newCSS = `
@media (max-width: 768px) {
  button, 
  select, 
  input[type="text"], 
  input[type="email"], 
  input[type="password"], 
  input[type="number"], 
  input[type="tel"], 
  input[type="search"] {
    min-height: 44px;
  }
  
  /* Ensure padding and margins are reduced on small screens */
  .container {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
}
`;

code = code.replace("/* Print Styles */", newCSS + "\n/* Print Styles */");

fs.writeFileSync('src/index.css', code);
