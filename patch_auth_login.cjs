const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const targetStr = `            } else {
              try {
                await userCredential.user.delete();
              } catch (e) {
                console.error("Failed to delete auth user:", e);
              }
              await auth.signOut();
              throw new Error('تم مسح بيانات هذا الحساب من النظام. يرجى إنشاء حساب جديد.');
            }`;

const replacementStr = `            } else {
              await auth.signOut();
              throw new Error('تم مسح بيانات هذا الحساب من النظام بواسطة الإدارة. يرجى إعادة إنشاء الحساب (من تبويب إنشاء حساب) باستخدام نفس كلمة المرور القديمة لاستعادة حسابك.');
            }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/Auth.tsx', code);
