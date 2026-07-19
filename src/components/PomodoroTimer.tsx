import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Coffee, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  Trash2, 
  Clock, 
  Plus, 
  Minus,
  Save,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc, 
  getDocFromServer
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface PomodoroTimerProps {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  userData: any;
}

export default function PomodoroTimer({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  userData
}: PomodoroTimerProps) {
  // Config state
  const [workDuration, setWorkDuration] = useState(25); // in minutes
  const [breakDuration, setBreakDuration] = useState(5); // in minutes

  // Timer run state
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [secondsFocused, setSecondsFocused] = useState(0);

  // Stats and history state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio synthesize beep
  const playBeep = (isWorkEnd: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone generator
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration - 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      if (isWorkEnd) {
        // Joyful chime for work completed
        playTone(523.25, 0, 0.3); // C5
        playTone(659.25, 0.2, 0.3); // E5
        playTone(783.99, 0.4, 0.3); // G5
        playTone(1046.50, 0.6, 0.6); // C6
      } else {
        // Calm double chime for break completed
        playTone(587.33, 0, 0.4); // D5
        playTone(440.00, 0.3, 0.6); // A4
      }
    } catch (e) {
      console.error("Audio synth error:", e);
    }
  };

  // Fetch session history
  const fetchSessions = async () => {
    if (!userData?.id) return;
    setLoadingSessions(true);
    try {
      const q = query(
        collection(db, 'focus_sessions'),
        where('userId', '==', userData.id),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const querySnap = await getDocs(q);
      const fetched: any[] = [];
      let totalMins = 0;
      let todayMins = 0;
      const todayStr = new Date().toDateString();

      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const session = { id: docSnap.id, ...data };
        fetched.push(session);
        
        // Sum total focus minutes
        const minutes = Number(data.focusMinutes || 0);
        totalMins += minutes;

        // Sum today's minutes
        if (data.createdAt) {
          const sessionDate = new Date(data.createdAt).toDateString();
          if (sessionDate === todayStr) {
            todayMins += minutes;
          }
        }
      });

      setSessions(fetched);
      setTotalFocusMinutes(parseFloat(totalMins.toFixed(1)));
      setTodayFocusMinutes(parseFloat(todayMins.toFixed(1)));
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userData?.id, courseId]);

  // Sync timeLeft when durations change and timer is NOT active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft((isWorkMode ? workDuration : breakDuration) * 60);
    }
  }, [workDuration, breakDuration, isWorkMode]);

  // Handle ticking
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Completed!
            clearInterval(timerRef.current!);
            setIsActive(false);
            handlePeriodComplete();
            return 0;
          }
          if (isWorkMode) {
            setSecondsFocused((sf) => sf + 1);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isWorkMode]);

  // Handle timer completion
  const handlePeriodComplete = async () => {
    playBeep(isWorkMode);

    if (isWorkMode) {
      const focusMins = parseFloat((secondsFocused / 60).toFixed(1)) || workDuration;
      toast.success(`أحسنت صنعاً! لقد أكملت جلسة تركيز مدتها ${focusMins} دقيقة 🌟`, {
        duration: 5000,
        icon: '🔥'
      });
      
      // Save stats
      await saveFocusSession(focusMins);
      
      // Switch to Break Mode
      setIsWorkMode(false);
      setTimeLeft(breakDuration * 60);
      setSecondsFocused(0);
    } else {
      toast.success('انتهى وقت الراحة، هل أنت مستعد للتركيز مجدداً؟ 💪', {
        duration: 5000,
        icon: '⚡'
      });
      setIsWorkMode(true);
      setTimeLeft(workDuration * 60);
    }
  };

  // Save focus session to Firestore
  const saveFocusSession = async (minutesSpent: number) => {
    if (!userData?.id || minutesSpent < 0.2) return; // Don't save sessions less than 12 seconds
    
    try {
      const payload = {
        userId: userData.id,
        userName: userData.name || 'طالب متميز',
        courseId,
        courseTitle,
        lessonId: lessonId || '',
        lessonTitle: lessonTitle || '',
        focusMinutes: parseFloat(minutesSpent.toFixed(1)),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'focus_sessions'), payload);
      fetchSessions();
    } catch (e) {
      console.error("Error saving focus session:", e);
    }
  };

  // Manual trigger to save elapsed focus time early
  const handleEndAndSaveEarly = async () => {
    if (secondsFocused < 10) {
      toast.error('أنت بحاجة إلى التركيز لـ 10 ثوانٍ على الأقل لحفظ الجلسة!');
      return;
    }

    const focusMins = parseFloat((secondsFocused / 60).toFixed(1));
    setIsActive(false);
    
    toast.promise(
      saveFocusSession(focusMins),
      {
        loading: 'جاري حفظ وقت التركيز...',
        success: `تم حفظ ${focusMins} دقيقة من التركيز بنجاح! 🏆`,
        error: 'حدث خطأ أثناء حفظ الجلسة'
      }
    );

    // Reset session trackers
    setSecondsFocused(0);
    setTimeLeft(workDuration * 60);
    setIsWorkMode(true);
  };

  // Timer controls
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (window.confirm('هل تريد إعادة تعيين المؤقت؟ سيتم فقدان وقت التركيز غير المحفوظ لهذه الجلسة.')) {
      setIsActive(false);
      setSecondsFocused(0);
      setTimeLeft((isWorkMode ? workDuration : breakDuration) * 60);
    }
  };

  const skipPeriod = () => {
    if (window.confirm(`هل أنت متأكد من رغبتك في تخطي فترة ${isWorkMode ? 'التركيز' : 'الراحة'} الحالية؟`)) {
      setIsActive(false);
      setSecondsFocused(0);
      setIsWorkMode(!isWorkMode);
      setTimeLeft((!isWorkMode ? workDuration : breakDuration) * 60);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('هل تريد حذف هذه الجلسة من إحصائياتك؟')) {
      try {
        await deleteDoc(doc(db, 'focus_sessions', sessionId));
        toast.success('تم حذف الجلسة بنجاح');
        fetchSessions();
      } catch (e) {
        toast.error('خطأ أثناء حذف الجلسة');
      }
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate circular progress percentage
  const totalPeriodSeconds = (isWorkMode ? workDuration : breakDuration) * 60;
  const progressPercent = ((totalPeriodSeconds - timeLeft) / totalPeriodSeconds) * 100;

  // Preset Configurations
  const selectPreset = (work: number, pause: number) => {
    if (isActive && !window.confirm('المؤقت يعمل حالياً. تغيير الإعداد سيعيد تشغيل المؤقت. هل تريد الاستمرار؟')) {
      return;
    }
    setIsActive(false);
    setSecondsFocused(0);
    setWorkDuration(work);
    setBreakDuration(pause);
    setIsWorkMode(true);
    setTimeLeft(work * 60);
    toast.success(`تم تعيين نمط المذاكرة: ${work} دقيقة عمل / ${pause} دقيقة راحة`);
  };

  // Daily target statistics progress
  const dailyTarget = 60; // 1 hour focus daily goal
  const dailyProgressPercent = Math.min(100, (todayFocusMinutes / dailyTarget) * 100);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Intro info bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-right">
            <h4 className="text-sm font-black text-gray-900 dark:text-white">طريقة بومودورو لتنظيم الدراسة</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">ادرس بتركيز كامل لمدة {workDuration} دقيقة، ثم استرح لـ {breakDuration} دقائق لتجديد طاقتك الذهنية.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Interactive Timer Column */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Active Mode Banner */}
          <div className="mb-6 flex justify-center">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 ${
              isWorkMode 
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
            }`}>
              {isWorkMode ? (
                <>
                  <Flame className="w-4 h-4 animate-bounce" />
                  جلسة التركيز الحالية ({workDuration} دقيقة)
                </>
              ) : (
                <>
                  <Coffee className="w-4 h-4 animate-spin" />
                  وقت الاستراحة والراحة ({breakDuration} دقيقة)
                </>
              )}
            </span>
          </div>

          {/* Radial/Concentric Timer Visual */}
          <div className="relative w-64 h-64 flex items-center justify-center select-none">
            {/* SVG Circle Background & Active Ring */}
            <svg className="w-full h-full -rotate-90">
              {/* Gray outer circle */}
              <circle 
                cx="128" 
                cy="128" 
                r="110" 
                className="stroke-gray-100 dark:stroke-[#222230] fill-none"
                strokeWidth="8"
              />
              {/* Dynamic Animated Color Ring */}
              <motion.circle 
                cx="128" 
                cy="128" 
                r="110" 
                className={`fill-none ${
                  isWorkMode 
                    ? 'stroke-rose-500 dark:stroke-[#E63946]' 
                    : 'stroke-emerald-500 dark:stroke-[#2A9D8F]'
                }`}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 110}
                animate={{
                  strokeDashoffset: (2 * Math.PI * 110) * (1 - progressPercent / 100)
                }}
                transition={{ duration: 1, ease: 'linear' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Centered Clock Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black font-mono tracking-wider text-gray-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1.5">
                {isWorkMode ? 'مرحلة التركيز' : 'مرحلة الراحة'}
              </span>
              {secondsFocused > 0 && isWorkMode && (
                <div className="mt-2 text-[11px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded">
                  تم رصد: {Math.floor(secondsFocused / 60)}د {secondsFocused % 60}ث
                </div>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4 mt-8 w-full max-w-sm">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                isActive 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                  : isWorkMode 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  إيقاف المؤقت
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  ابدأ التركيز الآن
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={resetTimer}
              title="إعادة تعيين المؤقت"
              className="p-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#222230] dark:hover:bg-[#2D2D3D] text-gray-600 dark:text-gray-400 rounded-2xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip Button */}
            <button
              onClick={skipPeriod}
              title="تخطي الفترة الحالية"
              className="p-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#222230] dark:hover:bg-[#2D2D3D] text-gray-600 dark:text-gray-400 rounded-2xl transition-colors cursor-pointer"
            >
              <Coffee className="w-4 h-4" />
            </button>
          </div>

          {/* End Early and Save Button */}
          {secondsFocused >= 10 && isWorkMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <button
                onClick={handleEndAndSaveEarly}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                إنهاء الجلسة وحفظ الدقائق المنجزة
              </button>
            </motion.div>
          )}

          {/* Custom adjustments */}
          <div className="mt-8 border-t border-gray-100 dark:border-[#2D2D3D] pt-6 w-full">
            <h5 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-4 text-center">تعديل فترات المؤقت يدوياً</h5>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              
              {/* Work Minutes */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">وقت التركيز:</span>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0D0D12] p-1.5 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <button
                    onClick={() => setWorkDuration(prev => Math.max(5, prev - 5))}
                    disabled={isActive}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold text-gray-800 dark:text-white">
                    {workDuration}د
                  </span>
                  <button
                    onClick={() => setWorkDuration(prev => Math.min(120, prev + 5))}
                    disabled={isActive}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Break Minutes */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">وقت الراحة:</span>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0D0D12] p-1.5 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <button
                    onClick={() => setBreakDuration(prev => Math.max(2, prev - 1))}
                    disabled={isActive}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold text-gray-800 dark:text-white">
                    {breakDuration}د
                  </span>
                  <button
                    onClick={() => setBreakDuration(prev => Math.min(30, prev + 1))}
                    disabled={isActive}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Focus Presets & Stats Column */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Preset templates */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
            <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-500" />
              أنماط المذاكرة السريعة
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => selectPreset(25, 5)}
                className="p-3 text-right rounded-xl border border-gray-100 hover:border-blue-100 dark:border-gray-800 dark:hover:border-blue-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 flex justify-between items-center transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-xs font-black block text-gray-800 dark:text-gray-200">النمط الكلاسيكي (طريقة بومودورو)</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">أفضل خيار للمذاكرة المستمرة والمراجعة</span>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-lg">25 / 5 د</span>
              </button>

              <button
                onClick={() => selectPreset(50, 10)}
                className="p-3 text-right rounded-xl border border-gray-100 hover:border-indigo-100 dark:border-gray-800 dark:hover:border-indigo-900/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 flex justify-between items-center transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-xs font-black block text-gray-800 dark:text-gray-200">التركيز الممتد (طريقة الخمسين دقيقة)</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">للأعمال التي تتطلب تركيزاً عميقاً ومسائل ممتدة</span>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-lg">50 / 10 د</span>
              </button>

              <button
                onClick={() => selectPreset(15, 3)}
                className="p-3 text-right rounded-xl border border-gray-100 hover:border-rose-100 dark:border-gray-800 dark:hover:border-rose-900/50 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 flex justify-between items-center transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-xs font-black block text-gray-800 dark:text-gray-200">جلسة المراجعة السريعة</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">ممتازة للمذاكرة الخاطفة قبل الامتحان أو قراءة سريعة</span>
                </div>
                <span className="text-xs font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 px-2 py-1 rounded-lg">15 / 3 د</span>
              </button>
            </div>
          </div>

          {/* Focus Statistics */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-4">
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              إحصائيات الإنجاز والتركيز
            </h4>

            {/* Today Target Meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-600 dark:text-gray-300">هدف التركيز اليومي ({dailyTarget} دقيقة)</span>
                <span className="text-blue-500">{todayFocusMinutes} دقيقة</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-[#222230] rounded-full h-2">
                <motion.div 
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                {dailyProgressPercent >= 100 
                  ? 'تهانينا! لقد حققت هدفك اليومي بالكامل اليوم 🎉' 
                  : `متبقي ${Math.max(0, dailyTarget - todayFocusMinutes).toFixed(1)} دقيقة لتحقيق هدف اليوم.`
                }
              </p>
            </div>

            {/* Mini Summary counters */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-rose-50/40 dark:bg-rose-950/10 p-3 rounded-2xl text-right border border-rose-100/30">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">إجمالي التركيز</span>
                <span className="text-lg font-black text-rose-500 font-mono">{totalFocusMinutes}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mr-1">دقيقة</span>
              </div>
              
              <div className="bg-emerald-50/40 dark:bg-emerald-950/10 p-3 rounded-2xl text-right border border-emerald-100/30">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">جلسات بومودورو</span>
                <span className="text-lg font-black text-emerald-500 font-mono">{sessions.length}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mr-1">جلسة</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Focus History Log List */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          سجل جلسات المذاكرة الأخيرة
        </h4>

        {loadingSessions ? (
          <div className="text-center py-6 text-gray-400">جاري تحميل سجل المذاكرة...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-dashed border-gray-200 dark:border-[#2D2D3D]">
            <p className="text-xs font-bold">لا يوجد جلسات مسجلة بعد.</p>
            <p className="text-[10px] text-gray-400 mt-1">المذاكرة المركزة تبدأ بخطوة صغيرة! شغل المؤقت وسجل أولى جلساتك.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0D0D12] hover:bg-gray-100/50 dark:hover:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D]/50 flex justify-between items-center transition-all group"
              >
                <div className="text-right flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-800 dark:text-gray-200">
                      {session.lessonTitle ? `درس: ${session.lessonTitle}` : `مذاكرة كورس: ${session.courseTitle}`}
                    </h5>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {new Date(session.createdAt).toLocaleDateString('ar-EG', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-lg">
                    {session.focusMinutes} دقيقة تركيز
                  </span>
                  
                  {/* Delete Option */}
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="حذف الجلسة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
