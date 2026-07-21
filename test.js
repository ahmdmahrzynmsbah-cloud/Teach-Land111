const fs = require('fs');
console.log(fs.readFileSync('src/components/TeacherQudurat.tsx', 'utf8').includes('toast.error(\'الرجاء تعبئة جميع الحقول المطلوبة بما في ذلك فيديو المراجعة\')'));
