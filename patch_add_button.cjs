const fs = require('fs');
let code = fs.readFileSync('src/components/ComprehensiveExamBuilder.tsx', 'utf8');

const oldBtn = `<button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة سؤال جديد
                </button>`;

const newBtn = `<div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('multiple_choice')}
                    className="px-3 py-2 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    اختيار من متعدد
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('true_false')}
                    className="px-3 py-2 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    صح وخطأ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('essay')}
                    className="px-3 py-2 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    سؤال مقالي
                  </button>
                </div>`;

code = code.replace(oldBtn, newBtn);
fs.writeFileSync('src/components/ComprehensiveExamBuilder.tsx', code);
