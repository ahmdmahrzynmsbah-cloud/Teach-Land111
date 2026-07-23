async function test() {
  const fileId = 'test1234';

  const res = await fetch('http://localhost:3000/api/upload-merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileId,
      totalChunks: 1,
      originalName: 'test.mp4',
      bunny: false
    })
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
test();
