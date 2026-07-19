const fs = require('fs');
let code = fs.readFileSync('src/components/ComprehensiveExamBuilder.tsx', 'utf8');

const oldOptions = `                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-1">
                          <label className={\`text-[10px] font-bold \${q.correctOptionIndex === oIdx ? "text-green-500" : "text-gray-400"}\`}>
                            الخيار رقم {oIdx + 1} {q.correctOptionIndex === oIdx ? "(الإجابة الصحيحة ✅)" : ""}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                              placeholder={\`الخيار \${oIdx + 1}\`}
                              className={\`w-full p-2.5 bg-gray-50 dark:bg-[#222230] border rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none \${
                                q.correctOptionIndex === oIdx
                                  ? "border-green-500 focus:border-green-600"
                                  : "border-gray-100 dark:border-transparent focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                              }\`}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", oIdx)}
                              className={\`px-3 rounded-xl text-[10px] font-black transition-all border \${
                                q.correctOptionIndex === oIdx
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                              }\`}
                            >
                              صحيحة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>`;

const newOptions = `                    {/* Options Grid based on question type */}
                    {(!q.type || q.type === 'multiple_choice') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="space-y-1">
                            <label className={\`text-[10px] font-bold \${q.correctOptionIndex === oIdx ? "text-green-500" : "text-gray-400"}\`}>
                              الخيار رقم {oIdx + 1} {q.correctOptionIndex === oIdx ? "(الإجابة الصحيحة ✅)" : ""}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                                placeholder={\`الخيار \${oIdx + 1}\`}
                                className={\`w-full p-2.5 bg-gray-50 dark:bg-[#222230] border rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none \${
                                  q.correctOptionIndex === oIdx
                                    ? "border-green-500 focus:border-green-600"
                                    : "border-gray-100 dark:border-transparent focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                                }\`}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", oIdx)}
                                className={\`px-3 rounded-xl text-[10px] font-black transition-all border \${
                                  q.correctOptionIndex === oIdx
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                                }\`}
                              >
                                صحيحة
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold text-gray-400 block mb-2 w-full text-right">الإجابة الصحيحة:</label>
                        <div className="flex gap-3 w-full">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", 0)}
                            className={\`flex-1 py-3 rounded-xl font-bold transition-all border \${
                              q.correctOptionIndex === 0
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                            }\`}
                          >
                            صح
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", 1)}
                            className={\`flex-1 py-3 rounded-xl font-bold transition-all border \${
                              q.correctOptionIndex === 1
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                            }\`}
                          >
                            خطأ
                          </button>
                        </div>
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400">الإجابة النموذجية (مرجع للمعلم)</label>
                        <textarea
                          value={q.correctAnswer || ""}
                          onChange={(e) => handleUpdateQuestionField(qIdx, "correctAnswer", e.target.value)}
                          rows={3}
                          placeholder="اكتب الإجابة النموذجية هنا..."
                          className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] resize-none"
                        />
                      </div>
                    )}`;

code = code.replace(oldOptions, newOptions);
fs.writeFileSync('src/components/ComprehensiveExamBuilder.tsx', code);
