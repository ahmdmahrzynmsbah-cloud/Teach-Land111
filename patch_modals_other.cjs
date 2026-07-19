const fs = require('fs');

function patchFile(filepath) {
  if (fs.existsSync(filepath)) {
    let code = fs.readFileSync(filepath, 'utf8');
    code = code.replace(
      /className="(bg-[^"]+ rounded-3xl w-full max-w-[^"]+ relative z-10 shadow-2xl p-6 text-right)"/g,
      'className="$1 max-h-[90vh] overflow-y-auto"'
    );
    fs.writeFileSync(filepath, code);
  }
}

patchFile('src/components/AdminCoursesPanel.tsx');
patchFile('src/components/ExamPage.tsx');
patchFile('src/components/QuizSection.tsx');
patchFile('src/components/TeacherClasses.tsx');
patchFile('src/components/CourseDetails.tsx');

patchFile('src/components/StudentExamTaking.tsx');
patchFile('src/components/InteractiveSchedule.tsx');
