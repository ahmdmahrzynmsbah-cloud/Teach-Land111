const fs = require('fs');
let code = fs.readFileSync('src/components/StudentExamTaking.tsx', 'utf8');

const oldRender = `                    {/* Options targets */}
                    <div className="space-y-3">
                      {activeQuestion.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[activeQuestion.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                            className={\`w-full p-4 rounded-2xl text-right border text-xs font-black transition-all flex items-center justify-between \${
                              isSelected
                                ? "bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:to-transparent dark:border-[#D4AF37] shadow-sm scale-[1.01]"
                                : "bg-white dark:bg-[#1A1A24] border-gray-100 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#20202d]"
                            }\`}
                          >
                            <span className="flex items-center gap-3">
                              <span className={\`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs \${
                                isSelected
                                   ? "bg-[#00B4D8] border-[#00B4D8] text-white dark:bg-[#D4AF37] dark:border-[#D4AF37]"
                                   : "border-gray-200 dark:border-gray-700 text-gray-400"
                              }\`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className={isSelected ? "text-[#0077B6] dark:text-[#D4AF37]" : "text-gray-700 dark:text-gray-300"}>
                                {option}
                              </span>
                            </span>
                            {isSelected && (
                              <span className="text-xs text-[#00B4D8] dark:text-[#D4AF37]">محدد ✅</span>
                            )}
                          </button>
                        );
                      })}
                    </div>`;

const newRender = `                    {/* Options targets */}
                    <div className="space-y-3">
                      {(!activeQuestion.type || activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'true_false') && activeQuestion.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[activeQuestion.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                            className={\`w-full p-4 rounded-2xl text-right border text-xs font-black transition-all flex items-center justify-between \${
                              isSelected
                                ? "bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:to-transparent dark:border-[#D4AF37] shadow-sm scale-[1.01]"
                                : "bg-white dark:bg-[#1A1A24] border-gray-100 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#20202d]"
                            }\`}
                          >
                            <span className="flex items-center gap-3">
                              {activeQuestion.type !== 'true_false' && (
                                <span className={\`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs \${
                                  isSelected
                                     ? "bg-[#00B4D8] border-[#00B4D8] text-white dark:bg-[#D4AF37] dark:border-[#D4AF37]"
                                     : "border-gray-200 dark:border-gray-700 text-gray-400"
                                }\`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                              )}
                              <span className={isSelected ? "text-[#0077B6] dark:text-[#D4AF37]" : "text-gray-700 dark:text-gray-300"}>
                                {option}
                              </span>
                            </span>
                            {isSelected && (
                              <span className="text-xs text-[#00B4D8] dark:text-[#D4AF37]">محدد ✅</span>
                            )}
                          </button>
                        );
                      })}
                      {activeQuestion.type === 'essay' && (
                        <div className="pt-2">
                          <textarea
                            rows={6}
                            placeholder="اكتب إجابتك هنا بالتفصيل..."
                            value={selectedAnswers[activeQuestion.id] || ''}
                            onChange={(e) => handleSelectOption(activeQuestion.id, e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] resize-none"
                          />
                        </div>
                      )}
                    </div>`;

code = code.replace(oldRender, newRender);
fs.writeFileSync('src/components/StudentExamTaking.tsx', code);
