import React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Play,
  Clock,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Award,
  CheckCircle,
  AlertTriangle,
  Home,
  BookOpenCheck,
  HelpCircle,
  Trophy,
  Shield,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { toast } from "react-hot-toast";
import LuxuriousLoader from "./LuxuriousLoader";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
}

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  // User & Exam state
  const [userData, setUserData] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active exam states
  const [examStarted, setExamStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [submitting, setSubmitting] = useState(false);

  // Tab lock and infractions state
  const [infractions, setInfractions] = useState(0);
  const [showInfractionWarning, setShowInfractionWarning] = useState(false);

  // Results state
  const [showResults, setShowResults] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Custom Confirmation Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Authenticate user & Fetch Exam
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);

        // Fetch exam
        if (!examId) {
          toast.error("مُعرّف الامتحان غير صالح.");
          navigate("/dashboard");
          return;
        }

        const examDoc = await getDoc(doc(db, "quizzes", examId));
        if (!examDoc.exists()) {
          toast.error("لم يتم العثور على هذا الامتحان.");
          navigate("/dashboard");
          return;
        }

        const examData: any = { id: examDoc.id, ...examDoc.data() };
        setExam(examData);
        setTimeLeft((examData.timeLimit || 30) * 60);

        // Check user session
        const currentUser = auth.currentUser;
        if (!currentUser) {
          // If no direct currentUser yet, wait slightly or redirect
          setTimeout(async () => {
            const recheckUser = auth.currentUser;
            if (!recheckUser) {
              toast.error("يرجى تسجيل الدخول أولاً للوصول إلى الامتحان.");
              navigate("/login");
            } else {
              const userSnap = await getDoc(doc(db, "users", recheckUser.uid));
              if (userSnap.exists()) {
                setUserData({ id: userSnap.id, ...userSnap.data() });
              }

              // Check for existing submission if not a force-retake
              const params = new URLSearchParams(window.location.search);
              if (params.get("retake") !== "true") {
                const subDoc = await getDoc(doc(db, "quiz_submissions", `${recheckUser.uid}_${examDoc.id}`));
                if (subDoc.exists()) {
                  setSubmissionResult(subDoc.data());
                  setShowResults(true);
                }
              }
            }
          }, 1000);
        } else {
          const userSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (userSnap.exists()) {
            setUserData({ id: userSnap.id, ...userSnap.data() });
          }

          // Check for existing submission if not a force-retake
          const params = new URLSearchParams(window.location.search);
          if (params.get("retake") !== "true") {
            const subDoc = await getDoc(doc(db, "quiz_submissions", `${currentUser.uid}_${examDoc.id}`));
            if (subDoc.exists()) {
              setSubmissionResult(subDoc.data());
              setShowResults(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading exam page:", error);
        toast.error("حدث خطأ أثناء تحميل بيانات الامتحان.");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [examId, navigate]);

  // 2. Timer countdown effect
  useEffect(() => {
    if (examStarted && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto submit when time runs out
            setTimeout(() => {
              handleAutoSubmit();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, timeLeft]);

  // 3. Prevent accidental page exit and tab switches (Anti-Cheat & Tab Lock)
  useEffect(() => {
    if (!examStarted || showResults) return;

    // Prevent closing/refreshing tab
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "هل أنت متأكد من رغبتك في الخروج؟ سيؤدي هذا إلى إلغاء محاولة الامتحان الجارية وفقدان درجاتك.";
      return e.returnValue;
    };

    // Track tab-switches (blur and visibilitychange)
    const handleVisibilityOrBlur = () => {
      if (document.hidden || !document.hasFocus()) {
        setInfractions((prev) => {
          const nextVal = prev + 1;
          if (nextVal >= 3) {
            setShowInfractionWarning(false);
            toast.error("تم إلغاء الامتحان وتسلّيمه تلقائياً بسبب تجاوزك عدد محاولات الخروج المسموح بها (3 محاولات)!");
            handleSubmit(undefined, true); // True indicates a forced submission due to cheating violation
            return nextVal;
          } else {
            setShowInfractionWarning(true);
            return nextVal;
          }
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityOrBlur);
    window.addEventListener("blur", handleVisibilityOrBlur);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityOrBlur);
      window.removeEventListener("blur", handleVisibilityOrBlur);
    };
  }, [examStarted, showResults, infractions]);

  const handleStart = () => {
    setExamStarted(true);
    toast.success("بدأ الامتحان الآن! بالتوفيق والنجاح 👍");
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async (overrideAnswers?: Record<string, number>, cheatedViolation = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const finalAnswers = overrideAnswers || selectedAnswers;
      const questionsList: Question[] = exam?.questions || [];

      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      questionsList.forEach((q) => {
        const selected = finalAnswers[q.id];
        const pts = Number(q.points) || 1;
        totalPoints += pts;
        if (selected !== undefined && selected === q.correctOptionIndex) {
          correctCount += 1;
          earnedPoints += pts;
        }
      });

      const percentScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = percentScore >= 50 && !cheatedViolation;

      const submissionId = `${userData.id}_${exam.id}`;
      const submissionData = {
        id: submissionId,
        userId: userData.id,
        userName: userData.name || "طالب",
        quizId: exam.id,
        courseId: exam.courseId || "",
        lessonId: exam.lessonId || "comprehensive",
        score: percentScore,
        totalPoints,
        correctAnswers: correctCount,
        totalQuestions: questionsList.length,
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
        passed,
        infractionsCount: infractions,
        cheatedViolation: cheatedViolation,
      };

      await setDoc(doc(db, "quiz_submissions", submissionId), submissionData);

      setSubmissionResult(submissionData);
      setShowResults(true);
      if (cheatedViolation) {
        toast.error("تم إنهاء الاختبار وتسليمه بتقرير مخالفة غش بسبب مغادرة الصفحة!");
      } else {
        toast.success("تم تسليم الامتحان وحفظ نتيجتك بنجاح! 🎉");
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      toast.error("فشل تسليم الامتحان. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error("انتهى الوقت المحدد للاختبار! يتم الآن تسليم إجاباتك تلقائياً...");
    handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <LuxuriousLoader fullScreen size="lg" text="جاري تجهيز بيئة الاختبار..." />;
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#0D0D15] text-gray-900 dark:text-white" dir="rtl">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold">عذراً، لم نتمكن من العثور على هذا الامتحان.</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-6 py-3 bg-[#00B4D8] hover:bg-[#0077B6] text-white font-bold rounded-2xl transition-colors"
        >
          العودة للوحة القيادة
        </button>
      </div>
    );
  }

  const questionsList: Question[] = exam.questions || [];
  const activeQuestion = questionsList[currentIdx];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090E] text-gray-900 dark:text-white flex flex-col" dir="rtl">
      {/* Top Header */}
      <header className="bg-white dark:bg-[#12121A] border-b border-gray-100 dark:border-[#1E1E2F] py-4 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black truncate max-w-[200px] sm:max-w-xs">{exam.title}</h1>
            <p className="text-[10px] text-gray-400 font-bold">بوابة الطالب للاختبارات التفاعلية</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (examStarted && !showResults) {
              setShowExitModal(true);
            } else {
              navigate("/dashboard");
            }
          }}
          className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-[#1A1A26] dark:hover:bg-[#252538] text-gray-400 dark:text-gray-300 transition-all flex items-center gap-1 text-xs font-black"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">العودة للرئيسية</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-5xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {/* 1. Results View */}
          {showResults && submissionResult ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white dark:bg-[#12121A] rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 dark:border-[#1E1E2F] text-center space-y-8"
            >
              <div className="max-w-md mx-auto space-y-6">
                <div
                  className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-xl ${
                    submissionResult.passed
                      ? "bg-green-100 dark:bg-green-950/30 text-green-500 shadow-green-500/10 animate-bounce"
                      : "bg-red-100 dark:bg-red-950/30 text-red-500 shadow-red-500/10"
                  }`}
                >
                  {submissionResult.passed ? <CheckCircle className="w-14 h-14" /> : <AlertTriangle className="w-14 h-14" />}
                </div>

                <div className="space-y-2">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black ${
                    submissionResult.passed
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}>
                    {submissionResult.passed ? "تم اجتياز الامتحان بنجاح 🎉" : "لم تجتز الامتحان هذه المرة ⚠️"}
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                    نتيجة اختبارك: {submissionResult.score}%
                  </h3>
                  <p className="text-xs text-gray-400 font-bold">
                    لقد أجبت بشكل صحيح على {submissionResult.correctAnswers} من أصل {submissionResult.totalQuestions} سؤال.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-[#1A1A26] p-5 rounded-2xl border border-gray-100 dark:border-[#222235]">
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">النجوم الإجمالية</p>
                    <p className="text-lg font-black text-[#00B4D8] dark:text-[#D4AF37]">
                      {submissionResult.totalPoints} نجوم
                    </p>
                  </div>
                  <div className="text-center space-y-0.5 border-r border-gray-200 dark:border-[#222235] pr-4">
                    <p className="text-[10px] text-gray-400 font-bold">تاريخ ووقت التقديم</p>
                    <p className="text-xs font-black text-gray-600 dark:text-gray-300">
                      {new Date(submissionResult.submittedAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>

                {/* Infractions Summary if present */}
                {(submissionResult.infractionsCount !== undefined || submissionResult.cheatedViolation) && (
                  <div className={`p-4 rounded-2xl text-xs font-black text-right flex gap-3 items-start border ${
                    submissionResult.cheatedViolation
                      ? "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
                      : (submissionResult.infractionsCount || 0) > 0
                        ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    <Shield className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-black text-xs">مؤشرات الأمان ومصداقية الاختبار:</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-300 font-bold mt-1 leading-relaxed">
                        {submissionResult.cheatedViolation
                          ? "تم إنهاء الاختبار وإغلاقه تلقائياً بسبب مغادرتك لصفحة الامتحان أكثر من العدد المسموح به (3 مخالفات خروج)."
                          : (submissionResult.infractionsCount || 0) > 0
                            ? `تم رصد عدد ${submissionResult.infractionsCount} محاولات خروج من الصفحة أو تغيير التبويب أثناء حل الاختبار.`
                            : "عمل ممتاز! لم يتم تسجيل أي محاولات خروج من صفحة الاختبار. مصداقية أدائك كاملة 100% 👍"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Review of Answers */}
              <div className="text-right space-y-6 pt-6 border-t border-gray-100 dark:border-[#1E1E2F]">
                <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                  تفاصيل الأسئلة والتقرير التفصيلي:
                </h4>

                <div className="space-y-4">
                  {questionsList.map((q, qIndex) => {
                    const studentAnswerIdx = submissionResult.answers[q.id];
                    const isCorrect = studentAnswerIdx !== undefined && studentAnswerIdx === q.correctOptionIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isCorrect
                            ? "bg-green-50/30 border-green-200 dark:bg-green-950/10 dark:border-green-900/30"
                            : "bg-red-50/30 border-red-200 dark:bg-red-950/10 dark:border-red-900/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-black text-xs text-gray-800 dark:text-white leading-relaxed">
                            {qIndex + 1}. {q.text}
                          </p>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 ${
                            isCorrect
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
                          </span>
                        </div>

                        {/* Options List with status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = studentAnswerIdx === optIdx;
                            const isCorrectAnswer = q.correctOptionIndex === optIdx;

                            let borderStyle = "border-gray-100 dark:border-gray-800/40";
                            let bgStyle = "bg-white/50 dark:bg-[#161623]/50";
                            let textStyle = "text-gray-500";

                            if (isCorrectAnswer) {
                              borderStyle = "border-green-500";
                              bgStyle = "bg-green-500/10 text-green-600 dark:text-green-400";
                              textStyle = "font-bold text-green-600 dark:text-green-400";
                            } else if (isSelected && !isCorrectAnswer) {
                              borderStyle = "border-red-500";
                              bgStyle = "bg-red-500/10 text-red-600 dark:text-red-400";
                              textStyle = "font-bold text-red-600 dark:text-red-400";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border text-right text-xs transition-colors ${borderStyle} ${bgStyle}`}
                              >
                                <span className={textStyle}>
                                  {opt}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="mt-4 p-3 bg-gray-100/50 dark:bg-[#1A1A2A] rounded-xl border border-gray-200/50 dark:border-gray-800/40 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            <span className="font-black text-gray-700 dark:text-white block mb-1">💡 تفسير وشرح الإجابة:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setCurrentIdx(0);
                    setShowResults(false);
                    setSubmissionResult(null);
                    setExamStarted(true);
                  }}
                  className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-650 text-white font-black rounded-2xl text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  إعادة محاولة حل الاختبار 🔁
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-8 py-3.5 bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] text-white font-black rounded-2xl text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  العودة للوحة قيادة الطالب 🏠
                </button>
              </div>
            </motion.div>
          ) : !examStarted ? (
            /* 2. Pre-Start Instructions Screen */
            <motion.div
              key="instructions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full bg-white dark:bg-[#12121A] rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 dark:border-[#1E1E2F] space-y-8 text-right"
            >
              <div className="border-b border-gray-100 dark:border-[#1E1E2F] pb-4 flex items-center justify-between">
                <div>
                  <span className="inline-block px-3 py-1 text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-full">
                    🏆 اختبار تفاعلي متاح الآن
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mt-2">{exam.title}</h2>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-bold">معلومات وتفاصيل الاختبار الشامل:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A26] rounded-2xl border border-gray-100 dark:border-[#1E1E2F] flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold">المدة الزمنية المحددة</p>
                      <p className="text-xs font-black text-gray-800 dark:text-white">{exam.timeLimit} دقيقة كاملة</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A26] rounded-2xl border border-gray-100 dark:border-[#1E1E2F] flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold">عدد الأسئلة الإجمالي</p>
                      <p className="text-xs font-black text-gray-800 dark:text-white">{questionsList.length} سؤال تفاعلي</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#00B4D8]/5 border-r-4 border-[#00B4D8] p-5 rounded-2xl space-y-3">
                  <p className="text-xs font-black text-[#0077B6] flex items-center gap-1.5">
                    ⚠️ تعليمات وملاحظات هامة جداً قبل البدء بالحل:
                  </p>
                  <ul className="text-[11px] text-gray-600 dark:text-gray-300 space-y-2 pl-4 list-disc font-medium">
                    <li>بمجرد النقر فوق زر البدء أدناه، سيبدأ المؤقت بالتنازل على الفور، ولا يمكن إيقافه مؤقتاً نهائياً.</li>
                    <li>يرجى التأكد من أن اتصال الإنترنت مستقر وقوي لمنع انقطاع الامتحان أو فشل رفع الإجابات.</li>
                    <li>عند نفاد الوقت، سيقوم النظام تلقائياً بجمع وتثبيت كل الإجابات التي قمت باختيارها وتقديم الاختبار بالنيابة عنك.</li>
                  </ul>
                </div>

                {exam.description && (
                  <div className="bg-gray-50 dark:bg-[#1D1D28] p-5 rounded-2xl text-xs text-gray-500 leading-relaxed font-bold border border-gray-100 dark:border-[#1E1E2F]">
                    <span className="block text-gray-700 dark:text-white mb-1.5">📝 وصف وتوجيهات المعلم:</span>
                    {exam.description}
                  </div>
                )}
              </div>

              {/* Big, Pulsing Start Exam Button (زر بدء الامتحان) */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-[#1E1E2F]">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-1/3 py-4 bg-gray-100 dark:bg-[#1A1A26] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#252538] rounded-2xl text-xs font-black transition-colors"
                >
                  تراجع وإلغاء
                </button>
                <button
                  onClick={handleStart}
                  id="start-exam-button"
                  className="w-full sm:w-2/3 py-4 bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] text-white hover:opacity-95 rounded-2xl text-xs font-black shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] animate-pulse"
                >
                  <Play className="w-5 h-5 fill-current" />
                  بدء وحل الامتحان الآن 🚀
                </button>
              </div>
            </motion.div>
          ) : (
            /* 3. Active Exam Component rendering questions */
            <motion.div
              key="active-quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col lg:flex-row gap-6 items-start"
            >
              {/* Sidebar: Navigation grid of questions */}
              <div className="w-full lg:w-1/4 bg-white dark:bg-[#12121A] rounded-3xl p-5 shadow-lg border border-gray-100 dark:border-[#1E1E2F] space-y-4 shrink-0">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1E1E2F]">
                  <h3 className="text-xs font-black text-gray-800 dark:text-white">قائمة الأسئلة</h3>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-[#1A1A26] px-2 py-0.5 rounded-md">
                    {questionsList.length} أسئلة
                  </span>
                </div>

                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {questionsList.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    const isActive = currentIdx === idx;

                    let bgStyle = "bg-gray-50 dark:bg-[#1A1A26] text-gray-500 dark:text-gray-400 hover:bg-gray-100";
                    if (isAnswered) {
                      bgStyle = "bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] dark:border-[#D4AF37]/30";
                    }
                    if (isActive) {
                      bgStyle = "bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] text-white shadow-md shadow-[#00B4D8]/10";
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`aspect-square rounded-xl font-black text-xs flex items-center justify-center transition-all ${bgStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-[#1E1E2F] flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                      <span>الأسئلة المُجاب عليها:</span>
                      <span>
                        {Object.keys(selectedAnswers).length} من {questionsList.length} 
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-[#1A1A26] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] transition-all duration-300"
                        style={{ width: `${(Object.keys(selectedAnswers).length / questionsList.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {timeLeft !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                        <span>الوقت المتبقي:</span>
                        <span dir="ltr">{formatTime(timeLeft)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-[#1A1A26] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${timeLeft < 120 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-l from-green-400 to-green-600'}`}
                          style={{ width: `${(timeLeft / ((exam.timeLimit || 30) * 60)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Card: The Question Container */}
              <div className="w-full lg:w-3/4 flex flex-col gap-5">
                {/* Timer and Header Info */}
                <div className="bg-white dark:bg-[#12121A] rounded-2xl p-4 shadow-md border border-gray-100 dark:border-[#1E1E2F] flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-500 animate-bounce" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold">السؤال الحالي</p>
                      <p className="text-xs font-black text-gray-800 dark:text-white">
                        السؤال {currentIdx + 1} من {questionsList.length}
                      </p>
                    </div>
                  </div>

                  {/* Elegant Protection Badge */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/35">
                    <Shield className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
                    <div className="text-right">
                      <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black leading-none">نظام مراقبة التبويب نشط 🔒</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-300 font-bold mt-1">
                        الخروج من الصفحة: <span className={infractions > 0 ? "text-red-500 font-black text-xs" : "text-emerald-500 font-black"}>{infractions} / 3</span>
                      </p>
                    </div>
                  </div>

                  {/* Elegant Countdown Timer */}
                  <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 w-full sm:w-auto justify-center ${
                    timeLeft !== null && timeLeft <= 120
                      ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-500 animate-pulse font-black"
                      : "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 font-bold"
                  }`}>
                    <Clock className="w-4 h-4" />
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 dark:text-gray-300 font-medium leading-none">الوقت المتبقي</p>
                      <span className="text-xs font-black font-mono">
                        {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* The Active Question */}
                <div className="bg-white dark:bg-[#12121A] rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100 dark:border-[#1E1E2F] flex flex-col justify-between min-h-[350px]">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-black text-gray-900 dark:text-white leading-relaxed">
                        {activeQuestion.text}
                      </h3>
                      <span className="text-[9px] font-black bg-gray-100 dark:bg-[#1A1A26] text-gray-500 dark:text-gray-300 px-2.5 py-1 rounded-md shrink-0">
                        {activeQuestion.points || 1} درجات
                      </span>
                    </div>

                    {/* Multiple-Choice Options */}
                    <div className="grid grid-cols-1 gap-3">
                      {activeQuestion.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[activeQuestion.id] === optIdx;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                            className={`p-4 rounded-2xl border text-right text-xs font-bold transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-gradient-to-l from-[#00B4D8]/10 to-[#0077B6]/5 border-[#00B4D8] text-[#0077B6] dark:from-[#D4AF37]/10 dark:to-[#AA7C11]/5 dark:border-[#D4AF37] dark:text-[#D4AF37] shadow-sm shadow-[#00B4D8]/5"
                                : "bg-gray-50 dark:bg-[#1A1A26] border-gray-100 dark:border-[#222235]/60 hover:bg-gray-100/80 dark:hover:bg-[#222235] text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <span className="leading-relaxed flex-1">{opt}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                              isSelected
                                ? "border-[#00B4D8] dark:border-[#D4AF37] bg-[#00B4D8] dark:bg-[#D4AF37]"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation & Submit Controls */}
                  <div className="flex items-center justify-between gap-4 pt-8 border-t border-gray-100 dark:border-[#1E1E2F] mt-8">
                    <button
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A26] hover:bg-gray-100 dark:hover:bg-[#222235] text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:hover:bg-gray-50 dark:disabled:hover:bg-[#1A1A26] font-black text-xs transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابق
                    </button>

                    {currentIdx < questionsList.length - 1 ? (
                      <button
                        onClick={() => setCurrentIdx((prev) => prev + 1)}
                        className="px-5 py-3 rounded-2xl bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:bg-[#0077B6] dark:hover:bg-[#b08e2a] font-black text-xs transition-colors flex items-center gap-1.5"
                      >
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        disabled={submitting}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs transition-colors shadow-lg shadow-green-500/10 flex items-center gap-1.5"
                      >
                        {submitting ? "جاري تسليم الامتحان..." : "تسليم وإرسال الامتحان 🏁"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 1. Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-[#12121A] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-[#1E1E2F] space-y-6 text-right"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#1E1E2F] pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">تنبيه: مغادرة الامتحان الجاري</h3>
                  <p className="text-[10px] text-gray-400 font-bold">يرجى تأكيد قرارك بعناية</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-bold">
                  هل أنت متأكد من رغبتك في الخروج والعودة للرئيسية؟
                </p>
                <div className="p-3.5 bg-red-50/50 dark:bg-red-950/10 border-r-4 border-red-500 rounded-xl">
                  <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed font-black">
                    ⚠️ تحذير: سيتم إلغاء محاولتك الحالية فوراً وفقدان جميع الإجابات التي قمت بتحديدها. لن يتم حفظ أي درجات!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-[#1A1A26] hover:bg-gray-200 dark:hover:bg-[#252538] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black transition-all"
                >
                  البقاء ومواصلة الحل
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    navigate("/dashboard");
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-500/10"
                >
                  تأكيد الخروج والمغادرة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-[#12121A] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-[#1E1E2F] space-y-6 text-right"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#1E1E2F] pb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">تأكيد تسليم الامتحان النهائي</h3>
                  <p className="text-[10px] text-gray-400 font-bold">بوابة تسليم النتائج التلقائية</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-bold">
                  هل أنت متأكد من رغبتك في تسليم الامتحان وتأكيد جميع الإجابات التي اخترتها؟
                </p>

                {/* Question stats check */}
                <div className="p-4 bg-gray-50 dark:bg-[#1A1A26] rounded-2xl border border-gray-100 dark:border-[#1E1E2F] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold">عدد الأسئلة الكلي:</span>
                    <span className="font-black text-gray-700 dark:text-white">{questionsList.length} أسئلة</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold">الأسئلة التي تم حلها:</span>
                    <span className={`font-black ${
                      Object.keys(selectedAnswers).length === questionsList.length
                        ? "text-green-500"
                        : "text-amber-500"
                    }`}>
                      {Object.keys(selectedAnswers).length} سؤالاً
                    </span>
                  </div>
                  
                  {Object.keys(selectedAnswers).length < questionsList.length && (
                    <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/10 border-r-4 border-amber-500 rounded-xl text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed font-black flex items-start gap-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                      <span>تنبيه: لقد تركت {questionsList.length - Object.keys(selectedAnswers).length} سؤالاً بدون إجابة! هل تريد المراجعة قبل التسليم؟</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-[#1A1A26] hover:bg-gray-200 dark:hover:bg-[#252538] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black transition-all"
                >
                  الرجوع للمراجعة والحل
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleSubmit();
                  }}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-green-500/10 flex items-center justify-center gap-1.5"
                >
                  نعم، سلم الإجابات الآن 🏁
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Infraction/Cheating Warning Modal */}
      <AnimatePresence>
        {showInfractionWarning && infractions < 3 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-[#12121A] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-500/30 space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-red-650 dark:text-red-400">⚠️ تحذير: تم كشف مغادرة صفحة الاختبار!</h3>
                <p className="text-xs text-gray-400 font-bold">نظام الحماية وقفل التبويب الإلكتروني</p>
              </div>

              <div className="space-y-4 text-right bg-red-50/50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                <p className="text-xs text-gray-750 dark:text-gray-300 leading-relaxed font-bold">
                  لقد قمت بالخروج من تبويب أو نافذة الاختبار. هذا السلوك مخالف لتعليمات الامتحان الإلكتروني وقد يُعرضك لإلغاء النتيجة.
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
                className="w-full py-3.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-600/20"
              >
                أفهم ذلك، العودة لحل الاختبار ✍️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
