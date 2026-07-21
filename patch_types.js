const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(
  "videoUrl: string;",
  "videoUrl?: string;\n  contentType?: 'video_course' | 'pdf_book' | 'exam';"
);
code = code.replace(
  "export interface TahsiliReview {",
  "export interface TahsiliReview {\n  contentType?: 'video_course' | 'pdf_book' | 'exam';"
);
fs.writeFileSync('src/types.ts', code);
