const fs = require('fs');
let code = fs.readFileSync('src/components/StudentExamTaking.tsx', 'utf8');

const oldQuestion = `interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
}`;

const newQuestion = `export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

interface Question {
  id: string;
  text: string;
  type?: QuestionType;
  options: string[];
  correctOptionIndex: number;
  correctAnswer?: string;
  points: number;
  explanation?: string;
}`;

code = code.replace(oldQuestion, newQuestion);

// Also selectedAnswers might hold string for essay answers.
const oldAnswers = `const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});`;
const newAnswers = `const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});`;

code = code.replace(oldAnswers, newAnswers);
fs.writeFileSync('src/components/StudentExamTaking.tsx', code);
