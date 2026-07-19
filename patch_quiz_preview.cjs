const fs = require('fs');
let code = fs.readFileSync('src/components/QuizSection.tsx', 'utf8');

const oldPreview = `                      {/* MCQ choices with color states */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelectedByStudent = studentChoice === optIdx;
                          const isCorrectAns = q.correctOptionIndex === optIdx;
                          let btnStyle = 'bg-gray-50 dark:bg-[#0D0D12] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2D2D3D]';
                          
                          if (isCorrectAns) {
                            btnStyle = 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30';
                          } else if (isSelectedByStudent && !isCorrectAns) {
                            btnStyle = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
                          }

                          return (
                            <div key={optIdx} className={\`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border \${btnStyle}\`}>
                              <span className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-sans">{optionMarkers[optIdx]}</span>
                                {opt}
                              </span>
                              {isCorrectAns && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                              {isSelectedByStudent && !isCorrectAns && <X className="w-4 h-4 text-red-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>`;

const newPreview = `                      {/* Choices with color states */}
                      {(!q.type || q.type === 'multiple_choice' || q.type === 'true_false') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelectedByStudent = studentChoice === optIdx;
                            const isCorrectAns = q.correctOptionIndex === optIdx;
                            let btnStyle = 'bg-gray-50 dark:bg-[#0D0D12] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2D2D3D]';
                            
                            if (isCorrectAns) {
                              btnStyle = 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30';
                            } else if (isSelectedByStudent && !isCorrectAns) {
                              btnStyle = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
                            }

                            return (
                              <div key={optIdx} className={\`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border \${btnStyle}\`}>
                                <span className="flex items-center gap-2">
                                  {q.type !== 'true_false' && <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-sans">{optionMarkers[optIdx]}</span>}
                                  {opt}
                                </span>
                                {isCorrectAns && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                                {isSelectedByStudent && !isCorrectAns && <X className="w-4 h-4 text-red-500 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {q.type === 'essay' && (
                        <div className="pt-2 space-y-3">
                          <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-gray-400 block mb-1">إجابة الطالب:</span>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {/* TODO: Essay answer from student */}
                              (الأسئلة المقالية في طور التحديث - ستظهر الإجابة قريباً)
                            </p>
                          </div>
                          {q.correctAnswer && (
                            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 p-3 rounded-xl">
                              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 block mb-1">الإجابة النموذجية:</span>
                              <p className="text-xs font-medium text-green-800 dark:text-green-300">
                                {q.correctAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}`;

code = code.replace(oldPreview, newPreview);

// we have to replace two occurences of oldPreview
// one is for student result modal and one is for teacher view in QuizSection!
// Let's replace globally just in case. Or I can do it twice.
// Let's write a script that replaces all matching blocks.

fs.writeFileSync('src/components/QuizSection.tsx', code);
