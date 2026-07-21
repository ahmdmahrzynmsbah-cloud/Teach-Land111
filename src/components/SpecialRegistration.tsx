import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Phone, ArrowRight, Lock, Loader2, Sparkles, GraduationCap } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

export default function SpecialRegistration() {
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type') === 'qudurat' ? 'qudurat' : 'tahsili';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });
  const [selectedRegType, setSelectedRegType] = useState<'qudurat' | 'tahsili' | 'both'>(
    type === 'qudurat' ? 'qudurat' : 'tahsili'
  );

  const typeName = selectedRegType === 'qudurat' ? 'القدرات' : selectedRegType === 'tahsili' ? 'التحصيلي' : 'القدرات والتحصيلي معاً';
  const typeColor = selectedRegType === 'qudurat' ? 'text-emerald-500' : selectedRegType === 'tahsili' ? 'text-purple-500' : 'text-blue-500';
  const typeBg = selectedRegType === 'qudurat' ? 'bg-emerald-500/10' : selectedRegType === 'tahsili' ? 'bg-purple-500/10' : 'bg-blue-500/10';
  const typeGradient = selectedRegType === 'qudurat' 
    ? 'from-emerald-500 to-teal-600' 
    : selectedRegType === 'tahsili' 
      ? 'from-purple-500 to-indigo-600' 
      : 'from-blue-500 to-indigo-600';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) {
      toast.error('يرجى ملء جميع الحقول بما في ذلك كلمة المرور');
      return;
    }

    if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      toast.error('يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01XXXXXXXXX)');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 أحرف أو أرقام على الأقل');
      return;
    }

    setLoading(true);
    try {
      // Create email from phone
      const email = `${formData.phone}@tafawwoq.app`;
      // Use the chosen password instead of phone number
      const password = formData.password;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: formData.name,
        phone: formData.phone,
        email: email,
        role: 'student',
        registrationType: selectedRegType,
        isSpecialRegistration: true,
        status: 'approved',
        isApproved: true,
        balance: 0,
        createdAt: new Date().toISOString(),
        governorate: 'غير محدد',
        grade: selectedRegType === 'qudurat' ? 'القدرات' : selectedRegType === 'tahsili' ? 'التحصيلي' : 'القدرات والتحصيلي معاً',
        school: 'غير محدد',
        parentPhone: '01000000000'
      });

      toast.success(`تم إنشاء حسابك كطالب ${typeName} بنجاح! يمكنك الآن بدء التعلم والاشتراك في الدورات مباشرة 🎉`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      const isAlreadyInUse = error.code === 'auth/email-already-in-use' || 
                             (error.message && error.message.includes('email-already-in-use'));
      if (isAlreadyInUse) {
        toast.error('هذا الهاتف مسجل بالفعل في المنصة! يرجى الذهاب لصفحة تسجيل الدخول واستخدام رقم الهاتف وكلمة المرور الخاصة بك لدخول حسابك.');
      } else {
        toast.error('حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button onClick={() => navigate('/')} className="text-gray-500 dark:text-gray-400 hover:text-primary flex items-center gap-1.5 transition-colors text-xs sm:text-sm font-black bg-white dark:bg-[#1A1A24] px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-[#2D2D3D]">
          <ArrowRight className="w-4 h-4" /> عودة للرئيسية
        </button>
      </div>
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md my-8"
      >
        <div className="bg-white dark:bg-[#1A1A24] rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-[#2D2D3D] relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 ${typeBg} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute -bottom-24 -left-24 w-48 h-48 ${typeBg} rounded-full blur-3xl pointer-events-none`} />

          <div className="text-center mb-6 relative z-10">
            <div className={`w-20 h-20 bg-gradient-to-tr ${typeGradient} rounded-3xl mx-auto mb-5 flex items-center justify-center text-white shadow-xl shadow-black/10 transform -rotate-3`}>
              <GraduationCap className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-black mb-3 border border-gray-100 dark:border-white/5 uppercase tracking-widest">
              <Sparkles className={`w-3.5 h-3.5 ${typeColor}`} />
              مرحلة تسجيل الطلاب (طلب انضمام للمسارات الخاصة)
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">طلب انضمام جديد 🚀</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed max-w-[280px] mx-auto">
              سجل اسمك ورقم هاتفك فقط وسيقوم مدير المنصة بمراجعة حسابك وتفعيله في أسرع وقت!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10" dir="rtl">
            {/* Class Selection Cards */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 mr-2">المسار المطلوب للاشتراك فيه:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'qudurat', label: 'القدرات', colorClass: 'border-emerald-500/20 dark:border-emerald-500/10' },
                  { id: 'tahsili', label: 'التحصيلي', colorClass: 'border-purple-500/20 dark:border-purple-500/10' },
                  { id: 'both', label: 'كلاهما', colorClass: 'border-blue-500/20 dark:border-blue-500/10' },
                ].map((item) => {
                  const isSelected = selectedRegType === item.id;
                  const activeColor = item.id === 'qudurat' 
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' 
                    : item.id === 'tahsili' 
                      ? 'border-purple-500 bg-purple-500/5 text-purple-600 dark:text-purple-400' 
                      : 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedRegType(item.id as any)}
                      className={`py-3 px-1 rounded-xl text-center font-black text-xs border transition-all cursor-pointer ${
                        isSelected 
                          ? activeColor 
                          : 'border-gray-150 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 mr-2">الاسم بالكامل:</label>
              <div className="relative group">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-150 dark:border-[#2D2D3D] rounded-2xl pr-12 pl-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold"
                  placeholder="مثال: أحمد محمد علي"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 mr-2">رقم الهاتف (الواتساب):</label>
              <div className="relative group">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-150 dark:border-[#2D2D3D] rounded-2xl pr-12 pl-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold"
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 mr-2">كلمة المرور (اختر كلمة مرور خاصة بحسابك):</label>
              <div className="relative group">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-150 dark:border-[#2D2D3D] rounded-2xl pr-12 pl-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold"
                  placeholder="أدخل كلمة المرور الخاصة بك"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-2xl p-4 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 text-[10px] leading-relaxed text-gray-600 dark:text-gray-300 font-bold space-y-1">
              <p className="flex items-center gap-1 font-black text-[#00B4D8] dark:text-[#D4AF37]">
                💡 ملحوظة هامة لسهولة الدخول:
              </p>
              <p>
                عند تسجيل الدخول لاحقاً، يمكنك إدخال <b>رقم هاتفك</b> في خانة (البريد الإلكتروني أو رقم الهاتف) و<b>كلمة المرور</b> التي اخترتها بالأعلى للدخول مباشرة إلى حسابك بعد موافقة الإدارة.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4.5 bg-gradient-to-r ${typeGradient} text-white rounded-2xl font-black text-xs shadow-xl shadow-black/10 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer border-0`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>إرسال طلب الانضمام والانتظار</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-50 dark:border-white/5 pt-5">
            <p className="text-[10px] text-gray-400 font-bold mb-2">لديك حساب بالفعل؟</p>
            <button
              onClick={() => navigate('/login')}
              className={`text-xs font-black ${typeColor} hover:underline transition-all cursor-pointer bg-transparent border-0`}
            >
              تسجيل الدخول من هنا
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-gray-400 dark:text-gray-500 font-bold max-w-[300px] mx-auto leading-relaxed">
          بالتسجيل في المنصة، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بـ {settings.platformName}.
        </p>
      </motion.div>
    </div>
  );
}
