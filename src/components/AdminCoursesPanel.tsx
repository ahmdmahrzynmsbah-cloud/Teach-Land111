import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Course, User } from '../types';
import { 
  BookOpen, Users, ShieldAlert, CheckCircle, XCircle, Search, 
  DollarSign, Edit2, ChevronLeft, Trash2, ShieldCheck, Filter, UserX, Award, HelpCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import CourseStudentsTable from './CourseStudentsTable';

export default function AdminCoursesPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modal states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewingStudents, setViewingStudents] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [editingPriceCourse, setEditingPriceCourse] = useState<Course | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const gradesList = ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const fetchedCourses: Course[] = [];
      coursesSnap.forEach(doc => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(fetchedCourses);

      // Fetch users (to get teacher and student lists)
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedUsers: User[] = [];
      usersSnap.forEach(doc => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching admin courses data:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الكورسات');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    const currentIsActive = course.isActive !== false; // default true if undefined
    const nextIsActive = !currentIsActive;
    
    try {
      await updateDoc(doc(db, 'courses', course.id), {
        isActive: nextIsActive
      });
      
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isActive: nextIsActive } : c));
      
      toast.success(nextIsActive ? 'تم تفعيل الكورس بنجاح' : 'تم إلغاء تفعيل الكورس بنجاح');
    } catch (err) {
      console.error('Error toggling course status:', err);
      toast.error('حدث خطأ أثناء تعديل حالة الكورس');
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceCourse || !newPrice) return;

    const priceNum = Number(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }

    try {
      await updateDoc(doc(db, 'courses', editingPriceCourse.id), {
        price: priceNum
      });

      setCourses(prev => prev.map(c => c.id === editingPriceCourse.id ? { ...c, price: priceNum } : c));
      setEditingPriceCourse(null);
      setNewPrice('');
      toast.success('تم تحديث سعر الكورس بنجاح');
    } catch (err) {
      console.error('Error updating course price:', err);
      toast.error('حدث خطأ أثناء تعديل سعر الكورس');
    }
  };

  const handleRemoveStudentFromCourse = async (studentId: string | string[], course: Course) => {
    try {
      const studentIds = Array.isArray(studentId) ? studentId : [studentId];
      const newEnrolledIds = (course.enrolledStudentIds || []).filter(id => !studentIds.includes(id));
      const newEnrolledCount = Math.max(0, newEnrolledIds.length);

      await updateDoc(doc(db, 'courses', course.id), {
        enrolledStudentIds: newEnrolledIds,
        enrolledStudents: newEnrolledCount
      });

      // Update local states
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, enrolledStudentIds: newEnrolledIds, enrolledStudents: newEnrolledCount } : c));
      setViewingStudents(prev => prev && prev.id === course.id ? { ...prev, enrolledStudentIds: newEnrolledIds, enrolledStudents: newEnrolledCount } : prev);
      setEnrolledStudents(prev => prev.filter(u => !studentIds.includes(u.id)));

      toast.success(studentIds.length > 1 ? `تم إزالة ${studentIds.length} طالب من الكورس بنجاح` : 'تم إلغاء اشتراك الطالب وحذفه من الكورس بنجاح');
    } catch (err) {
      console.error('Error removing student:', err);
      toast.error('حدث خطأ أثناء حذف الطالب من الكورس');
    }
  };

  const handleUpdateStudent = async (studentId: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', studentId), updates);
      
      // Update local states
      setUsers(prev => prev.map(u => u.id === studentId ? { ...u, ...updates } : u));
      setEnrolledStudents(prev => prev.map(u => u.id === studentId ? { ...u, ...updates } : u));
      
      toast.success('تم تحديث بيانات الطالب بنجاح');
    } catch (err) {
      console.error('Error updating student:', err);
      toast.error('حدث خطأ أثناء تحديث بيانات الطالب');
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      toast.success('تم حذف الكورس نهائياً بنجاح 🗑️');
      setCourseToDelete(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('فشل في حذف الكورس');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadEnrolledStudentsList = (course: Course) => {
    setLoadingStudents(true);
    setViewingStudents(course);
    
    // Filter matching users
    const enrolledIds = course.enrolledStudentIds || [];
    const enrolledList = users.filter(u => enrolledIds.includes(u.id));
    
    setEnrolledStudents(enrolledList);
    setLoadingStudents(false);
  };

  // Filters logic
  const filteredCourses = courses.filter(c => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = (c.title || '').toLowerCase().includes(q) || 
                          (c.teacherName || '').toLowerCase().includes(q) ||
                          (c.subject || '').toLowerCase().includes(q);
    const matchesGrade = selectedGrade === 'all' || c.grade === selectedGrade;
    
    const courseIsActive = c.isActive !== false;
    const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'active' && courseIsActive) || 
                          (selectedStatus === 'inactive' && !courseIsActive);

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const filteredEnrolledStudents = enrolledStudents.filter(student => {
    const queryStr = studentSearchQuery.toLowerCase().trim();
    if (!queryStr) return true;
    return (student.name || '').toLowerCase().includes(queryStr) ||
           (student.email || '').toLowerCase().includes(queryStr) ||
           (student.phone || '').toLowerCase().includes(queryStr) ||
           (student.governorate || '').toLowerCase().includes(queryStr) ||
           (student.school || '').toLowerCase().includes(queryStr) ||
           (student.grade || '').toLowerCase().includes(queryStr);
  });

  if (viewingStudents) {
    return (
      <div className="space-y-6 text-right font-sans" dir="rtl">
        {/* Top Header Card */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-150 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <button
              onClick={() => {
                setViewingStudents(null);
                setStudentSearchQuery('');
              }}
              className="group mb-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              <span>العودة لقائمة الكورسات</span>
            </button>
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">الطلاب المشتركين في الكورس 👥</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
              الكورس: <span className="text-[#00B4D8] dark:text-[#D4AF37]">{viewingStudents.title}</span> • الأستاذ: {viewingStudents.teacherName} • المادة: {viewingStudents.subject}
            </p>
          </div>
          <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 px-4 py-2.5 rounded-2xl border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 font-bold text-xs text-[#00B4D8] dark:text-[#D4AF37] self-stretch sm:self-auto text-center">
            المشتركين حالياً: {viewingStudents.enrolledStudents || 0} طالب
          </div>
        </div>

        <div className="h-[600px] mt-4">
          <CourseStudentsTable 
            students={enrolledStudents} 
            course={viewingStudents} 
            onRemoveStudent={handleRemoveStudentFromCourse}
            onUpdateStudent={handleUpdateStudent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Welcome Title */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-150 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#00B4D8] dark:text-[#D4AF37]">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">إدارة المحتوى والتدريس</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">التحكم بكورسات المعلمين 🎓</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">يمكنك تفعيل وإيقاف الكورسات، تعديل الأسعار، ومتابعة الطلاب المشتركين لكل كورس على المنصة.</p>
        </div>
        <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 px-4 py-2 rounded-2xl border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 font-bold text-xs text-[#00B4D8] dark:text-[#D4AF37]">
          إجمالي الكورسات: {courses.length} كورس
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ابحث باسم الكورس، المعلم، أو المادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2D2D3D] focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all font-bold outline-none"
          />
        </div>

        {/* Grade Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2D2D3D] focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all font-bold outline-none cursor-pointer"
          >
            <option value="all">كل المراحل الدراسية</option>
            {gradesList.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2D2D3D] focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all font-bold outline-none cursor-pointer"
          >
            <option value="all">كل الحالات (مفعل/ملغي)</option>
            <option value="active">الكورسات المفعلة فقط</option>
            <option value="inactive">الكورسات الملغاة فقط</option>
          </select>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="text-center py-24 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm">
          <div className="w-10 h-10 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-gray-500 font-bold">جاري تحميل كورسات المعلمين وتجهيز لوحة التحكم...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm">
          <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="font-black text-sm text-gray-700 dark:text-gray-300">لا توجد كورسات تطابق خيارات البحث الحالية 🔍</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const isActive = course.isActive !== false;
            return (
              <motion.div
                layout
                key={course.id}
                className={`bg-white dark:bg-[#1A1A24] rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  !isActive ? 'border-red-200 dark:border-red-950/40 bg-red-50/5 dark:bg-red-950/5' : 'border-gray-150 dark:border-[#2D2D3D]/60'
                }`}
              >
                {/* Course Banner Image & Tags */}
                <div className="h-40 bg-gray-100 dark:bg-[#0D0D12] relative overflow-hidden shrink-0">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-[#111] dark:to-[#1A1A24] text-gray-400">
                      <BookOpen className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm ${
                    isActive 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {isActive ? 'نشط ومفعل 🟢' : 'ملغي / موقف 🔴'}
                  </span>
                  
                  {/* Price Tag */}
                  <span className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-black">
                    {course.price === 0 ? 'مجااااني 🎁' : `${course.price} ج.م`}
                  </span>
                </div>

                {/* Course Details Body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 block mb-1">{course.grade} • {course.subject}</span>
                    <h3 className="font-black text-sm text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold line-clamp-2 mt-1 leading-relaxed">
                      {course.description || 'لا يوجد وصف مضاف لهذا الكورس.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-[#0D0D12] p-2.5 rounded-xl border border-gray-100 dark:border-[#2D2D3D]/40 text-center font-bold text-[10px]">
                    <div>
                      <span className="block text-gray-400 mb-0.5">المعلم 🧑‍🏫</span>
                      <span className="text-gray-800 dark:text-gray-200 block truncate">{course.teacherName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 mb-0.5">المشتركون 👥</span>
                      <span className="text-gray-800 dark:text-gray-200">{course.enrolledStudents || 0} طالب</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls Area */}
                <div className="p-4 border-t border-gray-150 dark:border-[#2D2D3D]/40 flex gap-2 shrink-0 bg-gray-50/50 dark:bg-[#1E1E2B]/30">
                  {/* Toggle Active Button */}
                  <button
                    onClick={() => handleToggleActive(course)}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-950/20 dark:hover:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>إيقاف الكورس</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>تفعيل الكورس</span>
                      </>
                    )}
                  </button>

                  {/* Change Price Button */}
                  <button
                    onClick={() => {
                      setEditingPriceCourse(course);
                      setNewPrice(course.price.toString());
                    }}
                    className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                    title="تعديل سعر الكورس"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* View Subscribers Button */}
                  <button
                    onClick={() => loadEnrolledStudentsList(course)}
                    className="py-2 px-3 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3D3D4D] text-gray-700 dark:text-gray-300 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>الطلاب ({course.enrolledStudents || 0})</span>
                  </button>

                  {/* Delete Course Button */}
                  <button
                    onClick={() => setCourseToDelete(course)}
                    className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                    title="حذف الكورس نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Price Modal */}
      <AnimatePresence>
        {editingPriceCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative text-right"
              dir="rtl"
            >
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">تحديث سعر الكورس 🏷️</h3>
              <p className="text-xs text-gray-500 font-bold mb-4">{editingPriceCourse.title}</p>

              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">سعر الاشتراك الجديد (بالج.م المصري)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs font-bold">ج.م</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="أدخل السعر الجديد، 0 يعني كورس مجاني"
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2D2D3D] focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] text-sm font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:bg-[#0077B6] dark:hover:bg-[#B8860B] rounded-xl font-black text-xs transition-all cursor-pointer"
                  >
                    حفظ السعر الجديد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPriceCourse(null);
                      setNewPrice('');
                    }}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-500 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Course Confirmation Modal */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative text-right"
              dir="rtl"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">تأكيد حذف الكورس نهائياً</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                  هل أنت متأكد من رغبتك في حذف كورس <span className="text-red-500">"{courseToDelete.title}"</span> للأبد؟
                </p>
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-bold leading-relaxed">
                    ⚠️ تنبيه: هذا الإجراء سيقوم بمسح كافة بيانات الكورس من قاعدة البيانات. الطلاب المشتركين لن يتمكنوا من الوصول إليه مرة أخرى!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteCourse}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>نعم، احذف الكورس</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
