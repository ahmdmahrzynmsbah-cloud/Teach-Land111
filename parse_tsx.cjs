const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherClasses.tsx', 'utf8');

// I'll just do a regex replace
const oldStr = `{course.isActive === false && (
                    <div className="bg-orange-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> غير مفعل
                    </div>
                  )}`;
const newStr = `                  {/* Status Indicator */}
                  <div className={\`backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1.5 \${
                    course.status === 'published' || course.isActive === true ? 'bg-green-500/90' :
                    course.status === 'under_review' ? 'bg-yellow-500/90' :
                    'bg-gray-500/90'
                  }\`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    {course.status === 'published' || course.isActive === true ? 'منشور' :
                      course.status === 'under_review' ? 'قيد المراجعة' :
                      'مسودة'}
                  </div>`;
code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/TeacherClasses.tsx', code);
