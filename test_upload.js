const fs = require('fs');
const path = require('path');

// generate dummy 1MB pdf
const fakePdf = Buffer.alloc(1024 * 1024, 'a');
fs.writeFileSync('test.pdf', fakePdf);

(async () => {
  const FormData = (await import('formdata-node')).FormData;
  const { fileFromSync } = await import('fetch-blob/from.js');
  
  const fd = new FormData();
  fd.append('file', fileFromSync('test.pdf'));

  const fetch = (await import('node-fetch')).default;
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: fd
  });

  const text = await res.text();
  console.log(res.status, text);
})();
