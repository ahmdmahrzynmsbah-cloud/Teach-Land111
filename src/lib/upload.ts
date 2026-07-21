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

import { storage } from './firebase';

export async function uploadFileToFirebase(
  originalFile: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions
): Promise<string> {
  // Compress image if applicable
  const file = await compressImage(originalFile);

  if (!file) {
    const errorMsg = 'لم يتم تحديد أي ملف للرفع.';
    toast.error(errorMsg);
    throw new Error(errorMsg);
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

  // Try Firebase Storage first, if it fails due to CORS or rules, fallback to local Express API
  return new Promise((resolve, reject) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.min(progress, 99));
        }, 
        (error) => {
          console.warn("Firebase Storage Upload Error, falling back to local server:", error);
          // Fallback to local express server
          const formData = new FormData();
          formData.append('file', file);
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload', true);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(Math.min(progress, 99.9));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                onProgress(100);
                resolve(response.url);
              } catch (e) {
                reject(new Error('استجابة غير صالحة من الخادم أثناء الرفع.'));
              }
            } else {
              reject(new Error(`فشل الرفع من الخادم: رمز الحالة ${xhr.status}`));
            }
          };
          xhr.onerror = () => {
            reject(new Error('حدث خطأ في الاتصال بالشبكة أثناء رفع الملف.'));
          };
          xhr.send(formData);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress(100);
            resolve(downloadURL);
          } catch (e: any) {
            reject(new Error('فشل الحصول على رابط الملف: ' + e.message));
          }
        }
      );
    } catch (e: any) {
      reject(new Error('حدث خطأ في عملية الرفع: ' + e.message));
    }
  });
}

/**
 * Backward compatibility wrapper for uploadChunkedFile
 */
export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions & { bunny?: boolean }
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const useBunny = options?.bunny !== undefined ? options.bunny : isVideo;
  
  return new Promise(async (resolve, reject) => {
    try {
      const chunkSize = 500 * 1024; // 500KB chunks (safe for 1MB limits)
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to upload chunk ${i}`);
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
         resolve(`bunny:${data.videoId}`);
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
