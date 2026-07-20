const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// generate dummy 1MB pdf
const fakePdf = Buffer.alloc(1024 * 1024, 'a');
fs.writeFileSync('test.pdf', fakePdf);

try {
  const result = execSync('curl -v -F "file=@test.pdf" http://localhost:3000/api/upload');
  console.log("Output:", result.toString());
} catch(err) {
  console.error("Error:", err.stderr.toString());
}
