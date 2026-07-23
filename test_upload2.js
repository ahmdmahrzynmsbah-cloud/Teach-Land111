async function test() {
  const fileId = 'test1234';
  const chunkData = new Blob([new Uint8Array(500 * 1024).fill(97)], { type: 'application/octet-stream' }); 

  const formData = new FormData();
  formData.append('chunkIndex', '0');
  formData.append('fileId', fileId);
  formData.append('chunk', chunkData, 'chunk-0.bin');

  const res = await fetch('http://localhost:3000/api/upload-chunk', {
    method: 'POST',
    body: formData
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
test();
