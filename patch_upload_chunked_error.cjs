const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const targetStr = `              if (!response.ok) {
                throw new Error(\`Failed to upload chunk \${i}\`);
              }`;

const replacementStr = `              if (!response.ok) {
                let errStr = \`Failed to upload chunk \${i} (Status: \${response.status})\`;
                try {
                  const errorData = await response.json();
                  if (errorData.error) errStr = errorData.error;
                } catch(e) {
                  try {
                    errStr += " - " + await response.text();
                  } catch(e2) {}
                }
                throw new Error(errStr);
              }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/lib/upload.ts', code);
