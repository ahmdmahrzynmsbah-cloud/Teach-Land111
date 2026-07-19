const fs = require('fs');
let code = fs.readFileSync('src/components/ComprehensiveExamBuilder.tsx', 'utf8');

const oldValidation = `      if (!q.options || q.options.length === 0) {
        toast.error(\`يرجى إضافة خيارات للسؤال رقم \${i + 1}\`);
        return;
      }
      for (let o = 0; o < q.options.length; o++) {
        const option = q.options[o];
        if (typeof option !== "string" || !option.trim()) {
          toast.error(\`يرجى كتابة الخيار رقم \${o + 1} للسؤال رقم \${i + 1}\`);
          return;
        }
      }`;

const newValidation = `      if (!q.type || q.type === 'multiple_choice') {
        if (!q.options || q.options.length === 0) {
          toast.error(\`يرجى إضافة خيارات للسؤال رقم \${i + 1}\`);
          return;
        }
        for (let o = 0; o < q.options.length; o++) {
          const option = q.options[o];
          if (typeof option !== "string" || !option.trim()) {
            toast.error(\`يرجى كتابة الخيار رقم \${o + 1} للسؤال رقم \${i + 1}\`);
            return;
          }
        }
      } else if (q.type === 'essay') {
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          toast.error(\`يرجى كتابة الإجابة النموذجية للسؤال المقالي رقم \${i + 1}\`);
          return;
        }
      }`;

code = code.replace(oldValidation, newValidation);
fs.writeFileSync('src/components/ComprehensiveExamBuilder.tsx', code);
