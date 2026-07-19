import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, Users, ImageIcon, Search, Filter, Star, 
  ArrowRight, Award, Sparkles, X, CheckCircle, Phone, 
  Mail, Play, Compass 
} from 'lucide-react';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';
import LuxuriousLoader from './LuxuriousLoader';

interface StudentCoursesProps {
  userData: User;
}

export default function StudentCourses({ userData }: StudentCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [courseRatings, setCourseRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!userData) return;
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    } else {
      setSelectedSubject('');
    }
    // Reset teacher filter when subject changes
    setFilterTeacherId('');
  }, [searchParams, userData?.id]);

  useEffect(() => {
    if (!userData) return;
    setLoading(true);

    // 1. Subscribe to courses in real-time
    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const fetchedCourses: Course[] = [];
      snapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(fetchedCourses);
    }, (error) => {
      console.error('Error listening to courses:', error);
    });

    const fetchOtherData = async () => {
      try {
        // 2. Fetch all teachers
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teachersSnap = await getDocs(teachersQuery);
        const fetchedTeachers: User[] = [];
        teachersSnap.forEach((doc) => {
          fetchedTeachers.push({ id: doc.id, ...doc.data() } as User);
        });
        setTeachers(fetchedTeachers);

        // 3. Fetch reviews & calculate average ratings
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
          console.error('Error fetching reviews/ratings:', err);
        }

        // 4. Fetch progress records
        if (userData?.id) {
          const qProg = query(collection(db, 'course_progress'), where('userId', '==', userData.id));
          const progSnap = await getDocs(qProg);
          const map: Record<string, any> = {};
          progSnap.forEach((doc) => {
            const data = doc.data();
            map[data.courseId] = data;
          });
          setProgressMap(map);
        }
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOtherData();

    return () => {
      unsubscribeCourses();
    };
  }, [userData?.id, userData?.grade]);

  // Compute stats per teacher
  const teacherStats = useMemo(() => {
    const stats: Record<string, { coursesCount: number; totalStudents: number; averageRating: number }> = {};
    
    teachers.forEach(t => {
      const teacherCourses = courses.filter(c => c.teacherId === t.id && c.isActive !== false);
      const coursesCount = teacherCourses.length;
      const totalStudents = teacherCourses.reduce((acc, c) => acc + (c.enrolledStudents || 0), 0);
      
      let ratingSum = 0;
      let ratingCount = 0;
      teacherCourses.forEach(c => {
        const rating = courseRatings[c.id];
        if (rating) {
          ratingSum += rating.average;
          ratingCount += 1;
        }
      });
      const averageRating = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 4.9;

      stats[t.id] = { coursesCount, totalStudents, averageRating };
    });

    return stats;
  }, [teachers, courses, courseRatings]);

  // Extract unique subjects from active courses
  const subjects = useMemo(() => {
    const subs = courses.filter(c => c.isActive !== false).map(c => c.subject);
    return Array.from(new Set(subs)).filter(Boolean);
  }, [courses]);

  // Filter teachers of the selected subject matching the student's grade
  const filteredTeachersOfSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return teachers.filter(t => {
      // Must teach this subject
      const matchesSubject = t.subject?.toLowerCase() === selectedSubject.toLowerCase();
      
      // Must match student's grade if defined
      const matchesGrade = !userData?.grade || 
        (Array.isArray(t.teachingGrades) && t.teachingGrades.includes(userData.grade)) ||
        (courses.some(c => c.teacherId === t.id && c.grade === userData.grade));

      return matchesSubject && matchesGrade;
    });
  }, [teachers, selectedSubject, userData?.grade, courses]);

  // Filter courses of the selected subject matching the student's grade
  const filteredCoursesOfSubject = useMemo(() => {
    return courses.filter(c => {
      const isPublished = c.isActive !== false;
      
      // Filter by subject if selected
      const matchesSubject = !selectedSubject || c.subject?.toLowerCase() === selectedSubject.toLowerCase();
      
      // Filter by student's grade if defined
      const matchesGrade = !userData?.grade || c.grade === userData.grade;
      
      // Filter by teacher if teacher filter is active
      const matchesTeacher = !filterTeacherId || c.teacherId === filterTeacherId;

      // Filter by search search terms
      const matchesSearch = !searchTerm || 
        (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      return isPublished && matchesSubject && matchesGrade && matchesTeacher && matchesSearch;
    });
  }, [courses, selectedSubject, userData?.grade, filterTeacherId, searchTerm]);

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LuxuriousLoader size="md" text="جاري تحميل البيانات..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-2" dir="rtl">
      {selectedSubject ? (
        // ================= SUBJECT DETAILS VIEW =================
        <div className="space-y-8">
          {/* Back button */}
          <button 
            onClick={() => {
              setSelectedSubject('');
              setFilterTeacherId('');
              // Update URL params
              setSearchParams({});
            }}
            className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span>العودة لجميع الكورسات والمواد</span>
          </button>

          {/* Premium Subject Header */}
          <div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 dark:from-[#D4AF37] dark:to-yellow-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-black bg-white/20 py-1 px-3 rounded-full inline-block mb-1">
                تصفح مواد الصف: {userData?.grade || 'كل الصفوف'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                <BookOpen className="w-8 h-8 shrink-0" />
                <span>مادة {selectedSubject}</span>
              </h1>
              <p className="text-white/85 font-medium text-xs sm:text-sm max-w-2xl leading-relaxed">
                هنا تجد نخبة من أفضل معلمي مادة {selectedSubject} مع كورساتهم المصممة خصيصاً لمساعدتك على التفوق في صفك الدراسي.
              </p>
            </div>
          </div>

          {/* SECTION 1: Teachers of this subject */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2D2D3D] pb-3">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                <span>معلمو مادة {selectedSubject} لصفك الدراسي</span>
              </h2>
              <span className="text-xs text-gray-400 font-bold">
                ({filteredTeachersOfSubject.length}) معلّم متاح
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 border border-gray-200 dark:border-[#2D2D3D] animate-pulse h-48" />
                ))}
              </div>
            ) : filteredTeachersOfSubject.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 text-center border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                <div className="w-12 h-12 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">لا يوجد معلمون لهذه المادة حالياً</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  لم يتم تسجيل معلمي مادة {selectedSubject} {userData?.grade ? `لـ ${userData.grade}` : 'في الوقت الحالي'}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachersOfSubject.map((teacher) => {
                  const stats = teacherStats[teacher.id] || { coursesCount: 0, totalStudents: 0, averageRating: 4.9 };
                  const isFiltered = filterTeacherId === teacher.id;

                  return (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white dark:bg-[#1A1A24] rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                        isFiltered 
                          ? 'border-2 border-[#00B4D8] dark:border-[#D4AF37] shadow-md bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5' 
                          : 'border-gray-200 dark:border-[#2D2D3D] shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00B4D8] to-blue-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 select-none">
                            {(teacher.name || 'م').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                              {teacher.name}
                            </h3>
                            <span className="inline-block bg-blue-50 text-[#00B4D8] dark:bg-blue-950/40 dark:text-blue-400 py-0.5 px-2 rounded-md text-[9px] font-black mt-1">
                              {teacher.school || 'معلم متميز'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-2">
                          خبرة متميزة في تبسيط مادة {selectedSubject} وإيصال المعلومات بأحدث الطرق التفاعلية الممتعة.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#2D2D3D] space-y-3">
                        <div className="grid grid-cols-3 gap-1 text-center bg-gray-50/50 dark:bg-[#0D0D12]/20 p-2 rounded-xl text-[11px] font-bold">
                          <div>
                            <span className="block text-[9px] text-gray-400 mb-0.5">الكورسات</span>
                            <span className="text-gray-800 dark:text-gray-200">{stats.coursesCount}</span>
                          </div>
                          <div className="border-x border-gray-200/50 dark:border-gray-800/50">
                            <span className="block text-[9px] text-gray-400 mb-0.5">الطلاب</span>
                            <span className="text-[#00B4D8] dark:text-[#D4AF37]">{stats.totalStudents}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-gray-400 mb-0.5">التقييم</span>
                            <span className="text-yellow-500 flex items-center justify-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-500 stroke-yellow-500" />
                              {stats.averageRating}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (isFiltered) {
                              setFilterTeacherId('');
                            } else {
                              setFilterTeacherId(teacher.id);
                            }
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl font-black text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            isFiltered
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#222230] dark:hover:bg-[#2D2D3E] text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <span>{isFiltered ? 'عرض كورسات كل المعلمين' : 'عرض كورسات هذا المعلم فقط'}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: Courses of this subject */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2D2D3D] pb-3">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                <span>كورسات مادة {selectedSubject} لصفك الدراسي</span>
              </h2>
              <span className="text-xs text-gray-400 font-bold">
                ({filteredCoursesOfSubject.length}) كورس متاح
              </span>
            </div>

            {/* Teacher Filter Notification bar */}
            {filterTeacherId && (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold">
                    تظهر الآن كورسات المعلم: <strong className="font-black">{teachers.find(t => t.id === filterTeacherId)?.name}</strong> فقط
                  </span>
                </div>
                <button 
                  onClick={() => setFilterTeacherId('')}
                  className="text-xs font-black underline hover:text-emerald-950 dark:hover:text-emerald-200 cursor-pointer"
                >
                  عرض جميع الكورسات
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 border border-gray-200 dark:border-[#2D2D3D] animate-pulse h-64" />
                ))}
              </div>
            ) : filteredCoursesOfSubject.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">لا يوجد كورسات لهذه المادة حالياً</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  عذراً، لا تتوفر كورسات مسجلة لمادة {selectedSubject} {userData?.grade ? `لـ ${userData.grade}` : 'في الوقت الحالي'}. ترقبوا إضافتها قريباً!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoursesOfSubject.map((course, idx) => {
                  const rating = courseRatings[course.id] || { average: 5.0, count: 0 };
                  const isEnrolled = userData?.role === 'student' && course.enrolledStudentIds?.includes(userData.id);
                  const progressData = progressMap[course.id];
                  let percent = 0;
                  let completedCount = 0;
                  
                  if (progressData) {
                    if (progressData.completedLessons) {
                      completedCount = progressData.completedLessons.length;
                      const totalLessons = course.lessonsCount || 1;
                      percent = parseFloat(((completedCount / totalLessons) * 100).toFixed(1));
                    } else if (progressData.progressPercent !== undefined) {
                      percent = progressData.progressPercent;
                    }
                  }

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="bg-white dark:bg-[#1A1A24] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-150 dark:border-[#2D2D3D] group transition-all duration-300 flex flex-col relative h-full hover:-translate-y-1"
                    >
                      <Link to={`/course/${course.id}`} className="absolute inset-0 z-10" />
                      
                      {/* Image Container with strict 16:10 Aspect Ratio */}
                      <div className="aspect-[16/10] w-full relative overflow-hidden bg-gray-50 dark:bg-[#15151F] pointer-events-none">
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
                            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                          </div>
                        )}
                        
                        {/* Subject Badge */}
                        <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                          {course.subject}
                        </div>

                        {/* Grade Badge */}
                        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-white shadow-sm">
                          {course.grade}
                        </div>
                      </div>

                      {/* Content Container */}
                      <div className="p-5 flex-1 flex flex-col justify-between pointer-events-none">
                        <div>
                          {/* Teacher & Rating Header */}
                          <div className="flex items-center justify-between mb-3 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold">
                              <div className="w-5 h-5 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37]">
                                {course.teacherName?.charAt(0) || 'أ'}
                              </div>
                              <span>{course.teacherName}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded-lg font-bold">
                              <Star className="w-3 h-3 fill-[#F5A623]" />
                              <span>{rating.average.toFixed(1)}</span>
                              <span className="text-[9px] opacity-70">({rating.count})</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-black text-gray-950 dark:text-white mb-2 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                            {course.title}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed font-medium">
                            {course.description}
                          </p>
                        </div>

                        <div>
                          {/* Progress tracker for enrolled courses */}
                          {isEnrolled && (
                            <div className="mb-4 bg-gray-50 dark:bg-[#222230]/30 p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                              <div className="flex items-center justify-between mb-1.5 text-[10px] font-black">
                                <span className="text-gray-400 dark:text-gray-500">التقدم الدراسي</span>
                                <span className="text-[#00B4D8] dark:text-[#D4AF37] font-bold font-mono">
                                  {percent.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-bold flex justify-between items-center">
                                <span>تم إنجاز {completedCount} من {course.lessonsCount || 0} دروس</span>
                                <span>{percent === 100 ? "مكتمل 🌟" : "قيد الدراسة 📚"}</span>
                              </div>
                            </div>
                          )}

                          {/* Footer price & lesson counter */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2D2D3D] text-xs font-bold text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              <span>{course.lessonsCount || 0} درس</span>
                            </div>
                            
                            <div className="text-base font-black text-[#00B4D8] dark:text-[#D4AF37]">
                              {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ================= GENERAL EXPLORE VIEW =================
        <div className="space-y-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">استكشف الكورسات والمواد</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">اختر الكورسات المناسبة لصفك الدراسي ({userData.grade || 'كل الصفوف'})</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن كورس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-12 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors text-sm font-bold"
              />
            </div>
            <div className="relative md:w-64">
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  // Update search param
                  if (e.target.value) {
                    setSearchParams({ subject: e.target.value, tab: 'subjects' });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-12 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors appearance-none text-xs font-black"
              >
                <option value="">كل المواد الدراسية</option>
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LuxuriousLoader size="md" text="جاري تحميل الكورسات..." />
            </div>
          ) : filteredCoursesOfSubject.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center shadow-sm border border-gray-200 dark:border-[#2D2D3D]"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#222230] rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد كورسات مطابقة</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">لم نتمكن من العثور على كورسات تطابق بحثك الحالي لصفك الدراسي.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoursesOfSubject.map((course, idx) => {
                const progressData = progressMap[course.id];
                let percent = 0;
                let completedCount = 0;
                
                if (progressData) {
                  if (progressData.completedLessons) {
                    completedCount = progressData.completedLessons.length;
                    const totalLessons = course.lessonsCount || 1;
                    percent = parseFloat(((completedCount / totalLessons) * 100).toFixed(1));
                  } else if (progressData.progressPercent !== undefined) {
                    percent = progressData.progressPercent;
                  }
                }
                const isEnrolled = userData?.role === 'student' && course.enrolledStudentIds?.includes(userData.id);
                const rating = courseRatings[course.id] || { average: 5.0, count: 0 };

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-white dark:bg-[#1A1A24] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-150 dark:border-[#2D2D3D] group transition-all duration-300 flex flex-col relative h-full hover:-translate-y-1"
                  >
                    <Link to={`/course/${course.id}`} className="absolute inset-0 z-10" />
                    
                    {/* Image Container with strict 16:10 Aspect Ratio */}
                    <div className="aspect-[16/10] w-full relative overflow-hidden bg-gray-50 dark:bg-[#15151F] pointer-events-none">
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
                          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                        </div>
                      )}
                      
                      {/* Subject Badge */}
                      <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                        {course.subject}
                      </div>

                      {/* Grade Badge */}
                      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-white shadow-sm">
                        {course.grade}
                      </div>
                    </div>

                    {/* Content Container */}
                    <div className="p-5 flex-1 flex flex-col justify-between pointer-events-none">
                      <div>
                        {/* Teacher & Rating Header */}
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold">
                            <div className="w-5 h-5 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37]">
                              {course.teacherName?.charAt(0) || 'أ'}
                            </div>
                            <span>{course.teacherName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded-lg font-bold">
                            <Star className="w-3 h-3 fill-[#F5A623]" />
                            <span>{rating.average.toFixed(1)}</span>
                            <span className="text-[9px] opacity-70">({rating.count || 0})</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-black text-gray-950 dark:text-white mb-2 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                          {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed font-medium">
                          {course.description}
                        </p>
                      </div>

                      <div>
                        {/* Progress tracker for enrolled courses */}
                        {isEnrolled && (
                          <div className="mb-4 bg-gray-50 dark:bg-[#222230]/30 p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                            <div className="flex items-center justify-between mb-1.5 text-[10px] font-black">
                              <span className="text-gray-400 dark:text-gray-500">التقدم الدراسي</span>
                              <span className="text-[#00B4D8] dark:text-[#D4AF37] font-bold font-mono">
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-bold flex justify-between items-center">
                              <span>تم إنجاز {completedCount} من {course.lessonsCount || 0} دروس</span>
                              <span>{percent === 100 ? "مكتمل 🌟" : "قيد الدراسة 📚"}</span>
                            </div>
                          </div>
                        )}

                        {/* Footer price & lesson counter */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2D2D3D] text-xs font-bold text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span>{course.lessonsCount || 0} درس</span>
                          </div>
                          
                          <div className="text-base font-black text-[#00B4D8] dark:text-[#D4AF37]">
                            {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
