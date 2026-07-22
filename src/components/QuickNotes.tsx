import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Edit3, Trash2, Plus, Search, Check, Save, FileText, 
  Sparkles, Calendar, ArrowUpRight, Loader2, RefreshCw, Filter, ListFilter
} from 'lucide-react';
import { 
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, 
  query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { QuickNote, Course } from '../types';

interface QuickNotesProps {
  db: any;
  userData: {
    id: string;
    name: string;
    role: string;
  };
}

export default function QuickNotes({ db, userData }: QuickNotesProps) {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [noteContent, setNoteContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Load student's enrolled courses to associate notes with them
  useEffect(() => {
    if (!userData?.id) return;

    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, 'courses'),
          where('enrolledStudentIds', 'array-contains', userData.id)
        );
        const querySnapshot = await getDocs(q);
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching enrolled courses for notes:', error);
      }
    };

    fetchCourses();
  }, [db, userData?.id]);

  // Sync / Listen to Quick Notes from Firestore
  useEffect(() => {
    if (!userData?.id) return;

    setLoading(true);
    const notesRef = collection(db, 'quick_notes');
    const q = query(
      notesRef, 
      where('userId', '==', userData.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes: QuickNote[] = [];
      snapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as QuickNote);
      });
      setNotes(fetchedNotes);
      setLoading(false);
    }, (error) => {
      console.error('Error syncing quick notes:', error);
      // Fallback if index isn't created yet or other permissions error
      fallbackFetch();
    });

    // Fallback simple fetch without complex orderBy to prevent blocking
    const fallbackFetch = async () => {
      try {
        const qSimple = query(notesRef, where('userId', '==', userData.id));
        const snap = await getDocs(qSimple);
        const fetchedNotes: QuickNote[] = [];
        snap.forEach((doc) => {
          fetchedNotes.push({ id: doc.id, ...doc.data() } as QuickNote);
        });
        // Sort in memory
        fetchedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setNotes(fetchedNotes);
      } catch (err) {
        console.error('Fallback fetch notes error:', err);
      } finally {
        setLoading(false);
      }
    };

    return () => unsubscribe();
  }, [db, userData?.id]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error('الرجاء كتابة نص الملاحظة أولاً');
      return;
    }

    setSaving(true);
    try {
      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      const courseTitle = selectedCourseId === 'general' ? 'ملاحظات عامة' : (selectedCourse?.title || 'كورس دراسي');

      if (editingNoteId) {
        // Update existing note
        const noteDocRef = doc(db, 'quick_notes', editingNoteId);
        await updateDoc(noteDocRef, {
          content: noteContent.trim(),
          courseId: selectedCourseId,
          courseTitle: courseTitle,
          updatedAt: new Date().toISOString()
        });
        toast.success('تم تحديث الملاحظة بنجاح ✏️');
        setEditingNoteId(null);
      } else {
        // Create new note
        const notesRef = collection(db, 'quick_notes');
        await addDoc(notesRef, {
          userId: userData.id,
          content: noteContent.trim(),
          courseId: selectedCourseId,
          courseTitle: courseTitle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success('تم حفظ الملاحظة السريعة بنجاح! 🌟');
      }

      setNoteContent('');
      setSelectedCourseId('general');
    } catch (error) {
      console.error('Error saving quick note:', error);
      toast.error('فشل في حفظ الملاحظة، يرجى المحاولة لاحقاً');
    } finally {
      setSaving(false);
    }
  };

  const handleEditInit = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setSelectedCourseId(note.courseId);
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteContent('');
    setSelectedCourseId('general');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟')) return;
    try {
      await deleteDoc(doc(db, 'quick_notes', noteId));
      toast.success('تم حذف الملاحظة بنجاح🗑️');
      if (editingNoteId === noteId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Error deleting quick note:', error);
      toast.error('فشل حذف الملاحظة.');
    }
  };

  // Filter & Search Logic
  const filteredNotes = notes.filter(note => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = (note.content || '').toLowerCase().includes(searchLower) || 
                          (note.courseTitle || '').toLowerCase().includes(searchLower);
    const matchesCourse = filterCourseId === 'all' || note.courseId === filterCourseId;
    return matchesSearch && matchesCourse;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
  });

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      {/* Title & Info Banner */}
      <div className="bg-gradient-to-r from-[#00B4D8]/10 via-[#0077B6]/5 to-transparent dark:from-[#D4AF37]/10 dark:via-[#B8860B]/5 dark:to-transparent p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
            دفتر الملاحظات السريعة 📝
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1.5 leading-relaxed">
            اكتب وحشّد أفكارك، ملخصاتك، أو واجباتك المرتبطة بكل درس وكورس لتسهيل مراجعتها لاحقاً.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C28] px-4 py-2 rounded-2xl border border-gray-200/50 dark:border-[#2D2D3D] text-xs font-black shadow-sm text-gray-500 dark:text-gray-400">
          <Sparkles className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
          <span>مزامنة سحابية فائقة الأمان والحفظ ☁️</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right Column: Note Writer Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-5 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-[#2D2D3D]/50">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
              {editingNoteId ? 'تعديل الملاحظة الحالية' : 'ملاحظة جديدة ذكية'}
            </h3>
            {editingNoteId && (
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-black">
                قيد التعديل
              </span>
            )}
          </div>

          <form onSubmit={handleSaveNote} className="space-y-4">
            {/* Associated Course Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 block">
                ربط الملاحظة بكورس معين:
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all cursor-pointer"
              >
                <option value="general">📁 ملاحظات عامة وتنبيهات ذاتية</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    📚 {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Input Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 block flex justify-between items-center">
                <span>محتوى الملاحظة:</span>
                <span className="text-[10px] text-gray-400 font-mono font-bold">
                  {noteContent.length} / 1000 حرف
                </span>
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value.slice(0, 1000))}
                rows={6}
                placeholder="اكتب ملاحظاتك هنا... على سبيل المثال: 'مراجعة الباب الثاني كيمياء وتدوين أهم المعادلات الصعبة قبل امتحان الأسبوع القادم'"
                className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-4 text-sm font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] placeholder-gray-400 dark:placeholder-gray-600 transition-all leading-relaxed resize-none"
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !noteContent.trim()}
                className="flex-1 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] hover:opacity-95 text-white py-3.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingNoteId ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{editingNoteId ? 'حفظ التعديلات الحالية' : 'حفظ الملاحظة السحابية'}</span>
              </button>

              {editingNoteId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-100 dark:bg-[#20202D] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2D2D3D] p-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>

          {/* Quick Guidance Box */}
          <div className="p-4 bg-gray-50/50 dark:bg-[#14141F]/40 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/40 space-y-2">
            <span className="text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37] block">🎯 نصيحة ذكية للمذاكرة:</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
              قم بربط كل ملاحظة بالكورس الخاص بها لمراجعتها بضغطة زر واحدة أثناء مشاهدة حصص المادة أو قبل الاختبارات مباشرة.
            </p>
          </div>
        </div>

        {/* Left Column: Notes List & Filters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Bar: Search, Category Filter, Sort */}
          <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث في محتوى أو تصنيف الملاحظات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl pr-11 pl-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                />
              </div>

              {/* Course filter */}
              <div className="sm:w-48">
                <select
                  value={filterCourseId}
                  onChange={(e) => setFilterCourseId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all cursor-pointer"
                >
                  <option value="all">🔍 جميع الملاحظات ({notes.length})</option>
                  <option value="general">📁 ملاحظات عامة</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      📚 {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] font-black text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" />
                <span>عرض {filteredNotes.length} ملاحظات مصفاة</span>
              </span>

              <div className="flex items-center gap-2">
                <span>ترتيب حسب:</span>
                <button
                  type="button"
                  onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                  className="text-[#00B4D8] dark:text-[#D4AF37] hover:underline cursor-pointer"
                >
                  {sortBy === 'newest' ? 'الأحدث أولاً ⬇️' : 'الأقدم أولاً ⬆️'}
                </button>
              </div>
            </div>
          </div>

          {/* Notes Cards Container */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-16 text-center bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">جاري تحميل ومزامنة ملاحظاتك من السحابة...</span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-16 text-center bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm text-gray-400 font-bold text-xs space-y-3 flex flex-col items-center justify-center">
                <span className="text-4xl">🗒️</span>
                <p className="leading-relaxed">لا توجد ملاحظات سريعة مسجلة ومطابقة حالياً.</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-sm">
                  ابدأ الآن بكتابة وحفظ أول ملاحظة دراسية سريعة لك باستخدام المحرر الذكي على اليمين وسيتم حفظها بشكل دائم.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => {
                    const isGeneral = note.courseId === 'general';
                    return (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-[#1A1A24] p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                      >
                        {/* Decorative background border glow for active editing */}
                        {editingNoteId === note.id && (
                          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 dark:bg-[#D4AF37]" />
                        )}

                        <div className="space-y-3">
                          {/* Card Header: Subject Tag & Date */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                              isGeneral
                                ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30'
                                : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                            }`}>
                              {isGeneral ? '📁 عامة' : `📚 ${note.courseTitle}`}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.updatedAt).toLocaleDateString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Content */}
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words line-clamp-6">
                            {note.content}
                          </p>
                        </div>

                        {/* Actions footer */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-50 dark:border-[#2D2D3D]/50">
                          <button
                            type="button"
                            onClick={() => handleEditInit(note)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-[#20202D] dark:hover:bg-[#2D2D3D] text-gray-500 dark:text-gray-300 rounded-xl transition-colors cursor-pointer"
                            title="تعديل الملاحظة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-red-500 rounded-xl transition-colors cursor-pointer border border-red-100/10"
                            title="حذف الموعد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
