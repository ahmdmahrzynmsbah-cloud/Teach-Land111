
import { ref, uploadString, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
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

async function fetchWithTimeout(resource: string, options: any, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
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

  // Fast direct server chunked upload
  return await uploadChunkedFile(originalFile, onProgress, { ...options, bunny: false });
}

export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;

  try {
    // 2MB chunks for fast parallel transmission
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
      formData.append('chunk', chunk, `chunk-${i}.bin`);
      
      let chunkSuccess = false;
      let retries = 3;
      
      while (!chunkSuccess && retries > 0) {
        try {
          const response = await fetchWithTimeout('/api/upload-chunk', {
            method: 'POST',
            body: formData,
          }, 15000); // 15 seconds timeout per chunk
          
          if (!response.ok) {
            throw new Error(`Chunk upload failed: ${response.status}`);
          }
          chunkSuccess = true;
        } catch (err) {
          retries--;
          console.warn(`Chunk ${i} failed, retrying... (${retries} left)`, err);
          if (retries === 0) throw err;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      onProgress(Math.min(Math.round(((i + 1) / totalChunks) * 90), 95));
    }

    const mergeResponse = await fetchWithTimeout('/api/upload-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        totalChunks,
        originalName: file.name,
        bunny: useBunny,
      }),
    }, 60000);

    if (!mergeResponse.ok) {
      throw new Error('Merge failed');
    }

    const data = await mergeResponse.json();
    if (data.videoId) {
      onProgress(100);
      return `bunny:${data.videoId}`;
    } else if (data.url) {
      onProgress(100);
      return data.url;
    }
    
    throw new Error('Invalid response from server');
  } catch (err) {
    console.error("Chunked upload failed:", err);
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
