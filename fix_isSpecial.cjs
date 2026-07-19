const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  /                        <\/span>\n                                    <\/div>/g,
  '                        </span>\n                      )}\n                    </div>'
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
