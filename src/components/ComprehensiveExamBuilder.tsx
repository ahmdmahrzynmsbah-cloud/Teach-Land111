import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Save, Clock, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { doc, setDoc, getDocs, collection, query, where, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

interface Question {
  id: string;
  text: string;
  type?: QuestionType;
  options: string[];
  correctOptionIndex: number;
  correctAnswer?: string;
  points: number;
  explanation?: string;
  originalBankQuestionId?: string;
}

interface ComprehensiveExamBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  db: any;
  userData: any;
  coursesList: any[];
  editingExamId: string | null;
  existingExamData?: any;
  onSaveSuccess: (examData: any) => void;
}

export default function ComprehensiveExamBuilder({
  isOpen,
  onClose,
  db,
  userData,
  coursesList,
  editingExamId,
  existingExamData,
  onSaveSuccess,
}: ComprehensiveExamBuilderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [courseId, setCourseId] = useState("");
  const [isLeagueExam, setIsLeagueExam] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q_1", text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Question Bank import states
  const [showBankModal, setShowBankModal] = useState(false);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [numQuestionsToImport, setNumQuestionsToImport] = useState(5);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [pastUsedQuestionIds, setPastUsedQuestionIds] = useState<Set<string>>(new Set());
  const [excludeUsedQuestions, setExcludeUsedQuestions] = useState(true);
  const [importMode, setImportMode] = useState<'random' | 'manual'>('random');
  const [selectedManualQuestionIds, setSelectedManualQuestionIds] = useState<Set<string>>(new Set());

  // Load existing exam data if editing
  useEffect(() => {
    if (editingExamId && existingExamData) {
      setTitle(existingExamData.title || "");
      setDescription(existingExamData.description || "");
      setTimeLimit(existingExamData.timeLimit || 30);
      setCourseId(existingExamData.courseId === "all" ? "" : existingExamData.courseId || "");
      setIsLeagueExam(existingExamData.isLeagueExam || false);
      setScheduledTime(existingExamData.scheduledTime || "");
      setIsHidden(existingExamData.isHidden || false);
      setQuestions(existingExamData.questions || [
        { id: "q_1", text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "" }
      ]);
    } else {
      // Reset form
      setTitle("");
      setDescription("");
      setTimeLimit(30);
      setCourseId("");
      setIsLeagueExam(false);
      setScheduledTime("");
      setIsHidden(false);
      setQuestions([
        { id: "q_1", text: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1, explanation: "" },
      ]);
    }
  }, [editingExamId, existingExamData, isOpen]);

  const openBankModal = async () => {
    setShowBankModal(true);
    if (banksList.length === 0) {
      setLoadingBanks(true);
      try {
        const q = query(collection(db, 'questionBanks'), where('teacherId', '==', userData.id));
        const snap = await getDocs(q);
        setBanksList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Load past used question IDs from quizzes
        const quizzesQ = query(collection(db, 'quizzes'), where('createdBy', '==', userData.id));
        const quizzesSnap = await getDocs(quizzesQ);
        const usedIds = new Set<string>();
        quizzesSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.questions) {
            data.questions.forEach((q: any) => {
              if (q.originalBankQuestionId) {
                usedIds.add(q.originalBankQuestionId);
              }
            });
          }
        });
        setPastUsedQuestionIds(usedIds);
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء تحميل بنوك الأسئلة');
      } finally {
        setLoadingBanks(false);
      }
    }
  };

  const handleImportFromBank = () => {
    const bank = banksList.find(b => b.id === selectedBankId);
    if (!bank) return toast.error('يرجى اختيار بنك الأسئلة');
    
    let availableQuestions = bank.questions || [];
    let selected: any[] = [];
    
    if (importMode === 'random') {
      if (excludeUsedQuestions) {
        availableQuestions = availableQuestions.filter((q: any) => !pastUsedQuestionIds.has(q.id));
      }
      
      if (availableQuestions.length === 0) {
        return toast.error('لا يوجد أسئلة متاحة للاستيراد بهذه الشروط');
      }
      
      if (availableQuestions.length < numQuestionsToImport) {
        toast.error(`يوجد ${availableQuestions.length} سؤال متاح فقط، سيتم استيرادهم جميعاً`);
      }
      
      // Shuffle and pick
      const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, numQuestionsToImport);
    } else {
      selected = availableQuestions.filter((q: any) => selectedManualQuestionIds.has(q.id));
      if (selected.length === 0) {
        return toast.error('يرجى تحديد سؤال واحد على الأقل');
      }
    }
    
    const formattedQuestions = selected.map((q: any) => ({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      originalBankQuestionId: q.id,
      text: q.text,
      options: q.options || ["", "", "", ""],
      correctOptionIndex: q.correctAnswer || 0,
      points: 1,
      explanation: q.explanation || "",
      type: 'multiple_choice' as QuestionType
    }));
    
    setQuestions(prev => {
      // If we only have the default empty question, replace it
      if (prev.length === 1 && !prev[0].text && prev[0].options.every(o => !o)) {
        return formattedQuestions;
      }
      return [...prev, ...formattedQuestions];
    });
    
    setShowBankModal(false);
    toast.success(`تم استيراد ${selected.length} سؤال بنجاح 🎉`);
  };

  const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let newQuestion: Question = { id: newId, text: "", type, options: [], correctOptionIndex: 0, points: 1, explanation: "" };
    
    if (type === 'multiple_choice') {
      newQuestion.options = ["", "", "", ""];
    } else if (type === 'true_false') {
      newQuestion.options = ["صح", "خطأ"];
    } else if (type === 'essay') {
      newQuestion.correctAnswer = "";
    }

    setQuestions((prev) => [
      ...prev,
      newQuestion,
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("يجب أن يحتوي الامتحان على سؤال واحد على الأقل.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestionField = (index: number, field: keyof Question, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIndex) {
          const newOpts = [...q.options];
          newOpts[optIndex] = value;
          return { ...q, options: newOpts };
        }
        return q;
      })
    );
  };

  const handleSave = async () => {
    if (!userData?.id) {
      toast.error("عذراً، يجب أن تكون مسجلاً الدخول لحفظ الامتحان الشامل.");
      return;
    }

    if (!title.trim()) {
      toast.error("يرجى إدخال عنوان الامتحان الشامل.");
      return;
    }

    if (isLeagueExam && !scheduledTime) {
      toast.error("يرجى تحديد موعد وتاريخ بدء اختبار الدوري الأسبوعي ⏰");
      return;
    }

    if (!questions || questions.length === 0) {
      toast.error("يجب إضافة سؤال واحد على الأقل للامتحان.");
      return;
    }

    // Validate questions and their options safely
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        toast.error(`يرجى كتابة نص السؤال رقم ${i + 1}`);
        return;
      }
      if (!q.type || q.type === 'multiple_choice') {
        if (!q.options || q.options.length === 0) {
          toast.error(`يرجى إضافة خيارات للسؤال رقم ${i + 1}`);
          return;
        }
        for (let o = 0; o < q.options.length; o++) {
          const option = q.options[o];
          if (typeof option !== "string" || !option.trim()) {
            toast.error(`يرجى كتابة الخيار رقم ${o + 1} للسؤال رقم ${i + 1}`);
            return;
          }
        }
      } else if (q.type === 'essay') {
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          toast.error(`يرجى كتابة الإجابة النموذجية للسؤال المقالي رقم ${i + 1}`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const examId = editingExamId || `comprehensive_${Date.now()}`;
      const examData = {
        id: examId,
        title: title.trim(),
        description: description.trim(),
        timeLimit: Number(timeLimit) || 0,
        courseId: courseId || "all",
        questions: questions,
        isComprehensive: true,
        isLeagueExam: isLeagueExam,
        scheduledTime: scheduledTime || "",
        createdBy: userData.id,
        createdAt: existingExamData?.createdAt || new Date().toISOString(),
        isHidden: isHidden,
      };

      await setDoc(doc(db, "quizzes", examId), examData);
      onSaveSuccess(examData);
      toast.success(editingExamId ? "تم تعديل الامتحان بنجاح! ✏️" : "تم تفعيل الامتحان الشامل بنجاح! 🎉");
      onClose();
    } catch (err) {
      console.error("Error saving comprehensive exam:", err);
      toast.error("حدث خطأ أثناء حفظ الامتحان. يرجى المحاولة مرة أخرى.");
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
          className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right border border-gray-100 dark:border-[#2D2D3D]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-xl z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  {editingExamId ? "تعديل الامتحان الشامل" : "إنشاء امتحان شامل/عام جديد"}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-0.5">صمم امتحاناً تفاعلياً عاماً لقياس مستوى الفهم العام لطلابك</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#2D2D3D] text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50 dark:bg-[#15151F]/30">
            {/* Metadata Card */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300">عنوان الامتحان الشامل *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: الامتحان الشامل الأول في الفيزياء الحديثة"
                  className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300">ربط بالكورس (اختياري)</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                >
                  <option value="">امتحان عام (متاح لجميع طلاب المنصة) 🌍</option>
                  {coursesList.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300">وصف أو تعليمات الامتحان</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تعليمات لطلابك قبل البدء (مثال: يرجى عدم الخروج من الصفحة، الامتحان يحتوي على أسئلة اختيار من متعدد...)"
                  rows={2}
                  className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  المدة الزمنية (بالدقائق) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                />
              </div>

              {/* isHidden Draft Toggle option */}
              <div className="md:col-span-2 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex flex-col gap-3 mt-2 select-none">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={isHidden}
                    onChange={(e) => setIsHidden(e.target.checked)}
                    className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] border-gray-300 dark:border-[#2D2D3D] rounded focus:ring-0 mt-0.5 cursor-pointer accent-[#00B4D8] dark:accent-[#D4AF37]"
                  />
                  <div className="text-right flex-1">
                    <label htmlFor="isHidden" className="text-xs font-black text-gray-800 dark:text-white cursor-pointer">
                      إخفاء هذا الامتحان مؤقتاً وحفظه كمسودة 🙈
                    </label>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 leading-relaxed">
                      عند تفعيل هذا الخيار، لن يظهر هذا الامتحان للطلاب حتى تقوم بنشره وتوجيهه إليهم لاحقاً من لوحة التحكم التفاعلية للاختبارات.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                  أسئلة الامتحان المضافة ({questions.length})
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openBankModal}
                    className="px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-emerald-500/20"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    استيراد من بنك الأسئلة
                  </button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-[#2D2D3D] mx-1"></div>
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

              <div className="space-y-6">
                {questions.map((q, qIdx) => (
                  <React.Fragment key={q.id}>
                    {qIdx > 0 && (
                      <div className="flex items-center my-8 select-none">
                        <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-800" />
                        <div className="mx-4 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/40 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                          <span>فاصل بين السؤال {qIdx} والسؤال {qIdx + 1} 🔍</span>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-800" />
                      </div>
                    )}
                    <div
                      className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] border-r-4 border-r-indigo-500 dark:border-r-[#D4AF37] shadow-sm space-y-4 relative"
                    >
                    <div className="flex justify-between items-center border-b border-gray-50 dark:border-[#2D2D3D]/50 pb-3">
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300">السؤال رقم {qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="حذف هذا السؤال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">نص السؤال *</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleUpdateQuestionField(qIdx, "text", e.target.value)}
                        placeholder="مثال: ما هي وحدة قياس القوة الدافعة الكهربية؟"
                        className="w-full p-3 bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                      />
                    </div>

                    {/* Options Grid based on question type */}
                    {(!q.type || q.type === 'multiple_choice') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="space-y-1">
                            <label className={`text-[10px] font-bold ${q.correctOptionIndex === oIdx ? "text-green-500" : "text-gray-400"}`}>
                              الخيار رقم {oIdx + 1} {q.correctOptionIndex === oIdx ? "(الإجابة الصحيحة ✅)" : ""}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                                placeholder={`الخيار ${oIdx + 1}`}
                                className={`w-full p-2.5 bg-gray-50 dark:bg-[#222230] border rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none ${
                                  q.correctOptionIndex === oIdx
                                    ? "border-green-500 focus:border-green-600"
                                    : "border-gray-100 dark:border-transparent focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", oIdx)}
                                className={`px-3 rounded-xl text-[10px] font-black transition-all border ${
                                  q.correctOptionIndex === oIdx
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                                }`}
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
                            className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                              q.correctOptionIndex === 0
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            صح
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", 1)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                              q.correctOptionIndex === 1
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-[#2D2D3D] text-gray-500 hover:bg-gray-100"
                            }`}
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
                    )}

                    {/* Additional fields: points and explanation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-50 dark:border-[#2D2D3D]/30 pt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400">الدرجة (النجوم)</label>
                        <input
                          type="number"
                          min={1}
                          value={q.points}
                          onChange={(e) => handleUpdateQuestionField(qIdx, "points", Number(e.target.value))}
                          className="w-full p-2 bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-900"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400">تفسير الإجابة وشرحها المبسط (يظهر للطالب بعد تسليم الحل)</label>
                        <input
                          type="text"
                          value={q.explanation || ""}
                          onChange={(e) => handleUpdateQuestionField(qIdx, "explanation", e.target.value)}
                          placeholder="مثال: الفولت هو وحدة قياس القوة الدافعة الكهربية لأن..."
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
          <div className="p-6 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center bg-white dark:bg-[#1A1A24]">
            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
              يرجى حفظ التغييرات لتفعيل الامتحان للطلاب فوراً.
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
                {saving ? "جاري الحفظ..." : "حفظ ونشر الامتحان 🚀"}
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showBankModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#1A1A24] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-5 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between bg-gray-50/50 dark:bg-[#0D0D12]/30 shrink-0">
                  <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <span>استيراد من بنك الأسئلة</span>
                  </h3>
                  <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2D2D3D]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-5">
                  {loadingBanks ? (
                    <div className="py-10 text-center text-gray-500 font-bold text-sm">جاري التحميل...</div>
                  ) : banksList.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 font-bold text-sm">لا يوجد لديك بنوك أسئلة حالياً.</div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 dark:text-gray-300">اختر بنك الأسئلة <span className="text-red-500">*</span></label>
                        <select
                          value={selectedBankId}
                          onChange={e => {
                            setSelectedBankId(e.target.value);
                            setSelectedManualQuestionIds(new Set());
                          }}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="" disabled>-- اختر من بنوك الأسئلة --</option>
                          {banksList.map(b => (
                            <option key={b.id} value={b.id}>{b.title} ({b.questions?.length || 0} أسئلة)</option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedBankId && (
                        <div className="flex p-1 bg-gray-100 dark:bg-[#0D0D12] rounded-xl mb-4">
                          <button
                            type="button"
                            onClick={() => setImportMode('random')}
                            className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition-all ${importMode === 'random' ? 'bg-white dark:bg-[#2D2D3D] text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            اختيار عشوائي
                          </button>
                          <button
                            type="button"
                            onClick={() => setImportMode('manual')}
                            className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition-all ${importMode === 'manual' ? 'bg-white dark:bg-[#2D2D3D] text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            تحديد يدوي
                          </button>
                        </div>
                      )}

                      {importMode === 'random' && selectedBankId ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-gray-700 dark:text-gray-300">عدد الأسئلة المطلوبة</label>
                            <input
                              type="number"
                              min="1"
                              value={numQuestionsToImport}
                              onChange={e => setNumQuestionsToImport(parseInt(e.target.value) || 1)}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                            <input
                              type="checkbox"
                              id="excludeUsed"
                              checked={excludeUsedQuestions}
                              onChange={e => setExcludeUsedQuestions(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="excludeUsed" className="text-xs font-bold text-blue-800 dark:text-blue-300 cursor-pointer">
                              استبعاد الأسئلة التي تم استخدامها مسبقاً
                            </label>
                          </div>
                        </>
                      ) : importMode === 'manual' && selectedBankId ? (
                        <div className="mt-4 border border-gray-200 dark:border-[#2D2D3D] rounded-xl overflow-hidden max-h-[300px] flex flex-col">
                           <div className="p-3 bg-gray-50 dark:bg-[#0D0D12] border-b border-gray-200 dark:border-[#2D2D3D] flex justify-between items-center shrink-0">
                             <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                               تم تحديد {selectedManualQuestionIds.size} سؤال
                             </span>
                             <button
                               type="button"
                               onClick={() => {
                                  const bank = banksList.find(b => b.id === selectedBankId);
                                  if (!bank) return;
                                  if (selectedManualQuestionIds.size === bank.questions?.length) {
                                    setSelectedManualQuestionIds(new Set());
                                  } else {
                                    setSelectedManualQuestionIds(new Set(bank.questions?.map((q: any) => q.id) || []));
                                  }
                               }}
                               className="text-xs text-emerald-600 font-bold hover:underline"
                             >
                               {selectedManualQuestionIds.size === banksList.find(b => b.id === selectedBankId)?.questions?.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                             </button>
                           </div>
                           <div className="overflow-y-auto p-2 space-y-2">
                             {banksList.find(b => b.id === selectedBankId)?.questions?.map((q: any, idx: number) => (
                               <div 
                                 key={q.id}
                                 onClick={() => {
                                   const newSet = new Set(selectedManualQuestionIds);
                                   if (newSet.has(q.id)) newSet.delete(q.id);
                                   else newSet.add(q.id);
                                   setSelectedManualQuestionIds(newSet);
                                 }}
                                 className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedManualQuestionIds.has(q.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#1A1A24]'}`}
                               >
                                 <input
                                   type="checkbox"
                                   checked={selectedManualQuestionIds.has(q.id)}
                                   readOnly
                                   className="mt-1 shrink-0 w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                                 />
                                 <div>
                                   <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2">{q.text}</p>
                                   <div className="flex gap-2 mt-1">
                                      <span className="text-[10px] text-gray-500 bg-white dark:bg-[#2D2D3D] px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                                        سؤال {idx + 1}
                                      </span>
                                      {pastUsedQuestionIds.has(q.id) && (
                                        <span className="text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                                          مستخدم سابقاً
                                        </span>
                                      )}
                                   </div>
                                 </div>
                               </div>
                             ))}
                             {(!banksList.find(b => b.id === selectedBankId)?.questions || banksList.find(b => b.id === selectedBankId)?.questions?.length === 0) && (
                               <div className="text-center p-4 text-xs font-bold text-gray-500">لا يوجد أسئلة في هذا البنك</div>
                             )}
                           </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="p-5 border-t border-gray-100 dark:border-[#2D2D3D] flex gap-3 shrink-0 bg-gray-50/50 dark:bg-[#0D0D12]/30">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-black hover:bg-gray-300 dark:hover:bg-[#3D3D4D] transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleImportFromBank}
                    disabled={loadingBanks || !selectedBankId || (importMode === 'manual' && selectedManualQuestionIds.size === 0)}
                    className="flex-[2] px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <span>{importMode === 'manual' ? `استيراد المحدد (${selectedManualQuestionIds.size})` : 'استيراد عشوائي الآن'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
