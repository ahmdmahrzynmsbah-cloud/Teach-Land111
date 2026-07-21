import React from "react";
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Lock, User, Phone, MapPin, School, BookOpen, GraduationCap, Users, Calendar, IdCard, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليوبية', 'بورسعيد', 'السويس', 
  'مطروح', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية', 'الإسماعيلية', 
  'دمياط', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
  'سوهاج', 'قنا', 'أسوان', 'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 
  'شمال سيناء', 'جنوب سيناء'
];

const COUNTRY_CODES = [
  { code: '+20', flag: '🇪🇬', name: 'مصر' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+968', flag: '🇴🇲', name: 'عمان' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: '+963', flag: '🇸🇾', name: 'سوريا' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+970', flag: '🇵🇸', name: 'فلسطين' },
  { code: '+967', flag: '🇾🇪', name: 'اليمن' },
  { code: '+249', flag: '🇸🇩', name: 'السودان' },
  { code: '+218', flag: '🇱🇾', name: 'ليبيا' },
  { code: '+216', flag: '🇹🇳', name: 'تونس' },
  { code: '+213', flag: '🇩🇿', name: 'الجزائر' },
  { code: '+212', flag: '🇲🇦', name: 'المغرب' },
  { code: '+222', flag: '🇲🇷', name: 'موريتانيا' },
  { code: '+252', flag: '🇸🇴', name: 'الصومال' },
  { code: '+253', flag: '🇩🇯', name: 'جيبوتي' },
  { code: '+269', flag: '🇰🇲', name: 'جزر القمر' }
];

export default function Auth() {
  const { settings } = usePlatformSettings();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [role, setRole] = useState<'student' | 'teacher' | 'parent' | 'admin'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [educationSystem, setEducationSystem] = useState('general');
  const navigate = useNavigate();

  const [roleSelected, setRoleSelected] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
    setRoleSelected(false);
    setShowAdminCode(false);
    setAdminCode('');
  }, [location.pathname]);

  // Prevent auto-redirect during form submission to avoid race conditions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !loading) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate, loading]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    let email = (formData.get('email') as string || '').trim().toLowerCase();
    const password = (formData.get('password') as string || '').trim();

    const combinePhone = (name: string) => {
      const code = formData.get(`${name}Code`) as string;
      const num = formData.get(name) as string;
      if (!num) return '';
      return `${code || ''}${num}`.trim();
    };

    // If login input is a phone number, convert to the special registration email format
    if (/^[0-9]+$/.test(email) && email.startsWith('01') && email.length === 11) {
      email = `${email}@tafawwoq.app`;
    }

    try {
      if (isLogin) {
        let userCredential;
        if (email === 'ahmed@admin.com' && (password === '1234' || password === '123456' || password === '١٢٣٤')) {
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, '123456');
          } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
              try {
                userCredential = await createUserWithEmailAndPassword(auth, email, '123456');
                try {
                  await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email,
                    name: 'مدير النظام',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                  });
                } catch (dbError) {
                  console.error("Firestore error creating admin:", dbError);
                }
              } catch (createError: any) {
                if (createError.code === 'auth/email-already-in-use') {
                   // If it already exists but 123456 failed, try the typed password just in case they changed it
                   userCredential = await signInWithEmailAndPassword(auth, email, password);
                } else {
                   throw createError;
                }
              }
            } else {
              throw error;
            }
          }
        } else {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        }

        // Verify that the user has the correct role selected
        if (userCredential && userCredential.user) {
          let userData: any = null;
          
          // Try fetching by UID first
          const userDocSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (userDocSnap.exists()) {
            userData = userDocSnap.data();
          } else {
            // Fallback: query by email
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              userData = querySnap.docs[0].data();
            }
          }

          if (userData) {
            // Strict role verification: do not allow logging in under a different role!
            if (userData.role && userData.role !== role) {
              await auth.signOut();
              
              let roleNameAr = '';
              if (userData.role === 'student') roleNameAr = 'طالب';
              else if (userData.role === 'teacher') roleNameAr = 'معلم';
              else if (userData.role === 'parent') roleNameAr = 'ولي أمر';
              else if (userData.role === 'admin') roleNameAr = 'مدير النظام';
              
              let selectedRoleNameAr = '';
              if (role === 'student') selectedRoleNameAr = 'طالب';
              else if (role === 'teacher') selectedRoleNameAr = 'معلم';
              else if (role === 'parent') selectedRoleNameAr = 'ولي أمر';
              else if (role === 'admin') selectedRoleNameAr = 'مدير النظام';

              throw new Error(`هذا الحساب مسجل كـ (${roleNameAr}) وليس كـ (${selectedRoleNameAr}). يرجى تسجيل الدخول من التبويب الصحيح.`);
            }
          } else {
            if (role === 'admin' || email.includes('admin')) {
              const defaultName = userCredential.user.displayName || (email ? email.split('@')[0] : 'مستخدم جديد');
              const defaultDoc = {
                id: userCredential.user.uid,
                email: email,
                name: defaultName,
                phone: '01000000000',
                governorate: 'القاهرة',
                role: 'admin',
                createdAt: new Date().toISOString(),
                isApproved: true,
                stars: 0,
                points: 0
              };
              await setDoc(doc(db, 'users', userCredential.user.uid), defaultDoc);
              setRole('admin');
            } else {
              await auth.signOut();
              throw new Error('تم مسح بيانات هذا الحساب من النظام بواسطة الإدارة. يرجى إعادة إنشاء الحساب (من تبويب إنشاء حساب) باستخدام نفس كلمة المرور القديمة لاستعادة حسابك.');
            }
          }
        }

        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const baseData = {
          email,
          name: formData.get('name') as string,
          phone: combinePhone('phone'),
          governorate: formData.get('governorate') as string,
          role,
          password,
          createdAt: new Date().toISOString()
        };

        if (role === 'student') {
          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            grade: formData.get('grade') as string,
            school: formData.get('school') as string,
            parentPhone: combinePhone('parentPhone'),
            educationSystem: formData.get('educationSystem') as string,
            branch: formData.get('branch') as string || null,
            isApproved: false
          });
        } else if (role === 'teacher') {
          // get checked grades
          const grades = [];
          if (formData.get('grade_1')) grades.push('الأول الإعدادي');
          if (formData.get('grade_2')) grades.push('الثاني الإعدادي');
          if (formData.get('grade_3')) grades.push('الثالث الإعدادي');
          if (formData.get('grade_4')) grades.push('الأول الثانوي');
          if (formData.get('grade_5')) grades.push('الثاني الثانوي');
          if (formData.get('grade_6')) grades.push('الثالث الثانوي');

          const finalGrades = grades.length > 0 ? grades : ['غير محدد'];
          const teacherSubject = formData.get('subject') as string;
          const teacherName = formData.get('name') as string;

          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            subject: teacherSubject,
            nationalId: formData.get('nationalId') as string,
            dateOfBirth: formData.get('dateOfBirth') as string,
            teachingGrades: finalGrades,
            isApproved: false
          });

          // Send notifications to students who are in the teacher's teachingGrades
          try {
            const studentsQuery = query(
              collection(db, 'users'),
              where('role', '==', 'student'),
              where('grade', 'in', finalGrades)
            );
            const studentsSnap = await getDocs(studentsQuery);
            const notificationPromises = studentsSnap.docs.map(studentDoc => {
              return addDoc(collection(db, 'notifications'), {
                userId: studentDoc.id,
                title: 'معلّم جديد انضم لتخصّصك! 👨‍🏫',
                message: `انضم الأستاذ ${teacherName} لتدريس مادة ${teacherSubject} لصفك الدراسي. يمكنك الآن استكشاف كورساته ومحاضراته!`,
                type: 'new_teacher_alert',
                read: false,
                createdAt: new Date().toISOString(),
                teacherId: user.uid
              });
            });
            await Promise.all(notificationPromises);
          } catch (notifErr) {
            console.error("Error creating notifications for new teacher:", notifErr);
          }
        } else if (role === 'parent') {
          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            studentPhone: combinePhone('studentPhone'),
            isApproved: false
          });
        } else if (role === 'admin') {
          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            isApproved: true
          });
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('عذراً، لم يتم تفعيل الدخول بالبريد الإلكتروني في قاعدة البيانات. (يجب تفعيل Email/Password من لوحة تحكم Firebase)');
      } else if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('email-already-in-use'))) {
        if (!isLogin) {
          try {
            // Check if this is a zombie account (Auth exists but Firestore doc is missing)
            const loginAttempt = await signInWithEmailAndPassword(auth, email, password);
            const docCheck = await getDoc(doc(db, 'users', loginAttempt.user.uid));
            if (!docCheck.exists()) {
              // Recreate the document!
              const baseData = {
                email,
                name: formData.get('name') as string,
                phone: combinePhone('phone'),
                governorate: formData.get('governorate') as string,
                role,
                password,
                createdAt: new Date().toISOString()
              };
              
              if (role === 'student') {
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  grade: formData.get('grade') as string,
                  school: formData.get('school') as string,
                  parentPhone: combinePhone('parentPhone'),
                  educationSystem: formData.get('educationSystem') as string,
                  branch: (formData.get('branch') as string) || null,
                  isApproved: false
                });
              } else if (role === 'teacher') {
                const grades = [];
                if (formData.get('grade_1')) grades.push('الأول الإعدادي');
                if (formData.get('grade_2')) grades.push('الثاني الإعدادي');
                if (formData.get('grade_3')) grades.push('الثالث الإعدادي');
                if (formData.get('grade_4')) grades.push('الأول الثانوي');
                if (formData.get('grade_5')) grades.push('الثاني الثانوي');
                if (formData.get('grade_6')) grades.push('الثالث الثانوي');
                const finalGrades = grades.length > 0 ? grades : ['غير محدد'];
                
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  subject: formData.get('subject') as string,
                  nationalId: formData.get('nationalId') as string,
                  dateOfBirth: formData.get('dateOfBirth') as string,
                  teachingGrades: finalGrades,
                  isApproved: false
                });
              } else if (role === 'parent') {
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  studentPhone: combinePhone('studentPhone'),
                  isApproved: false
                });
              } else if (role === 'admin') {
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  isApproved: true
                });
              }
              navigate('/dashboard');
              return;
            } else {
              setError('هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في المنصة، يرجى تسجيل الدخول مباشرة.');
            }
          } catch (e) {
            setError('هذا البريد الإلكتروني مسجل مسبقاً. إذا كان حسابك محذوفاً يرجى التواصل مع الإدارة، أو حاول تسجيل الدخول بكلمة المرور القديمة.');
          }
        } else {
          setError('هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في المنصة، يرجى تسجيل الدخول مباشرة.');
        }
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('حدث خطأ في الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      } else {
        const msg = err.message || '';
        if (msg.includes('مسجل كـ') || msg.includes('التبويب الصحيح')) {
          setError(msg);
        } else {
          setError('حدث خطأ أثناء العملية: ' + msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-primary/30 font-sans relative pt-24 pb-12">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors text-xs sm:text-sm font-black bg-white dark:bg-[#1A1A24] px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-[#2D2D3D]">
          <ArrowRight className="w-4 h-4" /> عودة للرئيسية
        </Link>
      </div>
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#1A1A24] rounded-3xl p-5 sm:p-8 shadow-xl border border-gray-200 dark:border-[#2D2D3D]"
      >
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              settings.logoChar || 'T'
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-1.5 text-gray-900 dark:text-white">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold">
            {isLogin ? `أهلاً بك مرة أخرى في ${settings.platformName}` : 'سجل بياناتك عشان تبدأ رحلتك التعليمية'}
          </p>
        </div>

        {isLogin && (
          <div className="mb-4 p-1 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl flex gap-1 relative border border-gray-150 dark:border-[#2D2D3D]/40" dir="rtl">
            {[
              { id: 'student', label: 'طالب' },
              { id: 'teacher', label: 'معلم' },
              { id: 'parent', label: 'ولي أمر' },
              { id: 'admin', label: 'إدارة' }
            ].map((tab) => {
              const active = role === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRole(tab.id as any)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-colors relative z-10 cursor-pointer ${
                    active 
                      ? 'text-white font-black' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="loginRoleBg"
                      className="absolute inset-0 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-xl shadow-md shadow-[#00B4D8]/15 dark:shadow-[#D4AF37]/15"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {isLogin && (
          <div className="text-center mb-6 text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-[#1E1E2B]/20 py-2.5 px-3 rounded-xl border border-gray-150/50 dark:border-[#2D2D3D]/30">
            {role === 'student' && 'بوابة الطلاب لمتابعة الكورسات والواجبات والاختبارات'}
            {role === 'teacher' && 'بوابة المعلمين لإدارة الفصول ورفع المحاضرات والمستندات'}
            {role === 'parent' && 'بوابة أولياء الأمور لمتابعة مستويات الأبناء وشحن أرصدتهم'}
            {role === 'admin' && 'لوحة الإدارة العامة للتحكم الكامل بأقسام النظام'}
          </div>
        )}

        {/* Show role tabs ONLY when creating a new account (register) */}
        {!isLogin && roleSelected && (
          <button
            type="button"
            onClick={() => {
              setRoleSelected(false);
              setShowAdminCode(false);
              setAdminCode('');
            }}
            className="mb-4 text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] hover:underline flex items-center gap-1.5 transition-colors bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 px-3 py-2 rounded-xl border border-[#00B4D8]/10 dark:border-[#D4AF37]/10"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> تغيير نوع الحساب ({role === 'student' ? 'طالب' : role === 'teacher' ? 'معلم' : role === 'parent' ? 'ولي أمر' : 'مدير النظام'})
          </button>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {!isLogin && !roleSelected ? (
          <div className="space-y-6 text-right" dir="rtl">
            <p className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">اختر نوع الحساب الذي تريد إنشاؤه للبدء:</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Student Card */}
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setRoleSelected(true);
                }}
                className="p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] bg-gray-50/50 dark:bg-[#1E1E2B]/40 hover:bg-white dark:hover:bg-[#1A1A24] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[#00B4D8] dark:text-[#D4AF37] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">حساب طالب</h4>
                  <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal">حضور الحصص وحل الاختبارات ومتابعة دراستك</p>
                </div>
              </button>

              {/* Teacher Card */}
              <button
                type="button"
                onClick={() => {
                  setRole('teacher');
                  setRoleSelected(true);
                }}
                className="p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] bg-gray-50/50 dark:bg-[#1E1E2B]/40 hover:bg-white dark:hover:bg-[#1A1A24] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">حساب معلم</h4>
                  <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal">إنشاء الكورسات والامتحانات ومتابعة الطلاب والمبيعات</p>
                </div>
              </button>

              {/* Parent Card */}
              <button
                type="button"
                onClick={() => {
                  setRole('parent');
                  setRoleSelected(true);
                }}
                className="p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] bg-gray-50/50 dark:bg-[#1E1E2B]/40 hover:bg-white dark:hover:bg-[#1A1A24] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">حساب ولي أمر</h4>
                  <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal">متابعة حضور الأبناء وحل اختباراتهم وشحن رصيدهم</p>
                </div>
              </button>

              {/* Admin Card */}
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setShowAdminCode(true);
                }}
                className="p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] hover:border-red-400 bg-gray-50/50 dark:bg-[#1E1E2B]/40 hover:bg-white dark:hover:bg-[#1A1A24] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">مدير النظام</h4>
                  <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal">لوحة الإدارة الكاملة للتحكم في الأكواد والاشتراكات والمستخدمين</p>
                </div>
              </button>
            </div>

            {/* Admin verification input box */}
            {showAdminCode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-150 dark:border-red-950/40 space-y-3"
              >
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-xs">
                  <Lock className="w-4 h-4" />
                  <span>مطلوب رمز التحقق لمدير النظام</span>
                </div>
                <input
                  type="password"
                  placeholder="أدخل رمز التحقق السري للإدارة..."
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0D0D12] text-gray-900 dark:text-white border border-gray-200 dark:border-[#2D2D3D] focus:ring-2 focus:ring-red-400 text-xs font-bold outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (adminCode === '1234' || adminCode === '123456' || adminCode.toLowerCase() === 'teachlandadmin') {
                        setRoleSelected(true);
                        setShowAdminCode(false);
                      } else {
                        setError('رمز التحقق الذي أدخلته غير صحيح!');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    تأكيد ومتابعة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminCode(false);
                      setAdminCode('');
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-[#2D2D3D] text-gray-500 rounded-xl text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            )}

            <div className="border-t border-gray-150 dark:border-[#2D2D3D]/50 pt-4 text-center">
              <span className="text-xs text-gray-400 font-bold">هل لديك حساب بالفعل؟ </span>
              <button onClick={() => navigate('/login')} className="text-[#00B4D8] dark:text-[#D4AF37] text-xs font-black hover:underline">
                سجل الدخول الآن
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الاسم بالكامل</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input name="name" required type="text" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-11 sm:pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold" placeholder="محمد أحمد..." />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">المحافظة</label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select name="governorate" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors appearance-none text-sm font-bold">
                          <option value="">اختر المحافظة</option>
                          {EGYPT_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {role === 'student' ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">نوع التعليم</label>
                          <div className="relative">
                            <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <select 
                              name="educationSystem" 
                              required 
                              value={educationSystem}
                              onChange={(e) => setEducationSystem(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors appearance-none text-sm font-bold"
                            >
                              <option value="general">ثانوي عام</option>
                              <option value="azhar">ثانوي أزهري</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الصف الدراسي</label>
                          <div className="relative">
                            <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <select 
                              name="grade" 
                              required 
                              value={selectedGrade}
                              onChange={(e) => setSelectedGrade(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors appearance-none text-sm font-bold"
                            >
                              <option value="">اختر الصف</option>
                              <optgroup label="المرحلة الإعدادية">
                                <option value="الأول الإعدادي">الأول الإعدادي</option>
                                <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                                <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                              </optgroup>
                              <optgroup label="المرحلة الثانوية">
                                <option value="الأول الثانوي">الأول الثانوي</option>
                                <option value="الثاني الثانوي">الثاني الثانوي</option>
                                <option value="الثالث الثانوي">الثالث الثانوي</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>

                        {(selectedGrade === 'الثاني الثانوي' || selectedGrade === 'الثالث الثانوي') && (
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الشعبة</label>
                            <div className="relative">
                              <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <select name="branch" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors appearance-none text-sm font-bold">
                                {educationSystem === 'azhar' ? (
                                  <>
                                    <option value="scientific">علمي</option>
                                    <option value="literary">أدبي</option>
                                  </>
                                ) : (
                                  <>
                                    {selectedGrade === 'الثاني الثانوي' ? (
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
                          </div>
                        )}
                      </>
                    ) : role === 'teacher' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">المادة</label>
                        <div className="relative">
                          <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <select name="subject" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors appearance-none text-sm font-bold">
                            <option value="">اختر المادة</option>
                            <option value="الرياضيات">الرياضيات</option>
                            <option value="الفيزياء">الفيزياء</option>
                            <option value="الكيمياء">الكيمياء</option>
                            <option value="الأحياء">الأحياء</option>
                            <option value="لغة عربية">لغة عربية</option>
                          </select>
                        </div>
                      </div>
                    ) : role === 'parent' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم هاتف الطالب المرتبط</label>
                        <div className="flex gap-2" dir="ltr">
                          <select name="studentPhoneCode" defaultValue="+20" className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-2 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors text-sm font-bold w-[110px]" dir="ltr">
                            {COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input name="studentPhone" required type="tel" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold text-left" placeholder="01X..." />
                          </div>
                          
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {role === 'student' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">اسم المدرسة</label>
                        <div className="relative">
                          <School className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <input name="school" required type="text" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-11 sm:pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold" placeholder="مدرسة..." />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم ولي الأمر</label>
                        <div className="flex gap-2" dir="ltr">
                          <select name="parentPhoneCode" defaultValue="+20" className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-2 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors text-sm font-bold w-[110px]" dir="ltr">
                            {COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input name="parentPhone" required type="tel" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold text-left" placeholder="01X..." />
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  ) : role === 'teacher' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الرقم القومي</label>
                          <div className="relative">
                            <IdCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input name="nationalId" required type="text" pattern="^[23][0-9]{13}$" title="رقم قومي مصري صحيح (14 رقم)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-11 sm:pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold" placeholder="14 رقم" dir="ltr" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">تاريخ الميلاد</label>
                          <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input name="dateOfBirth" required type="date" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-11 sm:pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الصفوف الدراسية التي تدرسها</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((grade, index) => (
                             <label key={grade} className="flex items-center gap-2 cursor-pointer text-xs font-bold bg-gray-50 dark:bg-[#0D0D12]/40 p-2 rounded-xl border border-gray-150 dark:border-[#2D2D3D]/40 hover:bg-gray-100 dark:hover:bg-[#0D0D12] transition-colors">
                                <input name={`grade_${index+1}`} type="checkbox" className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37] rounded border-gray-200 dark:border-[#2D2D3D] focus:ring-[#D4AF37]" />
                                <span className="truncate">{grade}</span>
                             </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم الهاتف</label>
                    <div className="flex gap-2" dir="ltr">
                          <select name="phoneCode" defaultValue="+20" className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-2 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors text-sm font-bold w-[110px]" dir="ltr">
                            {COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input name="phone" required type="tel" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold text-left" placeholder="01X..." />
                          </div>
                          
                        </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">
                {isLogin ? 'البريد الإلكتروني أو رقم الهاتف' : 'البريد الإلكتروني'}
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input 
                  name="email" 
                  autoComplete="off"
                  required 
                  type={isLogin ? "text" : "email"} 
                  className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-11 sm:pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold" 
                  placeholder={isLogin ? "example@email.com أو 01XXXXXXXXX" : "email@example.com"} 
                  dir="ltr" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input name="password" autoComplete="new-password" required minLength={4} type="password" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-4 pr-11 sm:pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#0D0D12] transition-colors text-sm font-bold" placeholder="••••••••" dir="ltr" />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:-translate-y-0.5 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-all mt-6 text-sm disabled:opacity-50 cursor-pointer">
              {loading ? 'جاري التحميل...' : (isLogin ? 'دخول 🔑' : 'إنشاء حساب مجاني 🚀')}
            </button>
          </form>
        )}

        {(isLogin || roleSelected) && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
            {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <button onClick={() => navigate(isLogin ? '/register' : '/login')} className="text-[#00B4D8] dark:text-[#D4AF37] font-bold hover:underline">
              {isLogin ? 'سجل الآن مجاناً' : 'سجل الدخول'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
