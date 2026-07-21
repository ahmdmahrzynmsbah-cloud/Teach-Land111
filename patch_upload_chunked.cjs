const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const targetChunkedFile = `export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;
  
  return new Promise(async (resolve, reject) => {
    try {
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      const fileId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunkIndex', i.toString());
        formData.append('fileId', fileId);
        formData.append('chunk', chunk);

        const response = await fetch('/api/upload-chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || \`Failed to upload chunk \${i}\`);
        }

        // Calculate overall progress based on chunks + some space for merge/bunny upload
        // Let's allocate 90% for chunking and 10% for the final merge & bunny upload
        const chunkProgress = ((i + 1) / totalChunks) * 90;
        onProgress(chunkProgress);
      }

      const mergeResponse = await fetch('/api/upload-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          totalChunks,
          originalName: file.name,
          bunny: useBunny,
        }),
      });

      if (!mergeResponse.ok) {
        const errorData = await mergeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to merge chunks');
      }

      const data = await mergeResponse.json();
      
      if (data.videoId) {
         onProgress(100);
         resolve(\`bunny:\${data.videoId}\`);
      } else if (data.url) {
         onProgress(100);
         resolve(data.url);
      } else {
         reject(new Error('Unknown response format'));
      }
    } catch (error) {
      reject(error);
    }
  });
}`;

const replacementChunkedFile = `export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;
  
  return new Promise(async (resolve, reject) => {
    try {
      // First try Firebase Storage (best for static hosting environments)
      const fileExtension = file.name.split('.').pop();
      const fileName = \`uploads/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExtension}\`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.min(progress, 99));
        }, 
        async (error) => {
          console.warn("Firebase Storage failed for chunked upload, falling back to local Express server:", error);
          // Fallback to Express backend (if running in full-stack mode)
          try {
            const chunkSize = 2 * 1024 * 1024; // 2MB chunks
            const totalChunks = Math.ceil(file.size / chunkSize);
            const fileId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);

            for (let i = 0; i < totalChunks; i++) {
              const start = i * chunkSize;
              const end = Math.min(start + chunkSize, file.size);
              const chunk = file.slice(start, end);
              
              const formData = new FormData();
              formData.append('chunkIndex', i.toString());
              formData.append('fileId', fileId);
              formData.append('chunk', chunk);

              const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error(\`Failed to upload chunk \${i}\`);
              }
              const chunkProgress = ((i + 1) / totalChunks) * 90;
              onProgress(chunkProgress);
            }

            const mergeResponse = await fetch('/api/upload-merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileId,
                totalChunks,
                originalName: file.name,
                bunny: useBunny,
              }),
            });

            if (!mergeResponse.ok) {
              throw new Error('Failed to merge chunks');
            }

            const data = await mergeResponse.json();
            
            if (data.videoId) {
              onProgress(100);
              resolve(\`bunny:\${data.videoId}\`);
            } else if (data.url) {
              onProgress(100);
              resolve(data.url);
            } else {
              reject(new Error('Unknown response format'));
            }
          } catch (fallbackError) {
             reject(fallbackError);
          }
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress(100);
            resolve(downloadURL);
          } catch (e: any) {
            reject(new Error('فشل الحصول على رابط الملف من Firebase: ' + e.message));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}`;

code = code.replace(targetChunkedFile, replacementChunkedFile);
fs.writeFileSync('src/lib/upload.ts', code);
