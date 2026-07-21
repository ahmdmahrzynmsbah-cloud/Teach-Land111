import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Save, BookOpen, AlertCircle } from "lucide-react";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

interface Question {
  id: string;
  text: string;
  type?: QuestionType;
  options: string[];
  correctOptionIndex: number;
  correctAnswer?: string; // some older structures use correctAnswer instead of correctOptionIndex
  points: number;
  explanation?: string;
}

interface ComprehensiveBankBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  db: any;
  userData: any;
  editingBankId: string | null;
  existingBankData?: any;
  onSaveSuccess: (bankData: any) => void;
}

export default function ComprehensiveBankBuilder({
  isOpen,
  onClose,
  db,
  userData,
  editingBankId,
  existingBankData,
  onSaveSuccess,
}: ComprehensiveBankBuilderProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q_1", text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "", type: "multiple_choice" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingBankId && existingBankData) {
      setTitle(existingBankData.title || "");
      setSubject(existingBankData.subject || "");
      
      const loadedQuestions = existingBankData.questions && existingBankData.questions.length > 0 
        ? existingBankData.questions.map((q: any) => ({
            ...q,
            correctOptionIndex: q.correctAnswer !== undefined ? q.correctAnswer : (q.correctOptionIndex || 0),
            type: q.type || 'multiple_choice'
          }))
        : [{ id: "q_1", text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "", type: "multiple_choice" }];
        
      setQuestions(loadedQuestions);
    } else {
      setTitle("");
      setSubject("");
      setQuestions([
        { id: "q_1", text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "", type: "multiple_choice" },
      ]);
    }
  }, [editingBankId, existingBankData, isOpen]);

  const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let newQuestion: Question = { id: newId, text: "", type, options: [], correctOptionIndex: 0, points: 1, explanation: "" };
    
    if (type === 'multiple_choice') {
      newQuestion.options = ["", "", "", ""];
    } else if (type === 'true_false') {
      newQuestion.options = ["صح", "خطأ"];
    } else if (type === 'essay') {
      newQuestion.options = [];
    }
    
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('يجب أن يحتوي بنك الأسئلة على سؤال واحد على الأقل');
      return;
    }
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleUpdateQuestionField = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return toast.error("يرجى إدخال اسم بنك الأسئلة");
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        return toast.error(`يرجى كتابة نص السؤال رقم ${i + 1}`);
      }
      if (q.type === 'multiple_choice' && q.options.some((o: string) => !o.trim())) {
        return toast.error(`يرجى تعبئة جميع خيارات السؤال رقم ${i + 1}`);
      }
    }

    setSaving(true);
    try {
      const formattedQuestions = questions.map(q => ({
        ...q,
        correctAnswer: q.correctOptionIndex // maintain backwards compatibility with existing UI
      }));
      
      const bankData = {
        title: title.trim(),
        subject: subject.trim(),
        teacherId: userData.id,
        questions: formattedQuestions,
        updatedAt: serverTimestamp(),
      };

      if (editingBankId) {
        await setDoc(doc(db, "questionBanks", editingBankId), bankData, { merge: true });
        toast.success("تم تحديث بنك الأسئلة بنجاح 🎉");
        onSaveSuccess({ id: editingBankId, ...bankData });
      } else {
        const docRef = await addDoc(collection(db, "questionBanks"), {
          ...bankData,
          createdAt: serverTimestamp()
        });
        toast.success("تم إنشاء بنك الأسئلة بنجاح 🎉");
        onSaveSuccess({ id: docRef.id, ...bankData, createdAt: new Date() });
      }
      
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("حدث خطأ أثناء حفظ بنك الأسئلة");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gray-50 dark:bg-[#0D0D12] w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-gray-200 dark:border-[#2D2D3D]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2D2D3D] flex justify-between items-center bg-white dark:bg-[#1A1A24] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white">
                  {editingBankId ? "تعديل بنك الأسئلة" : "إنشاء بنك أسئلة جديد"}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                  منشئ بنوك الأسئلة الشامل
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-600 dark:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Basic Details */}
              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-5">
                <h4 className="font-black text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] flex items-center justify-center text-xs">1</span>
                  المعلومات الأساسية
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5 block">
                      اسم بنك الأسئلة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: بنك أسئلة الوحدة الأولى فيزياء..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#222230] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-bold focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5 block">
                      المادة / التصنيف (اختياري)
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: فيزياء 101"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#222230] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-bold focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                    أسئلة بنك الأسئلة ({questions.length})
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
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
                  </div>
                </div>

                {questions.map((q, qIdx) => (
                <React.Fragment key={q.id}>
                  <div className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-5 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-[#00B4D8] dark:bg-[#D4AF37]"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-black">
                          {qIdx + 1}
                        </span>
                        <span className="text-[10px] font-black px-2 py-1 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] rounded-md">
                          {q.type === 'true_false' ? 'صح وخطأ' : q.type === 'essay' ? 'مقالي' : 'اختيار من متعدد'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400">نص السؤال</label>
                        <textarea
                          value={q.text}
                          onChange={(e) => handleUpdateQuestionField(qIdx, "text", e.target.value)}
                          placeholder="اكتب السؤال هنا..."
                          className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] rounded-xl text-sm font-bold text-gray-900 dark:text-white resize-none h-20 focus:outline-none focus:border-[#00B4D8]"
                        />
                      </div>

                      {q.type !== 'essay' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400">الخيارات (اختر الإجابة الصحيحة)</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={`flex items-center gap-3 p-2 rounded-xl border ${q.correctOptionIndex === optIdx ? 'border-green-400 bg-green-50 dark:border-green-500/50 dark:bg-green-900/10' : 'border-gray-200 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]'}`}>
                                <input
                                  type="radio"
                                  name={`correct_${q.id}`}
                                  checked={q.correctOptionIndex === optIdx}
                                  onChange={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", optIdx)}
                                  className="w-4 h-4 text-green-500 border-gray-300 focus:ring-green-500 shrink-0 cursor-pointer"
                                />
                                {q.type === 'true_false' ? (
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{opt}</span>
                                ) : (
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                    placeholder={`خيار ${optIdx + 1}`}
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400">تفسير الإجابة وشرحها المبسط (اختياري)</label>
                        <input
                          type="text"
                          value={q.explanation || ""}
                          onChange={(e) => handleUpdateQuestionField(qIdx, "explanation", e.target.value)}
                          placeholder="اشرح لماذا هذه هي الإجابة الصحيحة..."
                          className="w-full p-2 bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center bg-white dark:bg-[#1A1A24] shrink-0">
            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
              احفظ بنك الأسئلة لتتمكن من استخدامه لاحقاً
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-white hover:bg-gray-200 rounded-2xl text-xs font-black transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] text-white rounded-2xl text-xs font-black shadow-lg transition-all flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "جاري الحفظ..." : "حفظ بنك الأسئلة 🚀"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
