const fs = require('fs');
let code = fs.readFileSync('src/components/ComprehensiveExamBuilder.tsx', 'utf8');

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

fs.writeFileSync('src/components/ComprehensiveExamBuilder.tsx', code);
