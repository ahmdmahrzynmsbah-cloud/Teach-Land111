const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf-8');

content = content.replace(
  /catch \(err: any\) \{\n\s+console\.error\(err\);\n\s+setError\('حدث خطأ أثناء التسجيل، يرجى التأكد من صحة البيانات\.'\);\n\s+\}/,
  `catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('عذراً، لم يتم تفعيل الدخول بالبريد الإلكتروني في قاعدة البيانات. يرجى تفعيله من Firebase Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
        setError(err.message || 'حدث خطأ أثناء العملية، يرجى المحاولة مرة أخرى.');
      }
    }`
);

fs.writeFileSync('src/components/Auth.tsx', content);
