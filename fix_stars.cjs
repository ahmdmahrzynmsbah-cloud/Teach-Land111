const fs = require('fs');

// 1. QuizSection.tsx
let quiz = fs.readFileSync('src/components/QuizSection.tsx', 'utf8');
quiz = quiz.replace(/نقطة/g, 'نجمة');
quiz = quiz.replace(/نقاط/g, 'نجوم');
fs.writeFileSync('src/components/QuizSection.tsx', quiz);

// 2. ComprehensiveExamBuilder.tsx
let comp = fs.readFileSync('src/components/ComprehensiveExamBuilder.tsx', 'utf8');
comp = comp.replace(/نقاط/g, 'نجوم');
comp = comp.replace(/نقطة/g, 'نجمة');
fs.writeFileSync('src/components/ComprehensiveExamBuilder.tsx', comp);

// 3. ExamPage.tsx
let exam = fs.readFileSync('src/components/ExamPage.tsx', 'utf8');
exam = exam.replace(/نقاط/g, 'نجوم');
fs.writeFileSync('src/components/ExamPage.tsx', exam);

// 4. StudentExamTaking.tsx
let student = fs.readFileSync('src/components/StudentExamTaking.tsx', 'utf8');
student = student.replace(/نقاط/g, 'نجوم');
fs.writeFileSync('src/components/StudentExamTaking.tsx', student);

