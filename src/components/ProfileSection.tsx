import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Phone, Mail, MapPin, School, GraduationCap, 
  Lock, Trash2, Key, Save, AlertTriangle, ShieldAlert, Shield, 
  BookOpen, Calendar, IdCard, Sparkles, Check, Download, RefreshCw, Award,
  BarChart2, Trophy, TrendingUp, CheckCircle, Play, Users, Percent, Star, ChevronLeft, Zap, LogOut
} from 'lucide-react';
import { updateDoc, doc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import confetti from 'canvas-confetti';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليوبية', 'بورسعيد', 'السويس', 
  'مطروح', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية', 'الإسماعيلية', 
  'دمياط', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
  'سوهاج', 'قنا', 'أسوان', 'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 
  'شمال سيناء', 'جنوب سيناء'
];

interface ProfileSectionProps {
  userData: any;
  onUpdateUserData: (newData: any) => void;
}

export default function ProfileSection({ userData, onUpdateUserData }: ProfileSectionProps) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'courses' | 'achievements' | 'basic' | 'academic' | 'idCard' | 'security' | 'danger'>('stats');
  const [loading, setLoading] = useState(false);
  const [avatarBg, setAvatarBg] = useState(userData?.avatarBg || 'from-[#00B4D8] to-[#0077B6]');
  const [isFlipped, setIsFlipped] = useState(false);

  // Stats and courses state
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, any>>({});
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [realBadges, setRealBadges] = useState<any[]>([]);
  const [loadingStatsData, setLoadingStatsData] = useState(true);
  const [teacherStats, setTeacherStats] = useState<{
    coursesCount: number;
    totalStudents: number;
    totalLessons: number;
    totalQuizzes: number;
    avgRating: number;
    avgTeacherRating?: number;
    avgContentRating?: number;
    ratingCount: number;
  }>({
    coursesCount: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    avgRating: 5.0,
    ratingCount: 0
  });

  // Fetch stats and courses
  useEffect(() => {
    const fetchProfileStatsAndCourses = async () => {
      if (!userData?.id) return;
      try {
        setLoadingStatsData(true);
        
        // 1. Fetch all courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const allCourses: any[] = [];
        coursesSnap.forEach(doc => {
          allCourses.push({ id: doc.id, ...doc.data() });
        });

        // 2. Filter courses based on role
        if (userData.role === 'student') {
          // Enrolled courses are those where enrolledStudentIds includes student id
          const enrolled = allCourses.filter(c => c.enrolledStudentIds?.includes(userData.id));
          setMyCourses(enrolled);

          // Fetch student course progress
          const qProg = query(collection(db, 'course_progress'), where('userId', '==', userData.id));
          const progSnap = await getDocs(qProg);
          const pMap: Record<string, any> = {};
          const earnedBadges: any[] = [];
          
          progSnap.forEach(docSnap => {
            const data = docSnap.data();
            pMap[data.courseId] = data;
            
            // Check if course is completed
            const courseObj = allCourses.find(c => c.id === data.courseId);
            if (courseObj) {
              let isCompleted = false;
              if (data.progressPercent !== undefined && data.progressPercent >= 100) {
                isCompleted = true;
              } else if (data.completedLessons && courseObj.lessonsCount && data.completedLessons.length >= courseObj.lessonsCount) {
                isCompleted = true;
              }
              
              if (isCompleted) {
                earnedBadges.push({
                  id: `badge-${data.courseId}`,
                  courseId: data.courseId,
                  courseTitle: courseObj.title,
                  dateEarned: data.updatedAt ? new Date(data.updatedAt) : (data.createdAt ? new Date(data.createdAt) : new Date()),
                  type: 'gold',
                  subject: courseObj.subject || 'عام'
                });
              }
            }
          });
          setCourseProgressMap(pMap);
          setRealBadges(earnedBadges);

          // Fetch student quiz submissions
          const qSub = query(collection(db, 'quiz_submissions'), where('userId', '==', userData.id));
          const subSnap = await getDocs(qSub);
          const subs: any[] = [];
          subSnap.forEach(doc => {
            subs.push({ id: doc.id, ...doc.data() });
          });
          
          // Sort by submittedAt
          subs.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
          setQuizSubmissions(subs);

        } else if (userData.role === 'teacher') {
          // Courses created by teacher
          const created = allCourses.filter(c => c.teacherId === userData.id);
          setMyCourses(created);

          // Calculate teacher stats
          let totalStudents = 0;
          let totalLessons = 0;
          created.forEach(c => {
            totalStudents += c.enrolledStudentIds?.length || 0;
            totalLessons += c.lessonsCount || 0;
          });

          // Fetch quizzes created in teacher's courses
          const quizzesSnap = await getDocs(collection(db, 'quizzes'));
          let teacherQuizzesCount = 0;
          quizzesSnap.forEach(doc => {
            const qData = doc.data();
            if (created.some(c => c.id === qData.courseId)) {
              teacherQuizzesCount++;
            }
          });

          // Fetch reviews for teacher's courses to calculate average rating
          const reviewsSnap = await getDocs(collection(db, 'reviews'));
          let totalRating = 0;
          let ratingCount = 0;
          let totalTeacherRating = 0;
          let teacherRatingCount = 0;
          let totalContentRating = 0;
          let contentRatingCount = 0;
          reviewsSnap.forEach(doc => {
            const rev = doc.data();
            if (created.some(c => c.id === rev.courseId)) {
              totalRating += rev.rating || 5;
              ratingCount++;
              if (rev.teacherRating !== undefined) {
                totalTeacherRating += rev.teacherRating;
                teacherRatingCount++;
              }
              if (rev.contentRating !== undefined) {
                totalContentRating += rev.contentRating;
                contentRatingCount++;
              }
            }
          });

          setTeacherStats({
            coursesCount: created.length,
            totalStudents,
            totalLessons,
            totalQuizzes: teacherQuizzesCount,
            avgRating: ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(1)) : 5.0,
            avgTeacherRating: teacherRatingCount > 0 ? parseFloat((totalTeacherRating / teacherRatingCount).toFixed(1)) : undefined,
            avgContentRating: contentRatingCount > 0 ? parseFloat((totalContentRating / contentRatingCount).toFixed(1)) : undefined,
            ratingCount
          });
        }
      } catch (err) {
        console.error("Error fetching stats data for profile:", err);
      } finally {
        setLoadingStatsData(false);
      }
    };

    fetchProfileStatsAndCourses();
  }, [userData?.id, userData?.role]);

  // Basic Details State
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [governorate, setGovernorate] = useState(userData?.governorate || '');

  // Academic / Student Details State
  const [school, setSchool] = useState(userData?.school || '');
  const [grade, setGrade] = useState(userData?.grade || '');
  const [parentPhone, setParentPhone] = useState(userData?.parentPhone || '');
  const [educationSystem, setEducationSystem] = useState(userData?.educationSystem || 'general');
  const [branch, setBranch] = useState(userData?.branch || '');

  // Teacher Specific State
  const [subject, setSubject] = useState(userData?.subject || '');
  const [nationalId, setNationalId] = useState(userData?.nationalId || '');
  const [dateOfBirth, setDateOfBirth] = useState(userData?.dateOfBirth || '');
  const [teachingGrades, setTeachingGrades] = useState<string[]>(userData?.teachingGrades || []);

  // Parent Specific State
  const [studentPhone, setStudentPhone] = useState(userData?.studentPhone || '');

  // Password Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Account Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Save basic/role-specific information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('الرجاء إدخال الاسم كاملاً');
      return;
    }
    if (!phone.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', userData.id);
      
      let updatedFields: any = {
        name,
        phone,
        governorate,
        avatarBg
      };

      if (userData.role === 'student') {
        updatedFields = {
          ...updatedFields,
          school,
          grade,
          parentPhone,
          educationSystem,
          branch
        };
      } else if (userData.role === 'teacher') {
        updatedFields = {
          ...updatedFields,
          subject: subject.trim(),
          nationalId,
          dateOfBirth,
          teachingGrades
        };
      } else if (userData.role === 'parent') {
        updatedFields = {
          ...updatedFields,
          studentPhone
        };
      }

      await updateDoc(userDocRef, updatedFields);
      onUpdateUserData({ ...userData, ...updatedFields });
      toast.success('تم تحديث ملفك الشخصي بنجاح! ✨');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('فشل تحديث البيانات: ' + (error.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('الرجاء ملء جميع حقول كلمة المرور');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب ألا تقل عن 6 رموز');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('تأكيد كلمة المرور الجديدة غير متطابق');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('لم يتم العثور على المستخدم الحالي');
      }

      // Reauthenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update Password
      await updatePassword(user, newPassword);
      toast.success('تمت إعادة تعيين كلمة المرور بنجاح! 🔐');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور الحالية غير صحيحة.');
      } else {
        toast.error('فشل تغيير كلمة المرور: ' + (error.message || 'يرجى التأكد من البيانات'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle teaching grades for teachers
  const handleToggleGrade = (gradeName: string) => {
    if (teachingGrades.includes(gradeName)) {
      setTeachingGrades(teachingGrades.filter(g => g !== gradeName));
    } else {
      setTeachingGrades([...teachingGrades, gradeName]);
    }
  };

  // Permanently delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'احذف حسابي') {
      toast.error('يرجى كتابة الكلمة التأكيدية بشكل صحيح');
      return;
    }
    if (!deletePassword) {
      toast.error('الرجاء إدخال كلمة المرور لتأكيد الهوية');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('لم يتم العثور على المستخدم الحالي');
      }

      // Reauthenticate to prove identity before deletion
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      const userId = user.uid;

      // 1. Delete user doc from Firestore
      await deleteDoc(doc(db, 'users', userId));

      // 2. Delete Auth User from Firebase
      await deleteUser(user);

      toast.success('تم حذف الحساب والبيانات نهائياً بنجاح. نأسف لمغادرتك! 👋');
      setShowDeleteModal(false);
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور غير صحيحة. يرجى إعادة المحاولة.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('أمنياً، تتطلب هذه العملية تسجيل خروجك ثم تسجيل الدخول مرة أخرى للتحقق من هويتك.');
      } else {
        toast.error('حدث خطأ أثناء حذف الحساب: ' + (error.message || 'يرجى المحاولة لاحقاً'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-2xl"></div>
        <div className={`w-24 h-24 bg-gradient-to-br ${avatarBg} rounded-full border-4 border-white dark:border-[#2D2D3D] flex items-center justify-center font-black text-4xl text-white shadow-lg shrink-0 relative transition-all duration-500`}>
          {name.charAt(0) || 'U'}
          <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-[#1A1A24] flex items-center justify-center" title="نشط">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
          </span>
        </div>
        <div className="text-center md:text-right flex-1 space-y-1">
          <div className="flex flex-col md:flex-row items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{name || 'مستخدم جديد'}</h2>
            <span className="bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-3 py-1 rounded-full text-xs font-black">
              {userData?.role === 'teacher' ? '👨‍🏫 معلم' : userData?.role === 'parent' ? '👨‍👩‍👦 ولي أمر' : userData?.role === 'admin' ? '🛡️ مدير النظام' : '🎓 طالب'}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center justify-center md:justify-start gap-1">
            <Mail className="w-4 h-4 text-gray-400" /> {userData?.email}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">موقعنا الحالي: {governorate || 'غير محدد'}</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-3 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex md:flex-col gap-1 overflow-x-auto md:overflow-visible sticky top-24 z-10">
          {(userData?.role === 'student' || userData?.role === 'teacher') && (
            <>
              <button
                onClick={() => setActiveSubTab('stats')}
                className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeSubTab === 'stats'
                    ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
                }`}
              >
                <BarChart2 className="w-4 h-4 shrink-0" /> إحصائيات الأداء
              </button>

              <button
                onClick={() => setActiveSubTab('courses')}
                className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeSubTab === 'courses'
                    ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" /> {userData?.role === 'teacher' ? 'الدورات المنشورة' : 'الدورات المسجل بها'}
              </button>

              <button
                onClick={() => setActiveSubTab('achievements')}
                className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeSubTab === 'achievements'
                    ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0" /> الأوسمة والإنجازات
              </button>
            </>
          )}

          <button
            onClick={() => setActiveSubTab('basic')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'basic'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            <User className="w-4 h-4 shrink-0" /> البيانات الأساسية
          </button>

          <button
            onClick={() => setActiveSubTab('academic')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'academic'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            {userData?.role === 'teacher' ? (
              <>
                <GraduationCap className="w-4 h-4 shrink-0" /> بيانات التدريس
              </>
            ) : userData?.role === 'parent' ? (
              <>
                <GraduationCap className="w-4 h-4 shrink-0" /> بيانات الأبناء
              </>
            ) : userData?.role === 'admin' ? (
              <>
                <Shield className="w-4 h-4 shrink-0" /> الصلاحيات والتحكم
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 shrink-0" /> بيانات الدراسة
              </>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('idCard')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'idCard'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            <IdCard className="w-4 h-4 shrink-0" /> الهوية الرقمية الذكية
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'security'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" /> الأمان والحماية
          </button>

          <button
            onClick={() => setActiveSubTab('danger')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 whitespace-nowrap ${
              activeSubTab === 'danger' ? 'bg-red-50 dark:bg-red-950/20 font-black' : ''
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" /> منطقة الخطر
          </button>

          <button
            onClick={async () => {
              try {
                await auth.signOut();
                navigate('/login');
              } catch (e) {
                toast.error('حدث خطأ أثناء تسجيل الخروج');
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" /> تسجيل الخروج
          </button>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {/* Stats Tab */}
            {activeSubTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {loadingStatsData ? (
                  <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold font-sans">جاري تحميل إحصائيات الأداء المتميزة...</p>
                  </div>
                ) : (
                  <>
                    {/* Performance metrics row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {userData?.role === 'student' ? (
                        <>
                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/10 text-[#00B4D8] flex items-center justify-center text-lg font-bold">💰</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">رصيد المحفظة</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{userData?.balance || 0} <span className="text-xs">ج.م</span></h3>
                            <p className="text-[9px] text-gray-400 font-bold">يمكنك الشحن لاحقاً</p>
                          </div>

                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg font-bold">📚</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">الدورات المسجلة</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{myCourses.length}</h3>
                            <p className="text-[9px] text-gray-400 font-bold">مجموع كورساتك الحالية</p>
                          </div>

                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-lg font-bold">✅</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">الدروس المكتملة</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">
                              {Object.values(courseProgressMap).reduce((acc, curr) => acc + (curr.completedLessons?.length || 0), 0)}
                            </h3>
                            <p className="text-[9px] text-gray-400 font-bold">فيديو وحصة تم إنجازها</p>
                          </div>

                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-lg font-bold">🎯</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">معدل درجاتك</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">
                              {quizSubmissions.length > 0
                                ? `${Math.round(quizSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizSubmissions.length)}%`
                                : '0%'
                              }
                            </h3>
                            <p className="text-[9px] text-gray-400 font-bold">في الاختبارات التي خضتها</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center text-lg font-bold">👥</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">الطلاب المشتركين</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{teacherStats.totalStudents}</h3>
                            <p className="text-[9px] text-gray-400 font-bold">تأثيرك التعليمي يتوسع</p>
                          </div>

                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg font-bold">📚</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">الكورسات المنشورة</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{teacherStats.coursesCount}</h3>
                            <p className="text-[9px] text-gray-400 font-bold">إجمالي دوراتك التعليمية</p>
                          </div>

                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-lg font-bold">🎥</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">الدروس والحصص</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{teacherStats.totalLessons}</h3>
                            <p className="text-[9px] text-gray-400 font-bold">مجموع الفيديوهات والملفات</p>
                          </div>

                          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-right space-y-1.5 relative overflow-hidden group hover:scale-[1.02] transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center">
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-lg font-bold">⭐</div>
                                {teacherStats.ratingCount > 0 && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                    {teacherStats.ratingCount} تقييم
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-bold block pt-1.5">متوسط التقييمات</span>
                              <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{teacherStats.avgRating} <span className="text-xs text-gray-400 font-normal">/ 5</span></h3>
                            </div>
                            
                            {/* Breakdown of Teacher and Content Rating */}
                            {(teacherStats.avgTeacherRating !== undefined || teacherStats.avgContentRating !== undefined) && (
                              <div className="pt-2 border-t border-gray-100 dark:border-[#2D2D3D] space-y-1 text-[9px] text-gray-500 dark:text-gray-400 font-bold">
                                {teacherStats.avgTeacherRating !== undefined && (
                                  <div className="flex justify-between">
                                    <span>👨‍🏫 شرح الأستاذ:</span>
                                    <span className="text-amber-500">{teacherStats.avgTeacherRating} / 5</span>
                                  </div>
                                )}
                                {teacherStats.avgContentRating !== undefined && (
                                  <div className="flex justify-between">
                                    <span>📖 المادة العلمية:</span>
                                    <span className="text-amber-500">{teacherStats.avgContentRating} / 5</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                            {userData?.role === 'teacher' ? 'مخطط تفاعل الطلاب بالكورسات' : 'مخطط أدائك ومستواك الدراسي'}
                          </h3>
                          <p className="text-gray-400 dark:text-gray-500 text-xs">
                            {userData?.role === 'teacher' ? 'عدد الطلاب المسجلين بكل دورة من دوراتك التعليمية' : 'مستوى نتائجك وتقدمك في آخر اختبارات المنصة'}
                          </p>
                        </div>
                        {userData?.role === 'student' && quizSubmissions.length > 0 && (
                          <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> أداء متصاعد وممتاز!
                          </div>
                        )}
                      </div>

                      <div className="h-[280px] w-full pt-4">
                        {userData?.role === 'student' ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={
                                quizSubmissions.length > 0 
                                  ? quizSubmissions.slice(-7).map((sub, idx) => ({
                                      name: sub.quizTitle ? (sub.quizTitle.length > 10 ? sub.quizTitle.substring(0, 10) + '..' : sub.quizTitle) : `اختبار ${idx + 1}`,
                                      "الدرجة (%)": sub.score || 0
                                    }))
                                  : [
                                      { name: 'اختبار تجريبي ١', "الدرجة (%)": 75 },
                                      { name: 'اختبار تجريبي ٢', "الدرجة (%)": 90 },
                                      { name: 'اختبار تجريبي ٣', "الدرجة (%)": 85 },
                                      { name: 'اختبار تجريبي ٤', "الدرجة (%)": 98 }
                                    ]
                              }
                            >
                              <defs>
                                <linearGradient id="colorStudent" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:hidden" />
                              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" className="hidden dark:block" />
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1A1A24', 
                                  borderColor: '#2D2D3D', 
                                  borderRadius: '12px',
                                  color: '#fff',
                                  fontSize: '12px',
                                  textAlign: 'right'
                                }} 
                              />
                              <Area type="monotone" dataKey="الدرجة (%)" stroke="#00B4D8" strokeWidth={3} fillOpacity={1} fill="url(#colorStudent)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={
                                myCourses.length > 0
                                  ? myCourses.map(c => ({
                                      name: c.title ? (c.title.length > 12 ? c.title.substring(0, 12) + '..' : c.title) : 'كورس',
                                      "عدد الطلاب": c.enrolledStudentIds?.length || 0
                                    }))
                                  : [
                                      { name: 'كورس الكيمياء ١', "عدد الطلاب": 120 },
                                      { name: 'كورس الكيمياء ٢', "عدد الطلاب": 240 },
                                      { name: 'مراجعة الباب الأول', "عدد الطلاب": 180 }
                                    ]
                              }
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:hidden" />
                              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" className="hidden dark:block" />
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1A1A24', 
                                  borderColor: '#2D2D3D', 
                                  borderRadius: '12px',
                                  color: '#fff',
                                  fontSize: '12px',
                                  textAlign: 'right'
                                }} 
                              />
                              <Bar dataKey="عدد الطلاب" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      
                      {userData?.role === 'student' && quizSubmissions.length === 0 && (
                        <p className="text-center text-xs font-bold text-amber-500/80 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10">
                          📌 الرسم البياني أعلاه هو تمثيل تجريبي. قم بحل الاختبارات التفاعلية داخل الكورسات لتسجيل أدائك الحقيقي هنا!
                        </p>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Courses Tab */}
            {activeSubTab === 'courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                      {userData?.role === 'teacher' ? 'الدورات والكورسات المنشورة الخاصة بك' : 'الدورات والكورسات المسجل بها'}
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                      {userData?.role === 'teacher' ? 'قم بإدارة كورساتك ومتابعة الحصص المنشورة ونسب الالتحاق' : 'استكمل تقدمك في رحلتك التعليمية المتميزة لتفوق دائم'}
                    </p>
                  </div>

                  {loadingStatsData ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="w-10 h-10 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold font-sans">جاري تحميل الدورات...</p>
                    </div>
                  ) : myCourses.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] rounded-2xl space-y-4">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center mx-auto text-3xl">📚</div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">لا توجد كورسات مسجلة بعد</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {userData?.role === 'teacher' ? 'لم تقم بنشر أي كورس بعد' : 'تصفح قائمة الكورسات المتاحة وابدأ في بناء مستقبلك التعليمي!'}
                        </p>
                      </div>
                      {userData?.role === 'student' && (
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
                        >
                          استكشاف الكورسات المتاحة 🔍
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {myCourses.map((course) => {
                        const progressData = courseProgressMap[course.id];
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
                          <div 
                            key={course.id}
                            className="bg-gray-50 dark:bg-[#0D0D12] rounded-2xl overflow-hidden border border-gray-150 dark:border-[#2D2D3D] flex flex-col justify-between group hover:shadow-md transition-all h-full"
                          >
                            <div className="p-4 space-y-3">
                              {/* Subject / Grade Tags */}
                              <div className="flex items-center justify-between">
                                <span className="bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                                  {course.subject}
                                </span>
                                <span className="bg-gray-200 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                                  {course.grade}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-black text-sm text-gray-900 dark:text-white group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                                {course.title}
                              </h4>

                              {/* Meta Info */}
                              <p className="text-gray-400 dark:text-gray-500 text-[11px] leading-relaxed line-clamp-2 font-bold">
                                {course.description}
                              </p>

                              {userData?.role === 'student' && (
                                <div className="space-y-1.5 pt-2">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-gray-400">التقدم الفعلي</span>
                                    <span className="text-[#00B4D8] dark:text-[#D4AF37] font-sans">{percent}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] h-full rounded-full transition-all duration-300"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-bold block pt-1">
                                    تم إنجاز {completedCount} من أصل {course.lessonsCount || 0} درس
                                  </span>
                                </div>
                              )}

                              {userData?.role === 'teacher' && (
                                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                  <div className="bg-white dark:bg-[#1A1A24] p-2 rounded-xl border border-gray-150 dark:border-[#2D2D3D] text-center">
                                    <span className="text-gray-400 block mb-0.5">الطلاب المشتركين</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white font-sans">{course.enrolledStudentIds?.length || 0} طالب</span>
                                  </div>
                                  <div className="bg-white dark:bg-[#1A1A24] p-2 rounded-xl border border-gray-150 dark:border-[#2D2D3D] text-center">
                                    <span className="text-gray-400 block mb-0.5">عدد الدروس</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white font-sans">{course.lessonsCount || 0} درس</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="p-4 border-t border-gray-150 dark:border-[#2D2D3D] bg-white dark:bg-[#151520] flex items-center justify-between">
                              <span className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37]">
                                {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                              </span>
                              <button
                                onClick={() => navigate(`/course/${course.id}`)}
                                className="bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 dark:hover:bg-[#D4AF37]/20 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                              >
                                {userData?.role === 'teacher' ? 'إدارة الكورس ⚙️' : 'استكمال التعلم 📖'}
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Achievements Tab */}
            {activeSubTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">الأوسمة والإنجازات الخاصة بك</h3>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">تعرف على أوسمتك والميداليات التي حصلت عليها بناءً على تفوقك ونشاطك بالمنصة</p>
                    </div>
                    {/* Badge Count summary */}
                    <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl border border-amber-500/20 text-xs font-black flex items-center gap-1.5 self-start">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>الأوسمة المكتسبة:</span>
                      <span className="text-sm font-sans font-black">
                        {userData?.role === 'student' ? realBadges.length : [
                          myCourses.length > 0,
                          teacherStats.totalStudents > 0,
                          teacherStats.totalLessons >= 3,
                          teacherStats.avgRating >= 4.5 && teacherStats.ratingCount > 0
                        ].filter(Boolean).length} / {userData?.role === 'student' ? (realBadges.length || 1) : 4}
                      </span>
                    </div>
                  </div>

                  {userData?.role === 'student' ? (
                    realBadges.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] rounded-2xl space-y-4">
                        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl">🏅</div>
                        <div className="space-y-1 max-w-md mx-auto">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">لا توجد أوسمة محققة بعد</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                            أنت على طريق التميز! ستحصل على **وسام ذهبي متميز** بشكل تلقائي فور استكمال دراسة أي كورس بنسبة ١٠٠٪.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveSubTab('courses')}
                          className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
                        >
                          استكمال دروسك الآن 📖
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {realBadges.map((badge, idx) => (
                          <motion.div 
                            key={badge.id}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => {
                              try {
                                confetti({
                                  particleCount: 150,
                                  spread: 70,
                                  origin: { y: 0.6 },
                                  colors: ['#D4AF37', '#00B4D8', '#FFD700', '#FFFFFF']
                                });
                              } catch (e) {}
                            }}
                            className="p-4 rounded-2xl border bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-amber-600 dark:text-amber-400 border-yellow-500/20 flex items-center gap-4 cursor-pointer relative group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1A1A24] shadow-sm flex items-center justify-center font-black text-xl shrink-0 border-2 border-yellow-400">
                              🏅
                            </div>
                            <div className="text-right space-y-0.5 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-black text-sm text-gray-900 dark:text-white">
                                  وسام التفوق: {badge.courseTitle}
                                </h4>
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                  ذهبي
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                                تم الحصول عليه عند إتمام هذا الكورس بنسبة ١٠٠٪ بنجاح وتفوق.
                              </p>
                              <span className="text-[9px] text-emerald-500 font-black block pt-0.5 font-sans">
                                تاريخ الإنجاز: {new Date(badge.dateEarned).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Teacher Milestones Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          id: 'teacher-certified',
                          title: 'معلم معتمد بالمنصة 🎓',
                          description: 'نشر كورس تعليمي واحد على الأقل على منصة Teachland للطلاب.',
                          unlocked: myCourses.length > 0,
                          colorBg: 'bg-green-500/10 text-green-600 border-green-500/20',
                          status: myCourses.length > 0 ? `تم نشر ${myCourses.length} كورس` : 'لم يتم نشر كورسات بعد'
                        },
                        {
                          id: 'teacher-reach',
                          title: 'الانتشار الأكاديمي 👥',
                          description: 'الوصول لعدد من الطلاب المشتركين والمتابعين لكورساتك بنجاح.',
                          unlocked: teacherStats.totalStudents > 0,
                          colorBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                          status: teacherStats.totalStudents > 0 ? `مشترك لديك ${teacherStats.totalStudents} طالب` : 'في انتظار أول طالب'
                        },
                        {
                          id: 'teacher-lessons',
                          title: 'المنارة التعليمية 🎥',
                          description: 'إضافة ونشر ٣ دروس تعليمية أو حصص على الأقل لإثراء المحتوى.',
                          unlocked: teacherStats.totalLessons >= 3,
                          colorBg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                          status: `تم نشر ${teacherStats.totalLessons} درس`
                        },
                        {
                          id: 'teacher-rating',
                          title: 'التقييم الذهبي ⭐',
                          description: 'الحصول على متوسط تقييم ممتاز (٤.٥ أو أكثر) من آراء وتقييمات الطلاب.',
                          unlocked: teacherStats.avgRating >= 4.5 && teacherStats.ratingCount > 0,
                          colorBg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
                          status: teacherStats.ratingCount > 0 ? `التقييم ${teacherStats.avgRating} من ${teacherStats.ratingCount} طالب` : 'لا توجد تقييمات بعد'
                        }
                      ].map((badge) => (
                        <div 
                          key={badge.id}
                          className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
                            badge.unlocked 
                              ? `${badge.colorBg} shadow-sm scale-100 hover:scale-[1.01]` 
                              : 'bg-gray-50 dark:bg-[#0D0D12]/50 border-gray-150 dark:border-[#2D2D3D] opacity-40'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${
                            badge.unlocked ? 'bg-white/90 dark:bg-[#1A1A24]/90 shadow-sm' : 'bg-gray-200 dark:bg-[#2D2D3D] text-gray-400'
                          }`}>
                            {badge.title.split(' ').slice(-1)[0]}
                          </div>
                          <div className="text-right space-y-0.5 flex-1">
                            <h4 className="font-black text-sm text-gray-900 dark:text-white">
                              {badge.title.split(' ').slice(0, -1).join(' ')}
                            </h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{badge.description}</p>
                            <span className={`text-[9px] font-black block pt-0.5 ${badge.unlocked ? 'text-emerald-500' : 'text-gray-400'}`}>
                              {badge.unlocked ? `✓ مـحـقـق (${badge.status})` : `🔒 غـيـر مـنـجـز بـعـد (${badge.status})`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Basic Info Form */}
            {activeSubTab === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">البيانات الأساسية للملف</h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">حافظ على بيانات الاتصال الخاصة بك محدثة وموثوقة</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar Color Selector */}
                  <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] space-y-3">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> لون مظهر الحساب (الخلفية)
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { name: 'سماوي Teachland', value: 'from-[#00B4D8] to-[#0077B6]' },
                        { name: 'ذهبي متميز', value: 'from-[#D4AF37] to-[#B8860B]' },
                        { name: 'بنفسجي ملكي', value: 'from-[#7209B7] to-[#3F37C9]' },
                        { name: 'وردي ملهم', value: 'from-[#FF007F] to-[#7209B7]' },
                        { name: 'أخضر تفاحي', value: 'from-[#4CCC81] to-[#2E8B57]' },
                        { name: 'برتقالي مشع', value: 'from-[#FF6B6B] to-[#FF8E53]' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setAvatarBg(item.value)}
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.value} relative border-2 transition-transform duration-200 active:scale-95 ${
                            avatarBg === item.value 
                              ? 'border-[#00B4D8] dark:border-[#D4AF37] scale-110 shadow-md shadow-[#00B4D8]/20' 
                              : 'border-transparent'
                          }`}
                          title={item.name}
                        >
                          {avatarBg === item.value && (
                            <span className="absolute inset-0 flex items-center justify-center text-white">
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> الاسم كاملاً
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder="أدخل الاسم الرباعي"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> رقم الهاتف (واتساب)
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> المحافظة
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                    >
                      <option value="">اختر المحافظة</option>
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> حفظ التعديلات
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Academic Details Form based on Role */}
            {activeSubTab === 'academic' && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                    {userData?.role === 'teacher' ? 'بيانات التدريس والتأهيل' : userData?.role === 'parent' ? 'توصيل ومتابعة الأبناء' : userData?.role === 'admin' ? 'التحكم الإداري والنظام' : 'المرحلة والبيانات الدراسية'}
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">هذه البيانات تحدد طريقة ظهورك والمحتوى المناسب لك على المنصة</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {userData?.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> نوع التعليم
                        </label>
                        <select
                          required
                          value={educationSystem}
                          onChange={(e) => setEducationSystem(e.target.value as any)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                        >
                          <option value="general">ثانوي عام</option>
                          <option value="azhar">ثانوي أزهري</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> السنة الدراسية
                        </label>
                        <select
                          required
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                        >
                          <option value="">اختر السنة الدراسية</option>
                          <optgroup label="المرحلة الإعدادية">
                            <option value="الأول الإعدادي">الصف الأول الإعدادي</option>
                            <option value="الثاني الإعدادي">الصف الثاني الإعدادي</option>
                            <option value="الثالث الإعدادي">الصف الثالث الإعدادي</option>
                          </optgroup>
                          <optgroup label="المرحلة الثانوية">
                            <option value="الأول الثانوي">الصف الأول الثانوي</option>
                            <option value="الثاني الثانوي">الصف الثاني الثانوي</option>
                            <option value="الثالث الثانوي">الصف الثالث الثانوي</option>
                          </optgroup>
                        </select>
                      </div>

                      {(grade === 'الثاني الثانوي' || grade === 'الثالث الثانوي') && (
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> الشعبة
                          </label>
                          <select
                            required
                            value={branch}
                            onChange={(e) => setBranch(e.target.value as any)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          >
                            <option value="">اختر الشعبة</option>
                            {educationSystem === 'azhar' ? (
                              <>
                                <option value="scientific">علمي</option>
                                <option value="literary">أدبي</option>
                              </>
                            ) : (
                              <>
                                {grade === 'الثاني الثانوي' ? (
                                  <>
                                    <option value="scientific">علمي</option>
                                    <option value="literary">أدبي</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="science">علمي علوم</option>
                                    <option value="math">علمي رياضة</option>
                                    <option value="arts">أدبي</option>
                                  </>
                                )}
                              </>
                            )}
                          </select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> اسم المدرسة
                        </label>
                        <input
                          type="text"
                          required
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="مثال: مدرسة السعيدية الثانوية"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> رقم هاتف ولي الأمر لمتابعة الدرجات والغياب
                        </label>
                        <input
                          type="tel"
                          required
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="01xxxxxxxxx"
                        />
                      </div>
                    </>
                  )}

                  {userData?.role === 'teacher' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> المادة الأساسية التي تقوم بتدريسها
                        </label>
                        <input
                          type="text"
                          required
                          disabled
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-gray-100 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed opacity-70"
                          title="لا يمكن تغيير المادة بعد التسجيل. تواصل مع الإدارة للتعديل."
                        />
                        <p className="text-[10px] text-gray-500 mt-1 font-bold">لا يمكن تغيير المادة بعد التسجيل. تواصل مع الإدارة للتعديل.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> الرقم القومي المكون من 14 رقم (للتوثيق)
                        </label>
                        <input
                          type="text"
                          maxLength={14}
                          required
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="2xxxxxxxxxxxxx"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> تاريخ الميلاد
                        </label>
                        <input
                          type="date"
                          required
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-2">الصفوف الدراسية التي تدرس لها</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((g) => {
                            const isChecked = teachingGrades.includes(g);
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handleToggleGrade(g)}
                                className={`p-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                  isChecked
                                    ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border-[#00B4D8] dark:border-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]'
                                    : 'border-gray-200 dark:border-[#2D2D3D] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
                                }`}
                              >
                                {isChecked && <Check className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />}
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}


                  {userData?.role === 'admin' && (
                    <div className="p-4 bg-gray-50 dark:bg-[#222230]/50 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-bold">
                      <p>أنت قمت بتسجيل الدخول كمدير نظام (Admin).</p>
                      <p className="mt-2 text-xs">لا يتطلب حساب المدير استكمال بيانات دراسية أو إعدادات تدريس إضافية.</p>
                    </div>
                  )}
                  {userData?.role === 'parent' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> رقم هاتف الطالب المرتبط بحسابك لمتابعة أدائه
                        </label>
                        <input
                          type="tel"
                          required
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="01xxxxxxxxx"
                        />
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-[#222230]/50 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        📌 <b>ملاحظة:</b> رقم الهاتف هذا هو المفتاح لربط نتائج وتقارير ودرجات الطالب بلوحة تحكم ولي الأمر مباشرة. يرجى التأكد من تطابقه التام مع الرقم الذي يسجل به ابنك في حسابه الشخصي.
                      </div>
                    </>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> حفظ البيانات الدراسية
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Digital ID Card Tab */}
            {activeSubTab === 'idCard' && (
              <motion.div
                key="idCard"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 text-right"
                dir="rtl"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="mb-6 text-center sm:text-right">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">بطاقة الهوية الرقمية الذكية</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">بطاقتك التعليمية الخاصة للاستخدام داخل المنصة ومع المعلمين ومراكز الخدمة</p>
                  </div>

                  {/* 3D Flip Card Container */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-[400px] h-[240px] cursor-pointer [perspective:1000px] group select-none"
                    >
                      <div className={`relative w-full h-full duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        
                        {/* CARD FRONT */}
                        <div className={`absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br ${avatarBg} text-white shadow-2xl [backface-visibility:hidden] flex flex-col justify-between overflow-hidden border border-white/10`}>
                          {/* Design accents */}
                          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-12 -translate-x-12"></div>
                          
                          {/* Header */}
                          <div className="flex justify-between items-start z-10 relative">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-sm">T</div>
                              <span className="font-black text-sm tracking-wide">Teachland</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2 py-1 rounded font-black">
                              {userData?.role === 'teacher' ? 'مدرس متميز' : userData?.role === 'parent' ? 'ولي أمر' : userData?.role === 'admin' ? 'مدير النظام' : 'طالب ذكي'}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="flex items-center gap-4 my-auto z-10 relative">
                            {/* Chip & Info */}
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-black text-xl border border-white/20 shrink-0">
                              {name.charAt(0) || 'U'}
                            </div>
                            <div className="space-y-1 text-right">
                              <h4 className="font-black text-base truncate max-w-[200px]">{name || 'مستخدم Teachland'}</h4>
                              <p className="text-[10px] text-white/80 font-bold tracking-wider">
                                {userData?.role === 'student' ? (grade || 'الصف الدراسي غير محدد') : userData?.role === 'teacher' ? (subject || 'التخصص الدراسي غير محدد') : 'متابع للأبناء'}
                              </p>
                              <p className="text-[9px] text-white/60 font-mono">ID: TF-{userData?.id?.slice(0, 8).toUpperCase() || 'NEW'}</p>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex justify-between items-end z-10 relative border-t border-white/15 pt-2">
                            <div className="text-right">
                              <p className="text-[8px] text-white/50">المحافظة</p>
                              <p className="text-[10px] font-bold">{governorate || 'القاهرة'}</p>
                            </div>
                            <div className="text-left font-mono text-[9px] tracking-wider text-white/70">
                              VALID: 2026-2027
                            </div>
                          </div>
                        </div>

                        {/* CARD BACK */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-slate-900 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between overflow-hidden border border-slate-800">
                          {/* Magnetic Strip */}
                          <div className="absolute top-4 left-0 right-0 h-9 bg-slate-800"></div>

                          {/* Barcode representation */}
                          <div className="mt-12 space-y-2 relative z-10">
                            <div className="bg-white p-2 rounded flex flex-col items-center justify-center">
                              {/* Custom barcode using flex lines */}
                              <div className="h-8 flex items-center justify-between w-full gap-[2px]" dir="ltr">
                                {[1,3,1,2,1,4,2,1,3,1,1,2,3,1,2,1,4,1,2,3,1,1,2,1].map((width, idx) => (
                                  <div 
                                    key={idx} 
                                    className="h-full bg-slate-950" 
                                    style={{ flexGrow: width }}
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] text-slate-600 font-mono tracking-widest mt-1">
                                TF-{userData?.id?.toUpperCase() || 'NEWUSER'}
                              </span>
                            </div>
                          </div>

                          {/* Agreement Text */}
                          <div className="text-[8px] text-slate-400 text-center leading-relaxed font-bold z-10 relative">
                            هذه البطاقة رقمية مشفرة وصادرة من منصة Teachland. الاستخدام يخضع لشروط الخدمة. في حال العثور عليها يرجى تسليمها أو التواصل مع الدعم الفني.
                          </div>

                          {/* Contact Info */}
                          <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-800 pt-2 z-10 relative">
                            <span>support@tafawwoq.com</span>
                            <span>الرقم الموحد: ١٩٠٠٠</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mt-4 animate-pulse">
                      💡 اضغط على البطاقة لقلبها واستعراض الرمز التعريفي
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-6 w-full max-w-[400px] print:hidden">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#0D0D12] dark:hover:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-700 dark:text-gray-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> طباعة الهوية
                      </button>
                      <button 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 hover:bg-[#00B4D8]/20 dark:hover:bg-[#D4AF37]/20"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> قلب البطاقة
                      </button>
                    </div>

                    {/* Dedicated Print-only Flat Layout for ID Card */}
                    <div className="hidden print:block printable-area" dir="rtl">
                      <div className="flex flex-col items-center justify-center gap-8 p-12 bg-white min-h-screen">
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-black text-slate-900 mb-1">بطاقة الهوية الرقمية الذكية - منصة Teachland</h2>
                          <p className="text-slate-500 text-sm">نسخة الطباعة الرسمية المعتمدة</p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                          {/* Front Side */}
                          <div className={`w-[400px] h-[240px] rounded-2xl p-6 bg-gradient-to-br ${avatarBg} text-white shadow-xl flex flex-col justify-between overflow-hidden border border-white/10 relative`}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-12 -translate-x-12"></div>
                            
                            <div className="flex justify-between items-start z-10 relative">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-sm">T</div>
                                <span className="font-black text-sm tracking-wide">Teachland</span>
                              </div>
                              <span className="text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2 py-1 rounded font-black">
                                {userData?.role === 'teacher' ? 'مدرس متميز' : userData?.role === 'parent' ? 'ولي أمر' : userData?.role === 'admin' ? 'مدير النظام' : 'طالب ذكي'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 my-auto z-10 relative">
                              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-black text-xl border border-white/20 shrink-0">
                                {name.charAt(0) || 'U'}
                              </div>
                              <div className="space-y-1 text-right text-white">
                                <h4 className="font-black text-base truncate max-w-[200px] text-white">{name || 'مستخدم Teachland'}</h4>
                                <p className="text-[10px] text-white/80 font-bold tracking-wider">
                                  {userData?.role === 'student' ? (grade || 'الصف الدراسي غير محدد') : userData?.role === 'teacher' ? (subject || 'التخصص الدراسي غير محدد') : 'متابع للأبناء'}
                                </p>
                                <p className="text-[9px] text-white/60 font-mono text-white/70">ID: TF-{userData?.id?.slice(0, 8).toUpperCase() || 'NEW'}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-end z-10 relative border-t border-white/15 pt-2 text-white">
                              <div className="text-right text-white">
                                <p className="text-[8px] text-white/50">المحافظة</p>
                                <p className="text-[10px] font-bold text-white">{governorate || 'القاهرة'}</p>
                              </div>
                              <div className="text-left font-mono text-[9px] tracking-wider text-white/70">
                                VALID: 2026-2027
                              </div>
                            </div>
                          </div>

                          {/* Back Side */}
                          <div className="w-[400px] h-[240px] rounded-2xl p-6 bg-slate-900 text-white shadow-xl flex flex-col justify-between overflow-hidden border border-slate-800 relative text-white">
                            <div className="absolute top-4 left-0 right-0 h-9 bg-slate-800"></div>
                            
                            <div className="mt-12 space-y-2 relative z-10">
                              <div className="bg-white p-2 rounded flex flex-col items-center justify-center">
                                <div className="h-8 flex items-center justify-between w-full gap-[2px]" dir="ltr">
                                  {[1,3,1,2,1,4,2,1,3,1,1,2,3,1,2,1,4,1,2,3,1,1,2,1].map((width, idx) => (
                                    <div 
                                      key={idx} 
                                      className="h-full bg-slate-950" 
                                      style={{ flexGrow: width }}
                                    />
                                  ))}
                                </div>
                                <span className="text-[8px] text-slate-600 font-mono tracking-widest mt-1">
                                  TF-{userData?.id?.toUpperCase() || 'NEWUSER'}
                                </span>
                              </div>
                            </div>

                            <div className="text-[8px] text-slate-400 text-center leading-relaxed font-bold z-10 relative">
                              هذه البطاقة رقمية مشفرة وصادرة من منصة Teachland. الاستخدام يخضع لشروط الخدمة. في حال العثور عليها يرجى تسليمها أو التواصل مع الدعم الفني.
                            </div>

                            <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-800 pt-2 z-10 relative text-slate-400">
                              <span>support@tafawwoq.com</span>
                              <span>الرقم الموحد: ١٩٠٠٠</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievements Segment */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Award className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">الأوسمة والإنجازات الخاصة بك</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-lg">🎖️</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">عضو مؤسس</h4>
                        <p className="text-[10px] text-gray-500">تم الانضمام لدفعة ٢٠٢٦ بنجاح</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                      name && phone && governorate 
                        ? 'bg-green-500/10 border-green-200 dark:border-green-900/30 text-green-500' 
                        : 'bg-gray-50 dark:bg-[#0D0D12] border-gray-100 dark:border-[#2D2D3D] opacity-60'
                    }`}>
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-black text-lg">📝</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-950 dark:text-white">ملف مكتمل</h4>
                        <p className="text-[10px] text-gray-500">تم تعبئة جميع بيانات الملف بنجاح</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-lg">💡</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">صانع الملاحظات</h4>
                        <p className="text-[10px] text-gray-500">قمت بتسجيل ملاحظات دراسية ذكية</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-lg">⭐</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">المتعلم الدؤوب</h4>
                        <p className="text-[10px] text-gray-500">نشاط تعليمي منتظم داخل الحصص</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Passwords Settings Form */}
            {activeSubTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">تعديل كلمة مرور الحساب</h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">قم بتحديث كلمة المرور بانتظام للحفاظ على خصوصيتك وأمان حسابك</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> كلمة المرور الحالية
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                      dir="ltr"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                      dir="ltr"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                      dir="ltr"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Key className="w-4 h-4" /> تحديث كلمة المرور
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Danger Zone Content */}
            {activeSubTab === 'danger' && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl p-6 sm:p-8 border border-red-200 dark:border-red-900/30 shadow-sm space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-red-600 dark:text-red-400 mb-1">حذف الحساب نهائياً</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                      بمجرد حذف حسابك، لن تتمكن من التراجع عن هذه الخطوة. سيتم محو جميع كورساتك المشترك بها، مستواك التعليمي، درجاتك، مدفوعاتك، ورصيد محفظتك بالكامل ولن نتمكن من استرجاعها مطلقاً.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-4 border border-red-100 dark:border-red-950/40 text-xs text-red-500 dark:text-red-400 leading-relaxed font-bold">
                  ⚠️ <b>تنبيه بالغ الأهمية:</b> إذا قمت بحذف الحساب وكان لديك اشتراكات نشطة أو مبالغ متبقية في محفظتك الإلكترونية، فستفقدها تماماً دون أي حق للمطالبة بها. يرجى مراجعة الدعم الفني أولاً إن كنت تواجه أي مشكلة.
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-red-500/10 hover:shadow-red-500/20 w-full sm:w-auto"
                  >
                    بدء إجراءات حذف الحساب النهائي
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Account Deletion Confirmation Dialog Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#1A1A24] rounded-2xl w-full max-w-md relative z-10 shadow-2xl p-5 sm:p-6 border border-red-100 dark:border-red-950/20 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto text-red-500 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">تأكيد حذف الحساب 🤔</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  هذا الإجراء سيقوم بحذف حسابك بالكامل من قواعد بيانات "Teachland". لتأكيد رغبتك الجادة، يرجى كتابة العبارة التالية في المربع أدناه:
                </p>
                <div className="bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg inline-block border border-red-200/40 font-black text-red-600 dark:text-red-400 text-xs mt-1">
                  احذف حسابي
                </div>
              </div>

              <div className="space-y-3 text-right">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 block">اكتب كلمة التأكيد هنا</label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none text-center font-bold"
                    placeholder="احذف حسابي"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 block">أدخل كلمة مرور الحساب للتحقق الأمني</label>
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none text-center"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmationText('');
                    setDeletePassword('');
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors flex-1 order-2 sm:order-1"
                >
                  تراجع، لا أريد الحذف
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 shadow-lg shadow-red-500/15 flex items-center justify-center gap-1.5 order-1 sm:order-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> نعم، احذف الحساب فوراً
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
