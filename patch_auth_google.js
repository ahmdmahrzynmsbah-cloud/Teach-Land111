const fs = require('fs');

const content = `import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, User, Phone, MapPin, School, BookOpen, GraduationCap, Users, Calendar, IdCard } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليوبية', 'بورسعيد', 'السويس', 
  'مطروح', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية', 'الإسماعيلية', 
  'دمياط', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
  'سوهاج', 'قنا', 'أسوان', 'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 
  'شمال سيناء', 'جنوب سيناء'
];

export default function Auth() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in database
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // User exists, go to dashboard
        navigate('/dashboard');
      } else {
        // User needs to complete profile
        setGoogleUser(user);
        setNeedsRegistration(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول بواسطة جوجل.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!googleUser) return;
    
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const baseData = {
        email: googleUser.email,
        name: formData.get('name') as string || googleUser.displayName || 'مستخدم',
        phone: formData.get('phone') as string,
        governorate: formData.get('governorate') as string,
        role
      };

      if (role === 'student') {
        await setDoc(doc(db, 'users', googleUser.uid), {
          ...baseData,
          grade: formData.get('grade') as string,
          school: formData.get('school') as string,
          parentPhone: formData.get('parentPhone') as string
        });
      } else {
        const grades = [];
        if (formData.get('grade_1')) grades.push('الأول الثانوي');
        if (formData.get('grade_2')) grades.push('الثاني الثانوي');
        if (formData.get('grade_3')) grades.push('الثالث الثانوي');

        await setDoc(doc(db, 'users', googleUser.uid), {
          ...baseData,
          subject: formData.get('subject') as string,
          nationalId: formData.get('nationalId') as string,
          dateOfBirth: formData.get('dateOfBirth') as string,
          teachingGrades: grades.length > 0 ? grades : ['غير محدد']
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex items-center justify-center p-6 selection:bg-primary/30 font-sans" dir="rtl">
      <Link to="/" className="absolute top-6 right-6 text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:text-[#D4AF37] flex items-center gap-2 transition-colors text-sm font-bold">
        <ArrowRight className="w-5 h-5" /> عودة للرئيسية
      </Link>
      <div className="absolute top-6 left-6">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#1A1A24] rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-[#2D2D3D]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20">
            ت
          </div>
          <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">
            {!needsRegistration ? 'تسجيل الدخول / إنشاء حساب' : 'استكمال البيانات'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {!needsRegistration ? 'استخدم حساب جوجل الخاص بك للدخول فوراً' : 'سجل بياناتك عشان تبدأ رحلتك التعليمية'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {!needsRegistration ? (
          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white dark:bg-[#222230] border-2 border-gray-200 dark:border-[#2D2D3D] text-gray-700 dark:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-[#2A2A3A] transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'جاري التحميل...' : 'المتابعة باستخدام جوجل'}
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              سيتم إنشاء حساب جديد تلقائياً إذا لم يكن لديك حساب
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <div className="flex bg-gray-100 dark:bg-[#222230] p-1 rounded-xl mb-6">
              <button 
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === 'student' ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
              >
                <GraduationCap className="w-4 h-4" /> طالب
              </button>
              <button 
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === 'teacher' ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
              >
                <Users className="w-4 h-4" /> معلم
              </button>
            </div>

            <AnimatePresence mode="popLayout">
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
                    <input name="name" required type="text" defaultValue={googleUser.displayName || ''} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="محمد أحمد..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">المحافظة</label>
                    <div className="relative">
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <select name="governorate" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-10 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors appearance-none">
                        <option value="">اختر المحافظة</option>
                        {EGYPT_GOVERNORATES.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {role === 'student' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الصف الدراسي</label>
                      <div className="relative">
                        <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select name="grade" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-10 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors appearance-none">
                          <option value="">اختر الصف</option>
                          <option value="الأول الثانوي">الأول الثانوي</option>
                          <option value="الثاني الثانوي">الثاني الثانوي</option>
                          <option value="الثالث الثانوي">الثالث الثانوي</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">المادة</label>
                      <div className="relative">
                        <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select name="subject" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-10 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors appearance-none">
                          <option value="">اختر المادة</option>
                          <option value="الرياضيات">الرياضيات</option>
                          <option value="الفيزياء">الفيزياء</option>
                          <option value="الكيمياء">الكيمياء</option>
                          <option value="الأحياء">الأحياء</option>
                          <option value="لغة عربية">لغة عربية</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {role === 'student' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">اسم المدرسة</label>
                      <div className="relative">
                        <School className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input name="school" required type="text" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="مدرسة..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم ولي الأمر</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input name="parentPhone" required type="tel" pattern="^01[0125][0-9]{8}$" title="رقم هاتف مصري صحيح (مثال: 01012345678)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="01X..." dir="ltr" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الرقم القومي</label>
                        <div className="relative">
                          <IdCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <input name="nationalId" required type="text" pattern="^[23][0-9]{13}$" title="رقم قومي مصري صحيح (14 رقم)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors text-right" placeholder="14 رقم" dir="ltr" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">تاريخ الميلاد</label>
                        <div className="relative">
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <input name="dateOfBirth" required type="date" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الصفوف الدراسية التي تدرسها</label>
                      <div className="flex gap-4 mt-2">
                        {['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((grade, index) => (
                           <label key={grade} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                              <input name={\`grade_\${index+1}\`} type="checkbox" className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] rounded border-gray-200 dark:border-[#2D2D3D] focus:ring-[#D4AF37]" />
                              {grade}
                           </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input name="phone" required type="tel" pattern="^01[0125][0-9]{8}$" title="رقم هاتف مصري صحيح (مثال: 01012345678)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="01X..." dir="ltr" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <button disabled={loading} type="submit" className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:-translate-y-0.5 hover:bg-[#0077B6] dark:bg-[#B8860B] transition-all mt-6 text-lg disabled:opacity-50">
              {loading ? 'جاري التحميل...' : 'حفظ البيانات وبدء الاستخدام'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/Auth.tsx', content);
