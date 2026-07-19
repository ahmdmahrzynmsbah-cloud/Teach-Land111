const fs = require('fs');
let code = fs.readFileSync('src/components/QuizSection.tsx', 'utf8');

const oldEditor = `                    {/* MCQs and Select Correct */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">خيارات السؤال (اختر الدائرة الخضراء لتحديد الإجابة الصحيحة)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2 bg-gray-50 dark:bg-[#0D0D12] rounded-xl p-2 border border-gray-200 dark:border-[#2D2D3D]">
                            <button
                              type="button"
                              disabled={!isEditing && !!quiz}
                              onClick={() => handleUpdateQuestionField(qIdx, 'correctOptionIndex', optIdx)}
                              className={\`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border \${
                                q.correctOptionIndex === optIdx
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-white dark:bg-[#1A1A24] text-gray-400 border-gray-300 dark:border-gray-600 hover:border-green-500'
                              }\`}
                              title="تحديد كإجابة صحيحة"
                            >
                              {q.correctOptionIndex === optIdx ? <Check className="w-3.5 h-3.5" /> : optionMarkers[optIdx]}
                            </button>
                            <input
                              type="text"
                              disabled={!isEditing && !!quiz}
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              placeholder={\`الخيار \${optionMarkers[optIdx]}\`}
                              className="w-full bg-transparent text-xs font-medium outline-none border-none p-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>`;

const newEditor = `                    {/* Question type rendering */}
                    {(!q.type || q.type === 'multiple_choice') && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">خيارات السؤال (اختر الدائرة الخضراء لتحديد الإجابة الصحيحة)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2 bg-gray-50 dark:bg-[#0D0D12] rounded-xl p-2 border border-gray-200 dark:border-[#2D2D3D]">
                              <button
                                type="button"
                                disabled={!isEditing && !!quiz}
                                onClick={() => handleUpdateQuestionField(qIdx, 'correctOptionIndex', optIdx)}
                                className={\`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border \${
                                  q.correctOptionIndex === optIdx
                                    ? 'bg-green-500 text-white border-green-500'
                                    : 'bg-white dark:bg-[#1A1A24] text-gray-400 border-gray-300 dark:border-gray-600 hover:border-green-500'
                                }\`}
                                title="تحديد كإجابة صحيحة"
                              >
                                {q.correctOptionIndex === optIdx ? <Check className="w-3.5 h-3.5" /> : optionMarkers[optIdx]}
                              </button>
                              <input
                                type="text"
                                disabled={!isEditing && !!quiz}
                                value={opt}
                                onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                placeholder={\`الخيار \${optionMarkers[optIdx]}\`}
                                className="w-full bg-transparent text-xs font-medium outline-none border-none p-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">الإجابة الصحيحة</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            disabled={!isEditing && !!quiz}
                            onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", 0)}
                            className={\`flex-1 py-3 rounded-xl font-bold transition-all border text-sm \${
                              q.correctOptionIndex === 0
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-200 dark:border-[#2D2D3D] text-gray-500"
                            }\`}
                          >
                            صح
                          </button>
                          <button
                            type="button"
                            disabled={!isEditing && !!quiz}
                            onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", 1)}
                            className={\`flex-1 py-3 rounded-xl font-bold transition-all border text-sm \${
                              q.correctOptionIndex === 1
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-200 dark:border-[#2D2D3D] text-gray-500"
                            }\`}
                          >
                            خطأ
                          </button>
                        </div>
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">الإجابة النموذجية (كمرجع لك)</label>
                        <textarea
                          disabled={!isEditing && !!quiz}
                          value={q.correctAnswer || ""}
                          onChange={(e) => handleUpdateQuestionField(qIdx, "correctAnswer", e.target.value)}
                          rows={3}
                          placeholder="اكتب الإجابة النموذجية هنا للرجوع إليها وقت التصحيح..."
                          className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none resize-none"
                        />
                      </div>
                    )}`;

code = code.replace(oldEditor, newEditor);
fs.writeFileSync('src/components/QuizSection.tsx', code);
