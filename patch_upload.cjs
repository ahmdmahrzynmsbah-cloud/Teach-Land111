const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const oldFunc = `export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  
  if (isVideo) {
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
          formData.append('chunk', chunk);
          formData.append('chunkIndex', i.toString());
          formData.append('fileId', fileId);

          const response = await fetch('/api/upload-chunk', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(\`Failed to upload chunk \${i}\`);
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
            bunny: true,
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
  }

  // Determine validation options based on file type for non-videos (images etc)
  const options: UploadOptions = {
    allowedTypes: ['image/*'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB limit for images
  };

  return uploadFileToFirebase(file, onProgress, options);
}`;

const newFunc = `export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  
  if (isVideo) {
    const options: UploadOptions = {
      allowedTypes: ['video/*'],
      maxSizeBytes: 1000 * 1024 * 1024, // 1000MB limit for videos
    };
    return uploadFileToFirebase(file, onProgress, options);
  }

  // Determine validation options based on file type for non-videos (images etc)
  const options: UploadOptions = {
    allowedTypes: ['image/*'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB limit for images
  };

  return uploadFileToFirebase(file, onProgress, options);
}`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/lib/upload.ts', code);
