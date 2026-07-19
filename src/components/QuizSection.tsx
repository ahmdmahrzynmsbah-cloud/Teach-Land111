import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, BookOpen, Check, CheckCircle2, Clock, Edit2, HelpCircle, List, 
  Loader2, Plus, RefreshCw, Save, Settings, Trash2, Users, X, 
  AlertCircle, ArrowRight, ArrowLeft, History, Trophy, Eye, ChevronRight, ChevronLeft, AlertTriangle, Shield
} from 'lucide-react';
import { doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, query, where, collection, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Question, Quiz, QuizSubmission } from '../types';
import { toast } from 'react-hot-toast';
import LuxuriousLoader from './LuxuriousLoader';

interface QuizSectionProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  userData: User;
  isTeacher: boolean;
}

export default function QuizSection({ courseId, lessonId, lessonTitle, userData, isTeacher }: QuizSectionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  
  // Teacher Admin state
  const [isEditing, setIsEditing] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(0); // in minutes
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<QuizSubmission[]>([]);
  const [activeTeacherTab, setActiveTeacherTab] = useState<'edit' | 'grades'>('edit');
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [selectedStudentAnswers, setSelectedStudentAnswers] = useState<QuizSubmission | null>(null);
  const [quizIsHidden, setQuizIsHidden] = useState(false);

  // Student taking state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [unansweredQuestionsCount, setUnansweredQuestionsCount] = useState(0);
  const [infractions, setInfractions] = useState(0);
  const [showInfractionWarning, setShowInfractionWarning] = useState(false);
  
  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const quizStartTimeRef = useRef<number>(0);

  // Load Quiz & Submission Data
  useEffect(() => {
    const fetchQuizAndSubmissions = async () => {
      if (!lessonId) return;
      setLoading(true);
      setQuizStarted(false);
      setReviewMode(false);
      setIsEditing(false);
      setSelectedStudentAnswers(null);
      
      try {
        // 1. Fetch Quiz for this lesson
        const q = query(collection(db, 'quizzes'), where('lessonId', '==', lessonId));
        const quizSnap = await getDocs(q);
        
        if (!quizSnap.empty) {
          const quizDoc = quizSnap.docs[0];
          const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          setQuiz(quizData);
          setQuizTitle(quizData.title);
          setQuizDesc(quizData.description || '');
          setQuizTimeLimit(quizData.timeLimit || 0);
          setQuestions(quizData.questions || []);
          setQuizIsHidden(quizData.isHidden || false);
          
          // 2. Fetch current student's submission for this quiz
          if (!isTeacher) {
            const subDocId = `${userData.id}_${quizDoc.id}`;
            const subDoc = await getDoc(doc(db, 'quiz_submissions', subDocId));
            if (subDoc.exists()) {
              setSubmission({ id: subDoc.id, ...subDoc.data() } as QuizSubmission);
            } else {
              setSubmission(null);
            }
          } else {
            // 3. If teacher, fetch all student submissions for this quiz
            const subsQ = query(collection(db, 'quiz_submissions'), where('quizId', '==', quizDoc.id));
            const subsSnap = await getDocs(subsQ);
            const fetchedSubs: QuizSubmission[] = [];
            subsSnap.forEach((doc) => {
              fetchedSubs.push({ id: doc.id, ...doc.data() } as QuizSubmission);
            });
            fetchedSubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setAllSubmissions(fetchedSubs);
          }
        } else {
          setQuiz(null);
          setSubmission(null);
          setQuizIsHidden(false);
          // Set defaults for creation
          setQuizTitle(`اختبار تفاعلي: ${lessonTitle}`);
          setQuizDesc('أجب عن الأسئلة التالية لقياس مدى فهمك للدرس.');
          setQuizTimeLimit(10);
          setQuestions([
            {
              id: 'q1',
              text: 'السؤال الأول هنا؟',
              options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
              correctOptionIndex: 0,
              explanation: 'هنا يكتب المعلم التفسير العلمي الصحيح لهذه الإجابة لمساعدة الطالب.',
              points: 5
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching quiz info:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات الاختبار');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndSubmissions();
  }, [lessonId, isTeacher, userData.id, lessonTitle]);

  // Timer Countdown logic
  useEffect(() => {
    if (quizStarted && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            toast.error('انتهى الوقت المحدد للاختبار! سيتم تسليم الإجابات تلقائياً.');
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, timeLeft]);

  // Tab change & window blur protection for interactive lesson quizzes
  useEffect(() => {
    if (!quizStarted) {
      setInfractions(0);
      setShowInfractionWarning(false);
      return;
    }

    const handleFocusLoss = () => {
      setInfractions((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          toast.error("تم رصد 3 محاولات خروج من الصفحة. تم تسليم الاختبار تلقائياً وإلغاء النتيجة!");
          submitQuizData(selectedAnswers, 3, true);
          setQuizStarted(false);
        } else {
          setShowInfractionWarning(true);
          toast(`⚠️ تنبيه: لا تغادر صفحة الاختبار! تم تسجيل مخالفة ${next}/3`, {
            icon: '⚠️',
          });
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    const handleBlur = () => {
      handleFocusLoss();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [quizStarted, selectedAnswers]);

  const handleStartQuiz = () => {
    if (!quiz || quiz.questions.length === 0) {
      toast.error('لا توجد أسئلة مضافة في هذا الاختبار بعد');
      return;
    }
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setReviewMode(false);
    setShowResultModal(false);
    setInfractions(0);
    setShowInfractionWarning(false);
    quizStartTimeRef.current = Date.now();
    
    if (quiz.timeLimit && quiz.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit * 60);
    } else {
      setTimeLeft(null);
    }
    setQuizStarted(true);
  };

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < (quiz?.questions.length || 1) - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  // Safe auto submit when timer hits 0
  const handleAutoSubmit = async () => {
    if (!quiz) return;
    setSubmittingQuiz(true);
    try {
      await submitQuizData(selectedAnswers);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleManualSubmit = () => {
    if (!quiz) return;
    
    // Check if some questions are unanswered
    const unansweredCount = quiz.questions.filter(q => selectedAnswers[q.id] === undefined).length;
    setUnansweredQuestionsCount(unansweredCount);
    setShowSubmitConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!quiz) return;
    setShowSubmitConfirmModal(false);
    setSubmittingQuiz(true);
    try {
      await submitQuizData(selectedAnswers);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('فشل في إرسال إجابات الاختبار، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const submitQuizData = async (
    answers: Record<string, number>,
    infractionsCountParam?: number,
    cheatedViolationParam?: boolean
  ) => {
    if (!quiz) return;
    
    let correctCount = 0;
    let earnedPoints = 0;
    let totalQuizPoints = 0;

    quiz.questions.forEach((q) => {
      totalQuizPoints += q.points;
      const studentAns = answers[q.id];
      if (studentAns !== undefined && studentAns === q.correctOptionIndex) {
        correctCount++;
        earnedPoints += q.points;
      }
    });

    const calculatedPercentage = Math.round((earnedPoints / (totalQuizPoints || 1)) * 100);
    const passed = calculatedPercentage >= 50;

    const finalScore = cheatedViolationParam ? 0 : calculatedPercentage;
    const finalPassed = cheatedViolationParam ? false : passed;

    const subDocId = `${userData.id}_${quiz.id}`;
    const submissionData: QuizSubmission = {
      id: subDocId,
      userId: userData.id,
      userName: userData.name,
      quizId: quiz.id,
      courseId: courseId,
      lessonId: lessonId,
      score: finalScore,
      totalPoints: totalQuizPoints,
      correctAnswers: cheatedViolationParam ? 0 : correctCount,
      totalQuestions: quiz.questions.length,
      answers: answers,
      submittedAt: new Date().toISOString(),
      passed: finalPassed,
      infractionsCount: infractionsCountParam !== undefined ? infractionsCountParam : infractions,
      cheatedViolation: cheatedViolationParam || false
    };

    // Save to Firestore
    await setDoc(doc(db, 'quiz_submissions', subDocId), submissionData);
    setSubmission(submissionData);
    setQuizStarted(false);
    setReviewMode(true);
    setShowResultModal(true);

    // Reward student points in their profile if they passed or got a high score
    if (finalPassed && !cheatedViolationParam) {
      try {
        const bonusPoints = earnedPoints;
        await updateDoc(doc(db, 'users', userData.id), {
          points: increment(bonusPoints)
        });
        toast.success(`أحسنت صنعاً! تم إضافة ${bonusPoints} نجمة إلى رصيد تميزك! 🏆`);
      } catch (err) {
        console.error('Error rewarding points:', err);
      }
    } else if (cheatedViolationParam) {
      toast.error('تم إلغاء نتيجة الاختبار وتصفير الدرجة لمغادرتك الصفحة المتكرر.');
    } else {
      toast.success('تم تسليم الاختبار بنجاح، يمكنك الآن مراجعة الأخطاء والتفسير العلمي لكل سؤال.');
    }
  };

  // Teacher actions: Edit/Add Questions
  const handleAddQuestion = (type: 'multiple_choice' | 'true_false' | 'essay' = 'multiple_choice') => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let newQ: Question = {
      id: newId,
      text: 'اكتب نص السؤال هنا...',
      type,
      options: [],
      correctOptionIndex: 0,
      explanation: 'اكتب التوضيح العلمي والتفسير هنا لحل هذا السؤال بالتفصيل.',
      points: 5
    };
    if (type === 'multiple_choice') {
      newQ.options = ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'];
    } else if (type === 'true_false') {
      newQ.options = ['صح', 'خطأ'];
    } else if (type === 'essay') {
      newQ.correctAnswer = '';
    }
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      toast.error('يجب أن يحتوي الاختبار على سؤال واحد على الأقل.');
      return;
    }
    const filtered = questions.filter((_, i) => i !== idx);
    setQuestions(filtered);
  };

  const handleUpdateQuestionField = (idx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIdx].options];
    newOptions[optIdx] = val;
    updated[qIdx] = {
      ...updated[qIdx],
      options: newOptions
    };
    setQuestions(updated);
  };

  const handleSaveQuizByTeacher = async () => {
    if (!quizTitle.trim()) {
      toast.error('يرجى إدخال عنوان الاختبار.');
      return;
    }

    setSavingQuiz(true);
    try {
      const quizId = quiz?.id || `quiz_${lessonId}`;
      const updatedQuiz: Partial<Quiz> = {
        courseId,
        lessonId,
        title: quizTitle,
        description: quizDesc,
        questions: questions,
        timeLimit: Number(quizTimeLimit) || 0,
        createdBy: userData.id,
        createdAt: quiz?.createdAt || new Date().toISOString(),
        isHidden: quizIsHidden
      };

      await setDoc(doc(db, 'quizzes', quizId), updatedQuiz);
      
      const saved: Quiz = {
        id: quizId,
        ...updatedQuiz
      } as Quiz;
      
      setQuiz(saved);
      setIsEditing(false);
      toast.success('تم حفظ وتفعيل الاختبار بنجاح! يمكن للطلاب الآن البدء في الحل.');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('حدث خطأ أثناء حفظ الاختبار.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    const confirmDelete = window.confirm('هل أنت متأكد تماماً من رغبتك في حذف هذا الاختبار نهائياً وكل درجات الطلاب المسجلة به؟');
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'quizzes', quiz.id));
      
      // Delete submissions linked to this quiz
      const subsQ = query(collection(db, 'quiz_submissions'), where('quizId', '==', quiz.id));
      const subsSnap = await getDocs(subsQ);
      for (const d of subsSnap.docs) {
        await deleteDoc(doc(db, 'quiz_submissions', d.id));
      }

      setQuiz(null);
      setQuestions([]);
      setSubmission(null);
      setAllSubmissions([]);
      setIsEditing(false);
      toast.success('تم حذف الاختبار وكل سجلات درجات الطلاب بنجاح.');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('فشل في حذف الاختبار.');
    } finally {
      setLoading(false);
    }
  };

  // Formatting helpers for displaying time remaining
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Alphabet markers for MCQ choices in Arabic
  const optionMarkers = ['أ', 'ب', 'ج', 'د'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LuxuriousLoader size="md" text="جاري تحميل الاختبار التفاعلي..." />
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEACHER DASHBOARD VIEW (Edit & Submissions)
  // -------------------------------------------------------------
  if (isTeacher) {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        {/* Toggle between tabs */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-[#0D0D12] p-1.5 rounded-xl border border-gray-200 dark:border-[#2D2D3D]">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTeacherTab('edit'); setSelectedStudentAnswers(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                activeTeacherTab === 'edit'
                  ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              تعديل الأسئلة والاختبار
            </button>
            <button
              onClick={() => { setActiveTeacherTab('grades'); setSelectedStudentAnswers(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                activeTeacherTab === 'grades'
                  ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              درجات الطلاب ({allSubmissions.length})
            </button>
          </div>
          
          {quiz && (
            <button
              onClick={handleDeleteQuiz}
              className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف الاختبار بالكامل
            </button>
          )}
        </div>

        {/* Tab content 1: Edit Quiz */}
        {activeTeacherTab === 'edit' && (
          <div className="bg-gray-50 dark:bg-[#222230] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-[#2D2D3D]/60 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">إعدادات الاختبار العام للدرس</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">تحكم بأسئلة الامتحان، والوقت، وتفسير الإجابات</p>
              </div>
              {!isEditing && quiz ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  بدء التعديل
                </button>
              ) : (
                <div className="flex gap-2">
                  {quiz && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setQuizTitle(quiz.title);
                        setQuizDesc(quiz.description || '');
                        setQuizTimeLimit(quiz.timeLimit || 0);
                        setQuestions(quiz.questions);
                      }}
                      className="text-gray-500 dark:text-gray-400 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#2D2D3D]"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                  <button
                    onClick={handleSaveQuizByTeacher}
                    disabled={savingQuiz}
                    className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    {savingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    حفظ وتفعيل التغييرات
                  </button>
                </div>
              )}
            </div>

            {/* Inputs: Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300">عنوان الاختبار</label>
                <input
                  type="text"
                  disabled={!isEditing && !!quiz}
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="مثال: اختبار شامل على الفصل الأول"
                  className="w-full text-xs font-bold p-3 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300">وصف الاختبار وملاحظات للطالب</label>
                <input
                  type="text"
                  disabled={!isEditing && !!quiz}
                  value={quizDesc}
                  onChange={(e) => setQuizDesc(e.target.value)}
                  placeholder="مثال: يرجى حل الأسئلة بتركيز، مدة الاختبار محدودة"
                  className="w-full text-xs font-bold p-3 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300">مدة الاختبار بالدقائق (0 يعني غير محدد)</label>
                <div className="flex items-center bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="number"
                    min="0"
                    disabled={!isEditing && !!quiz}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    className="w-full text-xs font-bold p-3 bg-transparent border-none outline-none text-right"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox for Hide/Draft */}
            {(isEditing || !quiz) && (
              <div className="bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="quizIsHidden"
                  checked={quizIsHidden}
                  onChange={(e) => setQuizIsHidden(e.target.checked)}
                  className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] border-gray-300 dark:border-[#2D2D3D] rounded focus:ring-0 cursor-pointer accent-[#00B4D8] dark:accent-[#D4AF37]"
                />
                <div className="text-right flex-1">
                  <label htmlFor="quizIsHidden" className="text-xs font-black text-gray-800 dark:text-white cursor-pointer">
                    إخفاء هذا الاختبار مؤقتاً وحفظه كمسودة 🙈
                  </label>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                    عند تفعيل هذا الخيار، لن يتمكن الطلاب من رؤية أو بدء هذا الاختبار حتى تقوم بنشره وتوجيهه إليهم لاحقاً من لوحة التحكم الرئيسية للاختبارات.
                  </p>
                </div>
              </div>
            )}

            {/* Questions Builder */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <List className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                  قائمة الأسئلة ({questions.length})
                </h4>
                {(isEditing || !quiz) && (
                  <div className="flex flex-wrap gap-2">
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
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {questions.map((q, qIdx) => (
                  <div 
                    key={q.id} 
                    className="p-5 bg-white dark:bg-[#1C1C28] rounded-xl border border-gray-100 dark:border-[#2D2D3D] space-y-4 shadow-sm relative"
                  >
                    {/* Header of question */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black bg-gray-100 dark:bg-[#2D2D3D] px-3 py-1.5 rounded-lg text-[#0077B6] dark:text-[#D4AF37]">
                        السؤال {qIdx + 1}
                      </span>
                      {(isEditing || !quiz) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition-colors"
                          title="حذف هذا السؤال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Question text */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400">نص السؤال</label>
                      <textarea
                        disabled={!isEditing && !!quiz}
                        value={q.text}
                        onChange={(e) => handleUpdateQuestionField(qIdx, 'text', e.target.value)}
                        placeholder="اكتب هنا صيغة السؤال بوضوح..."
                        rows={2}
                        className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none resize-none"
                      />
                    </div>

                    {/* Question type rendering */}
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
                                className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border ${
                                  q.correctOptionIndex === optIdx
                                    ? 'bg-green-500 text-white border-green-500'
                                    : 'bg-white dark:bg-[#1A1A24] text-gray-400 border-gray-300 dark:border-gray-600 hover:border-green-500'
                                }`}
                                title="تحديد كإجابة صحيحة"
                              >
                                {q.correctOptionIndex === optIdx ? <Check className="w-3.5 h-3.5" /> : optionMarkers[optIdx]}
                              </button>
                              <input
                                type="text"
                                disabled={!isEditing && !!quiz}
                                value={opt}
                                onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                placeholder={`الخيار ${optionMarkers[optIdx]}`}
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
                            className={`flex-1 py-3 rounded-xl font-bold transition-all border text-sm ${
                              q.correctOptionIndex === 0
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-200 dark:border-[#2D2D3D] text-gray-500"
                            }`}
                          >
                            صح
                          </button>
                          <button
                            type="button"
                            disabled={!isEditing && !!quiz}
                            onClick={() => handleUpdateQuestionField(qIdx, "correctOptionIndex", 1)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all border text-sm ${
                              q.correctOptionIndex === 1
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-gray-50 dark:bg-[#222230] border-gray-200 dark:border-[#2D2D3D] text-gray-500"
                            }`}
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
                    )}

                    {/* Scientific Explanation & Points */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">التفسير العلمي وطريقة الحل (يظهر للطالب بعد الحل)</label>
                        <input
                          type="text"
                          disabled={!isEditing && !!quiz}
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestionField(qIdx, 'explanation', e.target.value)}
                          placeholder="مثال: طبقاً لقانون أوم، المقاومة تتناسب عكسياً مع التيار عند ثبوت الجهد..."
                          className="w-full text-xs font-medium p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">نجوم السؤال</label>
                        <input
                          type="number"
                          min="1"
                          disabled={!isEditing && !!quiz}
                          value={q.points}
                          onChange={(e) => handleUpdateQuestionField(qIdx, 'points', Number(e.target.value) || 5)}
                          className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Admin Actions */}
            {(isEditing || !quiz) && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-800">
                <button
                  onClick={handleSaveQuizByTeacher}
                  disabled={savingQuiz}
                  className="bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] text-white text-sm px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 flex items-center gap-2 hover:opacity-90"
                >
                  {savingQuiz ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  حفظ وتفعيل هذا الاختبار الآن
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab content 2: Student Submissions */}
        {activeTeacherTab === 'grades' && (
          <div className="bg-gray-50 dark:bg-[#222230] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">سجلات تسليمات الطلاب للدرجات</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">استعرض من قام بحل هذا الامتحان، درجاتهم، وإجاباتهم التفصيلية</p>
            </div>

            {selectedStudentAnswers ? (
              // View detailed questions answered by a specific student
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white dark:bg-[#1C1C28] p-4 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold block">إجابات الطالب المتقدّم:</span>
                    <h4 className="font-black text-base text-gray-900 dark:text-white">{selectedStudentAnswers.userName}</h4>
                    
                    <div className="mt-2">
                      {selectedStudentAnswers.cheatedViolation ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950/50 font-black flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          تم إلغاء الاختبار تلقائياً وتسجيل تقرير غش لمغادرة الصفحة 3 مرات 🛑
                        </span>
                      ) : selectedStudentAnswers.infractionsCount && selectedStudentAnswers.infractionsCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/30 font-black flex items-center gap-1 w-fit">
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                          تم رصد {selectedStudentAnswers.infractionsCount} محاولات خروج وتغيير تبويب صفحة الاختبار ⚠️
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 font-black flex items-center gap-1 w-fit">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          بيئة آمنة: لم يقم الطالب بأي محاولات للخروج من صفحة الاختبار 🔒
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left font-sans">
                      <div className="text-lg font-black text-[#00B4D8] dark:text-[#D4AF37]">{selectedStudentAnswers.score}%</div>
                      <div className="text-[10px] text-gray-400 font-bold">{selectedStudentAnswers.correctAnswers} من {selectedStudentAnswers.totalQuestions} إجابات صحيحة</div>
                    </div>
                    <button
                      onClick={() => setSelectedStudentAnswers(null)}
                      className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-[#2D2D3D] px-3 py-2 rounded-lg hover:bg-gray-200"
                    >
                      عودة لجدول الدرجات
                    </button>
                  </div>
                </div>

                {/* Submissions QA breakdown */}
                <div className="space-y-4">
                  {quiz?.questions.map((q, idx) => {
                    const studentChoice = selectedStudentAnswers.answers[q.id];
                    const isCorrect = studentChoice !== undefined && studentChoice === q.correctOptionIndex;
                    
                    return (
                      <div key={q.id} className="p-4 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2D3D] rounded-xl space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-xs font-black bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">
                            سؤال {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-400 font-sans">
                            {isCorrect ? `${q.points} من ${q.points} نجوم` : '0 من 0 نجوم'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">{q.text}</p>
                        
                        {/* Choices with color states */}
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
                                <div key={optIdx} className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${btnStyle}`}>
                                  <span className="flex items-center gap-2">
                                    {q.type !== 'true_false' && <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-sans">{optionMarkers[optIdx]}</span>}
                                    {opt}
                                  </span>
                                  {isCorrectAns && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                  {isSelectedByStudent && !isCorrectAns && <X className="w-4 h-4 text-red-500" />}
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
                        )}
                        {q.explanation && (
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 border-r-2 border-[#00B4D8] dark:border-[#D4AF37] p-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                            <strong>💡 التفسير العلمي: </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Table grid of students who finished
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 dark:bg-[#2D2D3D] text-gray-500 dark:text-gray-400 font-black">
                    <tr>
                      <th className="p-4">اسم الطالب</th>
                      <th className="p-4">النتيجة</th>
                      <th className="p-4">إجابات صحيحة</th>
                      <th className="p-4">الحالة الأكاديمية</th>
                      <th className="p-4">حماية التبويب 🔒</th>
                      <th className="p-4">تاريخ التسليم</th>
                      <th className="p-4 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D] font-bold">
                    {allSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-gray-400">
                          لا توجد تسليمات مسجلة لهذا الاختبار من الطلاب حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      allSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#222230]">
                          <td className="p-4 text-gray-900 dark:text-white font-black">{sub.userName}</td>
                          <td className="p-4 font-sans text-sm text-[#00B4D8] dark:text-[#D4AF37]">{sub.score}%</td>
                          <td className="p-4 font-sans text-sm">{sub.correctAnswers} / {sub.totalQuestions}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] ${
                              sub.passed 
                                ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            }`}>
                              {sub.passed ? 'ناجح وممتاز' : 'يحتاج لمراجعة'}
                            </span>
                          </td>
                          <td className="p-4">
                            {sub.cheatedViolation ? (
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 text-[10px] font-black flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                محاولة ملغاة (غش) 🛑
                              </span>
                            ) : sub.infractionsCount && sub.infractionsCount > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/30 text-[10px] font-black flex items-center gap-1 w-fit">
                                <Shield className="w-3.5 h-3.5 text-amber-500" />
                                {sub.infractionsCount} مخالفات خروج ⚠️
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 text-[10px] font-black flex items-center gap-1 w-fit">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                آمن بالكامل ✅
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-sans text-gray-400 dark:text-gray-500">
                            {new Date(sub.submittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedStudentAnswers(sub)}
                              className="text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg hover:opacity-80 transition-all"
                            >
                              عرض الإجابات التفصيلية
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STUDENT VIEW (Taking or Reviewing Quiz)
  // -------------------------------------------------------------
  if (!quiz) {
    return (
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 border border-gray-100 dark:border-[#2D2D3D] text-center py-12" dir="rtl">
        <HelpCircle className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 opacity-40 mb-3" />
        <h3 className="font-black text-gray-900 dark:text-white text-base">لا يوجد اختبار متاح لهذا الدرس</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">يقوم المعلم بوضع الاختبارات والأسئلة لتقييم الطلاب قريباً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <AnimatePresence mode="wait">
        {/* State A: Start Dashboard (Not Started, showing stats or last submission) */}
        {!quizStarted && !reviewMode && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#2D2D3D] space-y-6"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] rounded-full text-[10px] font-black">
                    اختبار تفاعلي سريع
                  </span>
                  {quiz.timeLimit ? (
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-bold font-sans">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.timeLimit} دقيقة
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{quiz.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{quiz.description}</p>
              </div>

              <button
                onClick={() => {
                  if (!quiz || quiz.questions.length === 0) {
                    toast.error('لا توجد أسئلة مضافة في هذا الاختبار بعد');
                    return;
                  }
                  navigate(`/exam/${quiz.id}?retake=true`);
                }}
                className="bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:opacity-90 transition-all shrink-0 w-full sm:w-auto text-center cursor-pointer"
              >
                {submission ? 'إعادة محاولة الاختبار' : 'بدء الاختبار التفاعلي الآن'}
              </button>
            </div>

            {/* Previous Submission Box */}
            {submission ? (
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-right w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    submission.passed 
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                  }`}>
                    {submission.passed ? <Trophy className="w-8 h-8" /> : <Award className="w-8 h-8" />}
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">محاولتك الأخيرة المسجلة:</span>
                    <h4 className="font-black text-base text-gray-900 dark:text-white">
                      درجتك: <span className="font-sans text-lg">{submission.score}%</span> - {submission.passed ? 'ناجح!' : 'تحتاج لمراجعة الدرس'}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-sans mt-0.5">
                      التاريخ: {new Date(submission.submittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/exam/${quiz.id}`)}
                  className="bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] text-gray-700 dark:text-gray-300 text-xs font-black px-6 py-3 rounded-xl transition-all w-full md:w-auto text-center cursor-pointer"
                >
                  استعراض الأسئلة وشرح الإجابات
                </button>
              </div>
            ) : (
              // Features list
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#222230]/50 border border-gray-100 dark:border-[#2D2D3D]/50 space-y-1">
                  <HelpCircle className="w-6 h-6 mx-auto text-[#00B4D8] dark:text-[#D4AF37]" />
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">قياس دقيق للفهم</h4>
                  <p className="text-[10px] text-gray-500">أسئلة تفاعلية ومدروسة تم اختيارها من قبل المعلم.</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#222230]/50 border border-gray-100 dark:border-[#2D2D3D]/50 space-y-1">
                  <Award className="w-6 h-6 mx-auto text-[#00B4D8] dark:text-[#D4AF37]" />
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">نجوم إضافية</h4>
                  <p className="text-[10px] text-gray-500">احصل على نجوم إضافية في رصيد تميزك عند تخطي 50%.</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-[#222230]/50 border border-gray-100 dark:border-[#2D2D3D]/50 space-y-1">
                  <BookOpen className="w-6 h-6 mx-auto text-[#00B4D8] dark:text-[#D4AF37]" />
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">التفسير العلمي الفوري</h4>
                  <p className="text-[10px] text-gray-500">تعرف على سبب صحة الإجابة بالتفصيل فور إكمال الاختبار.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* State B: Active Quiz Taking Mode */}
        {quizStarted && (
          <motion.div
            key="active-quiz"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#2D2D3D] space-y-6"
          >
            {/* Active Quiz Header / Timer */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-b border-gray-100 dark:border-[#2D2D3D]/60 pb-3">
              <div className="space-y-0.5 text-right w-full sm:w-auto">
                <span className="text-[10px] text-[#00B4D8] dark:text-[#D4AF37] font-black">جاري حل الاختبار الآن</span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">{quiz.title}</h3>
              </div>

              {/* Elegant Protection Badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/35 rounded-xl">
                <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" />
                <div className="text-right">
                  <p className="text-[8px] text-indigo-600 dark:text-indigo-400 font-black leading-none">نظام مراقبة التبويب نشط 🔒</p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-300 font-bold mt-0.5">
                    الخروج من الصفحة: <span className={infractions > 0 ? "text-red-500 font-black" : "text-emerald-500 font-black"}>{infractions} / 3</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bars */}
            <div className="space-y-4 mb-2 mt-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-black text-gray-500 dark:text-gray-400">
                  <span>الأسئلة المُجاب عليها ({Object.keys(selectedAnswers).length} من {quiz.questions.length})</span>
                  <span>{Math.round((Object.keys(selectedAnswers).length / quiz.questions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-[#0D0D12] rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-800">
                  <div 
                    className="h-full bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] transition-all duration-300"
                    style={{ width: `${(Object.keys(selectedAnswers).length / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>
              
              {timeLeft !== null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-black text-gray-500 dark:text-gray-400">
                    <span>الوقت المتبقي</span>
                    <span dir="ltr">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-[#0D0D12] rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-800">
                    <div 
                      className={`h-full transition-all duration-1000 ${timeLeft < 120 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-l from-green-400 to-green-600'}`}
                      style={{ width: `${(timeLeft / ((quiz.timeLimit || 30) * 60)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Question card */}
            <div className="space-y-4">
              <div className="p-5 sm:p-6 bg-gray-50 dark:bg-[#222230] rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <span className="text-[10px] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-2 py-1 rounded-md font-bold mb-3 inline-block">
                  {quiz.questions[currentQuestionIdx].points} نجوم
                </span>
                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-relaxed">
                  {quiz.questions[currentQuestionIdx].text}
                </p>
              </div>

              {/* MCQs Option Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quiz.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[quiz.questions[currentQuestionIdx].id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectAnswer(quiz.questions[currentQuestionIdx].id, optIdx)}
                      className={`p-4 rounded-xl text-xs font-black text-right border transition-all flex items-center justify-between gap-3 group relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border-[#00B4D8] dark:border-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37] shadow-md shadow-[#00B4D8]/5 dark:shadow-[#D4AF37]/5'
                          : 'bg-gray-50 dark:bg-[#222230] border-gray-200/80 dark:border-[#2D2D3D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d3d] hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg font-sans font-black text-xs flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white'
                            : 'bg-gray-200 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-400 group-hover:bg-[#00B4D8]/20 dark:group-hover:bg-[#D4AF37]/20 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]'
                        }`}>
                          {optionMarkers[optIdx]}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Back / Next actions */}
            <div className="flex justify-between items-center border-t border-gray-100 dark:border-[#2D2D3D]/50 pt-4">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed py-2 px-3 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
                السؤال السابق
              </button>

              {currentQuestionIdx === quiz.questions.length - 1 ? (
                <button
                  onClick={handleManualSubmit}
                  disabled={submittingQuiz}
                  className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  {submittingQuiz ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  إنهاء وتصحيح الاختبار
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] hover:opacity-85 py-2 px-4 rounded-xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10"
                >
                  السؤال التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* State B Infraction Warning Modal */}
        {showInfractionWarning && infractions < 3 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setShowInfractionWarning(false)}
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-[#12121A] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-500/30 space-y-6 text-center z-10"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-lg font-black text-red-650 dark:text-red-400">⚠️ تحذير: تم كشف مغادرة صفحة الاختبار!</h3>
                <p className="text-xs text-gray-400 font-bold">نظام الحماية وقفل التبويب الإلكتروني</p>
              </div>

              <div className="space-y-4 text-right bg-red-50/50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                <p className="text-xs text-gray-750 dark:text-gray-300 leading-relaxed font-bold font-sans">
                  لقد قمت بالخروج من تبويب أو نافذة الاختبار التفاعلي. هذا السلوك مخالف لتعليمات الامتحان الإلكتروني وقد يُعرضك لإلغاء النتيجة.
                </p>
                <div className="flex justify-between items-center text-xs font-black border-t border-red-100 dark:border-red-900/10 pt-3 mt-1">
                  <span className="text-gray-500">عدد المخالفات المسجلة:</span>
                  <span className="text-red-500 font-black text-sm">{infractions} من أصل 3 محاولات</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/10 rounded-xl text-[10px] text-amber-600 dark:text-amber-400 font-black text-right flex gap-1.5 items-start">
                <Shield className="w-3.5 h-3.5 shrink-0 animate-pulse mt-0.5" />
                <span>تنبيه هام: إذا وصلت المخالفات إلى 3، فسيقوم النظام تلقائياً بإنهاء الاختبار وتسليم إجاباتك الحالية فوراً مع تسجيل تقرير غش!</span>
              </div>

              <button
                onClick={() => setShowInfractionWarning(false)}
                className="w-full py-3.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-600/20 cursor-pointer"
              >
                أفهم ذلك، العودة لحل الاختبار ✍️
              </button>
            </motion.div>
          </div>
        )}

        {/* State C: Review Mode (Show submission results breakdown with full scientific explanations!) */}
        {reviewMode && submission && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Results Header Card */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#2D2D3D] space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                <div>
                  <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold block">تم تسليم وتصحيح الاختبار تلقائياً</span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">نتيجة محاولتك في الاختبار</h3>
                </div>
                <button
                  onClick={() => setReviewMode(false)}
                  className="text-xs font-bold text-[#00B4D8] dark:text-[#D4AF37] hover:underline"
                >
                  الرجوع للوحة الاختبار الرئيسية
                </button>
              </div>

              {/* Radial or score gauge breakdown */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-3">
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  {/* Circle background */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="transparent" strokeWidth="8" className="stroke-gray-100 dark:stroke-gray-800" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="48" 
                      fill="transparent" 
                      strokeWidth="8" 
                      className={submission.passed ? 'stroke-green-500' : 'stroke-red-500'}
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - submission.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center font-sans">
                    <span className="text-xl font-black text-gray-900 dark:text-white">{submission.score}%</span>
                    <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold">{submission.passed ? 'ناجح ومTeachland' : 'لم تتجاوز 50%'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 w-full sm:w-auto">
                  <div className="p-3 bg-gray-50 dark:bg-[#222230] rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">الإجابات الصحيحة</span>
                    <span className="text-base font-black text-green-500 font-sans">{submission.correctAnswers} / {submission.totalQuestions}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-[#222230] rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">النجوم المكتسبة</span>
                    <span className="text-base font-black text-[#00B4D8] dark:text-[#D4AF37] font-sans">+{submission.passed ? submission.score : 0} نجمة</span>
                  </div>
                </div>
              </div>

              {/* Infractions summary box for student */}
              {(submission.infractionsCount !== undefined || submission.cheatedViolation) && (
                <div className={`p-3 rounded-xl text-xs font-black text-right flex gap-2 items-start border w-full ${
                  submission.cheatedViolation
                    ? "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
                    : (submission.infractionsCount || 0) > 0
                      ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-[11px]">مؤشرات الأمان ومصداقية حل الدرس:</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-300 font-bold mt-0.5 leading-normal">
                      {submission.cheatedViolation
                        ? "تم إلغاء نتيجة هذا الاختبار تلقائياً وتصفير الدرجة بسبب الخروج من تبويب الصفحة 3 مرات غش."
                        : (submission.infractionsCount || 0) > 0
                          ? `تم رصد عدد ${submission.infractionsCount} محاولات خروج أو تغيير التبويب أثناء حل أسئلة الدرس.`
                          : "مصداقية أدائك كاملة 100%! لم يتم تسجيل أي خروج من صفحة الاختبار التفاعلي 👍"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 p-3.5 rounded-xl border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 text-xs">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                  يمكنك مراجعة كافة الأسئلة أدناه والاطلاع على التفسير والحل لكل سؤال.
                </span>
                <button
                  onClick={handleStartQuiz}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-4 py-2 rounded-xl font-black text-[10px] hover:opacity-90"
                >
                  إعادة الاختبار مجدداً
                </button>
              </div>
            </div>

            {/* Detailed questions explanations list */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                مراجعة الأخطاء والتفسير العلمي التفصيلي
              </h4>

              <div className="space-y-4">
                {quiz.questions.map((q, idx) => {
                  const studentChoice = submission.answers[q.id];
                  const isCorrect = studentChoice !== undefined && studentChoice === q.correctOptionIndex;
                  
                  return (
                    <div key={q.id} className="p-4 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2D3D] rounded-xl space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-black bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">
                          سؤال {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-400 font-sans">
                          {isCorrect ? `${q.points} من ${q.points} نجوم` : '0 من 0 نجوم'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-relaxed">{q.text}</p>
                      
                      {/* Choices with color states */}
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
                              <div key={optIdx} className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${btnStyle}`}>
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
                      )}

                      {/* Explanation box */}
                      {q.explanation && (
                        <div className="bg-blue-50/40 dark:bg-blue-950/20 border-r-2 border-[#00B4D8] dark:border-[#D4AF37] p-3 rounded-lg text-xs leading-relaxed text-gray-600 dark:text-gray-300 font-medium">
                          <strong className="text-blue-600 dark:text-[#D4AF37]">💡 التفسير والحل العلمي: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Notification Result Modal */}
      <AnimatePresence>
        {showResultModal && submission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-2xl overflow-hidden text-right flex flex-col max-h-[90vh]"
            >
              {/* Header Banner */}
              <div className={`p-6 text-white text-right relative overflow-hidden shrink-0 ${
                submission.passed
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                  : 'bg-gradient-to-r from-amber-600 to-orange-500'
              }`}>
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 translate-x-[-20%] translate-y-[-20%] opacity-10">
                  <Trophy className="w-48 h-48" />
                </div>
                
                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-block bg-white/20 text-white px-2.5 py-1 rounded-full text-[10px] font-black">
                      إشعار فوري بالنتيجة 🔔
                    </span>
                    <h3 className="text-xl font-black">
                      {submission.passed 
                        ? 'أحسنت يا بطل! لقد اجتزت الاختبار بنجاح 🎉' 
                        : 'محاولة جيدة! استمر في التعلم وسوف تتميز 💪'}
                    </h3>
                    <p className="text-xs text-white/90 leading-relaxed max-w-md">
                      {submission.passed
                        ? 'رائع جداً! لقد أظهرت فهماً ممتازاً لنجوم الدرس واستحقيت نجوم Teachland المضافة لرصيدك.'
                        : 'لا بأس بالخطأ، فهو طريق التعلم الأول. راجع التفسير العلمي المبسط أدناه لتجنب الأخطاء لاحقاً.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Score Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Score Gauge */}
                  <div className="p-4 bg-gray-50 dark:bg-[#222230] rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/50 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-black mb-2">نسبة النجاح</span>
                    <div className="relative w-16 h-16 flex items-center justify-center font-sans">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="transparent" strokeWidth="5" className="stroke-gray-100 dark:stroke-gray-800" />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="26" 
                          fill="transparent" 
                          strokeWidth="5" 
                          className={submission.passed ? 'stroke-emerald-500' : 'stroke-orange-500'}
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - submission.score / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-gray-900 dark:text-white">{submission.score}%</span>
                    </div>
                  </div>

                  {/* Correct count */}
                  <div className="p-4 bg-gray-50 dark:bg-[#222230] rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/50 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-black mb-1">الإجابات الصحيحة</span>
                    <span className="text-2xl font-black text-emerald-500 font-sans mt-1">
                      {submission.correctAnswers} <span className="text-xs text-gray-400">من {submission.totalQuestions}</span>
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">
                      {submission.totalQuestions - submission.correctAnswers} إجابات خاطئة
                    </span>
                  </div>

                  {/* Points Earned */}
                  <div className="p-4 bg-gray-50 dark:bg-[#222230] rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/50 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-black mb-1">نجوم Teachland المكتسبة</span>
                    <span className="text-2xl font-black text-[#00B4D8] dark:text-[#D4AF37] font-sans mt-1">
                      {submission.passed ? `+${submission.score}` : '0'}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">🏆 نجوم مضافة للملف</span>
                  </div>
                </div>

                {/* Corrections List Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-[#2D2D3D]">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    تقرير تصحيح الأخطاء التي وقعت فيها ومراجعتها علمياً:
                  </h4>

                  {/* Filter and display mistakes */}
                  {(() => {
                    const mistakes = quiz.questions.filter(q => {
                      const studentChoice = submission.answers[q.id];
                      return studentChoice === undefined || studentChoice !== q.correctOptionIndex;
                    });

                    if (mistakes.length === 0) {
                      return (
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center space-y-2">
                          <Trophy className="w-10 h-10 mx-auto text-emerald-500" />
                          <h5 className="text-xs font-black text-emerald-600 dark:text-emerald-400">عمل أسطوري لا يصدق!</h5>
                          <p className="text-[11px] text-gray-500">لقد أجبت على كافة الأسئلة بشكل صحيح 100%، لا توجد أخطاء لتصحيحها هنا.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {mistakes.map((q, mIdx) => {
                          const studentChoice = submission.answers[q.id];
                          const selectedOptionText = studentChoice !== undefined ? q.options[studentChoice] : 'لم يتم اختيار إجابة';
                          const correctOptionText = q.options[q.correctOptionIndex];

                          return (
                            <div 
                              key={q.id} 
                              className="p-4 bg-gray-50/50 dark:bg-[#1C1C28]/50 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black bg-red-500/10 text-red-500 px-2.5 py-1 rounded-lg">
                                  سؤال يحتاج لمراجعة #{mIdx + 1}
                                </span>
                                <span className="text-[10px] text-gray-400 font-sans font-bold">
                                  قيمة السؤال: {q.points} نجوم
                                </span>
                              </div>
                              
                              <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                                {q.text}
                              </p>

                              {/* QA selection comparison */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* Student Wrong Answer */}
                                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs">
                                  <span className="text-[9px] text-red-500 font-bold block mb-1">إجابتك التي اخترتها:</span>
                                  <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                                    <X className="w-4 h-4 shrink-0" />
                                    <span>{selectedOptionText}</span>
                                  </div>
                                </div>

                                {/* Correct Answer */}
                                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 text-xs">
                                  <span className="text-[9px] text-green-500 font-bold block mb-1">الإجابة الصحيحة علمياً:</span>
                                  <div className="flex items-center gap-1.5 font-bold text-green-600 dark:text-green-400">
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span>{correctOptionText}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Simplified Explanation */}
                              {q.explanation && (
                                <div className="bg-blue-50/40 dark:bg-blue-950/20 border-r-2 border-[#00B4D8] dark:border-[#D4AF37] p-3 rounded-lg text-xs leading-relaxed text-gray-600 dark:text-gray-300 font-medium">
                                  <strong className="text-[#0077B6] dark:text-[#D4AF37] block mb-1">💡 التفسير والشرح العلمي المبسط:</strong>
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-gray-50 dark:bg-[#151520] border-t border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center shrink-0">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                  * تم حفظ درجتك تلقائياً في قاعدة البيانات.
                </span>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="bg-gray-900 dark:bg-[#2D2D3D] hover:opacity-90 text-white text-xs px-6 py-2.5 rounded-xl font-black transition-colors"
                >
                  حسناً، إغلاق ومراجعة الأسئلة بالكامل
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Custom Confirmation Modal for Submitting Quiz */}
        {showSubmitConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100 dark:border-[#2D2D3D] text-right"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                تأكيد تسليم وإنهاء الاختبار 🏁
              </h3>

              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed mb-6">
                {unansweredQuestionsCount > 0 ? (
                  <p className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl font-bold border border-red-100 dark:border-red-900/30">
                    ⚠️ لقد تركت <span className="underline">{unansweredQuestionsCount} سؤالاً</span> بدون إجابة في هذا الاختبار! هل أنت متأكد من رغبتك في التسليم وتصحيح الاختبار مع احتساب هذه الأسئلة كإجابة خاطئة؟
                  </p>
                ) : (
                  <p>
                    لقد أجبت عن جميع الأسئلة بنجاح. هل أنت جاهز لإنهاء الاختبار وعرض النتيجة والتصحيح التلقائي فوراً؟
                  </p>
                )}
                <p className="text-[11px] text-gray-400 font-bold">
                  * بمجرد التأكيد، لن تتمكن من تعديل إجاباتك مرة أخرى وسيتم احتساب نتيجتك وحفظها تلقائياً.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-[#2D2D3D] hover:bg-gray-100 dark:hover:bg-[#323246] text-gray-700 dark:text-white text-xs font-bold rounded-xl transition-colors"
                >
                  تراجع، إكمال الاختبار
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-black rounded-xl transition-colors shadow-sm"
                >
                  نعم، إنهاء وتسليم الإجابات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
