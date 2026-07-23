import fs from 'fs';

const uploadTs = `
import { ref, uploadBytesResumable, getDownloadURL, uploadString } from 'firebase/storage';
import { storage } from './firebase';
import toast from 'react-hot-toast';

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  bunny?: boolean;
}

export async function compressImageToBase64(file: File, maxWidth?: number, maxHeight?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error('فشل قراءة الملف'));
      r.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = maxWidth || 800;
        const MAX_HEIGHT = maxHeight || 800;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type, 0.7));
      };
      img.onerror = () => reject(new Error('فشل معالجة الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
  });
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.8
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export async function uploadFileToFirebase(
  originalFile: File,
  onProgress: (progress: number) => void = () => {},
  options?: UploadOptions
): Promise<string> {
  if (!originalFile) {
    const errorMsg = 'لم يتم تحديد أي ملف للرفع.';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  let file = originalFile;
  if (file.type.startsWith('image/')) {
    try {
      file = await compressImage(originalFile);
    } catch (e) {
      console.warn("Image compression failed, using original:", e);
    }
  }

  const maxLimit = options?.maxSizeBytes || 500 * 1024 * 1024;
  if (file.size > maxLimit) {
    const sizeInMB = (maxLimit / (1024 * 1024)).toFixed(0);
    const errorMsg = \`حجم الملف كبير جداً. الحد الأقصى هو \${sizeInMB} ميجابايت.\`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Use Express direct upload FIRST, it's faster and bypasses Firebase blocking issues
  try {
    const url = await uploadViaLocalExpress(file, onProgress);
    if (url) return url;
  } catch (err) {
    console.warn("Express upload failed, falling back to Firebase SDK...", err);
  }

  // Fallback to Firebase SDK directly
  try {
    const url = await uploadViaFirebase(file, onProgress);
    if (url) return url;
  } catch (err) {
    console.warn("Firebase SDK upload failed, falling back to Base64...", err);
  }

  if (file.size <= 500 * 1024) {
    return await uploadViaBase64(file, onProgress);
  }

  throw new Error('فشل الرفع عبر جميع المحاولات.');
}

export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;

  if (!useBunny || !isVideo) {
    return await uploadFileToFirebase(file, onProgress, options);
  }

  try {
    const chunkSize = 2 * 1024 * 1024;
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
        throw new Error(\`Chunk upload failed: \${response.status}\`);
      }
      
      onProgress(((i + 1) / totalChunks) * 90);
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
      throw new Error('Merge failed');
    }

    const data = await mergeResponse.json();
    if (data.videoId) {
      onProgress(100);
      return \`bunny:\${data.videoId}\`;
    } else if (data.url) {
      onProgress(100);
      return data.url;
    }
  } catch (err) {
    console.error("Chunked upload failed:", err);
  }
  
  // Fallback to normal upload
  return await uploadFileToFirebase(file, onProgress, options);
}

function uploadViaLocalExpress(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.timeout = 300000;

    let lastProgressTime = Date.now();
    let isStalled = false;
    const stallCheckInterval = setInterval(() => {
      if (Date.now() - lastProgressTime > 15000) { // 15s without progress = stalled
        isStalled = true;
        xhr.abort();
        clearInterval(stallCheckInterval);
        reject(new Error("Upload stalled"));
      }
    }, 5000);

    xhr.upload.onprogress = (event) => {
      lastProgressTime = Date.now();
      if (event.lengthComputable && event.total > 0) {
        const progress = Math.min((event.loaded / event.total) * 100, 99);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      clearInterval(stallCheckInterval);
      if (isStalled) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.url) {
            onProgress(100);
            resolve(res.url);
          } else reject(new Error("Invalid response"));
        } catch(e) { reject(e); }
      } else {
        reject(new Error(\`Server error \${xhr.status}\`));
      }
    };
    xhr.onerror = () => {
      clearInterval(stallCheckInterval);
      reject(new Error("Network error"));
    };
    xhr.ontimeout = () => {
      clearInterval(stallCheckInterval);
      reject(new Error("Upload timed out"));
    };
    
    xhr.send(formData);
  });
}

function uploadViaFirebase(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const fileExtension = file.name.split('.').pop() || 'bin';
      const fileName = \`uploads/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExtension}\`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      let lastProgressTime = Date.now();
      let isStalled = false;
      const stallCheckInterval = setInterval(() => {
        if (Date.now() - lastProgressTime > 15000) {
          isStalled = true;
          try { uploadTask.cancel(); } catch(e) {}
          clearInterval(stallCheckInterval);
          reject(new Error("Upload stalled"));
        }
      }, 5000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          lastProgressTime = Date.now();
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.min(progress, 99));
          }
        },
        (error) => {
          clearInterval(stallCheckInterval);
          reject(error);
        },
        async () => {
          clearInterval(stallCheckInterval);
          if (isStalled) return;
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress(100);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function uploadViaBase64(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      onProgress(50);
      try {
        const base64Data = reader.result as string;
        const fileExtension = file.name.split('.').pop() || 'bin';
        const fileName = \`uploads/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExtension}\`;
        const storageRef = ref(storage, fileName);
        await uploadString(storageRef, base64Data, 'data_url');
        onProgress(90);
        const url = await getDownloadURL(storageRef);
        onProgress(100);
        resolve(url);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Base64 read error'));
    reader.readAsDataURL(file);
  });
}
`;

fs.writeFileSync('src/lib/upload.ts', uploadTs);
console.log('patched upload.ts with reliable anti-stall version');
