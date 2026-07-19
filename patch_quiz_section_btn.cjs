const fs = require('fs');
let code = fs.readFileSync('src/components/QuizSection.tsx', 'utf8');

const oldBtn = `<button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-4 py-2 rounded-xl flex items-center gap-1.5 hover:opacity-80 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة سؤال جديد
                  </button>`;

const newBtn = `<div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="text-[10px] sm:text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:opacity-80 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      اختيار من متعدد
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('true_false')}
                      className="text-[10px] sm:text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:opacity-80 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      صح وخطأ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('essay')}
                      className="text-[10px] sm:text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:opacity-80 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      سؤال مقالي
                    </button>
                  </div>`;

code = code.replace(oldBtn, newBtn);
fs.writeFileSync('src/components/QuizSection.tsx', code);
