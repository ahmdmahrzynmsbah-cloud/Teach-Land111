import fs from 'fs';

const content = fs.readFileSync('src/lib/upload.ts', 'utf8');

const updated = content.replace(
`  // 1. Try direct local Express server upload first
  try {
    const localUrl = await uploadViaLocalExpress(file, onProgress);
    if (localUrl) return localUrl;
  } catch (err) {
    console.warn('Direct Express upload failed, attempting Express chunked upload fallback...', err);
  }

  // 2. Try Express Chunked upload (500KB chunks - highly resilient for large PDFs/videos)
  try {
    const chunkSize = 500 * 1024; // 500KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunkIndex', i.toString());
      formData.append('fileId', fileId);
      formData.append('chunk', chunk, \`chunk-\${i}.bin\`);

      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(\`Chunk \${i} upload failed with status \${response.status}\`);
      }

      onProgress(Math.min(95, Math.round(((i + 1) / totalChunks) * 95)));
    }

    const mergeResponse = await fetch('/api/upload-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        totalChunks,
        originalName: file.name,
        bunny: false,
      }),
    });

    if (mergeResponse.ok) {
      const data = await mergeResponse.json();
      if (data.url) {
        onProgress(100);
        return data.url;
      }
    }
  } catch (chunkErr) {
    console.warn('Chunked upload failed, attempting Firebase Storage fallback...', chunkErr);
  }

  // 3. Try Firebase Storage
  try {
    const firebaseUrl = await uploadViaFirebase(file, onProgress);
    if (firebaseUrl) return firebaseUrl;
  } catch (fbErr) {
    console.warn('Firebase Storage upload failed:', fbErr);
  }

  // 4. Emergency fallback ONLY for small files <= 300KB (e.g., small logo/avatar)
  if (file.size <= 300 * 1024) {
    return await uploadViaBase64(file, onProgress);
  }`,
`  // 1. Priority: Direct Firebase Storage Upload (Most robust)
  try {
    const firebaseUrl = await uploadViaFirebase(file, onProgress);
    if (firebaseUrl) return firebaseUrl;
  } catch (fbErr) {
    console.warn('Firebase Storage upload failed, attempting local server fallback...', fbErr);
  }

  // 2. Try direct local Express server upload
  try {
    const localUrl = await uploadViaLocalExpress(file, onProgress);
    if (localUrl) return localUrl;
  } catch (err) {
    console.warn('Direct Express upload failed, attempting Express chunked upload fallback...', err);
  }

  // 3. Try Express Chunked upload
  try {
    const chunkSize = 500 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunkIndex', i.toString());
      formData.append('fileId', fileId);
      formData.append('chunk', chunk, \`chunk-\${i}.bin\`);

      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(\`Chunk \${i} upload failed with status \${response.status}\`);
      }

      onProgress(Math.min(95, Math.round(((i + 1) / totalChunks) * 95)));
    }

    const mergeResponse = await fetch('/api/upload-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        totalChunks,
        originalName: file.name,
        bunny: false,
      }),
    });

    if (mergeResponse.ok) {
      const data = await mergeResponse.json();
      if (data.url) {
        onProgress(100);
        return data.url;
      }
    }
  } catch (chunkErr) {
    console.warn('Chunked upload failed:', chunkErr);
  }

  // 4. Emergency fallback ONLY for small files <= 300KB
  if (file.size <= 300 * 1024) {
    return await uploadViaBase64(file, onProgress);
  }`
);

fs.writeFileSync('src/lib/upload.ts', updated);
console.log('patched successfully');
