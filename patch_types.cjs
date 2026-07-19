const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const oldQuestion = `export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
}`;

const newQuestion = `export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType; // Optional for backward compatibility, defaults to 'multiple_choice'
  options: string[]; // Can be empty for essay
  correctOptionIndex: number; // For multiple_choice and true_false
  correctAnswer?: string; // For essay (teacher reference)
  explanation?: string;
  points: number;
}`;

code = code.replace(oldQuestion, newQuestion);
fs.writeFileSync('src/types.ts', code);
