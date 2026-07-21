const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const targetUploadFile = `export async function uploadFileToFirebase(
  originalFile: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions
): Promise<string> {
  // Compress image if applicable
  const file = await compressImage(originalFile);

  // 1. Initial Validations
  if (!file) {
    const errorMsg = 'لم يتم تحديد أي ملف للرفع.';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // File size validation (default: 500MB max)
  const maxLimit = options?.maxSizeBytes || 500 * 1024 * 1024; // 500 MB
  if (file.size > maxLimit) {
    const sizeInMB = (maxLimit / (1024 * 1024)).toFixed(0);
    const errorMsg = \`حجم الملف كبير جداً. الحد الأقصى المسموح به هو \${sizeInMB} ميجابايت.\`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // File type validation if specified
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      const errorMsg = 'نوع الملف المختار غير مدعوم.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 2. Perform upload to local /api/upload using XMLHttpRequest for progress
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        // Keep it at max 99.9% until finished and url is returned
        onProgress(Math.min(progress, 99.9));
      } else {
        onProgress(50);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          onProgress(100);
          resolve(response.url);
        } catch (e) {
          console.error('Failed to parse upload response:', e);
          reject(new Error('استجابة غير صالحة من الخادم أثناء الرفع.'));
        }
      } else {
        console.error('Server upload failed with status:', xhr.status, xhr.responseText);
        reject(new Error(\`فشل الرفع من الخادم: رمز الحالة \${xhr.status}\`));
      }
    };

    xhr.onerror = () => {
      console.error('XHR Network error during upload');
      reject(new Error('حدث خطأ في الاتصال بالشبكة أثناء رفع الملف.'));
    };

    xhr.send(formData);
  });
}`;

const replacementUploadFile = `import { storage } from './firebase';

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
    const errorMsg = \`حجم الملف كبير جداً. الحد الأقصى هو \${sizeInMB} ميجابايت.\`;
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
      const fileName = \`uploads/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExtension}\`;
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
              reject(new Error(\`فشل الرفع من الخادم: رمز الحالة \${xhr.status}\`));
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
}`;

code = code.replace(targetUploadFile, replacementUploadFile);
fs.writeFileSync('src/lib/upload.ts', code);
