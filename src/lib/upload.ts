import { ref, uploadString, getDownloadURL } from 'firebase/storage';
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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(event.target?.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type, 0.7));
      };
      img.onerror = () => reject(new Error('فشل معالجة الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
  });
}

function uploadViaXhr(
  file: File,
  endpoint: string,
  onProgress: (progress: number) => void,
  timeoutMs = 300000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(Math.round((event.loaded / event.total) * 98), 98);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            onProgress(100);
            resolve(data.url);
            return;
          } else if (data.videoId) {
            onProgress(100);
            resolve(`bunny:${data.videoId}`);
            return;
          }
        } catch (e) {
          reject(new Error('تنسيق استجابة السيرفر غير صحيح'));
          return;
        }
      }
      reject(new Error(`خطأ من السيرفر (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('خطأ في الاتصال بالشبكة أثناء الرفع'));
    xhr.ontimeout = () => reject(new Error('انتهت مهلة طلب الرفع'));

    xhr.timeout = timeoutMs;
    xhr.open('POST', endpoint, true);
    xhr.send(formData);
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

  const maxLimit = options?.maxSizeBytes || 500 * 1024 * 1024;
  if (originalFile.size > maxLimit) {
    const sizeInMB = (maxLimit / (1024 * 1024)).toFixed(0);
    const errorMsg = `حجم الملف كبير جداً. الحد الأقصى هو ${sizeInMB} ميجابايت.`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  onProgress(5);

  // Try direct fast upload first for non-video or files under 50MB
  if (!originalFile.type.startsWith('video/') && originalFile.size <= 50 * 1024 * 1024) {
    try {
      return await uploadViaXhr(originalFile, '/api/upload', onProgress);
    } catch (err) {
      console.warn("Direct upload failed, switching to chunked upload:", err);
    }
  }

  // Fallback or large video files use chunked upload
  return await uploadChunkedFile(originalFile, onProgress, { ...options, bunny: options?.bunny });
}

function uploadChunkViaXhr(
  chunk: Blob,
  fileId: string,
  chunkIndex: number,
  onChunkProgress: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('fileId', fileId);
    formData.append('chunk', chunk, `chunk-${chunkIndex}.bin`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onChunkProgress(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            resolve();
            return;
          }
        } catch (e) {}
      }
      reject(new Error(`فشل رفع جزء الملف رقم ${chunkIndex}`));
    };

    xhr.onerror = () => reject(new Error('خطأ في الشبكة أثناء رفع جزء الملف'));
    xhr.ontimeout = () => reject(new Error('انتهت مهلة رفع جزء الملف'));

    xhr.timeout = 120000; // 2 minutes timeout per chunk
    xhr.open('POST', '/api/upload-chunk', true);
    xhr.send(formData);
  });
}

export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;

  try {
    const chunkSize = 1 * 1024 * 1024; // 1MB chunks for max reliability
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      let chunkSuccess = false;
      let retries = 3;

      while (!chunkSuccess && retries > 0) {
        try {
          await uploadChunkViaXhr(chunk, fileId, i, (loaded, total) => {
            const currentChunkProgress = (loaded / total) * (1 / totalChunks);
            const overallPercent = Math.min(Math.round(((i / totalChunks) + currentChunkProgress) * 90), 92);
            onProgress(overallPercent);
          });
          chunkSuccess = true;
        } catch (err) {
          retries--;
          console.warn(`Chunk ${i} upload error, retrying... (${retries} left)`, err);
          if (retries === 0) throw err;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    onProgress(93);

    const response = await fetch('/api/upload-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        totalChunks,
        originalName: file.name,
        bunny: useBunny,
      }),
    });

    if (!response.ok) {
      throw new Error('Merge request failed');
    }

    const data = await response.json();
    if (data.videoId) {
      onProgress(100);
      return `bunny:${data.videoId}`;
    } else if (data.url) {
      onProgress(100);
      return data.url;
    }

    throw new Error('Invalid merge response');
  } catch (err) {
    console.error("Chunked upload failed:", err);

    // Emergency Fallback for small files (< 10MB): Base64
    if (file.size <= 10 * 1024 * 1024) {
      try {
        console.warn("Attempting emergency base64 upload fallback...");
        return await uploadViaBase64(file, onProgress);
      } catch (e) {
        console.error("Base64 fallback failed:", e);
      }
    }

    throw new Error('فشل رفع الملف. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
  }
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
        const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
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
