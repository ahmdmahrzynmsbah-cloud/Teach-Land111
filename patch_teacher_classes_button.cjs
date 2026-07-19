const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherClasses.tsx', 'utf8');

const oldSubmitButton = `                  {isSubmitting ? (
                    <>
                      {imageFile && uploadProgress < 100 
                        ? \`جاري الرفع... \${Math.round(uploadProgress)}%\` 
                        : (imageFile && uploadProgress === 100) 
                          ? 'جاري الحفظ...' 
                          : 'جاري الإنشاء...'}
                    </>
                  ) : (
                    'إنشاء الكورس'
                  )}`;
const newSubmitButton = `                  {isSubmitting ? (
                    'جاري الإنشاء...'
                  ) : (
                    'إنشاء الكورس'
                  )}`;
code = code.replace(oldSubmitButton, newSubmitButton);

fs.writeFileSync('src/components/TeacherClasses.tsx', code);
