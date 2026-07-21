const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const targetStr = `            if (data.videoId) {
              onProgress(100);
              resolve(\`bunny:\${data.videoId}\`);
            } else if (data.url) {
              onProgress(100);
              resolve(data.url);
            } else {
              reject(new Error('Unknown response format'));
            }
          } catch (fallbackError) {
             reject(fallbackError);
          }
        }, 
        async () => {`;

const replacementStr = `            if (data.videoId) {
              onProgress(100);
              resolve(\`bunny:\${data.videoId}\`);
            } else if (data.url) {
              onProgress(100);
              resolve(data.url);
            } else {
              reject(new Error('Unknown response format'));
            }
          } catch (fallbackError: any) {
             console.error("Fallback upload error:", fallbackError);
             if (fallbackError.message.includes('404') || fallbackError.message.includes('<!DOCTYPE')) {
               reject(new Error('فشل الرفع: الخادم لا يدعم رفع الملفات (يبدو أنك تستخدم استضافة ثابتة Static Hosting). لحل هذه المشكلة، يجب عليك إعداد CORS في Firebase Storage للسماح لنطاق موقعك بالرفع.'));
             } else {
               reject(fallbackError);
             }
          }
        }, 
        async () => {`;

code = code.replace(targetStr, replacementStr);

const targetStr2 = `          xhr.onload = () => {
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
          };`;

const replacementStr2 = `          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                onProgress(100);
                resolve(response.url);
              } catch (e) {
                reject(new Error('استجابة غير صالحة من الخادم أثناء الرفع. يبدو أن الخادم لا يدعم رفع الملفات.'));
              }
            } else {
              if (xhr.status === 404) {
                 reject(new Error('فشل الرفع: الخادم لا يدعم رفع الملفات (يبدو أنك تستخدم استضافة ثابتة). لحل هذه المشكلة، يجب عليك إعداد CORS في Firebase Storage.'));
              } else {
                 reject(new Error(\`فشل الرفع من الخادم: رمز الحالة \${xhr.status}\`));
              }
            }
          };`;

code = code.replace(targetStr2, replacementStr2);

fs.writeFileSync('src/lib/upload.ts', code);
