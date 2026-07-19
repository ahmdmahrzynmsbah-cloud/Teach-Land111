const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const oldUploadFunc = `export async function uploadFileToFirebase(
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
  
  // 2. Perform Resumable/Progress Upload to Firebase Storage
  return new Promise((resolve, reject) => {
    if (!auth.currentUser) {
      const errorMsg = 'يجب تسجيل الدخول لرفع الملفات.';
      toast.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    // Sanitize file name to avoid invalid characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const extension = sanitizedName.split('.').pop() || '';
    const baseName = sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) || sanitizedName;
    const uniqueFileName = \`\${baseName}_\${Date.now()}.\${extension}\`;
    const filePath = \`uploads/\${auth.currentUser.uid}/\${uniqueFileName}\`;
    
    const storageRef = ref(storage, filePath);

    // Metadata to help with content type
    const metadata = {
      contentType: file.type || 'application/octet-stream',
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
        // Prevent showing 100% until the final URL is available
        const displayProgress = Math.min(progress, 99.9);
        onProgress(displayProgress);
      },
      (error) => {
        console.error('Firebase Storage Upload Error:', error);
        const translatedError = translateStorageError(error.code);
        toast.error(translatedError);
        reject(new Error(translatedError));
      },
      async () => {
        try {
          // Upload completed successfully, get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress(100);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          const translatedError = translateStorageError((error as any).code || 'unknown');
          toast.error('تم الرفع ولكن فشل الحصول على الرابط: ' + translatedError);
          reject(error);
        }
      }
    );
  });
}`;

const newUploadFunc = `export async function uploadFileToFirebase(
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
  
  // 2. Perform direct upload to local Express backend /api/upload
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.min(percentComplete, 99.9));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.url) {
            onProgress(100);
            resolve(response.url);
          } else {
            reject(new Error('لم يتم إرجاع رابط للملف'));
          }
        } catch (e) {
          reject(new Error('استجابة غير صالحة من الخادم'));
        }
      } else {
        const err = xhr.responseText ? JSON.parse(xhr.responseText).error || 'فشل الرفع' : 'فشل الرفع';
        toast.error(err);
        reject(new Error(err));
      }
    };

    xhr.onerror = () => {
      toast.error('حدث خطأ في الشبكة أثناء الرفع');
      reject(new Error('Network Error'));
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}`;

code = code.replace(oldUploadFunc, newUploadFunc);
fs.writeFileSync('src/lib/upload.ts', code);
