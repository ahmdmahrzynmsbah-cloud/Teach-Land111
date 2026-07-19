const fs = require('fs');
let code = fs.readFileSync('src/components/ComprehensiveExamBuilder.tsx', 'utf8');

const oldHandleAdd = `  const handleAddQuestion = () => {
    const newId = \`q_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    setQuestions((prev) => [
      ...prev,
      { id: newId, text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "" },
    ]);
  };`;

const newHandleAdd = `  const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
    const newId = \`q_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    let newQuestion: Question = { id: newId, text: "", type, options: [], correctOptionIndex: 0, points: 1, explanation: "" };
    
    if (type === 'multiple_choice') {
      newQuestion.options = ["", "", "", ""];
    } else if (type === 'true_false') {
      newQuestion.options = ["صح", "خطأ"];
    } else if (type === 'essay') {
      newQuestion.correctAnswer = "";
    }

    setQuestions((prev) => [
      ...prev,
      newQuestion,
    ]);
  };`;

code = code.replace(oldHandleAdd, newHandleAdd);
fs.writeFileSync('src/components/ComprehensiveExamBuilder.tsx', code);
