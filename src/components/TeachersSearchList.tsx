import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Users, BookOpen, Star, Search, Filter, Phone, Mail, 
  ArrowRight, Award, Video, Play, Sparkles, Compass, CheckCircle 
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';

interface TeachersSearchListProps {
  userData: User;
}

export default function TeachersSearchList({ userData }: TeachersSearchListProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseRatings, setCourseRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  // Selected Teacher state for the drill-down view
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // 1. Fetch all users who are teachers
      const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const teachersSnap = await getDocs(teachersQuery);
      const fetchedTeachers: User[] = [];
      teachersSnap.forEach((doc) => {
        fetchedTeachers.push({ id: doc.id, ...doc.data() } as User);
      });
      setTeachers(fetchedTeachers);

      // 2. Fetch all courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const fetchedCourses: Course[] = [];
      coursesSnap.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(fetchedCourses);

      // 3. Fetch reviews to compute ratings
      try {
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        const ratings: Record<string, { total: number; count: number }> = {};
        reviewsSnap.forEach((doc) => {
          const data = doc.data();
          const cid = data.courseId;
          if (cid) {
            if (!ratings[cid]) {
              ratings[cid] = { total: 0, count: 0 };
            }
            ratings[cid].total += data.rating || 0;
            ratings[cid].count += 1;
          }
        });

        const formattedRatings: Record<string, { average: number; count: number }> = {};
        Object.keys(ratings).forEach((cid) => {
          formattedRatings[cid] = {
            average: parseFloat((ratings[cid].total / ratings[cid].count).toFixed(1)),
            count: ratings[cid].count
          };
        });
        setCourseRatings(formattedRatings);
      } catch (err) {
        console.error('Error fetching course ratings:', err);
      }

    } catch (error) {
      console.error('Error fetching teachers/courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute stats per teacher
  const teacherStats = useMemo(() => {
    const stats: Record<string, { coursesCount: number; totalStudents: number; averageRating: number }> = {};
    
    teachers.forEach(t => {
      // Find courses belonging to this teacher
      const teacherCourses = courses.filter(c => c.teacherId === t.id && c.isActive !== false);
      const coursesCount = teacherCourses.length;
      
      // Accumulate enrolled students
      const totalStudents = teacherCourses.reduce((acc, c) => acc + (c.enrolledStudents || 0), 0);
      
      // Calculate average rating across teacher's courses
      let ratingSum = 0;
      let ratingCount = 0;
      teacherCourses.forEach(c => {
        const rating = courseRatings[c.id];
        if (rating) {
          ratingSum += rating.average;
          ratingCount += 1;
        }
      });
      const averageRating = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 4.9; // Decent default

      stats[t.id] = { coursesCount, totalStudents, averageRating };
    });

    return stats;
  }, [teachers, courses, courseRatings]);

  // Extract all unique subjects from teachers or courses
  const availableSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    teachers.forEach(t => {
      if (t.subject) subjectsSet.add(t.subject);
    });
    courses.forEach(c => {
      if (c.subject) subjectsSet.add(c.subject);
    });
    return Array.from(subjectsSet);
  }, [teachers, courses]);

  // Extract all grade options
  const gradeOptions = [
    "الأول الإعدادي",
    "الثاني الإعدادي",
    "الثالث الإعدادي",
    "الأول الثانوي",
    "الثاني الثانوي",
    "الثالث الثانوي"
  ];

  // Default filter to student's grade if empty
  useEffect(() => {
    if (userData?.grade) {
      setSelectedGrade(userData.grade);
    }
  }, [userData?.grade]);

  // Filter teachers based on criteria
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = !selectedSubject || t.subject === selectedSubject;
      
      // Check if teacher teaches this grade (matches selectedGrade)
      const matchesGrade = !selectedGrade || 
        (Array.isArray(t.teachingGrades) && t.teachingGrades.includes(selectedGrade)) ||
        (courses.some(c => c.teacherId === t.id && c.grade === selectedGrade));

      return matchesSearch && matchesSubject && matchesGrade;
    });
  }, [teachers, searchTerm, selectedSubject, selectedGrade, courses]);

  // Get courses belonging to currently selected teacher
  const selectedTeacherCourses = useMemo(() => {
    if (!selectedTeacher) return [];
    return courses.filter(c => {
      const isBelonging = c.teacherId === selectedTeacher.id && c.isActive !== false;
      if (!isBelonging) return false;
      if (userData?.grade) {
        return c.grade === userData.grade;
      }
      return true;
    });
  }, [selectedTeacher, courses, userData?.grade]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <AnimatePresence mode="wait">
        {!selectedTeacher ? (
          // --- TEACHERS GRID LIST VIEW ---
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header section with instructions */}
            <div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 dark:from-[#D4AF37] dark:to-yellow-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-black">
                  <Compass className="w-3.5 h-3.5 animate-spin" />
                  <span>كل المعلمين في منصة واحدة</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">ابحث عن معلمك واستعد للتفوق 🚀</h1>
                <p className="text-white/80 font-medium text-sm sm:text-base max-w-2xl leading-relaxed">
                  تصفح قائمة نخبة معلمي المملكة المسجلين بالمنصة، يمكنك فلترتهم بحسب تخصص المادة للوصول السريع إلى الكورسات المتميزة والاشتراك الفوري.
                </p>
              </div>
            </div>

            {/* Filters panel */}
            <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search input */}
              <div className={`relative ${userData?.grade ? 'md:col-span-7' : 'md:col-span-5'}`}>
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن اسم المعلم أو المادة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-12 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-colors text-sm font-bold"
                />
              </div>

              {/* Subject Filter */}
              <div className={`relative ${userData?.grade ? 'md:col-span-4' : 'md:col-span-3'}`}>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-colors text-xs font-black appearance-none"
                >
                  <option value="">كل المواد الدراسية</option>
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Grade Filter - Hidden if student has a grade */}
              {!userData?.grade && (
                <div className="relative md:col-span-3">
                  <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-colors text-xs font-black appearance-none"
                  >
                    <option value="">كل الصفوف الدراسية</option>
                    {gradeOptions.map(grade => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reset button */}
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('');
                  if (userData?.grade) {
                    setSelectedGrade(userData.grade);
                  } else {
                    setSelectedGrade('');
                  }
                }}
                className="md:col-span-1 py-3 text-xs font-black text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-center w-full"
              >
                إعادة ضبط
              </button>
            </div>

            {/* List count */}
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-gray-400">
                تم العثور على {filteredTeachers.length} معلّم ممتاز
              </span>
              {selectedGrade && (
                <span className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 py-1.5 px-3.5 rounded-xl border border-transparent flex items-center gap-1.5 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>
                    {userData?.grade === selectedGrade 
                      ? `تمت التصفية تلقائياً لصفك الدراسي: ${selectedGrade}`
                      : `عرض المعلمين لـ: ${selectedGrade}`}
                  </span>
                </span>
              )}
            </div>

            {/* Teachers Grid */}
            {filteredTeachers.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-16 text-center border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">لا يوجد معلمون مطابقون حالياً</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  حاول تغيير فلتر البحث أو الفئات للوصول للمدرسين المسجلين في المنصة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher, idx) => {
                  const stats = teacherStats[teacher.id] || { coursesCount: 0, totalStudents: 0, averageRating: 4.9 };
                  return (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 relative group"
                    >
                      {/* Teacher Top Info */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00B4D8] to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 select-none">
                            {(teacher.name || 'م').charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <h3 className="text-base font-black text-gray-900 dark:text-white truncate group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors">
                              {teacher.name || 'الأستاذ'}
                            </h3>
                            {/* Subject badge */}
                            <span className="inline-block bg-blue-50 text-[#00B4D8] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 py-0.5 px-2.5 rounded-lg text-[10px] font-black">
                              {teacher.subject || 'معلم معتمد'}
                            </span>
                          </div>
                        </div>

                        {/* Bio description */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-3">
                          {teacher.school ? `يدرس في ${teacher.school}. ` : ''}
                          خبرة ممتازة في شرح وتبسيط المناهج الدراسية لجميع المراحل وإيصال المعلومة بشكل ممتع وسهل.
                        </p>

                        {/* Taught grades indicators */}
                        {Array.isArray(teacher.teachingGrades) && teacher.teachingGrades.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {teacher.teachingGrades.map((g, i) => (
                              <span key={i} className="text-[9px] font-black bg-gray-100 dark:bg-[#0D0D12] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats Divider & Content */}
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2D2D3D] space-y-4">
                        <div className="grid grid-cols-3 gap-1 text-center bg-gray-50 dark:bg-[#0D0D12]/30 p-2.5 rounded-xl">
                          <div>
                            <span className="block text-[10px] font-black text-gray-400 mb-0.5">الكورسات</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">{stats.coursesCount}</span>
                          </div>
                          <div className="border-x border-gray-200/50 dark:border-gray-800/50">
                            <span className="block text-[10px] font-black text-gray-400 mb-0.5">الطلاب</span>
                            <span className="text-sm font-black text-[#00B4D8] dark:text-[#D4AF37]">{stats.totalStudents}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-gray-400 mb-0.5">التقييم</span>
                            <span className="text-sm font-black text-yellow-500 flex items-center justify-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-500 stroke-yellow-500" />
                              {stats.averageRating}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedTeacher(teacher)}
                          className="w-full bg-[#00B4D8] hover:bg-[#0077B6] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white dark:text-gray-900 py-3 px-4 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>استكشف كورسات المعلم</span>
                          <ArrowRight className="w-4 h-4 rotate-180 shrink-0" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          // --- TEACHER DRILL-DOWN DETAIL VIEW ---
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Back to list button */}
            <button
              onClick={() => setSelectedTeacher(null)}
              className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span>العودة لجميع المعلمين</span>
            </button>

            {/* Profile banner header */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right">
                <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#00B4D8] to-blue-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shrink-0 select-none">
                  {(selectedTeacher.name || 'م').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{selectedTeacher.name}</h1>
                    <span className="bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-transparent py-0.5 px-3 rounded-full text-xs font-black">
                      معلم مادة: {selectedTeacher.subject || 'غير محدد'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    مدرسة المعلم: {selectedTeacher.school || 'مدرسة متميزة بالمنصة'}
                  </p>
                  
                  {/* Contact pills */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1">
                    {selectedTeacher.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-bold" dir="ltr">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{selectedTeacher.email}</span>
                      </div>
                    )}
                    {selectedTeacher.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-bold" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{selectedTeacher.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="flex gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-[#2D2D3D]">
                <div className="bg-gray-50 dark:bg-[#0D0D12]/30 p-4 rounded-2xl flex-1 text-center md:min-w-[110px]">
                  <span className="block text-[10px] font-black text-gray-400 mb-1">كورسات منشورة</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {selectedTeacherCourses.length} كورس
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-[#0D0D12]/30 p-4 rounded-2xl flex-1 text-center md:min-w-[110px]">
                  <span className="block text-[10px] font-black text-gray-400 mb-1">إجمالي الطلاب</span>
                  <span className="text-lg font-black text-[#00B4D8] dark:text-[#D4AF37]">
                    {selectedTeacherCourses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0)} طالب
                  </span>
                </div>
              </div>
            </div>

            {/* Courses section header */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                <span>المناهج والكورسات المتاحة للمعلم</span>
              </h2>
              <p className="text-xs font-bold text-gray-400">
                اختر الكورس التعليمي المناسب، تصفح المحاضرات والدروس ثم ابدأ رحلة التميز والنجاح.
              </p>
            </div>

            {/* Teacher's courses list */}
            {selectedTeacherCourses.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-16 text-center border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">لا توجد كورسات منشورة بعد</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  هذا المعلم لم يقم بنشر أي كورسات أو برامج تعليمية بالوقت الحالي.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedTeacherCourses.map((course, index) => {
                  const rating = courseRatings[course.id] || { average: 5.0, count: 0 };
                  const isEnrolled = course.enrolledStudentIds?.includes(userData?.id || "");
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white dark:bg-[#1A1A24] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-[#2D2D3D] group hover:shadow-md transition-all flex flex-col h-full relative"
                    >
                      {/* Course Image Wrapper */}
                      <div className="h-44 relative overflow-hidden bg-gray-100 dark:bg-[#222230]">
                        {course.imageUrl ? (
                          <img 
                            src={course.imageUrl} 
                            alt={course.title} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                            }} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        {/* Grade tag */}
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                          {course.grade}
                        </div>
                      </div>

                      {/* Course Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold">{selectedTeacher.name}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500 stroke-yellow-500" />
                              <span className="text-[11px] font-black text-gray-900 dark:text-white">
                                {rating.average.toFixed(1)}
                              </span>
                              <span className="text-[9px] text-gray-400">({rating.count})</span>
                            </div>
                          </div>
                          <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        {/* Middle Stats badges */}
                        <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-gray-50 dark:border-[#2D2D3D] text-right">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{course.enrolledStudents || 0} طالب مشترك</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                            <Play className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{course.lessonsCount || 0} درس تعليمي</span>
                          </div>
                        </div>

                        {/* Bottom action bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2D2D3D] mt-auto">
                          <span className="text-lg font-black text-[#00B4D8] dark:text-[#D4AF37]">
                            {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                          </span>

                          <Link
                            to={`/course/${course.id}`}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                              isEnrolled
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                                : 'bg-[#00B4D8]/10 text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] dark:hover:bg-[#D4AF37] dark:hover:text-gray-900'
                            }`}
                          >
                            {isEnrolled ? 'ابدأ التعلم الآن' : 'تفاصيل الاشتراك'}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
