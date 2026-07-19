const fs = require('fs');
let code = fs.readFileSync('src/components/QuizSection.tsx', 'utf8');

const oldHandleAdd = `  const handleAddQuestion = () => {
    const newId = \`q_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
    const newQ: Question = {
      id: newId,
      text: 'اكتب نص السؤال هنا...',
      options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
      correctOptionIndex: 0,
      explanation: 'اكتب التوضيح العلمي والتفسير هنا لحل هذا السؤال بالتفصيل.',
      points: 5
    };
    setQuestions([...questions, newQ]);
  };`;

const newHandleAdd = `  const handleAddQuestion = (type: 'multiple_choice' | 'true_false' | 'essay' = 'multiple_choice') => {
    const newId = \`q_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
    let newQ: Question = {
      id: newId,
      text: 'اكتب نص السؤال هنا...',
      type,
      options: [],
      correctOptionIndex: 0,
      explanation: 'اكتب التوضيح العلمي والتفسير هنا لحل هذا السؤال بالتفصيل.',
      points: 5
    };
    if (type === 'multiple_choice') {
      newQ.options = ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'];
    } else if (type === 'true_false') {
      newQ.options = ['صح', 'خطأ'];
    } else if (type === 'essay') {
      newQ.correctAnswer = '';
    }
    setQuestions([...questions, newQ]);
  };`;

code = code.replace(oldHandleAdd, newHandleAdd);
fs.writeFileSync('src/components/QuizSection.tsx', code);
