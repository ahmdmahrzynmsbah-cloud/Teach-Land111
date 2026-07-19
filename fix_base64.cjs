const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const base64Logic = `
/**
 * Compresses an image and returns it as a Base64 string for direct storage.
 */
export async function compressImageToBase64(file: File): Promise<string> {
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

        const MAX_WIDTH = 800; // Smaller max width for base64
        const MAX_HEIGHT = 800;

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

/**`;

code = code.replace('/**\n * Compresses an image file before upload', base64Logic + '\n * Compresses an image file before upload');

fs.writeFileSync('src/lib/upload.ts', code);
