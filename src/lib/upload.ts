import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';
import { toast } from 'react-hot-toast';

export interface UploadOptions {
  allowedTypes?: string[]; // e.g., ['image/png', 'image/jpeg', 'video/mp4']
  maxSizeBytes?: number; // e.g., 100 * 1024 * 1024
}

/**
 * Translates Firebase Storage errors into clear, user-friendly Arabic error messages.
 */
function translateStorageError(code: string): string {
  switch (code) {
    case 'storage/unauthorized':
      return 'ليست لديك الصلاحية لرفع هذا الملف. يرجى التأكد من تسجيل الدخول وإعادة المحاولة.';
    case 'storage/canceled':
      return 'تم إلغاء عملية الرفع من قبل المستخدم.';
    case 'storage/quota-exceeded':
      return 'تم تجاوز المساحة التخزينية المتاحة للمنصة. يرجى التواصل مع الدعم الفني.';
    case 'storage/retry-limit-exceeded':
      return 'انتهت مهلة الاتصال بسبب ضعف شبكة الإنترنت. يرجى التحقق من الاتصال والمحاولة مجدداً.';
    case 'storage/invalid-checksum':
      return 'حدث خطأ أثناء نقل الملف (خطأ في المجموع التدقيقي). يرجى إعادة المحاولة.';
    case 'storage/cannot-slice-blob':
      return 'الملف تالف أو غير مدعوم من المتصفح.';
    case 'storage/server-file-not-found':
      return 'لم يتم العثور على الملف في الخادم.';
    default:
      return 'حدث خطأ غير متوقع أثناء الرفع. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.';
  }
}



/**
 * Compresses an image and returns it as a Base64 string for direct storage.
 */
export async function compressImageToBase64(file: File, maxWidth?: number, maxHeight?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      // If it's not an image (e.g. somehow a PDF), just read as base64 without compression
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

        const MAX_WIDTH = maxWidth || 800; // Smaller max width for base64
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
          resolve(event.target?.result as string); // fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // 0.5 quality keeps it small
        const base64String = canvas.toDataURL('image/jpeg', 0.5);
        resolve(base64String);
      };
      img.onerror = () => reject(new Error('فشل قراءة الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
}

/**
 * Compresses an image file before upload
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file; // Don't compress GIFs
  
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
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7 // quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Unified function to upload files (videos, images, etc.) to the local Express backend with robust error handling and translation.
 */

function uploadViaLocalExpress(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.timeout = 300000; // 5 minutes (300,000 ms) max timeout for large uploads
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const progress = Math.min((event.loaded / event.total) * 100, 99);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response && response.url) {
            onProgress(100);
            resolve(response.url);
            return;
          }
        } catch (e) {
          // invalid JSON (e.g., HTML response from SPA server)
        }
      }
      reject(new Error(`Server upload failed with status ${xhr.status}`));
    };

    xhr.ontimeout = () => {
      reject(new Error('Server upload timed out'));
    };

    xhr.onerror = () => {
      reject(new Error('Network error during local server upload'));
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
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      let hasMadeProgress = false;
      const timeoutTimer = setTimeout(() => {
        if (!hasMadeProgress) {
          try {
            uploadTask.cancel();
          } catch (e) {}
          reject(new Error('Firebase Storage upload connection timed out'));
        }
      }, 8000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          hasMadeProgress = true;
          clearTimeout(timeoutTimer);
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.min(progress, 99));
          }
        },
        (error) => {
          clearTimeout(timeoutTimer);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutTimer);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress(100);
            resolve(downloadURL);
          } catch (e) {
            reject(e);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

function uploadViaBase64(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    onProgress(15);
    const reader = new FileReader();
    
    reader.onload = () => {
      onProgress(100);
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('فشل قراءة الملف كـ Base64'));
    };

    reader.readAsDataURL(file);
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

  // Compress image if applicable
  let file = originalFile;
  if (file.type.startsWith('image/')) {
    try {
      file = await compressImage(originalFile);
    } catch (e) {
      console.warn("Image compression failed, using original:", e);
    }
  }

  // File size validation
  const maxLimit = options?.maxSizeBytes || 500 * 1024 * 1024;
  if (file.size > maxLimit) {
    const sizeInMB = (maxLimit / (1024 * 1024)).toFixed(0);
    const errorMsg = `حجم الملف كبير جداً. الحد الأقصى هو ${sizeInMB} ميجابايت.`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Type validation
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.split('/')[0]);
      }
      return file.type === type;
    });
    if (!isAllowed) {
      const errorMsg = 'نوع الملف المختار غير مدعوم.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 1. Priority: Direct Firebase Storage Upload (Most robust)
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
      formData.append('chunk', chunk, `chunk-${i}.bin`);

      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Chunk ${i} upload failed with status ${response.status}`);
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
  }

  throw new Error('فشل رفع الملف. يرجى التأكد من الاتصال بالشبكة وإعادة المحاولة.');
}

/**
 * Robust, resilient chunked/direct upload with multi-stage fallback
 */
export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;

  // If it's a PDF or non-video document or bunny is false, use direct fast upload
  if (!useBunny || !isVideo) {
    return await uploadFileToFirebase(file, onProgress, options);
  }

  // Stage 1: Express API chunked upload (for large videos / Bunny CDN processing)
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
      formData.append('chunk', chunk, `chunk-${i}.bin`);

      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
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
      return `bunny:${data.videoId}`;
    } else if (data.url) {
      onProgress(100);
      return data.url;
    }
  } catch (serverErr) {
    console.warn('Express chunked video upload failed, trying direct upload fallback...', serverErr);
  }

  // Stage 2: Direct upload fallback
  return await uploadFileToFirebase(file, onProgress, options);
}
