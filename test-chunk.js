const fs = require('fs');

async function run() {
  const fileId = "test12345";
  const formData = new FormData();
  formData.append('chunkIndex', '0');
  formData.append('fileId', fileId);
  formData.append('chunk', new Blob(['test content']), 'chunk-0.bin');

  const res1 = await fetch('http://localhost:3000/api/upload-chunk', {
    method: 'POST',
    body: formData
  });
  console.log("Chunk:", await res1.json());

  const res2 = await fetch('http://localhost:3000/api/upload-merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      totalChunks: 1,
      originalName: 'test.txt',
      bunny: false
    })
  });
  console.log("Merge:", await res2.json());
}
run();
