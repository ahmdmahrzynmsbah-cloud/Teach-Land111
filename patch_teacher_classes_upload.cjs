const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherClasses.tsx', 'utf8');

// replace import
code = code.replace(`import { uploadChunkedFile } from '../lib/upload';`, `import { compressImageToBase64 } from '../lib/upload';`);

// replace upload logic
const oldUpload = `      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadChunkedFile(imageFile, (progress) => {
          setUploadProgress(progress);
        });
      }`;
const newUpload = `      let imageUrl = '';
      if (imageFile) {
        imageUrl = await compressImageToBase64(imageFile, 800, 600);
      }`;
code = code.replace(oldUpload, newUpload);

// remove progress bar UI
const progressUI = `                    {isSubmitting && imageFile && (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span>{uploadProgress === 100 ? 'جاري حفظ البيانات...' : 'جاري رفع الصورة...'}</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2">
                          <div 
                            className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
                            style={{ width: \`\${uploadProgress}%\` }}
                          ></div>
                        </div>
                      </div>
                    )}`;
code = code.replace(progressUI, '');

// update submit button
const oldSubmitButton = `                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadProgress > 0 && uploadProgress < 100 ? \`جاري الرفع... \${Math.round(uploadProgress)}%\` : 'جاري الإنشاء...'}
                    </>
                  ) : (
                    'إنشاء الكورس'
                  )}`;
const newSubmitButton = `                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    'إنشاء الكورس'
                  )}`;
code = code.replace(oldSubmitButton, newSubmitButton);

fs.writeFileSync('src/components/TeacherClasses.tsx', code);
