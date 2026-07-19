import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Video, AlertCircle, 
  Check, ExternalLink, BookOpen, AlertTriangle, User, Loader2, Bell, BellOff,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, onSnapshot 
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import LuxuriousLoader from "./LuxuriousLoader";

interface ScheduleEvent {
  id: string;
  title: string;
  type: "class" | "exam" | "revision";
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  courseId: string;
  courseTitle: string;
  teacherName: string;
  link?: string;
  description?: string;
  remindMe?: boolean;
}

interface InteractiveScheduleProps {
  db: any;
  userData: any;
  coursesList: any[];
}

export default function InteractiveSchedule({ db, userData, coursesList }: InteractiveScheduleProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"list" | "weekly" | "calendar">("calendar");
  
  // Calendar states
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  // Create Event Form state (Teacher)
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"class" | "exam" | "revision">("class");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [courseId, setCourseId] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Student active reminder list saved in localStorage
  const [reminders, setReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`schedule_reminders_${userData?.id || "anon"}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current selected day for weekly view filter (0 = Saturday, 1 = Sunday, etc.)
  const arabDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(new Date().getDay() === 5 ? 6 : (new Date().getDay() + 1) % 7); // convert standard JS Sunday=0 to Arabic scale starting Saturday

  // Listen to Firestore schedule events
  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const q = query(collection(db, "schedule_events"), orderBy("date", "asc"), orderBy("time", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ScheduleEvent[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as ScheduleEvent);
      });

      setEvents(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading schedule events:", error);
      toast.error("حدث خطأ أثناء مزامنة الجدول الدراسي");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Handle reminder saving
  useEffect(() => {
    localStorage.setItem(`schedule_reminders_${userData?.id || "anon"}`, JSON.stringify(reminders));
  }, [reminders, userData?.id]);

  // Check if any class starts soon (within 15 mins) or is currently ongoing
  const [activeAlert, setActiveAlert] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    const checkSoonEvents = () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const curHour = now.getHours();
      const curMin = now.getMinutes();
      const nowInMinutes = curHour * 60 + curMin;

      // Find if there is an event today starting within 15 minutes or currently ongoing
      const soonEvent = events.find((ev) => {
        if (ev.date !== todayStr) return false;
        
        const [evH, evM] = ev.time.split(":").map(Number);
        const evTimeInMinutes = evH * 60 + evM;
        const diff = evTimeInMinutes - nowInMinutes;

        // Active if starting within 20 mins or ongoing (start time to start time + duration)
        const isStartingSoon = diff >= 0 && diff <= 20;
        const isOngoing = nowInMinutes >= evTimeInMinutes && nowInMinutes <= (evTimeInMinutes + ev.duration);

        return isStartingSoon || isOngoing;
      });

      if (soonEvent) {
        setActiveAlert(soonEvent);
      } else {
        setActiveAlert(null);
      }
    };

    checkSoonEvents();
    const interval = setInterval(checkSoonEvents, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [events]);

  const handleToggleReminder = (eventId: string) => {
    if (reminders.includes(eventId)) {
      setReminders(prev => prev.filter(id => id !== eventId));
      toast.success("تم إلغاء تنبيه الحصة 🔕");
    } else {
      setReminders(prev => [...prev, eventId]);
      toast.success("رائع! سنقوم بتنبيهك قبل بدء الحصة بـ 15 دقيقة ⏰🔔");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setLink("");
    setDescription("");
    setShowAddForm(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      toast.error("يرجى ملء الحقول الإلزامية لتنظيم الموعد");
      return;
    }

    setSubmitting(true);
    try {
      const selectedCourse = coursesList.find(c => c.id === courseId);
      const courseTitle = selectedCourse ? selectedCourse.title : "حصة عامة مستقلة";

      const newEvent = {
        title: title.trim(),
        type,
        date,
        time,
        duration: Number(duration) || 60,
        courseId,
        courseTitle,
        teacherName: userData?.name || "الأستاذ",
        link: link.trim(),
        description: description.trim()
      };

      await addDoc(collection(db, "schedule_events"), newEvent);
      toast.success("تمت إضافة الحصة وتنظيم الموعد في جدول الطلاب بنجاح! 📅✨");
      
      handleCancel();
    } catch (err) {
      console.error("Error creating schedule event:", err);
      toast.error("فشل تنظيم الموعد، الرجاء المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteDoc(doc(db, "schedule_events", eventToDelete));
      toast.success("تم حذف الموعد بنجاح 🗑️");
    } catch (err) {
      console.error("Error deleting schedule event:", err);
      toast.error("فشل حذف الموعد");
    } finally {
      setEventToDelete(null);
    }
  };

  const handleDeleteAllEvents = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف جميع المواعيد الحالية نهائياً لجميع الطلاب؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setLoading(true);
    try {
      const q = query(collection(db, "schedule_events"));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      toast.success("تم حذف جميع المواعيد بنجاح 🗑️✨");
    } catch (err) {
      console.error("Error deleting all events:", err);
      toast.error("فشل في حذف جميع المواعيد");
    } finally {
      setLoading(false);
    }
  };


  // Helper to format Arabic date string
  const formatArDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
    return new Date(dateStr).toLocaleDateString("ar-EG", options);
  };

  // Filter events helper
  const getUpcomingEvents = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    return events.filter(ev => ev.date >= todayStr);
  };

  // Helper to map type to Arabic label & color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "class":
        return { label: "حصة أسبوعية", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50" };
      case "exam":
        return { label: "موعد اختبار شهري", color: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200/50" };
      case "revision":
        return { label: "حصة مراجعة نهائية", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50" };
      default:
        return { label: "حصة دراسية", color: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200/50" };
    }
  };

  // Weekly view filtered events
  const getWeeklyFilteredEvents = () => {
    // Return events where day index of event date matches selectedDayIdx
    return events.filter(ev => {
      const evDate = new Date(ev.date);
      let dayIdx = evDate.getDay() === 5 ? 6 : (evDate.getDay() + 1) % 7; // Align to Saturday = 0, Friday = 6
      return dayIdx === selectedDayIdx;
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 1. UPCOMING SOON REALTIME ALERTER BANNER */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-l from-red-600 via-[#0077B6] to-[#00B4D8] dark:from-amber-600 dark:via-[#AA7C11] dark:to-[#D4AF37] text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 relative overflow-hidden animate-pulse"
          >
            {/* Absolute decorative glow circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-white animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  تبدأ الآن أو قريباً جداً ⏰🔥
                </span>
                <h4 className="text-base font-black mt-1">{activeAlert.title}</h4>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  مع {activeAlert.teacherName} • المادة: {activeAlert.courseTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 z-10 w-full md:w-auto">
              {activeAlert.link ? (
                <a
                  href={activeAlert.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full md:w-auto bg-white text-[#0077B6] dark:text-amber-800 hover:bg-opacity-90 font-black text-xs px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  انضم للاجتماع الآن 🚀
                </a>
              ) : (
                <span className="text-xs font-bold bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                  الحصة غير مخصصة لاجتماع عبر زوم
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HEADER TAB CONTROL AND DESCRIPTION */}
      <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
            الجدول الدراسي التفاعلي 📅
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-bold leading-relaxed max-w-2xl">
            نسق حصصك المباشرة، مواعيد امتحاناتك الشهرية الشاملة والمراجعات التفاعلية في مكان واحد مع تنبيهات تلقائية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {userData?.role === "teacher" && events.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllEvents}
              className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              حذف الكل
            </button>
          )}

          {userData?.role === "teacher" && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-500/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              تنظيم موعد جديد
            </button>
          )}

          {/* Toggle View */}
          <div className="bg-gray-100 dark:bg-[#222230] p-1 rounded-2xl flex border border-gray-200/40 dark:border-[#2D2D3D]">
            <button
              onClick={() => setActiveView("calendar")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeView === "calendar"
                  ? "bg-white dark:bg-[#1A1A24] text-[#0077B6] dark:text-[#D4AF37] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              التقويم التفاعلي 📅
            </button>
            <button
              onClick={() => setActiveView("list")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeView === "list"
                  ? "bg-white dark:bg-[#1A1A24] text-[#0077B6] dark:text-[#D4AF37] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              المخطط الزمني
            </button>
            <button
              onClick={() => setActiveView("weekly")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeView === "weekly"
                  ? "bg-white dark:bg-[#1A1A24] text-[#0077B6] dark:text-[#D4AF37] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              عرض أسبوعي
            </button>
          </div>
        </div>
      </div>

      {/* 3. TEACHER EVENT BUILDER FORM */}
      <AnimatePresence>
        {showAddForm && userData?.role === "teacher" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreateEvent}
              className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] space-y-4 shadow-sm"
            >
              <div className="border-b border-gray-100 dark:border-[#2D2D3D] pb-3 mb-2">
                <h3 className="font-black text-sm text-gray-900 dark:text-white">جدولة وتنسيق موعد تفاعلي للطلاب</h3>
                <p className="text-[10px] text-gray-400 font-bold">سيتم إدراج هذا الموعد فوراً لجميع الطلاب المشتركين بجدولهم الأسبوعي.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">عنوان الحصة / الامتحان الشامل *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: مراجعة نهائية على الفصل الأول"
                    className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                  />
                </div>

                {/* Course ID select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">مخصص لكورس / مادة معينة</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                  >
                    <option value="">-- كورس عام (لكافة المشتركين) --</option>
                    {coursesList.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Event Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">نوع الموعد</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                  >
                    <option value="class">حصة أسبوعية مسجلة</option>
                    <option value="exam">موعد اختبار شامل</option>
                    <option value="revision">حصة مراجعة تفاعلية</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">تاريخ الموعد *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none text-right"
                  />
                </div>

                {/* Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">وقت البدء (توقيت مصر) *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none text-right"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">المدة المقدرة (بالدقائق)</label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none text-right"
                  />
                </div>
              </div>

              {/* Link Zoom */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300">رابط الاجتماع (زووم / جوجل ميت - اختياري)</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://zoom.us/j/your-meeting-id"
                  className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Description / Instruction */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300">وصف الموعد وإرشادات للطلاب</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="يرجى قراءة الدرس الثالث وحل أسئلة الواجب قبل حضور هذه المحاضرة."
                  rows={2}
                  className="w-full text-xs font-bold p-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl focus:border-[#00B4D8] dark:focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-white hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] text-white text-xs font-black rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  جدولة ونشر الموعد 🏁
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CONTENT ACCORDING TO VIEW */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
          <LuxuriousLoader size="md" text="جاري تحميل وتزامن جدول المواعيد الدراسية التفاعلي..." />
        </div>
      ) : activeView === "calendar" ? (
        /* Calendar Monthly View */
        (() => {
          const arabicMonths = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
          ];
          const daysOfWeekAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

          const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
          const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

          const handlePrevMonth = () => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(prev => prev - 1);
            } else {
              setCurrentMonth(prev => prev - 1);
            }
          };

          const handleNextMonth = () => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(prev => prev + 1);
            } else {
              setCurrentMonth(prev => prev + 1);
            }
          };

          const firstDayIdx = getFirstDayOfMonth(currentYear, currentMonth);
          const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);

          const calendarCells: { day: number | null; dateStr: string | null }[] = [];
          for (let i = 0; i < firstDayIdx; i++) {
            calendarCells.push({ day: null, dateStr: null });
          }
          for (let d = 1; d <= daysInCurrentMonth; d++) {
            const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            calendarCells.push({ day: d, dateStr: formattedDate });
          }

          const selectedDateEvents = events.filter(ev => ev.date === selectedCalendarDate);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
              {/* Right Column: Calendar Grid */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col justify-between">
                <div>
                  {/* Calendar Navigation Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50 dark:border-[#2D2D3D]/50">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2 bg-gray-50 dark:bg-[#20202D] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                      <span>{arabicMonths[currentMonth]} {currentYear}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2 bg-gray-50 dark:bg-[#20202D] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day Names Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {daysOfWeekAr.map(dayName => (
                      <div key={dayName} className="text-xs font-black text-gray-400 dark:text-gray-500 py-2">
                        {dayName}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarCells.map((cell, idx) => {
                      if (cell.day === null || !cell.dateStr) {
                        return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/20 dark:bg-transparent rounded-xl" />;
                      }

                      const dayEvents = events.filter(ev => ev.date === cell.dateStr);
                      const isSelected = selectedCalendarDate === cell.dateStr;
                      const isToday = new Date().toISOString().split("T")[0] === cell.dateStr;

                      // Check types of events on this day
                      const hasExam = dayEvents.some(ev => ev.type === "exam");
                      const hasRevision = dayEvents.some(ev => ev.type === "revision");
                      const hasClass = dayEvents.some(ev => ev.type === "class");

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() => setSelectedCalendarDate(cell.dateStr)}
                          className={`aspect-square p-1 sm:p-2 rounded-2xl flex flex-col items-center justify-between border transition-all relative cursor-pointer group ${
                            isSelected
                              ? "bg-[#00B4D8]/10 text-[#0077B6] border-2 border-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] dark:border-[#D4AF37]"
                              : isToday
                              ? "bg-[#00B4D8]/5 text-gray-950 dark:text-white border-2 border-dashed border-[#00B4D8]/50 dark:border-[#D4AF37]/50"
                              : "bg-gray-50/50 hover:bg-gray-100 dark:bg-[#12121A]/50 dark:hover:bg-[#20202D] border-gray-100 dark:border-[#2D2D3D] text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs sm:text-sm font-black ${isToday ? "text-[#00B4D8] dark:text-[#D4AF37]" : ""}`}>
                              {cell.day}
                            </span>
                          </div>

                          {/* Miniature colored dots or labels for events */}
                          <div className="flex flex-wrap gap-0.5 sm:gap-1 items-center justify-center w-full min-h-[12px] sm:min-h-[16px]">
                            {hasExam && (
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" title="امتحان" />
                            )}
                            {hasRevision && (
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" title="مراجعة" />
                            )}
                            {hasClass && (
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" title="حصة" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calendar Legend */}
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-[#2D2D3D]/50 flex flex-wrap gap-4 text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>اختبارات شاملة 📝</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>حصص مراجعة 📚</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>حصص أسبوعية 📖</span>
                  </div>
                </div>
              </div>

              {/* Left Column: Selected Day Events List */}
              <div className="lg:col-span-5 flex flex-col h-full space-y-4">
                <div className="bg-gray-100 dark:bg-[#1C1C28] p-4 rounded-2xl text-xs font-black border border-gray-200/50 dark:border-[#2D2D3D] flex items-center justify-between text-gray-500 dark:text-gray-400 shrink-0">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                    <span>مواعيد: <strong className="text-gray-900 dark:text-white font-black">{selectedCalendarDate ? formatArDate(selectedCalendarDate) : ""}</strong></span>
                  </span>
                  <span className="bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 text-[#0077B6] dark:text-[#D4AF37] px-2.5 py-1 rounded-lg text-[10px] font-black">
                    {selectedDateEvents.length} مواعيد
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1 scrollbar-thin">
                  {selectedDateEvents.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] text-gray-400 font-bold text-xs space-y-3 h-full flex flex-col items-center justify-center min-h-[300px]">
                      <span className="text-4xl">☕</span>
                      <p className="leading-relaxed">لا توجد أي حصص، واجبات، أو امتحانات مجدولة في هذا اليوم.</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">اختر يوماً آخر من التقويم التفاعلي لمتابعة مواعيدك الدراسية القادمة بدقة.</p>
                    </div>
                  ) : (
                    selectedDateEvents.map((ev) => {
                      const badge = getTypeBadge(ev.type);
                      const isReminded = reminders.includes(ev.id);

                      return (
                        <div
                          key={ev.id}
                          className="bg-white dark:bg-[#1A1A24] p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" />
                              {ev.time} ({ev.duration} د)
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white leading-snug">
                              {ev.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-1">
                              المادة: {ev.courseTitle} • الأستاذ: {ev.teacherName}
                            </p>
                            {ev.description && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-[#20202D] p-2.5 rounded-xl border border-gray-100/30 dark:border-transparent whitespace-pre-wrap leading-relaxed">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 items-center justify-end pt-2 border-t border-gray-50 dark:border-[#2D2D3D]/50">
                            {userData?.role === "student" && (
                              <button
                                onClick={() => handleToggleReminder(ev.id)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isReminded
                                    ? "bg-[#00B4D8]/10 text-[#0077B6] border-[#00B4D8]/30 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] dark:border-[#D4AF37]/30"
                                    : "bg-gray-50 dark:bg-[#20202D] text-gray-500 border-gray-100 dark:border-[#2D2D3D]"
                                }`}
                              >
                                {isReminded ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                                {isReminded ? "مُفعل" : "تذكير"}
                              </button>
                            )}

                            {ev.link && (
                              <a
                                href={ev.link}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-[#0077B6] hover:bg-[#005f93] dark:bg-[#D4AF37] dark:hover:bg-[#AA7C11] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <Video className="w-3.5 h-3.5" />
                                دخول
                              </a>
                            )}

                            {userData?.role === "teacher" && (
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-100 cursor-pointer"
                                title="حذف الموعد"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()
      ) : activeView === "list" ? (
        /* Timeline List View */
        <div className="space-y-4">
          {getUpcomingEvents().length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] text-gray-500 font-bold text-xs space-y-2">
              <p>📭 لا توجد حصص أو اختبارات قادمة مجدولة في الفترة الحالية.</p>
              {userData?.role === "teacher" && <p className="text-[10px] text-gray-400">انقر على زر "تنظيم موعد جديد" لتعديل الجدول.</p>}
            </div>
          ) : (
            getUpcomingEvents().map((ev) => {
              const isReminded = reminders.includes(ev.id);
              const badge = getTypeBadge(ev.type);

              return (
                <div 
                  key={ev.id}
                  className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 border border-gray-100 dark:border-[#2D2D3D] hover:shadow-lg hover:border-[#00B4D8]/30 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Event Type Icon Indicator */}
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#13131C] border border-gray-200/50 dark:border-[#2D2D3D] flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400">
                      {ev.type === "exam" ? (
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                      
                      ) : ev.type === "revision" ? (
                        <BookOpen className="w-7 h-7 text-amber-500" />
                      ) : (
                        <CalendarIcon className="w-7 h-7 text-blue-500" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] bg-gray-100 dark:bg-[#20202D] text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full font-bold">
                          ⏱️ المدة: {ev.duration} دقيقة
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                        {ev.title}
                      </h3>

                      <div className="text-xs text-gray-400 flex flex-wrap items-center gap-4 font-bold pt-1">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4" />
                          {formatArDate(ev.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {ev.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {ev.teacherName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Side */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-100 dark:border-[#2D2D3D] pt-4 md:pt-0">
                    {/* Reminder toggle */}
                    {userData?.role === "student" && (
                      <button
                        onClick={() => handleToggleReminder(ev.id)}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                          isReminded
                            ? "bg-[#00B4D8]/10 text-[#0077B6] border-[#00B4D8]/30 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] dark:border-[#D4AF37]/30"
                            : "bg-gray-50 dark:bg-[#20202D] text-gray-500 border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-100 dark:hover:bg-[#2D2D3D]"
                        }`}
                      >
                        {isReminded ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        {isReminded ? "مُفعل" : "تذكير"}
                      </button>
                    )}

                    {/* Join Link */}
                    {ev.link && (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto bg-[#0077B6] hover:bg-[#005f93] dark:bg-[#D4AF37] dark:hover:bg-[#AA7C11] text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        انضم الآن
                      </a>
                    )}

                    {/* Teacher Delete Event */}
                    {userData?.role === "teacher" && (
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-colors"
                        title="حذف الموعد"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Weekly Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Days sidebar selector */}
          <div className="lg:col-span-1 bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] space-y-2 h-fit shadow-sm">
            <h3 className="font-black text-xs text-gray-400 mb-3 border-b border-gray-50 pb-2">اختر اليوم من الأسبوع:</h3>
            {arabDays.map((dayName, idx) => {
              // Count how many events are on this day
              const count = events.filter(ev => {
                const evDate = new Date(ev.date);
                let dayIdx = evDate.getDay() === 5 ? 6 : (evDate.getDay() + 1) % 7;
                return dayIdx === idx;
              }).length;

              return (
                <button
                  key={dayName}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`w-full text-right p-3 rounded-2xl text-xs font-black transition-all flex items-center justify-between ${
                    selectedDayIdx === idx
                      ? "bg-[#00B4D8]/10 text-[#0077B6] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#20202D]"
                  }`}
                >
                  <span>{dayName}</span>
                  {count > 0 && (
                    <span className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-sans font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Events filtered column */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gray-100 dark:bg-[#1C1C28] p-4 rounded-2xl text-xs text-gray-500 font-black border border-gray-200/50 dark:border-[#2D2D3D] flex items-center justify-between">
              <span>عرض حصص ومواعيد يوم: <strong className="text-gray-900 dark:text-white font-black">{arabDays[selectedDayIdx]}</strong></span>
              <span className="text-[11px] text-[#00B4D8] dark:text-[#D4AF37]">مجموع المواعيد اليوم: {getWeeklyFilteredEvents().length}</span>
            </div>

            {getWeeklyFilteredEvents().length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] text-gray-400 font-bold text-xs">
                ☕ لا توجد أي حصص أو واجبات أو اختبارات مجدولة ليوم {arabDays[selectedDayIdx]}. يوم هادئ ومناسب للاستذكار الفردي!
              </div>
            ) : (
              getWeeklyFilteredEvents().map((ev) => {
                const badge = getTypeBadge(ev.type);
                const isReminded = reminders.includes(ev.id);

                return (
                  <div
                    key={ev.id}
                    className="bg-white dark:bg-[#1A1A24] p-6 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm hover:shadow-lg transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] bg-gray-100 dark:bg-[#1F1F2C] text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full font-bold">
                          ⏱️ المدة: {ev.duration} دقيقة
                        </span>
                      </div>

                      {/* Time clock indicator */}
                      <div className="text-xs text-gray-500 dark:text-gray-300 font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                        <span>الساعة {ev.time}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-bold">
                        كورس: {ev.courseTitle} • معلم: {ev.teacherName}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 dark:border-[#2D2D3D]/50 justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold">التاريخ: {ev.date}</span>

                      <div className="flex gap-2 items-center">
                        {userData?.role === "student" && (
                          <button
                            onClick={() => handleToggleReminder(ev.id)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-2 ${
                              isReminded
                                ? "bg-[#00B4D8]/10 text-[#0077B6] border-[#00B4D8]/30 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] dark:border-[#D4AF37]/30"
                                : "bg-gray-50 dark:bg-[#20202D] text-gray-500 border-gray-100 dark:border-[#2D2D3D]"
                            }`}
                          >
                            {isReminded ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                            {isReminded ? "مُفعل" : "تذكير"}
                          </button>
                        )}

                        {ev.link && (
                          <a
                            href={ev.link}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#38384D] text-gray-800 dark:text-white px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-colors border border-gray-100 dark:border-transparent"
                          >
                            <Video className="w-4 h-4 text-emerald-500" />
                            دخول
                          </a>
                        )}

                        {userData?.role === "teacher" && (
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors border border-red-100"
                            title="حذف الموعد"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      {/* 5. DELETE MODAL */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEventToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-8 border border-gray-100 dark:border-[#2D2D3D] text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed font-bold">
                هل أنت متأكد من رغبتك في حذف هذا الموعد نهائياً من الجدول الدراسي لجميع الطلاب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 transition-all active:scale-95"
                >
                  تراجع
                </button>
                <button
                  onClick={confirmDeleteEvent}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
