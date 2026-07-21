import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, getDoc, setDoc, onSnapshot, arrayUnion, arrayRemove, addDoc, query, orderBy, where, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { 
  Users, BookOpen, Shield, Trash2, Edit2, Edit3, Loader2, CheckCircle2, 
  Eye, EyeOff, Printer, X, Calendar, User as UserIcon, Mail, Phone, Lock, 
  GraduationCap, Book, AlertTriangle, FileText, Settings, Sparkles, 
  Hash, Award, FileCheck, Check, Activity, ShieldAlert,
  MapPin, School, PhoneCall, Layers, Clock, Search, Filter,
  ArrowUpDown, SlidersHorizontal, RotateCcw, Archive, Download, Plus,
  CreditCard, Image as ImageIcon, XCircle, Copy, History, DollarSign, Ticket, Wallet, RefreshCw, Film, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import AdminVisualStats from './AdminVisualStats';
import SubscriptionRequests from './SubscriptionRequests';

const formatRegistrationDate = (createdAt: any) => {
  if (!createdAt) return '13/07/2026';
  try {
    if (typeof createdAt === 'string') {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
      }
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
  } catch (e) {
    // ignore
  }
  return '13/07/2026';
};

const getMockReportRecords = (role: string, rangeType: 'all' | 'month' | 'custom', monthStr?: string, startStr?: string, endStr?: string) => {
  let allRecords: any[] = [];
  
  if (role === 'teacher') {
    allRecords = [
      { id: 1, type: 'درس تفاعلي', name: 'شرح درس البلاغة المقارنة والنقد المعاصر', details: 'عدد الحاضرين: 15 طالب', date: '2026-07-08', status: 'مكتمل' },
      { id: 2, type: 'تصحيح واجبات', name: 'تصحيح واجب النحو والصرف الدوري الثاني', details: 'عدد الأوراق المصححة: 18 ورقة', date: '2026-07-04', status: 'مكتمل' },
      { id: 3, type: 'إعداد اختبار', name: 'إعداد بنك الأسئلة لمادة اللغة العربية للفصل الصيفي', details: 'عدد الأسئلة: 50 سؤال', date: '2026-06-22', status: 'مكتمل' },
      { id: 4, type: 'ورشة عمل', name: 'محاضرة مراجعة تفاعلية ليلة الامتحان التجريبي', details: 'المدة الزمنية: ساعتان', date: '2026-06-10', status: 'مكتمل' },
      { id: 5, type: 'درس تفاعلي', name: 'شرح معلقة امرؤ القيس والجاهلية الأولى', details: 'عدد الحاضرين: 14 طالب', date: '2026-05-25', status: 'مكتمل' },
      { id: 6, type: 'اجتماع إدارة', name: 'اجتماع مجلس المعلمين الدوري وتنسيق الجداول', details: 'حضور وإعداد التوصيات', date: '2026-05-11', status: 'مكتمل' },
      { id: 7, type: 'تصحيح اختبار', name: 'رصد علامات اختبار منتصف الفصل الثاني للطلاب', details: 'إدخال البيانات لقاعدة البيانات', date: '2026-04-18', status: 'مكتمل' }
    ];
  } else if (role === 'parent') {
    allRecords = [
      { id: 1, type: 'متابعة تقرير', name: 'استعراض التقرير الدراسي التفصيلي للابن أحمد', details: 'حالة حضور ممتازة 100%', date: '2026-07-10', status: 'مكتمل' },
      { id: 2, type: 'نتائج الاختبارات', name: 'الإطلاع على علامات الابن أحمد في مادة الرياضيات', details: 'النتيجة: 90 / 100 (ممتاز)', date: '2026-07-03', status: 'مكتمل' },
      { id: 3, type: 'تواصل مع معلم', name: 'إرسال استفسار للمعلم المشرف م. محمد بخصوص الواجبات', details: 'الحالة: تم الرد والحل', date: '2026-06-28', status: 'مكتمل' },
      { id: 4, type: 'شحن رصيد', name: 'تفعيل قسيمة شحن رصيد الكتب التعليمية ووسائل التدريس', details: 'القيمة المضافة: 500 ج.م', date: '2026-06-15', status: 'مكتمل' },
      { id: 5, type: 'متابعة غياب', name: 'تلقي إشعار التأخر الصباحي التلقائي للطالب أحمد', details: 'تم تبرير الغياب هاتفياً', date: '2026-05-22', status: 'مكتمل' },
      { id: 6, type: 'مجالس أولياء أمور', name: 'حضور مجلس الآباء السنوي الافتراضي لمناقشة الأداء', details: 'المشاركة الفعالة والتصويت', date: '2026-05-02', status: 'مكتمل' },
      { id: 7, type: 'دفع مصروفات', name: 'سداد رسوم اشتراك الفصل الدراسي الصيفي والكتب', details: 'عملية ناجحة وآمنة', date: '2026-04-12', status: 'مكتمل' }
    ];
  } else {
    // Default is student
    allRecords = [
      { id: 1, type: 'اختبار دوري', name: 'اختبار النحو والبلاغة الدوري المقيد', details: 'الدرجة: 96 / 100', date: '2026-07-05', status: 'ممتاز' },
      { id: 2, type: 'امتحان شهري', name: 'الامتحان الشهري الموحد - الجبر وحساب المثلثات', details: 'الدرجة: 90 / 100', date: '2026-07-02', status: 'ممتاز' },
      { id: 3, type: 'اختبار علمي', name: 'اختبار الميكانيكا والكهرباء الحديثة الشامل', details: 'الدرجة: 88 / 100', date: '2026-06-25', status: 'جيد جداً' },
      { id: 4, type: 'واجب منزلي', name: 'تقييم القراءة والكتابة والبحث التعبيري الإبداعي', details: 'الدرجة: 92 / 100', date: '2026-06-18', status: 'ممتاز' },
      { id: 5, type: 'اختبار كيمياء', name: 'اختبار العناصر الانتقالية والتحليل الكيميائي الكلي', details: 'الدرجة: 85 / 100', date: '2026-05-28', status: 'جيد جداً' },
      { id: 6, type: 'اختبار أحياء', name: 'امتحان الوراثة والتطور والخلية النمطية الموسع', details: 'الدرجة: 94 / 100', date: '2026-05-12', status: 'ممتاز' },
      { id: 7, type: 'تقييم عام', name: 'تقييم العصور الوسطى والتضاريس الجغرافية للتاريخ', details: 'الدرجة: 89 / 100', date: '2026-04-20', status: 'جيد جداً' }
    ];
  }

  return allRecords.filter(rec => {
    if (rangeType === 'month' && monthStr) {
      return rec.date.startsWith(monthStr);
    }
    if (rangeType === 'custom') {
      const recTime = new Date(rec.date).getTime();
      const startTime = startStr ? new Date(startStr).getTime() : 0;
      const endTime = endStr ? new Date(endStr).getTime() : Infinity;
      return recTime >= startTime && recTime <= endTime;
    }
    return true; // 'all'
  });
};

const WalletRecharge = ({ users, setUsers, payments }: { users: any[], setUsers: React.Dispatch<React.SetStateAction<any[]>>, payments: any[] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [rechargeCodes, setRechargeCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

  // Filter students based on search query
  const filteredStudents = users.filter(u => 
    u.role === 'student' && 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.phone?.includes(searchQuery) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Fetch recent recharge codes
  const fetchRechargeCodes = async () => {
    setLoadingCodes(true);
    try {
      const q = query(collection(db, 'recharge_codes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const codes: any[] = [];
      snap.forEach(doc => {
        codes.push({ id: doc.id, ...doc.data() as object });
      });
      setRechargeCodes(codes);
    } catch (e) {
      console.error("Error fetching recharge codes:", e);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    fetchRechargeCodes();
  }, []);

  const handleDirectCharge = async () => {
    if (!selectedStudent || !amount || Number(amount) <= 0) {
      toast.error('يرجى تحديد الطالب وإدخال مبلغ شحن صحيح');
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', selectedStudent.id);
      const chargeAmt = Number(amount);
      const newBalance = (selectedStudent.balance || 0) + chargeAmt;
      
      // Update balance
      await updateDoc(userRef, { balance: newBalance });
      
      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: selectedStudent.id,
        chargedBy: 'admin',
        type: 'charge',
        amount: chargeAmt,
        codeUsed: 'DIRECT_ADMIN_CHARGE',
        description: `شحن رصيد مباشر بواسطة إدارة المنصة بقيمة ${chargeAmt} ج.م`,
        createdAt: new Date().toISOString()
      });

      setUsers(prev => prev.map(u => u.id === selectedStudent.id ? { ...u, balance: newBalance } : u));
      setSelectedStudent(prev => prev ? { ...prev, balance: newBalance } : null);
      
      toast.success(`تم شحن رصيد بقيمة ${chargeAmt} ج.م للطالب ${selectedStudent.name} بنجاح! 🎉`);
      setAmount('');
    } catch (e) {
      console.error(e);
      toast.error('فشل شحن الرصيد المباشر');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedStudent || !amount || Number(amount) <= 0) {
      toast.error('يرجى تحديد الطالب وإدخال مبلغ شحن صحيح');
      return;
    }
    setLoading(true);
    try {
      const chargeAmt = Number(amount);
      
      // Generate a secure unique alphanumeric string of length 8
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomSuffix = '';
      for (let i = 0; i < 8; i++) {
        randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `TF-${chargeAmt}-${randomSuffix}`;

      // Store in firestore recharge_codes
      await setDoc(doc(db, 'recharge_codes', code), {
        code,
        amount: chargeAmt,
        used: false,
        createdAt: new Date().toISOString(),
        generatedForId: selectedStudent.id,
        generatedForName: selectedStudent.name,
        generatedForPhone: selectedStudent.phone || ''
      });

      setGeneratedCode(code);
      toast.success('تم توليد كود الشحن بنجاح! 🎫');
      setAmount('');
      fetchRechargeCodes();
    } catch (e) {
      console.error(e);
      toast.error('فشل توليد كود الشحن');
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteCode = async (codeId: string) => {
    try {
      await deleteDoc(doc(db, 'recharge_codes', codeId));
      toast.success('تم حذف كارت الشحن بنجاح 🎉');
      setCodeToDelete(null);
      fetchRechargeCodes();
    } catch (e) {
      console.error(e);
      toast.error('فشل حذف كود الشحن');
    }
  };

  // Calculate total amount student has paid
  const studentPayments = payments.filter(p => p.userId === selectedStudent?.id && p.status === 'approved');
  const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Right column: Search & Select Student */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> البحث عن طالب
          </h3>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الطالب، رقم الهاتف..."
              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl pr-9 pl-4 py-3 outline-none focus:ring-2 focus:ring-[#00B4D8]/20 focus:border-[#00B4D8] text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {(searchQuery ? filteredStudents : users.filter(u => u.role === 'student' || !u.role)).length > 0 ? (
              (searchQuery ? filteredStudents : users.filter(u => u.role === 'student' || !u.role)).slice(0, 50).map(student => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setGeneratedCode(null);
                  }}
                  className={`w-full text-right p-3 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-[#00B4D8] dark:border-[#D4AF37] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 text-[#00B4D8] dark:text-[#D4AF37]'
                      : 'border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#15151F] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{student.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1">{student.phone || 'بدون هاتف'}</p>
                  </div>
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full font-black">
                    {student.grade === '1' ? 'الصف الأول' : student.grade === '2' ? 'الصف الثاني' : 'الصف الثالث'}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4 font-bold">
                {searchQuery ? 'لا يوجد نتائج بحث مطابقة' : 'لا يوجد طلاب مسجلين بالمنصة حالياً'}
              </p>
            )}
          </div>
        </div>

        {/* Left column: Student Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
              {/* Student Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100 dark:border-[#2D2D3D]">
                <div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white">{selectedStudent.name}</h4>
                  <p className="text-xs font-bold text-gray-400 mt-1">{selectedStudent.email || 'لا يوجد بريد إلكتروني مسجل'}</p>
                </div>
                <span className="bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] text-xs font-black px-3 py-1.5 rounded-full">
                  طالب نشط بالمنصة 🎓
                </span>
              </div>

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#0D0D12]/50 border border-gray-100 dark:border-[#2D2D3D] rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-0.5">الرصيد المتاح حالياً</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{(selectedStudent.balance || 0).toLocaleString('ar-EG')} ج.م</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#0D0D12]/50 border border-gray-100 dark:border-[#2D2D3D] rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-0.5">إجمالي المدفوعات المعتمدة</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{totalPaid.toLocaleString('ar-EG')} ج.م</p>
                  </div>
                </div>
              </div>

              {/* Recharge Input & Form */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-500 dark:text-gray-400">مبلغ الشحن المطلوب:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['50', '100', '150', '200', '300', '500'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 px-3 text-xs font-black rounded-xl border transition-all ${
                        amount === val
                          ? 'border-[#00B4D8] dark:border-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                          : 'border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#15151F] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {val} ج.م
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="أو أدخل مبلغاً مخصصاً هنا..."
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#00B4D8]/20 focus:border-[#00B4D8] text-sm font-bold text-gray-900 dark:text-white"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">ج.م</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={loading || !amount}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] hover:opacity-90 disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 duration-200 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ticket className="w-4 h-4" />
                  )}
                  <span>توليد كارت شحن (كود تفعيل)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectCharge}
                  disabled={loading || !amount}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 duration-200 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                  <span>شحن مباشر فورياً للمحفظة</span>
                </button>
              </div>

              {/* Display Generated Code Result */}
              <AnimatePresence>
                {generatedCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-6 bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800/50 rounded-3xl text-center space-y-4"
                  >
                    <div>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">كارت شحن Teachland جاهز للاستخدام! 🎫</span>
                      <h5 className="text-sm font-bold text-gray-500 dark:text-gray-400">أرسل هذا الكود للطالب ليقوم بتفعيله وشحن محفظته تلقائياً:</h5>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-6 py-3 font-mono text-lg font-black text-gray-900 dark:text-white select-all">
                        {generatedCode}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          toast.success('تم نسخ كود الشحن بنجاح! 📋');
                        }}
                        className="flex items-center gap-1.5 px-4 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] hover:opacity-90 text-white rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        نسخ الكود
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1A24] p-8 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-center space-y-4 py-16">
              <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] rounded-full flex items-center justify-center mx-auto">
                <UserIcon className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900 dark:text-white">يرجى تحديد طالب من قائمة البحث أولاً 👆</h4>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold max-w-sm mx-auto">
                ابحث عن اسم الطالب المطلوب، ثم حدده لعرض تفاصيله المالية، كشف مدفوعاته، وإتمام عمليات شحن الرصيد له.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Recharge Codes generated */}
      <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#2D2D3D]">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" /> كروت الشحن وأكواد التفعيل المصدرة حديثاً
          </h3>
          <button
            onClick={fetchRechargeCodes}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loadingCodes ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingCodes ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
          </div>
        ) : rechargeCodes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2D2D3D] text-gray-400 font-black">
                  <th className="pb-3 pt-1">كود التفعيل</th>
                  <th className="pb-3 pt-1">القيمة</th>
                  <th className="pb-3 pt-1">صادر للطالب</th>
                  <th className="pb-3 pt-1">الحالة</th>
                  <th className="pb-3 pt-1">تاريخ الإصدار</th>
                  <th className="pb-3 pt-1 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50 font-bold">
                {rechargeCodes.map(codeDoc => (
                  <tr key={codeDoc.code} className="hover:bg-gray-50/50 dark:hover:bg-[#15151F]/40 transition-colors">
                    <td className="py-4 font-mono font-black text-[#00B4D8] dark:text-[#D4AF37]">{codeDoc.code}</td>
                    <td className="py-4">{codeDoc.amount.toLocaleString('ar-EG')} ج.م</td>
                    <td className="py-4">
                      <div>
                        <p className="text-gray-900 dark:text-white">{codeDoc.generatedForName || 'غير محدد'}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{codeDoc.generatedForPhone || ''}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      {codeDoc.used ? (
                        <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-[10px] px-2.5 py-1 rounded-full font-black">
                          مستخدمة ❌
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-black">
                          جاهزة للاستخدام ✨
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-gray-400 text-xs">
                      {new Date(codeDoc.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(codeDoc.code);
                            toast.success('تم نسخ كود الشحن بنجاح! 📋');
                          }}
                          className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
                          title="نسخ الكود"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCodeToDelete(codeDoc.id || codeDoc.code)}
                          className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 hover:text-red-700 rounded-lg"
                          title="حذف الكارت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-8 font-bold">لا توجد أكواد تفعيل مولدة حالياً</p>
        )}
      </div>

      {/* Confirmation Modal for deletion */}
      <AnimatePresence>
        {codeToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1A24] max-w-md w-full rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-[#2D2D3D] text-right space-y-4"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black text-gray-900 dark:text-white">تأكيد حذف كود الشحن</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف كود الشحن <span className="font-mono text-[#00B4D8] dark:text-[#D4AF37] font-black">{codeToDelete}</span> نهائياً؟
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl font-bold leading-relaxed">
                  ⚠️ تنبيه: هذا الإجراء نهائي ولا يمكن التراجع عنه! لن يتمكن الطالب من استخدام هذا الكارت لشحن رصيده بعد حذفه.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => executeDeleteCode(codeToDelete)}
                  className="bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-2xl shadow-md shadow-red-500/10 transition-colors cursor-pointer"
                >
                  حذف نهائي
                </button>
                <button
                  type="button"
                  onClick={() => setCodeToDelete(null)}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-black py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminPanel({ initialTab, userData }: { initialTab?: 'students' | 'teachers' | 'parents' | 'approvals' | 'special_approvals' | 'payments' | 'settings' | 'wallet' | 'courses' | 'subscription_requests'; userData?: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'parents' | 'approvals' | 'special_approvals' | 'payments' | 'settings' | 'wallet' | 'courses' | 'subscription_requests'>(initialTab || 'students');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [studentStatusFilter, setStudentStatusFilter] = useState<'active' | 'archived'>('active');
  const [studentTrackFilter, setStudentTrackFilter] = useState<'all' | 'qudurat' | 'tahsili' | 'both' | 'regular'>('all');
  const [specialApprovalTypeFilter, setSpecialApprovalTypeFilter] = useState<'all' | 'qudurat' | 'tahsili' | 'both'>('all');

  // Courses states
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesSearchQuery, setCoursesSearchQuery] = useState('');
  const [coursesGradeFilter, setCoursesGradeFilter] = useState('all');
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<any | null>(null);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<any | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null);

  const { settings: platformSettings, updateSettings, loading: loadingSettings } = usePlatformSettings();

  // Course payments / Vodafone Cash requests state
  const [payments, setPayments] = useState<any[]>([]);
  const [reviewPayments, setReviewPayments] = useState<any[]>([]);
  const [paymentSubTab, setPaymentSubTab] = useState<'courses' | 'reviews'>('courses');
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const [viewImageModalOpen, setViewImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Settings upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [tempSubjects, setTempSubjects] = useState(platformSettings.subjects || []);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('BookOpen');
  const [newSubjectColor, setNewSubjectColor] = useState('bg-blue-100 text-blue-600');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const subjectIconOptions = [
    'Calculator', 'Zap', 'FlaskConical', 'Dna', 'Languages', 'BookOpenText', 'Scroll', 'Globe', 'BookOpen', 'Trophy', 'Award', 'GraduationCap', 'Star', 'Users'
  ];

  const subjectColorOptions = [
    { name: 'أزرق', value: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
    { name: 'أصفر', value: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400' },
    { name: 'بنفسجي', value: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
    { name: 'أخضر', value: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' },
    { name: 'أحمر', value: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
    { name: 'نيلي', value: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
    { name: 'برتقالي', value: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
    { name: 'تركواز', value: 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' }
  ];

  useEffect(() => {
    if (platformSettings.subjects) {
      setTempSubjects(platformSettings.subjects);
    }
  }, [platformSettings.subjects]);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Print Form State / Customization
  const [printDateRange, setPrintDateRange] = useState<'all' | 'month' | 'custom'>('all');
  const [printMonth, setPrintMonth] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [customReportTitle, setCustomReportTitle] = useState('تقرير السجل الدراسي الشامل');
  const [customReportNotes, setCustomReportNotes] = useState('');
  const [showSignatures, setShowSignatures] = useState(true);

  const [deletePaymentModalOpen, setDeletePaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // States to store real data for the selected student
  const [selectedUserSubmissions, setSelectedUserSubmissions] = useState<any[]>([]);
  const [selectedUserProgress, setSelectedUserProgress] = useState<any[]>([]);
  const [selectedUserAverageQuizScore, setSelectedUserAverageQuizScore] = useState<number>(0);
  const [selectedUserReportRecords, setSelectedUserReportRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserSubmissions([]);
      setSelectedUserProgress([]);
      setSelectedUserAverageQuizScore(0);
      setSelectedUserReportRecords([]);
      return;
    }

    const fetchSelectedStudentData = async () => {
      try {
        if (selectedUser.role === 'student') {
          // Fetch real submissions
          const qSub = query(collection(db, 'quiz_submissions'), where('userId', '==', selectedUser.id));
          const subSnap = await getDocs(qSub);
          const subs = subSnap.docs.map(doc => doc.data());
          setSelectedUserSubmissions(subs);

          // Fetch real course progress
          const qProg = query(collection(db, 'course_progress'), where('userId', '==', selectedUser.id));
          const progSnap = await getDocs(qProg);
          const progs = progSnap.docs.map(doc => doc.data());
          setSelectedUserProgress(progs);

          // Calculate average quiz score
          const totalScore = subs.reduce((acc, sub) => acc + (sub.score || 0), 0);
          const avgScore = subs.length > 0 ? Math.round(totalScore / subs.length) : 0;
          setSelectedUserAverageQuizScore(avgScore || 85); // Fallback to 85 if no exams yet

          // Generate real report records
          const records: any[] = [];
          
          // Add quiz submissions
          subs.forEach((sub: any, idx: number) => {
            const score = sub.score || 0;
            let statusStr = 'مقبول';
            if (score >= 90) statusStr = 'ممتاز ⭐️';
            else if (score >= 80) statusStr = 'جيد جداً 👍';
            else if (score >= 65) statusStr = 'جيد';
            else if (score >= 50) statusStr = 'مقبول';
            else statusStr = 'يحتاج لمتابعة ⚠️';

            records.push({
              id: sub.id || `sub-${idx}`,
              type: 'اختبار تفاعلي',
              name: sub.quizTitle || 'اختبار تقييمي للدرس',
              details: `الدرجة: ${score} / 100`,
              date: sub.submittedAt ? sub.submittedAt.split('T')[0] : '',
              status: statusStr,
              timestamp: sub.submittedAt ? new Date(sub.submittedAt).getTime() : 0
            });
          });

          // Add completed lessons
          progs.forEach((prog: any, pIdx: number) => {
            if (Array.isArray(prog.completedLessons)) {
              prog.completedLessons.forEach((lessonId: string, lIdx: number) => {
                const dateStr = prog.lastWatchedAt ? new Date(prog.lastWatchedAt).toISOString().split('T')[0] : 
                                (prog.updatedAt ? new Date(prog.updatedAt).toISOString().split('T')[0] : '');
                records.push({
                  id: `lesson-${prog.courseId}-${lessonId}-${lIdx}`,
                  type: 'استكمال درس',
                  name: `إكمال مشاهدة وفهم الدرس التعليمي`,
                  details: 'مكتمل بنجاح',
                  date: dateStr,
                  status: 'مكتمل',
                  timestamp: prog.lastWatchedAt ? new Date(prog.lastWatchedAt).getTime() : 
                             (prog.updatedAt ? new Date(prog.updatedAt).getTime() : 0)
                });
              });
            }
          });

          // Sort by timestamp desc
          records.sort((a, b) => b.timestamp - a.timestamp);
          setSelectedUserReportRecords(records);
        } else {
          // Fallback/Default for non-student roles
          const baseRecs = getMockReportRecords(selectedUser.role || 'student', 'all');
          setSelectedUserReportRecords(baseRecs);
        }
      } catch (err) {
        console.error("Error fetching selected student data for admin report:", err);
      }
    };

    fetchSelectedStudentData();
  }, [selectedUser]);

  // Dynamic filter function for selected user report records
  const getFilteredReportRecords = () => {
    return selectedUserReportRecords.filter((rec: any) => {
      if (!rec.date) return true;
      if (printDateRange === 'month' && printMonth) {
        return rec.date.startsWith(printMonth);
      }
      if (printDateRange === 'custom') {
        const recTime = new Date(rec.date).getTime();
        const startTime = reportStartDate ? new Date(reportStartDate).getTime() : 0;
        const endTime = reportEndDate ? new Date(reportEndDate).getTime() : Infinity;
        return recTime >= startTime && recTime <= endTime;
      }
      return true;
    });
  };

  useEffect(() => {
    // 1. Fetch other static configurations/progress once on mount
    const fetchOtherData = async () => {
      try {
        const [progressSnap] = await Promise.all([
          getDocs(collection(db, 'course_progress')).catch(err => {
            console.error("Error fetching course progress in background:", err);
            return { docs: [] } as any;
          })
        ]);

        const progressData: any[] = [];
        progressSnap.forEach((doc: any) => {
          progressData.push({ id: doc.id, ...doc.data() });
        });
        setProgressRecords(progressData);
      } catch (error) {
        console.error("Error fetching other admin configurations:", error);
      }
    };

    fetchOtherData();

    // 2. Real-time listener for the users collection
    setLoading(true);
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData: any[] = [];
      snapshot.forEach((document) => {
        const data = document.data();
        let createdAt = data.createdAt;
        if (!createdAt) {
          createdAt = new Date().toISOString();
        }
        usersData.push({ id: document.id, ...data, createdAt });
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to users in real-time:", error);
      setLoading(false);
      toast.error('حدث خطأ أثناء جلب وتحديث بيانات المستخدمين');
    });

    // Real-time listener for course_payments collection
    const unsubscribePayments = onSnapshot(collection(db, 'course_payments'), (snapshot) => {
      const paymentsData: any[] = [];
      snapshot.forEach((document) => {
        paymentsData.push({ id: document.id, ...document.data() });
      });
      // Sort payments newest first
      paymentsData.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setPayments(paymentsData);
    }, (error) => {
      console.error("Error listening to course payments:", error);
    });

    // Real-time listener for courses collection
    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const coursesData: any[] = [];
      snapshot.forEach((document) => {
        coursesData.push({ id: document.id, ...document.data() });
      });
      setCourses(coursesData);
    }, (error) => {
      console.error("Error listening to courses:", error);
    });

    // Real-time listener for review_payments collection
    const unsubscribeReviewPayments = onSnapshot(collection(db, 'review_payments'), (snapshot) => {
      const reviewPaymentsData: any[] = [];
      snapshot.forEach((document) => {
        reviewPaymentsData.push({ id: document.id, ...document.data() });
      });
      // Sort newest first
      reviewPaymentsData.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setReviewPayments(reviewPaymentsData);
    }, (error) => {
      console.error("Error listening to review payments:", error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
      unsubscribeCourses();
      unsubscribeReviewPayments();
    };
  }, []);

  const showSuccessToast = (message: string, type: 'edit' | 'delete', userName?: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-[#1A1A24] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 border-r-4 ${
          type === 'delete' ? 'border-red-500' : 'border-green-500'
        } p-4 transition-all duration-300 ease-out`}
        dir="rtl"
      >
        <div className="flex-1 w-0 flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            type === 'delete' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 'bg-green-50 dark:bg-green-950/30 text-green-500'
          }`}>
            {type === 'delete' ? <Trash2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-black text-gray-900 dark:text-white">
              {message}
            </p>
            {userName && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-bold">
                {type === 'delete' ? `الاسم: ${userName}` : `تم تحديث ملف: ${userName}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex border-l border-gray-100 dark:border-gray-800 pl-3 ml-3 self-center shrink-0">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingSettings(true);
    const formData = new FormData(e.currentTarget);
    
    let logoUrl = platformSettings.logoUrl;
    
    try {
      if (logoFile) {
        toast.success("جاري رفع شعار المنصة...");
        const storageRef = ref(storage, `settings/platform-logo-${Date.now()}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const updated: any = {
        platformName: (formData.get('platformName') as string) || platformSettings.platformName || 'Teachland',
        logoChar: (formData.get('logoChar') as string) || platformSettings.logoChar || 'T',
        logoUrl: logoUrl || '',
        heroTitle: (formData.get('heroTitle') as string) || platformSettings.heroTitle || '',
        heroSubtitle: (formData.get('heroSubtitle') as string) || platformSettings.heroSubtitle || '',
        showGradesSection: formData.get('showGradesSection') === 'true',
        showSubjectsSection: formData.get('showSubjectsSection') === 'true',
        showFeaturesSection: formData.get('showFeaturesSection') === 'true',
        showFaqSection: formData.get('showFaqSection') === 'true',
        gradesTitle: (formData.get('gradesTitle') as string) || platformSettings.gradesTitle || '',
        gradesSubtitle: (formData.get('gradesSubtitle') as string) || platformSettings.gradesSubtitle || '',
        subjectsTitle: (formData.get('subjectsTitle') as string) || platformSettings.subjectsTitle || '',
        subjectsSubtitle: (formData.get('subjectsSubtitle') as string) || platformSettings.subjectsSubtitle || '',
        faqTitle: (formData.get('faqTitle') as string) || platformSettings.faqTitle || '',
        faqSubtitle: (formData.get('faqSubtitle') as string) || platformSettings.faqSubtitle || '',
        vodafoneCashNumber: (formData.get('vodafoneCashNumber') as string) || platformSettings.vodafoneCashNumber || '',
        isVodafoneCashEnabled: formData.get('isVodafoneCashEnabled') === 'true',
        instapayHandle: (formData.get('instapayHandle') as string) || platformSettings.instapayHandle || '',
        isInstapayEnabled: formData.get('isInstapayEnabled') === 'true',
        bankAccountDetails: (formData.get('bankAccountDetails') as string) || platformSettings.bankAccountDetails || '',
        isBankAccountEnabled: formData.get('isBankAccountEnabled') === 'true',
        subjects: tempSubjects || [],
        contactPhone: (formData.get('contactPhone') as string) || platformSettings.contactPhone || '',
        contactEmail: (formData.get('contactEmail') as string) || platformSettings.contactEmail || '',
        contactAddress: (formData.get('contactAddress') as string) || platformSettings.contactAddress || '',
        quduratVideoUrl: (formData.get('quduratVideoUrl') as string) || '',
        tahsiliVideoUrl: (formData.get('tahsiliVideoUrl') as string) || '',
        quduratVideoProvider: (formData.get('quduratVideoProvider') as 'bunny' | 'tiktok' | 'youtube' | 'direct') || 'youtube',
        tahsiliVideoProvider: (formData.get('tahsiliVideoProvider') as 'bunny' | 'tiktok' | 'youtube' | 'direct') || 'youtube',
        quduratVideoTitle: (formData.get('quduratVideoTitle') as string) || 'الفيديو التعريفي لمسار القدرات 🎯',
        tahsiliVideoTitle: (formData.get('tahsiliVideoTitle') as string) || 'الفيديو التعريفي لمسار التحصيلي 🚀',
        socialLinks: {
          facebook: (formData.get('facebook') as string) || platformSettings.socialLinks?.facebook || '',
          twitter: (formData.get('twitter') as string) || platformSettings.socialLinks?.twitter || '',
          youtube: (formData.get('youtube') as string) || platformSettings.socialLinks?.youtube || '',
          instagram: (formData.get('instagram') as string) || platformSettings.socialLinks?.instagram || ''
        }
      };

      await updateSettings(updated);
      setLogoFile(null);
      toast.success("تم حفظ إعدادات المنصة وتحديثها بنجاح! ✨");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("فشل في حفظ إعدادات المنصة");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApproveSpecialRegistration = async (user: any) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: 'approved',
        isApproved: true
      });
      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'approved', isApproved: true } : u));
      toast.success(`تم قبول طلب تسجيل ${user.name} بنجاح ✅`);
    } catch (error) {
      console.error("Error approving special registration:", error);
      toast.error('فشل قبول الطلب');
    }
  };

  const handleRejectSpecialRegistration = async (user: any) => {
    if (!window.confirm(`هل أنت متأكد من رفض طلب ${user.name}؟`)) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: 'rejected',
        isApproved: false
      });
      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'rejected', isApproved: false } : u));
      toast.error(`تم رفض طلب تسجيل ${user.name} ❌`);
    } catch (error) {
      console.error("Error rejecting special registration:", error);
      toast.error('فشل رفض الطلب');
    }
  };

  const handleApproveUser = async (userId: string, name: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isApproved: true
      });
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: true } : u));
      
      const roleName = role === 'teacher' ? 'المعلم' : role === 'parent' ? 'ولي الأمر' : 'الطالب';
      toast.success(`تم قبول وتفعيل حساب ${roleName} ${name} بنجاح! 🎉`);
    } catch (err) {
      console.error("Error approving user:", err);
      toast.error("حدث خطأ أثناء تفعيل الحساب");
    }
  };

  const handleRejectUser = async (userId: string, name: string, role: string) => {
    const roleName = role === 'teacher' ? 'المعلم' : role === 'parent' ? 'ولي الأمر' : 'الطالب';
    if (!window.confirm(`هل أنت متأكد من رفض وحذف طلب ${roleName} ${name}؟`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`تم رفض وحذف طلب ${roleName} ${name} بنجاح`);
    } catch (err) {
      console.error("Error rejecting user:", err);
      toast.error("حدث خطأ أثناء حذف طلب الحساب");
    }
  };



  const handleDeletePayment = async () => {
    const id = paymentToDelete;
    if (!id) return;
    
    // Close modal first for snappy UI
    setDeletePaymentModalOpen(false);
    
    try {
      const collectionName = paymentSubTab === 'courses' ? 'course_payments' : 'review_payments';
      await deleteDoc(doc(db, collectionName, id));
      toast.success('تم حذف الطلب بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      // Clear the id after animation should have finished
      setTimeout(() => setPaymentToDelete(null), 500);
    }
  };

  const handleApprovePayment = async (payment: any) => {
    if (!payment || processingPaymentId) return;
    setProcessingPaymentId(payment.id);
    try {
      // 1. Update the course: enrolledStudentIds & enrolledStudents increment
      const courseRef = doc(db, 'courses', payment.courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        const courseData = courseSnap.data();
        const enrolledIds = courseData.enrolledStudentIds || [];
        if (!enrolledIds.includes(payment.userId)) {
          await updateDoc(courseRef, {
            enrolledStudents: (courseData.enrolledStudents || 0) + 1,
            enrolledStudentIds: arrayUnion(payment.userId)
          });
        }
      }

      // 2. Add course progress document for the student
      const progressRef = doc(db, "course_progress", `${payment.userId}_${payment.courseId}`);
      await setDoc(progressRef, {
        userId: payment.userId,
        courseId: payment.courseId,
        lastWatchedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Update the payment request status to approved
      const paymentRef = doc(db, 'course_payments', payment.id);
      await updateDoc(paymentRef, {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      // 4. Send a notification to the student
      await addDoc(collection(db, 'notifications'), {
        userId: payment.userId,
        title: "تم تفعيل اشتراكك بنجاح! 🎉",
        message: `تمت الموافقة على اشتراكك في كورس "${payment.courseTitle}" وتفعيله. يمكنك الآن البدء في مشاهدة الدروس.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      toast.success(`تم قبول طلب الطالب ${payment.senderName} وتفعيل الكورس بنجاح! ✨`);
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("حدث خطأ أثناء قبول الطلب. الرجاء المحاولة مجدداً.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleApproveReviewPayment = async (payment: any) => {
    if (!payment || processingPaymentId) return;
    setProcessingPaymentId(payment.id);
    try {
      // 1. Update the review enrollment status
      const collectionName = payment.reviewType === 'tahsili' ? 'tahsili_reviews' : 'qudurat_reviews';
      const reviewRef = doc(db, collectionName, payment.reviewId);
      
      await updateDoc(reviewRef, {
        enrolledStudentIds: arrayUnion(payment.userId),
        enrolledStudents: increment(1)
      });

      // 2. Update the payment request status to approved
      const paymentRef = doc(db, 'review_payments', payment.id);
      await updateDoc(paymentRef, {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      // 3. Send a notification to the student
      await addDoc(collection(db, 'notifications'), {
        userId: payment.userId,
        title: "تم تفعيل مراجعتك بنجاح! 🎉",
        message: `تمت الموافقة على اشتراكك في مراجعة "${payment.reviewTitle}" وتفعيلها. يمكنك الآن البدء في المذاكرة.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      toast.success(`تم قبول طلب الطالب ${payment.senderName} وتفعيل المراجعة بنجاح! ✨`);
    } catch (error) {
      console.error("Error approving review payment:", error);
      toast.error("حدث خطأ أثناء قبول الطلب. الرجاء المحاولة مجدداً.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleOpenRejectModal = (payment: any) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };

  const handleRejectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error("الرجاء إدخل سبب الرفض");
      return;
    }
    setProcessingPaymentId(selectedPayment.id);
    try {
      const isReview = !!selectedPayment.reviewId;
      const collectionName = isReview ? 'review_payments' : 'course_payments';
      const title = isReview ? selectedPayment.reviewTitle : selectedPayment.courseTitle;
      
      // 1. Update the payment request status to rejected with reason
      const paymentRef = doc(db, collectionName, selectedPayment.id);
      await updateDoc(paymentRef, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date().toISOString()
      });

      // 2. Send a notification to the student
      await addDoc(collection(db, 'notifications'), {
        userId: selectedPayment.userId,
        title: isReview ? "تم رفض طلب اشتراكك في المراجعة ❌" : "تم رفض طلب اشتراكك ❌",
        message: `تم رفض طلب اشتراكك في ${isReview ? 'مراجعة' : 'كورس'} "${title}". السبب: ${rejectionReason.trim()}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      toast.success(`تم رفض طلب الطالب ${selectedPayment.senderName} وإرسال التنبيه.`);
      setRejectionModalOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("حدث خطأ أثناء رفض الطلب. الرجاء المحاولة مجدداً.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const confirmDelete = (userId: string) => {
    if (userId === userData?.id) {
      toast.error('لا يمكنك حذف حسابك الخاص من لوحة التحكم!');
      return;
    }
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    
    const id = userToDelete;
    setDeleteModalOpen(false);

    try {
      const deletedUser = users.find(u => u.id === id);
      const userName = deletedUser ? deletedUser.name : '';
      await deleteDoc(doc(db, 'users', id));
      
      // Remove student from all courses they are enrolled in
      const qCourses = query(collection(db, 'courses'), where('enrolledStudentIds', 'array-contains', id));
      const coursesSnap = await getDocs(qCourses);
      const updatePromises = coursesSnap.docs.map(courseDoc => {
        const courseData = courseDoc.data();
        const newEnrolledIds = (courseData.enrolledStudentIds || []).filter(enrolledId => enrolledId !== id);
        return updateDoc(doc(db, 'courses', courseDoc.id), {
          enrolledStudentIds: newEnrolledIds,
          enrolledStudents: newEnrolledIds.length
        });
      });
      await Promise.all(updatePromises);
      
      setUsers(prev => prev.filter(u => u.id !== id));
      showSuccessToast('تم حذف حساب الطالب بنجاح من قاعدة البيانات', 'delete', userName);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error('فشل حذف المستخدم. تأكد من الصلاحيات.');
    } finally {
      setTimeout(() => setUserToDelete(null), 500);
    }
  };

  const handleArchiveToggle = async (user: any, archive: boolean) => {
    try {
      await updateDoc(doc(db, 'users', user.id), { isArchived: archive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isArchived: archive } : u));
      if (archive) {
        toast.success(`تم أرشفة الطالب ${user.name || ''} بنجاح`);
      } else {
        toast.success(`تم استعادة الطالب ${user.name || ''} بنجاح`);
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
      toast.error('فشل تغيير حالة الأرشفة');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), editFormData);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editFormData } : u));
      showSuccessToast('تم تعديل بيانات الطالب وحفظها بنجاح', 'edit', editFormData.name || selectedUser.name);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error('فشل تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Course Active Status
  const handleToggleCourseActive = async (courseId: string, currentStatus: boolean) => {
    setUpdatingCourseId(courseId);
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        isActive: !currentStatus
      });
      toast.success(currentStatus ? 'تم إلغاء تفعيل الكورس بنجاح' : 'تم تفعيل الكورس بنجاح 🎉');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء تعديل حالة الكورس');
    } finally {
      setUpdatingCourseId(null);
    }
  };

  // Edit Course Submit
  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit) return;
    setUpdatingCourseId(selectedCourseForEdit.id);
    try {
      const { id, title, description, grade, subject, price } = selectedCourseForEdit;
      await updateDoc(doc(db, 'courses', id), {
        title: title.trim(),
        description: description.trim(),
        grade,
        subject,
        price: Number(price)
      });
      toast.success('تم تحديث بيانات الكورس بنجاح ✨');
      setSelectedCourseForEdit(null);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحديث الكورس');
    } finally {
      setUpdatingCourseId(null);
    }
  };

  // Delete Course
  const executeDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      toast.success('تم حذف الكورس نهائياً بنجاح 🗑️');
      setCourseToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف الكورس');
    }
  };

  // Remove student from course
  const handleRemoveStudentFromCourse = async (studentId: string, course: any) => {
    try {
      const courseRef = doc(db, 'courses', course.id);
      const enrolledStudentIds = (course.enrolledStudentIds || []).filter((id: string) => id !== studentId);
      const enrolledStudents = Math.max(0, (course.enrolledStudents || 1) - 1);
      
      await updateDoc(courseRef, {
        enrolledStudentIds,
        enrolledStudents
      });

      // Remove course progress for the student
      try {
        await deleteDoc(doc(db, 'course_progress', `${studentId}_${course.id}`));
      } catch (err) {
        console.error("No course progress found or failed to delete:", err);
      }

      // Send a notification to the student
      await addDoc(collection(db, 'notifications'), {
        userId: studentId,
        title: "تم إلغاء تفعيل اشتراك الكورس ⚠️",
        message: `تم إلغاء تفعيل اشتراكك في كورس "${course.title}" بواسطة الإدارة.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      toast.success('تم إلغاء اشتراك الطالب وحذفه من الكورس بنجاح');
      
      // Update selectedCourseForStudents state so the modal updates in real-time
      setSelectedCourseForStudents((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          enrolledStudentIds,
          enrolledStudents
        };
      });
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء إلغاء اشتراك الطالب');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Extract unique subjects from teachers for dynamic filter
  const teacherSubjects = Array.from(new Set(
    users
      .filter(u => u.role === 'teacher' && u.subject)
      .map(u => u.subject.trim())
  )) as string[];

  const filteredUsers = users
    .filter(u => {
      if (activeTab === 'students') {
        const isStudent = u.role === 'student' || !u.role;
        if (!isStudent) return false;
        if (u.isApproved === false) return false;
        if (studentStatusFilter === 'active') {
          return !u.isArchived;
        } else {
          return u.isArchived === true;
        }
      }
      if (activeTab === 'approvals') {
        return u.isApproved === false;
      }
      if (activeTab === 'teachers') return u.role === 'teacher' && u.isApproved !== false;
      if (activeTab === 'parents') return u.role === 'parent' && u.isApproved !== false;
      return false;
    })
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = (u.name || '').toLowerCase().includes(query);
      const emailMatch = (u.email || '').toLowerCase().includes(query);
      const phoneMatch = (u.phone || '').toLowerCase().includes(query);
      const gradeMatch = (activeTab === 'students' || activeTab === 'approvals') && (u.grade || '').toLowerCase().includes(query);
      const subjectMatch = (activeTab === 'teachers' || activeTab === 'approvals') && (u.subject || '').toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch || gradeMatch || subjectMatch;
    })
    .filter(u => {
      if (gradeFilter === 'all') return true;
      if (activeTab === 'students' || activeTab === 'approvals') {
        return u.grade === gradeFilter;
      }
      if (activeTab === 'teachers') {
        return Array.isArray(u.teachingGrades) && u.teachingGrades.includes(gradeFilter);
      }
      return true;
    })
    .filter(u => {
      if (activeTab !== 'teachers' || subjectFilter === 'all') return true;
      return (u.subject || '').trim() === subjectFilter;
    })
    .filter(u => {
      if (activeTab !== 'students') return true;
      if (studentTrackFilter === 'all') return true;
      if (studentTrackFilter === 'regular') {
        return !u.isSpecialRegistration;
      }
      if (studentTrackFilter === 'qudurat') {
        return u.isSpecialRegistration && (u.registrationType === 'qudurat' || u.registrationType === 'both');
      }
      if (studentTrackFilter === 'tahsili') {
        return u.isSpecialRegistration && (u.registrationType === 'tahsili' || u.registrationType === 'both');
      }
      if (studentTrackFilter === 'both') {
        return u.isSpecialRegistration && u.registrationType === 'both';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '', 'ar');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '', 'ar');
      }
      if (sortBy === 'date_desc') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === 'date_asc') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      }
      return 0;
    });

  const studentsCount = users.filter(u => (u.role === 'student' || !u.role) && u.isApproved !== false).length;
  const teachersCount = users.filter(u => u.role === 'teacher' && u.isApproved !== false).length;
  const parentsCount = users.filter(u => u.role === 'parent' && u.isApproved !== false).length;
  const pendingApprovalsCount = users.filter(u => u.isApproved === false).length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length + reviewPayments.filter(p => p.status === 'pending').length;

  if (activeTab === 'wallet') {
    return (
      <div className="space-y-6 print:hidden animate-in fade-in duration-300" dir="rtl">
        {/* Upper Panel Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
              شحن رصيد الطلاب وتوليد الكروت
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">البحث عن الطالب المطلوب، شحن محفظته مباشرة، وتوليد كروت الشحن التعليمية لـ Teachland</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-2 rounded-2xl border border-emerald-500/20">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black text-emerald-500">نظام شحن الأرصدة والكروت نشط</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
          </div>
        ) : (
          <WalletRecharge users={users} setUsers={setUsers} payments={payments} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      {/* Upper Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
            لوحة تحكم الإدارة
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">إدارة جميع مستخدمي المنصة والصلاحيات وتصدير التقارير الرسمية</p>
        </div>
        <div className="flex items-center gap-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-4 py-2 rounded-2xl border border-[#00B4D8]/20 dark:border-[#D4AF37]/20">
          <Activity className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
          <span className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37]">النظام نشط ومحمي</span>
        </div>
      </div>

      {/* Summary Statistics Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#00B4D8] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 block">إجمالي الطلاب</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{studentsCount} طالب</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 block">إجمالي المعلمين</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{teachersCount} معلم</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 block">أولياء الأمور</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{parentsCount} ولي أمر</span>
          </div>
        </div>
      </div>

      {/* Visual Statistics Dashboard */}
      <AdminVisualStats users={users} progressRecords={progressRecords} />

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex flex-wrap gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-3 mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'students'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            الطلاب ({users.filter(u => (u.role === 'student' || !u.role) && !u.isArchived && u.isApproved !== false).length})
            {activeTab === 'students' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'teachers'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            المعلمين ({teachersCount})
            {activeTab === 'teachers' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'parents'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            أولياء الأمور ({parentsCount})
            {activeTab === 'parents' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'approvals'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            بانتظار القبول ({pendingApprovalsCount})
            {activeTab === 'approvals' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'payments'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            طلبات الاشتراك ({pendingPaymentsCount})
            {activeTab === 'payments' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscription_requests')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'subscription_requests'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            مراجعة الاشتراكات ({users.filter(u => u.isSpecialRegistration && u.status === 'pending').length})
            {activeTab === 'subscription_requests' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 text-sm font-black transition-colors relative ${
              activeTab === 'settings'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            إعدادات المنصة
            {activeTab === 'settings' && (
              <motion.div 
                layoutId="adminTab" 
                className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full shadow-[0_1px_4px_rgba(0,180,216,0.3)] dark:shadow-[0_1px_4px_rgba(212,175,55,0.3)]" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Student Active / Archived Sub-tabs */}
        {activeTab === 'students' && (
          <div className="flex gap-2 mb-5 bg-gray-50/50 dark:bg-[#12121A]/30 p-1 rounded-xl border border-gray-150 dark:border-[#2D2D3D] w-full max-w-xs animate-in fade-in duration-200">
            <button
              onClick={() => setStudentStatusFilter('active')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                studentStatusFilter === 'active'
                  ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white dark:text-[#0D0D12] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              النشطين ({users.filter(u => (u.role === 'student' || !u.role) && !u.isArchived).length})
            </button>
            <button
              onClick={() => setStudentStatusFilter('archived')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                studentStatusFilter === 'archived'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              المؤرشفين ({users.filter(u => (u.role === 'student' || !u.role) && u.isArchived).length})
            </button>
          </div>
        )}

        {/* Search and Filters Section */}
        {activeTab !== 'settings' && activeTab !== 'courses' && (
          <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] mb-6 flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Input */}
              <div className="relative md:col-span-5">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'students' 
                      ? "بحث عن طالب بالاسم، الهاتف، البريد أو الصف..." 
                      : activeTab === 'teachers' 
                        ? "بحث عن معلم بالاسم، الهاتف، البريد أو المادة..." 
                        : activeTab === 'approvals'
                          ? "بحث عن طالب بانتظار القبول بالاسم أو الهاتف..."
                          : "بحث عن ولي أمر بالاسم، الهاتف أو البريد..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Grade Filter (Visible for students, teachers, and approvals) */}
              {(activeTab === 'students' || activeTab === 'teachers' || activeTab === 'approvals') ? (
                <div className="relative md:col-span-3">
                  <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">كل الصفوف الدراسية</option>
                  <option value="الأول الإعدادي">الأول الإعدادي</option>
                  <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                  <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                  <option value="الأول الثانوي">الأول الثانوي</option>
                  <option value="الثاني الثانوي">الثاني الثانوي</option>
                  <option value="الثالث الثانوي">الثالث الثانوي</option>
                </select>
              </div>
            ) : (
              <div className="hidden md:block md:col-span-3"></div>
            )}

            {/* Subject Filter (Visible only for teachers) or Track Filter (Visible only for students) */}
            {activeTab === 'teachers' ? (
              <div className="relative md:col-span-2">
                <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">كل التخصصات</option>
                  {teacherSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            ) : activeTab === 'students' ? (
              <div className="relative md:col-span-2">
                <SlidersHorizontal className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <select
                  value={studentTrackFilter}
                  onChange={(e) => setStudentTrackFilter(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">كل المسارات</option>
                  <option value="qudurat">مسار القدرات 🎯</option>
                  <option value="tahsili">مسار التحصيلي 🚀</option>
                  <option value="both">المسارين معاً 💫</option>
                  <option value="regular">المسار العام 🏫</option>
                </select>
              </div>
            ) : (
              <div className="hidden md:block md:col-span-2"></div>
            )}

            {/* Sorting */}
            <div className="relative md:col-span-2">
              <ArrowUpDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
              >
                <option value="name_asc">الاسم (أ - ي)</option>
                <option value="name_desc">الاسم (ي - أ)</option>
                <option value="date_desc">التسجيل (الأحدث)</option>
                <option value="date_asc">التسجيل (الأقدم)</option>
              </select>
            </div>
          </div>

          {/* Active filter badges / Reset indicator */}
          {(searchQuery || gradeFilter !== 'all' || subjectFilter !== 'all' || sortBy !== 'name_asc') && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-3 text-xs font-bold text-gray-500 dark:text-gray-400">
              <div className="flex flex-wrap items-center gap-2">
                <span>الفلاتر النشطة:</span>
                {searchQuery && (
                  <span className="bg-[#00B4D8]/10 text-[#00B4D8] dark:text-[#00B4D8] dark:bg-[#00B4D8]/5 px-2.5 py-1 rounded-lg border border-[#00B4D8]/20 flex items-center gap-1">
                    البحث: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
                {gradeFilter !== 'all' && (
                  <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 px-2.5 py-1 rounded-lg border border-purple-200/50 flex items-center gap-1">
                    الصف: {gradeFilter}
                    <button onClick={() => setGradeFilter('all')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
                {subjectFilter !== 'all' && (
                  <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200/50 flex items-center gap-1">
                    المادة: {subjectFilter}
                    <button onClick={() => setSubjectFilter('all')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
                {sortBy !== 'name_asc' && (
                  <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                    الترتيب: {
                      sortBy === 'name_desc' ? 'الاسم تنازلياً' :
                      sortBy === 'date_desc' ? 'الأحدث تسجيلاً' : 'الأقدم تسجيلاً'
                    }
                    <button onClick={() => setSortBy('name_asc')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
              </div>
              
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('all');
                  setSubjectFilter('all');
                  setSortBy('name_asc');
                }}
                className="text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors py-1 px-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>
        )}

        {loading || loadingSettings ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
          </div>
        ) : activeTab === 'settings' ? (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl mx-auto py-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Identity Settings Card */}
              <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-6 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] space-y-4">
                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> هوية المنصة الأساسية
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">اسم المنصة التعليمية</label>
                    <input
                      type="text"
                      name="platformName"
                      defaultValue={platformSettings.platformName}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-white font-bold text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">حرف الشعار (اللوجو)</label>
                    <input
                      type="text"
                      name="logoChar"
                      maxLength={2}
                      defaultValue={platformSettings.logoChar}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-white font-bold text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">شعار المنصة (صورة)</label>
                    <div className="flex items-center gap-3">
                      {(logoFile || platformSettings.logoUrl) && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#2D2D3D]">
                          <img 
                            src={logoFile ? URL.createObjectURL(logoFile) : platformSettings.logoUrl} 
                            alt="Logo preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-gray-300 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#00B4D8]/10 file:text-[#00B4D8] hover:file:bg-[#00B4D8]/20 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility Settings Card */}
              <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-6 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] space-y-4">
                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-500" /> عرض الأقسام في الصفحة الرئيسية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 block">قسم الصفوف الدراسية</label>
                    <select
                      name="showGradesSection"
                      defaultValue={platformSettings.showGradesSection ? 'true' : 'false'}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs cursor-pointer"
                    >
                      <option value="true">تفعيل وعرض</option>
                      <option value="false">إخفاء</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 block">قسم المواد الدراسية</label>
                    <select
                      name="showSubjectsSection"
                      defaultValue={platformSettings.showSubjectsSection ? 'true' : 'false'}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs cursor-pointer"
                    >
                      <option value="true">تفعيل وعرض</option>
                      <option value="false">إخفاء</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 block">قسم مميزات المنصة</label>
                    <select
                      name="showFeaturesSection"
                      defaultValue={platformSettings.showFeaturesSection ? 'true' : 'false'}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs cursor-pointer"
                    >
                      <option value="true">تفعيل وعرض</option>
                      <option value="false">إخفاء</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 block">قسم الأسئلة الشائعة</label>
                    <select
                      name="showFaqSection"
                      defaultValue={platformSettings.showFaqSection ? 'true' : 'false'}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs cursor-pointer"
                    >
                      <option value="true">تفعيل وعرض</option>
                      <option value="false">إخفاء</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Introductory Videos Card */}
              <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-6 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] md:col-span-2 space-y-4">
                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> الفيديوهات التعريفية للمسارات (قدرات وتحصيلي)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  أضف روابط فيديوهات تعريفية جذابة ومميزة تظهر للطلاب في بروتفوليو الصفحة الرئيسية لتشجيعهم واجتذابهم للاشتراك. يدعم يوتيوب، تيك توك، باني ستريم، والروابط المباشرة.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Qudurat Video Settings */}
                  <div className="p-4 bg-white dark:bg-[#12121A] rounded-xl border border-gray-100 dark:border-[#222230] space-y-4 shadow-sm">
                    <h4 className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#222230] pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      الفيديو التعريفي لمسار القدرات 🎯
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">عنوان الفيديو الجاذب</label>
                        <input
                          type="text"
                          name="quduratVideoTitle"
                          defaultValue={platformSettings.quduratVideoTitle || 'الفيديو التعريفي لمسار القدرات 🎯'}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12]/40 border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white font-bold text-xs"
                          placeholder="مثال: فجر طاقتك الكامنة واضمن الـ +95٪ مع شرحنا التفاعلي!"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">مزود الفيديو</label>
                        <select
                          name="quduratVideoProvider"
                          defaultValue={platformSettings.quduratVideoProvider || 'youtube'}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12]/40 border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white font-bold text-xs cursor-pointer"
                        >
                          <option value="youtube">يوتيوب (YouTube)</option>
                          <option value="tiktok">تيك توك (TikTok)</option>
                          <option value="bunny">باني ستريم (Bunny Stream ID)</option>
                          <option value="direct">رابط فيديو مباشر (Direct Link)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">رابط الفيديو أو معرف الفيديو (Stream ID)</label>
                        <input
                          type="text"
                          name="quduratVideoUrl"
                          defaultValue={platformSettings.quduratVideoUrl || ''}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12]/40 border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white font-mono text-xs text-left"
                          dir="ltr"
                          placeholder="https://www.youtube.com/watch?v=... or Video ID"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tahsili Video Settings */}
                  <div className="p-4 bg-white dark:bg-[#12121A] rounded-xl border border-gray-100 dark:border-[#222230] space-y-4 shadow-sm">
                    <h4 className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#222230] pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      الفيديو التعريفي لمسار التحصيلي 🚀
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">عنوان الفيديو الجاذب</label>
                        <input
                          type="text"
                          name="tahsiliVideoTitle"
                          defaultValue={platformSettings.tahsiliVideoTitle || 'الفيديو التعريفي لمسار التحصيلي 🚀'}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12]/40 border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-purple-500 dark:text-white font-bold text-xs"
                          placeholder="مثال: دليلك الشامل لتقفيل درجات التحصيلي في أقصر وقت وبأقل مجهود!"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">مزود الفيديو</label>
                        <select
                          name="tahsiliVideoProvider"
                          defaultValue={platformSettings.tahsiliVideoProvider || 'youtube'}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12]/40 border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-purple-500 dark:text-white font-bold text-xs cursor-pointer"
                        >
                          <option value="youtube">يوتيوب (YouTube)</option>
                          <option value="tiktok">تيك توك (TikTok)</option>
                          <option value="bunny">باني ستريم (Bunny Stream ID)</option>
                          <option value="direct">رابط فيديو مباشر (Direct Link)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">رابط الفيديو أو معرف الفيديو (Stream ID)</label>
                        <input
                          type="text"
                          name="tahsiliVideoUrl"
                          defaultValue={platformSettings.tahsiliVideoUrl || ''}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12]/40 border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-purple-500 dark:text-white font-mono text-xs text-left"
                          dir="ltr"
                          placeholder="https://www.youtube.com/watch?v=... or Video ID"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Customization Card */}
              <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-6 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] md:col-span-2 space-y-4">
                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> تخصيص واجهة الترحيب الرئيسية (Hero Section)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">عنوان الترحيب الرئيسي</label>
                    <input
                      type="text"
                      name="heroTitle"
                      defaultValue={platformSettings.heroTitle}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-white font-bold text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">العنوان الفرعي ووصف المنصة</label>
                    <textarea
                      name="heroSubtitle"
                      rows={3}
                      defaultValue={platformSettings.heroSubtitle}
                      className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-white font-bold text-sm leading-relaxed"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Custom Titles and Headers Card */}
              <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-6 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] md:col-span-2 space-y-4">
                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#00B4D8]" /> تخصيص مسميات ووصف الأقسام بالواجهة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[#00B4D8]">إعدادات قسم الصفوف الدراسية</h4>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">عنوان القسم</label>
                      <input
                        type="text"
                        name="gradesTitle"
                        defaultValue={platformSettings.gradesTitle}
                        className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">الوصف الفرعي للقسم</label>
                      <textarea
                        name="gradesSubtitle"
                        rows={2}
                        defaultValue={platformSettings.gradesSubtitle}
                        className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-purple-500">إعدادات قسم المواد الدراسية</h4>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">عنوان القسم</label>
                      <input
                        type="text"
                        name="subjectsTitle"
                        defaultValue={platformSettings.subjectsTitle}
                        className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">الوصف الفرعي للقسم</label>
                      <textarea
                        name="subjectsSubtitle"
                        rows={2}
                        defaultValue={platformSettings.subjectsSubtitle}
                        className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-4">
                    <h4 className="text-xs font-black text-amber-500">إعدادات قسم الأسئلة الشائعة (FAQ)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">عنوان القسم</label>
                        <input
                          type="text"
                          name="faqTitle"
                          defaultValue={platformSettings.faqTitle}
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">الوصف الفرعي للقسم</label>
                        <input
                          type="text"
                          name="faqSubtitle"
                          defaultValue={platformSettings.faqSubtitle}
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 md:col-span-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-4">
                    <h4 className="text-xs font-black text-emerald-500">معلومات التواصل (فوتر المنصة)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">العنوان (يظهر في الفوتر)</label>
                        <input
                          type="text"
                          name="contactAddress"
                          defaultValue={platformSettings.contactAddress || 'المملكة العربية السعودية، الرياض.'}
                          placeholder="مثال: المملكة العربية السعودية، الرياض."
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">رقم الهاتف للتواصل</label>
                        <input
                          type="text"
                          name="contactPhone"
                          defaultValue={platformSettings.contactPhone}
                          placeholder="مثال: +20 100 123 4567"
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">البريد الإلكتروني للدعم</label>
                        <input
                          type="email"
                          name="contactEmail"
                          defaultValue={platformSettings.contactEmail}
                          placeholder="support@example.com"
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-rose-500">إعدادات الدفع المالي</h4>
                      <div className="text-[10.5px] text-gray-500 font-bold bg-gray-50 dark:bg-[#1A1A24] px-3 py-1.5 rounded-lg border border-gray-100 dark:border-[#2D2D3D]">
                        سيتم عرض وسائل الدفع المفعلة فقط للطلاب
                      </div>
                    </div>

                    {/* Vodafone Cash */}
                    <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">💰</span>
                          <h5 className="text-sm font-bold text-gray-900 dark:text-white">فودافون كاش</h5>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            name="isVodafoneCashEnabled"
                            value="true"
                            defaultChecked={platformSettings.isVodafoneCashEnabled !== false}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                          <span className="mr-3 text-xs font-bold text-gray-600 dark:text-gray-400">تفعيل وسيلة الدفع</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">رقم فودافون كاش المعتمد لتحويلات الطلاب</label>
                        <input
                          type="text"
                          name="vodafoneCashNumber"
                          defaultValue={platformSettings.vodafoneCashNumber}
                          placeholder="مثال: 01012345678"
                          className="w-full max-w-sm bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-rose-500 dark:text-white font-bold text-xs font-mono text-right"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    {/* Instapay */}
                    <div className="bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">⚡</span>
                          <h5 className="text-sm font-bold text-gray-900 dark:text-white">إنستاباي (Instapay)</h5>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            name="isInstapayEnabled"
                            value="true"
                            defaultChecked={platformSettings.isInstapayEnabled !== false}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                          <span className="mr-3 text-xs font-bold text-gray-600 dark:text-gray-400">تفعيل وسيلة الدفع</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">حساب إنستاباي</label>
                        <input
                          type="text"
                          name="instapayHandle"
                          defaultValue={platformSettings.instapayHandle}
                          placeholder="مثال: username@instapay"
                          className="w-full max-w-sm bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-purple-500 dark:text-white font-bold text-xs font-mono text-right"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Bank Account */}
                    <div className="bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏦</span>
                          <h5 className="text-sm font-bold text-gray-900 dark:text-white">تحويل بنكي</h5>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            name="isBankAccountEnabled"
                            value="true"
                            defaultChecked={platformSettings.isBankAccountEnabled !== false}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                          <span className="mr-3 text-xs font-bold text-gray-600 dark:text-gray-400">تفعيل وسيلة الدفع</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">تفاصيل الحساب البنكي</label>
                        <textarea
                          name="bankAccountDetails"
                          defaultValue={platformSettings.bankAccountDetails}
                          placeholder="مثال: البنك الأهلي المصري, رقم الحساب: 123456789, الاسم: أحمد محمد"
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-blue-500 dark:text-white font-bold text-xs resize-none h-24"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-4">
                    <h4 className="text-xs font-black text-indigo-500">روابط التواصل الاجتماعي</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">رابط فيسبوك</label>
                        <input
                          type="text"
                          name="facebook"
                          defaultValue={platformSettings.socialLinks?.facebook}
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">رابط تويتر (X)</label>
                        <input
                          type="text"
                          name="twitter"
                          defaultValue={platformSettings.socialLinks?.twitter}
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">رابط يوتيوب</label>
                        <input
                          type="text"
                          name="youtube"
                          defaultValue={platformSettings.socialLinks?.youtube}
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-1">رابط إنستجرام</label>
                        <input
                          type="text"
                          name="instagram"
                          defaultValue={platformSettings.socialLinks?.instagram}
                          className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold text-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black text-cyan-500">إدارة المواد الدراسية (الرئيسية)</h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingSubject(!isAddingSubject)}
                        className="text-[10px] font-black bg-cyan-500 text-white px-3 py-1 rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-1"
                      >
                        {isAddingSubject ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {isAddingSubject ? 'إلغاء' : 'إضافة مادة جديدة'}
                      </button>
                    </div>

                    {isAddingSubject && (
                      <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-xl border border-dashed border-cyan-500/30 space-y-3 mb-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">اسم المادة</label>
                            <input
                              type="text"
                              value={newSubjectTitle}
                              onChange={(e) => setNewSubjectTitle(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-cyan-500 dark:text-white font-bold text-xs"
                              placeholder="مثال: الفلسفة"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">أيقونة المادة</label>
                            <select
                              value={newSubjectIcon}
                              onChange={(e) => setNewSubjectIcon(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-cyan-500 dark:text-white font-bold text-xs"
                            >
                              {subjectIconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">لون المادة</label>
                            <select
                              value={newSubjectColor}
                              onChange={(e) => setNewSubjectColor(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-cyan-500 dark:text-white font-bold text-xs"
                            >
                              {subjectColorOptions.map(color => (
                                <option key={color.value} value={color.value}>{color.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newSubjectTitle) return;
                              const newSubject = {
                                id: Date.now().toString(),
                                title: newSubjectTitle,
                                iconName: newSubjectIcon,
                                color: newSubjectColor
                              };
                              setTempSubjects([...tempSubjects, newSubject]);
                              setNewSubjectTitle('');
                              setIsAddingSubject(false);
                            }}
                            className="bg-cyan-500 text-white font-black text-[10px] py-2 px-6 rounded-lg hover:bg-cyan-600 transition-all"
                          >
                            تأكيد إضافة المادة
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {tempSubjects.map((subject, idx) => (
                        <div key={subject.id || idx} className="bg-white dark:bg-[#12121A] border border-gray-150 dark:border-[#2D2D3D] p-3 rounded-xl flex items-center justify-between group">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${subject.color}`}>
                              {/* Re-using subject.icon logic if possible or just show icon name */}
                              <Book className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 truncate">{subject.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTempSubjects(tempSubjects.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-[#2D2D3D]">
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white dark:text-[#0D0D12] font-black py-3.5 px-10 rounded-xl hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ والتطبيق...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> حفظ كافة الإعدادات وتطبيقها فوراً
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={`overflow-auto max-h-[600px] relative rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/50 scrollbar-thin ${(activeTab === 'payments' || activeTab === 'subscription_requests') ? 'p-6 bg-gray-50/30 dark:bg-[#0D0D12]/30' : ''}`}
            >
              {activeTab === 'subscription_requests' ? (
                <SubscriptionRequests adminUserData={userData} />
              ) : activeTab === 'special_approvals' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-500" /> طلبات القدرات والتحصيلي المعلقة
                      </h3>
                      <p className="text-xs font-bold text-gray-400 mt-1">مراجعة بيانات الطلاب المتقدمين للمسارات الخاصة وقبول أو رفض انضمامهم للمنصة</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">إجمالي الطلبات:</span>
                      <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-200/30">
                        {users.filter(u => u.isSpecialRegistration && u.status === 'pending').length}
                      </span>
                    </div>
                  </div>

                  {/* Type Filter Buttons for Pending Special Approvals */}
                  <div className="flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#1A1A24] p-4 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
                    <span className="text-xs font-black text-gray-400 ml-2">تصفية حسب المسار المعلق:</span>
                    {(['all', 'qudurat', 'tahsili', 'both'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSpecialApprovalTypeFilter(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-0 ${
                          specialApprovalTypeFilter === type
                            ? 'bg-[#00B4D8] text-white dark:bg-[#D4AF37] dark:text-gray-950 shadow-md'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-[#12121A] dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        {type === 'all' && 'الكل'}
                        {type === 'qudurat' && 'القدرات 🎯'}
                        {type === 'tahsili' && 'التحصيلي 🚀'}
                        {type === 'both' && 'المسارين معاً 💫'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.filter(u => {
                      const isPendingSpecial = u.isSpecialRegistration && u.status === 'pending';
                      if (!isPendingSpecial) return false;
                      if (specialApprovalTypeFilter === 'all') return true;
                      if (specialApprovalTypeFilter === 'qudurat') {
                        return u.registrationType === 'qudurat' || u.registrationType === 'both';
                      }
                      if (specialApprovalTypeFilter === 'tahsili') {
                        return u.registrationType === 'tahsili' || u.registrationType === 'both';
                      }
                      if (specialApprovalTypeFilter === 'both') {
                        return u.registrationType === 'both';
                      }
                      return true;
                    }).length > 0 ? (
                      users.filter(u => {
                        const isPendingSpecial = u.isSpecialRegistration && u.status === 'pending';
                        if (!isPendingSpecial) return false;
                        if (specialApprovalTypeFilter === 'all') return true;
                        if (specialApprovalTypeFilter === 'qudurat') {
                          return u.registrationType === 'qudurat' || u.registrationType === 'both';
                        }
                        if (specialApprovalTypeFilter === 'tahsili') {
                          return u.registrationType === 'tahsili' || u.registrationType === 'both';
                        }
                        if (specialApprovalTypeFilter === 'both') {
                          return u.registrationType === 'both';
                        }
                        return true;
                      }).map((user) => (
                        <motion.div
                          key={user.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-[#1A1A24] rounded-[2.5rem] p-6 border border-gray-100 dark:border-[#2D2D3D] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group"
                        >
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#0D0D12] flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37] border border-gray-100 dark:border-[#2D2D3D] group-hover:scale-110 transition-transform shadow-inner">
                                <UserIcon className="w-7 h-7" />
                              </div>
                              <div>
                                <h4 className="font-black text-base text-gray-900 dark:text-white">{user.name}</h4>
                                <p className="text-[11px] font-bold text-gray-400 mt-0.5" dir="ltr">{user.phone}</p>
                              </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                              user.registrationType === 'qudurat' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30' 
                                : 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-900/30'
                            }`}>
                              {user.registrationType === 'qudurat' ? 'القدرات' : 'التحصيلي'}
                            </div>
                          </div>

                          <div className="space-y-3 mb-6 bg-gray-50/50 dark:bg-[#0D0D12]/30 p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>تاريخ الطلب:</span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{formatRegistrationDate(user.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Shield className="w-3.5 h-3.5" />
                                <span>المحافظة:</span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{user.governorate || 'غير محدد'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleApproveSpecialRegistration(user)}
                              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group/btn cursor-pointer border-0"
                            >
                              <Check className="w-4 h-4 group-hover/btn:scale-125 transition-transform" /> قبول وتفعيل
                            </button>
                            <button
                              onClick={() => handleRejectSpecialRegistration(user)}
                              className="py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-2xl text-xs font-black transition-all border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 group/btn cursor-pointer"
                            >
                              <X className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" /> رفض الطلب
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-24 bg-white dark:bg-[#1A1A24] rounded-[3rem] border border-dashed border-gray-200 dark:border-[#2D2D3D] text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-[#0D0D12] rounded-3xl flex items-center justify-center mx-auto mb-5 text-gray-300 dark:text-gray-800">
                          <Sparkles className="w-10 h-10" />
                        </div>
                        <h4 className="text-base font-black text-gray-900 dark:text-white">لا توجد طلبات معلقة حالياً</h4>
                        <p className="text-xs font-bold text-gray-400 mt-2 max-w-xs mx-auto">عندما يقوم الطلاب بالتسجيل في مسار القدرات أو التحصيلي، ستظهر طلباتهم هنا للمراجعة</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="space-y-6">
                  {/* Payments Sub-Tabs Toggle */}
                  <div className="flex bg-gray-100 dark:bg-[#0D0D12] p-1.5 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] mb-4">
                    <button
                      onClick={() => setPaymentSubTab('courses')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                        paymentSubTab === 'courses' 
                          ? 'bg-white dark:bg-[#1A1A24] text-rose-600 dark:text-rose-400 shadow-md' 
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      اشتراكات الكورسات
                    </button>
                    <button
                      onClick={() => setPaymentSubTab('reviews')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                        paymentSubTab === 'reviews' 
                          ? 'bg-white dark:bg-[#1A1A24] text-purple-600 dark:text-purple-400 shadow-md' 
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      اشتراكات القدرات والتحصيلي
                    </button>
                  </div>

                  {/* Payments Filter Header */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:min-w-[300px]">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={paymentSearch}
                          onChange={(e) => setPaymentSearch(e.target.value)}
                          placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 text-sm transition-all text-gray-900 dark:text-white font-bold"
                        />
                      </div>
                    </div>
                    
                    <div className="flex bg-gray-100 dark:bg-[#0D0D12] p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                      {[
                        { id: 'all', label: 'الكل' },
                        { id: 'pending', label: 'قيد المراجعة' },
                        { id: 'approved', label: 'مقبول' },
                        { id: 'rejected', label: 'مرفوض' }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => setPaymentStatusFilter(status.id as any)}
                          className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                            paymentStatusFilter === status.id 
                              ? 'bg-white dark:bg-[#1A1A24] text-rose-600 dark:text-rose-400 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payments Table */}
                  {(paymentSubTab === 'courses' ? payments : reviewPayments).filter(p => {
                    const matchSearch = (p.userName || '').includes(paymentSearch) || (p.senderPhone || '').includes(paymentSearch) || (p.senderName || '').includes(paymentSearch);
                    const matchStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
                    return matchSearch && matchStatus;
                  }).length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
                      <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900/30 flex items-center justify-center text-rose-400 mb-4">
                        <Archive className="w-8 h-8 stroke-[1.5]" />
                      </div>
                      <h3 className="text-gray-900 dark:text-white font-black text-lg mb-2">لا توجد طلبات اشتراك</h3>
                      <p className="text-sm text-gray-400 dark:text-gray-500">لم يتم العثور على أي طلبات تطابق معايير البحث الحالية.</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-[#15151F]">
                              <th className="py-4 px-6 text-xs font-black text-gray-400 min-w-[220px]">اسم المحول / بيانات الطالب</th>
                              <th className="py-4 px-6 text-xs font-black text-gray-400 min-w-[130px]">رقم الهاتف</th>
                              <th className="py-4 px-6 text-xs font-black text-gray-400 min-w-[300px]">الاشتراك المطلوب</th>
                              <th className="py-4 px-6 text-xs font-black text-gray-400 min-w-[100px]">القيمة</th>
                              <th className="py-4 px-6 text-xs font-black text-gray-400 text-center min-w-[140px]">إثبات الدفع</th>
                              <th className="py-4 px-6 text-xs font-black text-gray-400 min-w-[160px]">الحالة</th>
                              <th className="py-4 px-6 text-xs font-black text-gray-400 text-center min-w-[180px]">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(paymentSubTab === 'courses' ? payments : reviewPayments).filter(p => {
                              const matchSearch = (p.userName || '').includes(paymentSearch) || (p.senderPhone || '').includes(paymentSearch) || (p.senderName || '').includes(paymentSearch);
                              const matchStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
                              return matchSearch && matchStatus;
                            }).map((payment) => {
                              const img = paymentSubTab === 'courses' ? payment.screenshotUrl : payment.screenshot;
                              return (
                                <tr key={payment.id} className="border-b border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50/30 dark:hover:bg-[#1e1e2d]/40 transition-colors animate-in fade-in duration-200">
                                  {/* Student / Sender Data */}
                                  <td className="py-4 px-6 min-w-[220px]">
                                    <div className="flex flex-col">
                                      <span className="font-black text-sm text-gray-900 dark:text-white whitespace-nowrap">{payment.senderName}</span>
                                      <span className="text-xs font-bold text-gray-400 mt-0.5 break-all">
                                        {paymentSubTab === 'courses' ? `حساب الطالب: ${payment.userName}` : `إيميل الطالب: ${payment.userEmail}`}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Phone */}
                                  <td className="py-4 px-6 text-xs font-black text-gray-700 dark:text-gray-300 min-w-[130px] whitespace-nowrap" dir="ltr">
                                    {payment.senderPhone}
                                  </td>

                                  {/* Target Course / Review */}
                                  <td className="py-4 px-6 min-w-[300px]">
                                    <div className="flex flex-col max-w-[400px]">
                                      <span className={`font-black text-xs leading-relaxed ${paymentSubTab === 'courses' ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                        {paymentSubTab === 'courses' ? payment.courseTitle : payment.reviewTitle}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400 mt-1 whitespace-nowrap">
                                        {paymentSubTab === 'courses' ? 'كورس تفاعلي' : (payment.reviewType === 'tahsili' ? 'مراجعة تحصيلي 🎯' : 'مراجعة قدرات 🚀')}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Price */}
                                  <td className="py-4 px-6 font-black text-xs text-gray-900 dark:text-white min-w-[100px] whitespace-nowrap">
                                    {paymentSubTab === 'courses' ? payment.coursePrice : payment.amount} ج.م
                                  </td>

                                  {/* Screenshot Link / Proof */}
                                  <td className="py-4 px-6 text-center min-w-[140px]">
                                    <div className="inline-flex justify-center whitespace-nowrap">
                                      {paymentSubTab === 'courses' && payment.screenshotUrl === 'uploading...' ? (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00B4D8]" />
                                          <span>جاري الرفع...</span>
                                        </div>
                                      ) : paymentSubTab === 'courses' && payment.screenshotUrl === 'failed' ? (
                                        <span className="text-xs font-bold text-rose-500">فشل الرفع</span>
                                      ) : img ? (
                                        <button
                                          onClick={() => {
                                            setSelectedImageUrl(img);
                                            setViewImageModalOpen(true);
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-[#15151F] dark:hover:bg-gray-800 border border-gray-150 dark:border-[#2D2D3D] text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] transition-all cursor-pointer border-0"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          عرض الإثبات
                                        </button>
                                      ) : (
                                        <span className="text-xs text-gray-400 font-bold">لا يوجد</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-4 px-6 min-w-[160px]">
                                    <div className="flex flex-col items-start gap-1">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${
                                        payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                        payment.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          payment.status === 'approved' ? 'bg-emerald-500' :
                                          payment.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                                        }`} />
                                        {payment.status === 'approved' ? 'تم القبول والتحويل' : payment.status === 'rejected' ? 'طلب مرفوض' : 'قيد المراجعة'}
                                      </span>
                                      {payment.status === 'rejected' && payment.rejectionReason && (
                                        <span className="text-[10px] text-red-500 font-bold max-w-[150px] truncate" title={payment.rejectionReason}>
                                          السبب: {payment.rejectionReason}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Action Buttons */}
                                  <td className="py-4 px-6 text-center min-w-[180px]">
                                    <div className="inline-flex gap-2">
                                      {payment.status === 'pending' ? (
                                        <>
                                          <button
                                            onClick={() => paymentSubTab === 'courses' ? handleApprovePayment(payment) : handleApproveReviewPayment(payment)}
                                            disabled={processingPaymentId === payment.id}
                                            className={`p-2 rounded-xl text-white ${paymentSubTab === 'courses' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-purple-600 hover:bg-purple-700'} text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer border-0`}
                                            title="موافقة وتفعيل الاشتراك"
                                          >
                                            {processingPaymentId === payment.id ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span className="text-[10px] pl-1 font-bold">تفعيل</span>
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => handleOpenRejectModal(payment)}
                                            disabled={processingPaymentId === payment.id}
                                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                                            title="رفض الاشتراك"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                            <span className="text-[10px] pl-1 font-bold">رفض</span>
                                          </button>
                                        </>
                                      ) : null}
                                      <button
                                        onClick={() => { setPaymentToDelete(payment.id); setDeletePaymentModalOpen(true); }}
                                        className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/20 text-xs font-black transition-all cursor-pointer"
                                        title="حذف الطلب بشكل نهائي"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'courses' ? (
                <div className="space-y-6 p-6 bg-gray-50/30 dark:bg-[#0D0D12]/30">
                  {/* Courses Search & Filters */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                      <div className="relative w-full md:w-[300px]">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={coursesSearchQuery}
                          onChange={(e) => setCoursesSearchQuery(e.target.value)}
                          placeholder="ابحث باسم الكورس، المعلم أو المادة..."
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 text-sm transition-all text-gray-900 dark:text-white font-bold"
                        />
                      </div>
                      
                      <div className="relative w-full md:w-[200px]">
                        <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={coursesGradeFilter}
                          onChange={(e) => setCoursesGradeFilter(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-[#00B4D8] text-sm transition-all text-gray-700 dark:text-gray-300 font-bold appearance-none cursor-pointer"
                        >
                          <option value="all">كل الصفوف الدراسية</option>
                          <option value="الأول الإعدادي">الأول الإعدادي</option>
                          <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                          <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                          <option value="الأول الثانوي">الأول الثانوي</option>
                          <option value="الثاني الثانوي">الثاني الثانوي</option>
                          <option value="الثالث الثانوي">الثالث الثانوي</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                        <Book className="w-4 h-4" />
                        إجمالي الكورسات: {courses.length}
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        النشطة منها: {courses.filter(c => c.isActive !== false).length}
                      </div>
                    </div>
                  </div>

                  {/* Courses List Cards */}
                  {courses.filter(course => {
                    const matchesSearch = (course.title || '').toLowerCase().includes(coursesSearchQuery.toLowerCase()) || 
                                          (course.teacherName || '').toLowerCase().includes(coursesSearchQuery.toLowerCase()) ||
                                          (course.subject || '').toLowerCase().includes(coursesSearchQuery.toLowerCase());
                    const matchesGrade = coursesGradeFilter === 'all' || course.grade === coursesGradeFilter;
                    return matchesSearch && matchesGrade;
                  }).length === 0 ? (
                    <div className="bg-white dark:bg-[#1A1A24] p-16 text-center text-gray-400 dark:text-gray-500 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] font-bold text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-[#0D0D12] border border-dashed border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-400">
                          <Book className="w-8 h-8" />
                        </div>
                        <span>لا توجد كورسات مطابقة لخيارات البحث المحددة حالياً</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.filter(course => {
                        const matchesSearch = (course.title || '').toLowerCase().includes(coursesSearchQuery.toLowerCase()) || 
                                              (course.teacherName || '').toLowerCase().includes(coursesSearchQuery.toLowerCase()) ||
                                              (course.subject || '').toLowerCase().includes(coursesSearchQuery.toLowerCase());
                        const matchesGrade = coursesGradeFilter === 'all' || course.grade === coursesGradeFilter;
                        return matchesSearch && matchesGrade;
                      }).map((course) => (
                        <div 
                          key={course.id}
                          className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all relative group"
                        >
                          {/* Course Thumbnail & Status Banner */}
                          <div className="relative h-44 bg-gray-100 dark:bg-[#0D0D12] overflow-hidden">
                            {course.imageUrl ? (
                              <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700 bg-gradient-to-br from-[#00B4D8]/10 to-purple-500/10">
                                <BookOpen className="w-12 h-12" />
                              </div>
                            )}
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              {course.isActive !== false ? (
                                <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg shadow-emerald-500/10 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  نشط ومتاح للطلاب
                                </span>
                              ) : (
                                <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg shadow-red-500/10 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                  ملغى / غير نشط
                                </span>
                              )}
                            </div>

                            {/* Price Tag */}
                            <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-xs font-black font-mono">
                              {course.price || 0} ج.م
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              {/* Subject & Grade Badges */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <span className="bg-blue-50 dark:bg-blue-950/30 text-[#00B4D8] px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  {course.subject || 'مادة عامة'}
                                </span>
                                <span className="bg-purple-50 dark:bg-purple-950/30 text-purple-500 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  {course.grade}
                                </span>
                              </div>

                              <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug line-clamp-1 mb-1">
                                {course.title}
                              </h3>
                              
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold line-clamp-2">
                                {course.description || 'لا يوجد وصف لهذا الكورس'}
                              </p>
                            </div>

                            <div className="border-t border-gray-100 dark:border-[#2D2D3D] pt-3 space-y-3">
                              {/* Teacher Info */}
                              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 bg-[#00B4D8]/10 text-[#00B4D8] rounded-full flex items-center justify-center">
                                    <UserIcon className="w-3 h-3" />
                                  </div>
                                  <span>الأستاذ: <span className="text-gray-700 dark:text-gray-300 font-black">{course.teacherName || 'غير محدد'}</span></span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => setSelectedCourseForStudents(course)}
                                  className="text-[#00B4D8] hover:underline cursor-pointer flex items-center gap-1 bg-[#00B4D8]/5 hover:bg-[#00B4D8]/10 px-2 py-1 rounded-lg"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>الطلاب: <span className="font-mono font-black">{course.enrolledStudents || 0}</span></span>
                                </button>
                              </div>

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                {/* Toggle Status */}
                                <button
                                  type="button"
                                  disabled={updatingCourseId === course.id}
                                  onClick={() => handleToggleCourseActive(course.id, course.isActive !== false)}
                                  className={`py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1 border cursor-pointer ${
                                    course.isActive !== false
                                      ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-950/40 dark:text-red-400 font-black'
                                      : 'bg-emerald-500 text-white border-transparent hover:bg-emerald-600 font-black'
                                  }`}
                                >
                                  {updatingCourseId === course.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : course.isActive !== false ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      إلغاء التفعيل
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      تفعيل الكورس
                                    </>
                                  )}
                                </button>

                                {/* Edit Course details */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCourseForEdit(course)}
                                  className="py-2 px-3 bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3D3D52] rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  تعديل الكورس
                                </button>
                              </div>

                                {/* Delete Course Button */}
                                <button
                                  type="button"
                                  onClick={() => setCourseToDelete(course)}
                                  className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-200 dark:border-red-900/30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  حذف الكورس نهائياً من السيستم
                                </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <table className="w-full min-w-[850px] text-right border-collapse relative">
              <thead className="sticky top-0 z-20 bg-white dark:bg-[#1A1A24]">
                <tr className="border-b border-gray-100 dark:border-[#2D2D3D]">
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">الاسم والبيانات</th>
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">البريد الإلكتروني</th>
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">رقم الهاتف</th>
                  {activeTab === 'students' && <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">الصف الدراسي</th>}
                  {activeTab === 'approvals' && <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">نوع الحساب / التفاصيل</th>}
                  {activeTab === 'teachers' && <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">المادة</th>}
                  {activeTab === 'approvals' && (
                    <>
                      <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">المحافظة / المدرسة</th>
                      <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">هاتف ولي الأمر</th>
                    </>
                  )}
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">تاريخ التسجيل</th>
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-center shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">التحكم والعمليات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'approvals' ? 8 : (activeTab === 'students' || activeTab === 'teachers' ? 6 : 5)} className="py-16 text-center text-gray-400 dark:text-gray-500 font-bold text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-[#0D0D12] border border-dashed border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-400">
                          <SlidersHorizontal className="w-7 h-7 stroke-[1.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-900 dark:text-white font-black text-base">لم يتم العثور على نتائج</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">جرب تعديل كلمات البحث أو تصفية الفلاتر للحصول على نتائج مغايرة.</p>
                        </div>
                        {(searchQuery || gradeFilter !== 'all' || subjectFilter !== 'all' || studentTrackFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setGradeFilter('all');
                              setSubjectFilter('all');
                              setStudentTrackFilter('all');
                              setSortBy('name_asc');
                            }}
                            className="mt-2 text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] hover:underline flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            إعادة تعيين كافة الفلاتر والبحث
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#0D0D12] transition-colors">
                    {/* Beautiful styled user avatar and name */}
                    <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0 ${
                          user.role === 'teacher' ? 'bg-purple-500' : user.role === 'parent' ? 'bg-amber-500' : user.role === 'admin' ? 'bg-red-500' : 'bg-[#00B4D8]'
                        }`}>
                          {(user.name || 'ب').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-black text-gray-900 dark:text-white text-sm">{user.name || 'بدون اسم'}</span>
                          <span className="block text-[10px] font-bold text-gray-400 mt-0.5 md:hidden">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400" dir="ltr">{user.phone || '-'}</td>
                    
                     {/* Modern pill styled attributes */}
                    {activeTab === 'students' && (
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="bg-blue-50 text-[#00B4D8] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 py-0.5 px-2.5 rounded-lg text-[11px] font-black inline-block">
                            {user.grade || '-'}
                          </span>
                          {user.branch && (
                            <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 py-0.5 px-2 rounded-md text-[9px] font-black inline-block">
                              {user.branch === 'science' ? 'علمي علوم' : 
                               user.branch === 'math' ? 'علمي رياضة' : 
                               user.branch === 'arts' ? 'أدبي' : 
                               user.branch === 'scientific' ? 'علمي' :
                               user.branch === 'literary' ? 'أدبي' : user.branch}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {activeTab === 'approvals' && (
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`py-0.5 px-2 rounded-lg text-[10px] font-black border ${
                            user.role === 'teacher' 
                              ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : user.role === 'parent' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' 
                              : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
                          }`}>
                            {user.role === 'teacher' ? 'معلم' : user.role === 'parent' ? 'ولي أمر' : 'طالب'}
                          </span>
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            {user.role === 'teacher' ? (user.subject || '-') : user.role === 'parent' ? `هاتف الطالب: ${user.studentPhone || '-'}` : (
                              <>
                                {user.grade || '-'}
                                {user.branch && ` • ${
                                  user.branch === 'science' ? 'علمي علوم' : 
                                  user.branch === 'math' ? 'علمي رياضة' : 
                                  user.branch === 'arts' ? 'أدبي' : 
                                  user.branch === 'scientific' ? 'علمي' :
                                  user.branch === 'literary' ? 'أدبي' : user.branch
                                }`}
                                {user.educationSystem === 'azhar' && ' (أزهري)'}
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                    )}
                    {activeTab === 'teachers' && (
                      <td className="py-2.5 px-4">
                        <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 py-0.5 px-2.5 rounded-lg text-[11px] font-black inline-block">
                          {user.subject || '-'}
                        </span>
                      </td>
                    )}
                    {activeTab === 'approvals' && (
                      <>
                        <td className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                          {user.governorate || '-'} / {user.school || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400" dir="ltr">
                          {user.parentPhone || '-'}
                        </td>
                      </>
                    )}
                    
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold">
                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-[11px]">{formatRegistrationDate(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {activeTab === 'approvals' ? (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id, user.name, user.role)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 rounded-xl transition-all font-black text-xs shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                              title="قبول وتفعيل الحساب"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>قبول وتفعيل</span>
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id, user.name, user.role)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/50 rounded-xl transition-all font-black text-xs shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                              title="رفض وحذف طلب التسجيل"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowModalPassword(false);
                                setViewModalOpen(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-gray-100 dark:border-[#2D2D3D]"
                              title="عرض البيانات الشاملة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowModalPassword(false);
                                setViewModalOpen(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="عرض البيانات الشاملة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setEditFormData(user);
                                setEditModalOpen(true);
                              }}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title="تعديل الحساب"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                // Auto fill title
                                setCustomReportTitle(
                                  user.role === 'student' ? 'تقرير الملف الدراسي للطالب' :
                                  user.role === 'teacher' ? 'تقرير السجل المهني للمعلم' : 'تقرير السجل العام لولي الأمر'
                                );
                                setPrintModalOpen(true);
                              }}
                              className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title="معاينة وطباعة تقرير رسمي"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {(user.role === 'student' || !user.role) ? (
                              <>
                                {!user.isArchived ? (
                                  <button 
                                    onClick={() => handleArchiveToggle(user, true)}
                                    className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
                                    title="أرشفة حساب الطالب"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => handleArchiveToggle(user, false)}
                                      className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
                                      title="استعادة حساب الطالب"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                    {user.id !== userData?.id && (
                                      <button 
                                        onClick={() => confirmDelete(user.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
                                        title="حذف الحساب نهائياً من الأرشيف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            ) : (
                              user.id !== userData?.id && (
                                <button 
                                  onClick={() => confirmDelete(user.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="حذف الحساب نهائياً"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
            )}
          </motion.div>
          </AnimatePresence>
        )}
      </div>

            {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewImageModalOpen && selectedImageUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewImageModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center justify-center z-10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewImageModalOpen(false)}
                className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white bg-black/50 hover:bg-black p-2 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={selectedImageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
              <div className="mt-4 flex gap-4">
                <a 
                  href={selectedImageUrl} 
                  download="screenshot.jpg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#00B4D8] text-white font-bold rounded-lg hover:bg-[#0096B4] transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل الصورة
                </a>
                <button
                  onClick={() => setViewImageModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Rejection Modal */}
      <AnimatePresence>
        {rejectionModalOpen && selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectionModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-sm relative z-10 shadow-2xl overflow-hidden p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">رفض طلب الاشتراك</h3>
                  <p className="text-xs text-gray-400">للطالب: {selectedPayment.senderName}</p>
                </div>
              </div>
              
              <form onSubmit={handleRejectPaymentSubmit}>
                <div className="mb-4 space-y-2">
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300">الرجاء إدخال سبب الرفض لتوضيحه للطالب:</label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: لقطة الشاشة غير واضحة، الرجاء رفع إثبات التحويل بشكل صحيح..."
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-3 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 text-xs font-bold text-gray-900 dark:text-white min-h-[100px] resize-none"
                  />
                </div>
                
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectionModalOpen(false)}
                    className="px-4 py-2 text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl transition-colors cursor-pointer bg-transparent border-0"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={processingPaymentId === selectedPayment.id}
                    className="px-4 py-2 text-xs font-black text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer border-0"
                  >
                    {processingPaymentId === selectedPayment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    تأكيد الرفض
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-sm relative z-10 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
              {/* Fixed Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-[#2D2D3D] shrink-0">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> تفاصيل حساب المستخدم
                </h3>
                <button onClick={() => setViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Profile Card Header */}
                <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-[#0D0D12]/30 p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shrink-0 ${
                  selectedUser.role === 'teacher' ? 'bg-purple-500 shadow-purple-500/20' : selectedUser.role === 'parent' ? 'bg-amber-500 shadow-amber-500/20' : selectedUser.role === 'admin' ? 'bg-red-500 shadow-red-500/20' : 'bg-[#00B4D8] shadow-[#00B4D8]/20'
                }`}>
                  {(selectedUser.name || 'ب').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-0.5 text-right min-w-0">
                  <h4 className="text-base font-black text-gray-900 dark:text-white truncate">{selectedUser.name || 'بدون اسم'}</h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedUser.role === 'teacher' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' :
                      selectedUser.role === 'parent' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                      selectedUser.role === 'admin' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                      'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    }`}>
                      {selectedUser.role === 'teacher' ? 'معلم' :
                       selectedUser.role === 'parent' ? 'ولي أمر' :
                       selectedUser.role === 'admin' ? 'مدير' : 'طالب'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      سجل في: {formatRegistrationDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-2.5 text-sm font-bold">
                {/* Email */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center shrink-0 ml-2.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">البريد الإلكتروني</span>
                    <span className="text-gray-900 dark:text-white text-xs truncate block font-mono" title={selectedUser.email}>{selectedUser.email || '-'}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[#00B4D8] flex items-center justify-center shrink-0 ml-2.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">رقم الهاتف</span>
                    <span className="text-gray-900 dark:text-white text-xs block font-mono" dir="ltr">{selectedUser.phone || '-'}</span>
                  </div>
                </div>

                {/* Password */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0 ml-2.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">كلمة المرور</span>
                    <span className="text-gray-900 dark:text-white text-xs font-mono block">
                      {showModalPassword ? (selectedUser.password || '123456') : '••••••••'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-[#2D2D3D] rounded-lg transition-colors shrink-0"
                    title={showModalPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Governorate */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center shrink-0 ml-2.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">المحافظة</span>
                    <span className="text-gray-900 dark:text-white text-xs block">{selectedUser.governorate || 'غير محدد'}</span>
                  </div>
                </div>

                {/* --- Student specific fields --- */}
                {selectedUser.role === 'student' && (
                  <>
                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center shrink-0 ml-2.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">الصف الدراسي</span>
                        <span className="text-gray-900 dark:text-white text-xs block">{selectedUser.grade || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0 ml-2.5">
                        <School className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">نظام التعليم</span>
                        <span className="text-gray-900 dark:text-white text-xs block">
                          {selectedUser.educationSystem === 'azhar' ? 'أزهري' : 'عام'}
                        </span>
                      </div>
                    </div>

                    {/* Branch (Important for High School) */}
                    {selectedUser.role === 'student' && (
                      <div className="flex items-center p-2.5 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
                        <div className="w-8.5 h-8.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center shrink-0 ml-2.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-cyan-600 dark:text-cyan-400 block text-[10px] font-black mb-0.5">الشعبة الدراسية</span>
                          <span className="text-gray-900 dark:text-white text-sm font-black block">
                            {selectedUser.branch === 'science' ? 'علمي علوم' : 
                             selectedUser.branch === 'math' ? 'علمي رياضة' : 
                             selectedUser.branch === 'arts' ? 'أدبي' : 
                             selectedUser.branch === 'scientific' ? 'علمي' :
                             selectedUser.branch === 'literary' ? 'أدبي' : selectedUser.branch || 'غير محددة'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-500 flex items-center justify-center shrink-0 ml-2.5">
                        <School className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">المدرسة</span>
                        <span className="text-gray-900 dark:text-white text-xs block truncate" title={selectedUser.school}>{selectedUser.school || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center shrink-0 ml-2.5">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">رقم هاتف ولي الأمر</span>
                        <span className="text-gray-900 dark:text-white text-xs block font-mono" dir="ltr">{selectedUser.parentPhone || 'غير مسجل'}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* --- Teacher specific fields --- */}
                {selectedUser.role === 'teacher' && (
                  <>
                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0 ml-2.5">
                        <Book className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">المادة الدراسية</span>
                        <span className="text-gray-900 dark:text-white text-xs block">{selectedUser.subject || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center shrink-0 ml-2.5">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">الرقم القومي</span>
                        <span className="text-gray-900 dark:text-white text-xs font-mono block">{selectedUser.nationalId || 'غير مسجل'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center shrink-0 ml-2.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">تاريخ الميلاد</span>
                        <span className="text-gray-900 dark:text-white text-xs block font-mono">{selectedUser.dateOfBirth || 'غير مسجل'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center shrink-0 ml-2.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">الصفوف المسندة</span>
                        <span className="text-gray-900 dark:text-white text-xs block truncate" title={Array.isArray(selectedUser.teachingGrades) ? selectedUser.teachingGrades.join('، ') : selectedUser.teachingGrades}>
                          {Array.isArray(selectedUser.teachingGrades) ? selectedUser.teachingGrades.join('، ') : selectedUser.teachingGrades || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* --- Parent specific fields --- */}
                {selectedUser.role === 'parent' && (
                  <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                    <div className="w-8.5 h-8.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center shrink-0 ml-2.5">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">رقم هاتف الطالب المرتبط</span>
                      <span className="text-gray-900 dark:text-white text-xs block font-mono" dir="ltr">{selectedUser.studentPhone || 'غير مسجل'}</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="p-5 border-t border-gray-100 dark:border-[#2D2D3D] shrink-0">
                <button 
                  onClick={() => setViewModalOpen(false)} 
                  className="w-full px-5 py-2.5 bg-[#00B4D8] hover:bg-[#0077B6] text-white rounded-xl transition-all font-bold text-xs shadow-md shadow-[#00B4D8]/10"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" /> تعديل بيانات المستخدم
                </h3>
                <button onClick={() => !isSaving && setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">الاسم</label>
                  <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">رقم الهاتف</label>
                  <input type="tel" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                </div>
                {selectedUser.role === 'student' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">الصف الدراسي</label>
                    <input type="text" value={editFormData.grade || ''} onChange={e => setEditFormData({...editFormData, grade: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">كلمة المرور (إن وجدت)</label>
                  <input type="text" value={editFormData.password || ''} onChange={e => setEditFormData({...editFormData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                </div>
                {selectedUser.role === 'student' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">رصيد المحفظة (ج.م)</label>
                    <input type="number" min="0" step="any" value={editFormData.balance !== undefined ? editFormData.balance : ''} onChange={e => setEditFormData({...editFormData, balance: e.target.value ? Number(e.target.value) : 0})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                  </div>
                )}
                <button type="submit" disabled={isSaving} className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all mt-4 flex justify-center items-center gap-2 shadow-lg">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التعديلات'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Print / Preview Modal */}
      <AnimatePresence>
        {printModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPrintModalOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-gray-100 dark:bg-[#0D0D12] rounded-3xl w-full max-w-5xl relative z-10 shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92vh]"
            >
              
              {/* Settings and options Panel (Left column) */}
              <div className="w-full md:w-[40%] bg-white dark:bg-[#1A1A24] p-6 border-b md:border-b-0 md:border-l border-gray-200 dark:border-[#2D2D3D] flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#2D2D3D]">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Printer className="w-5 h-5 text-purple-500" />
                        تخصيص ومعاينة التقرير
                      </h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">اضبط بيانات ومعايير التقرير قبل الطباعة</p>
                    </div>
                    <button 
                      onClick={() => setPrintModalOpen(false)} 
                      className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#2D2D3D] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Report Configuration form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1.5">عنوان التقرير الرسمي</label>
                      <input 
                        type="text" 
                        value={customReportTitle}
                        onChange={(e) => setCustomReportTitle(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-500 dark:text-white"
                        placeholder="مثال: تقرير السجل الدراسي الشامل"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1.5">الفترة الزمنية للتقرير</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          onClick={() => setPrintDateRange('all')} 
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                            printDateRange === 'all' 
                              ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-[#0D0D12] dark:border-[#2D2D3D] dark:text-gray-400'
                          }`}
                        >
                          شامل
                        </button>
                        <button 
                          onClick={() => setPrintDateRange('month')} 
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                            printDateRange === 'month' 
                              ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-[#0D0D12] dark:border-[#2D2D3D] dark:text-gray-400'
                          }`}
                        >
                          شهر محدد
                        </button>
                        <button 
                          onClick={() => setPrintDateRange('custom')} 
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                            printDateRange === 'custom' 
                              ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-[#0D0D12] dark:border-[#2D2D3D] dark:text-gray-400'
                          }`}
                        >
                          نطاق مخصص
                        </button>
                      </div>
                    </div>

                    {printDateRange === 'month' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-black text-gray-400 block mb-1.5">حدد الشهر المشمول بالتقرير</label>
                        <input 
                          type="month" 
                          value={printMonth}
                          onChange={(e) => setPrintMonth(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-500 dark:text-white" 
                        />
                      </div>
                    )}

                    {printDateRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 block mb-1">من تاريخ</label>
                          <input 
                            type="date" 
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 block mb-1">إلى تاريخ</label>
                          <input 
                            type="date" 
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white" 
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1.5">ملاحظات أو توصيات إضافية (تظهر بالتقرير)</label>
                      <textarea 
                        value={customReportNotes}
                        onChange={(e) => setCustomReportNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white resize-none leading-relaxed"
                        placeholder="اكتب أي ملاحظات سلوكية أو أكاديمية أو تقديرية لإضافتها لأسفل التقرير..."
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-[#2D2D3D] space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showSignatures}
                          onChange={(e) => setShowSignatures(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-gray-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 select-none">تضمين ختم وتوقيع المنصة الرسمي</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 dark:border-[#2D2D3D]">
                  <button 
                    onClick={handlePrint} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 text-sm"
                  >
                    <Printer className="w-5 h-5" />
                    طباعة التقرير الآن
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2.5 font-bold">يرجى التأكد من تفعيل "خيار الألوان والخلفيات" في إعدادات الطباعة للحصول على مظهر ممتاز</p>
                </div>
              </div>

              {/* Live Interactive Preview Container (Right column) */}
              <div className="w-full md:w-[60%] p-6 md:p-8 overflow-y-auto bg-gray-200 dark:bg-[#0D0D12] flex flex-col items-center justify-start gap-4">
                <div className="w-full flex justify-between items-center text-xs font-black text-gray-500 dark:text-gray-400 pb-2">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#00B4D8] animate-pulse" />
                    معاينة حية للمستند قبل الطباعة
                  </span>
                  <span>الورقة الافتراضية (A4)</span>
                </div>

                {/* Simulated Paper Sheet */}
                <div 
                  className="w-full bg-white text-slate-800 shadow-xl rounded-2xl p-6 md:p-8 font-sans relative border border-gray-300 select-text max-w-[210mm] min-h-[297mm] flex flex-col justify-between" 
                  dir="rtl"
                >
                  <div>
                    {/* Header Banner */}
                    <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00B4D8] to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">أكاديمية التميز التعليمية</h2>
                          <p className="text-[10px] text-slate-500 font-bold">المنصة التعليمية الشاملة لإدارة الطلاب</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 block">رقم المستند المرجعي</span>
                        <span className="text-xs font-mono font-black text-slate-800">#REP-{selectedUser.id?.substring(0, 8).toUpperCase() || '0000'}</span>
                      </div>
                    </div>

                    {/* Decorative Watermark logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <GraduationCap className="w-80 h-80 text-slate-900" />
                    </div>

                    {/* Report Title */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-black text-slate-900 bg-slate-100/80 py-2 px-5 rounded-xl inline-block border border-slate-200">
                        {customReportTitle || 'تقرير معلومات مستخدم رسمي'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 font-bold">
                        {printDateRange === 'month' && printMonth ? `عن شهر: ${printMonth}` : 
                         printDateRange === 'custom' && (reportStartDate || reportEndDate) ? `عن الفترة من: ${reportStartDate || 'البداية'} إلى: ${reportEndDate || 'النهاية'}` : 
                         'تاريخ الإصدار: شامل لجميع البيانات'}
                      </p>
                    </div>

                    {/* Formatted Student Details Bento Panels */}
                    <div className="space-y-5 relative z-10">
                      
                      {/* Section 1: User Profile Details */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          البيانات الشخصية والأساسية
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-sm font-bold text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">اسم المستخدم:</span>
                            <span className="text-slate-900">{selectedUser.name || 'بدون اسم'}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">البريد الإلكتروني:</span>
                            <span className="text-slate-900 font-mono text-xs">{selectedUser.email || '-'}</span>
                          </div>

                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">رقم الهاتف:</span>
                            <span className="text-slate-900 font-mono" dir="ltr">{selectedUser.phone || '-'}</span>
                          </div>

                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">تاريخ التسجيل بالمنصة:</span>
                            <span className="text-slate-900">
                              {formatRegistrationDate(selectedUser.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Account role & specific educational attributes */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          الحالة التعليمية والصلاحيات
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-sm font-bold text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">الدور / الصلاحية بالمنصة:</span>
                            <span className="text-slate-900">
                              {selectedUser.role === 'student' ? 'طالب' : selectedUser.role === 'teacher' ? 'معلم كادر' : selectedUser.role === 'parent' ? 'ولي أمر' : 'مستخدم عام'}
                            </span>
                          </div>

                          {selectedUser.role === 'student' && (
                            <>
                              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-slate-400 font-medium">الصف الدراسي المقيد به:</span>
                                <span className="text-[#00B4D8]">{selectedUser.grade || 'غير محدد'}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-slate-400 font-medium">نوع التعليم:</span>
                                <span className="text-[#00B4D8]">
                                  {selectedUser.educationSystem === 'azhar' ? 'ثانوي أزهري' : 'ثانوي عام'}
                                </span>
                              </div>
                              {selectedUser.branch && (
                                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                  <span className="text-slate-400 font-medium">الشعبة:</span>
                                  <span className="text-[#00B4D8]">
                                    {selectedUser.branch === 'science' ? 'علمي علوم' : 
                                     selectedUser.branch === 'math' ? 'علمي رياضة' : 
                                     selectedUser.branch === 'arts' ? 'أدبي' : 
                                     selectedUser.branch === 'scientific' ? 'علمي' :
                                     selectedUser.branch === 'literary' ? 'أدبي' : selectedUser.branch}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {selectedUser.role === 'teacher' && (
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-medium">المادة الدراسية المسندة:</span>
                              <span className="text-purple-600">{selectedUser.subject || 'غير محدد'}</span>
                            </div>
                          )}

                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">حالة تسجيل الدخول والنشاط:</span>
                            <span className="text-emerald-600 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              حساب نشط ومفعل
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Event & Academic records section based on date range */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                          {selectedUser.role === 'teacher' ? 'سجل الأنشطة والحصص التعليمية' : 
                           selectedUser.role === 'parent' ? 'سجل متابعة الحساب وأولياء الأمور' : 
                           'سجل الاختبارات والدرجات الأكاديمية'}
                        </h4>
                        
                        {getFilteredReportRecords().length > 0 ? (
                          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-slate-100 font-extrabold text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">البيان / الإجراء الدراسي</th>
                                  <th className="p-2.5">النوع</th>
                                  <th className="p-2.5 text-center">النتيجة والتقييم</th>
                                  <th className="p-2.5 text-center">التاريخ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {getFilteredReportRecords().map((rec: any) => (
                                  <tr key={rec.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5">{rec.name}</td>
                                    <td className="p-2.5 text-slate-400 font-medium">{rec.type}</td>
                                    <td className="p-2.5 text-center text-purple-600 font-extrabold">{rec.details}</td>
                                    <td className="p-2.5 text-center font-mono text-slate-400">{rec.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-black flex flex-col items-center justify-center gap-1.5">
                            <Clock className="w-5 h-5 text-slate-300 animate-pulse" />
                            <span>لا توجد سجلات دراسية متوفرة في النطاق الزمني المحدد</span>
                          </div>
                        )}
                      </div>

                      {/* Mock Academic stats to make document look complete */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          مؤشرات التفاعل والنشاط العام
                        </h4>
                        
                        {selectedUser.role === 'student' ? (
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 block mb-1">متوسط الدرجات والامتحانات</span>
                              <span className="text-base font-black text-purple-600">{selectedUserAverageQuizScore}%</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 block mb-1">الدروس المستكملة</span>
                              <span className="text-base font-black text-[#00B4D8]">{selectedUserProgress.reduce((acc, prog) => acc + (Array.isArray(prog.completedLessons) ? prog.completedLessons.length : 0), 0)} درس</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 block mb-1">رصيد المحفظة</span>
                              <span className="text-base font-black text-emerald-600">{selectedUser.balance || 0} ج.م</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 block mb-1">نسبة الحضور</span>
                              <span className="text-base font-black text-emerald-600">98%</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 block mb-1">إكمال الواجبات</span>
                              <span className="text-base font-black text-[#00B4D8]">92%</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 block mb-1">رصيد المحفظة</span>
                              <span className="text-base font-black text-purple-600">{selectedUser.balance || 0} ج.م</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Custom Admin Notes if specified */}
                      {customReportNotes && (
                        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 text-sm font-bold text-slate-800 animate-in fade-in duration-200">
                          <h4 className="font-extrabold text-amber-800 mb-1.5 flex items-center gap-1.5 text-xs">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            توصيات وملاحظات الإدارة واللجنة التعليمية:
                          </h4>
                          <p className="text-slate-700 font-medium leading-relaxed text-xs">{customReportNotes}</p>
                        </div>
                      )}

                      {/* Signatures Panel */}
                      {showSignatures && (
                        <div className="grid grid-cols-2 gap-6 pt-6 mt-8 border-t border-slate-200">
                          <div className="text-center font-bold">
                            <p className="text-slate-400 text-[10px]">توقيع مدير الشؤون التعليمية</p>
                            <div className="h-10 flex items-center justify-center">
                              <span className="text-xs font-mono text-slate-300 italic">مكتب الإشراف العام</span>
                            </div>
                            <p className="text-slate-800 text-[10px]">---------------------------</p>
                          </div>
                          <div className="text-center font-bold relative">
                            <p className="text-slate-400 text-[10px]">ختم وتوقيع المنصة الرسمي</p>
                            <div className="h-10 flex items-center justify-center relative">
                              {/* Virtual stamp illustration */}
                              <div className="w-14 h-14 rounded-full border-4 border-double border-red-500/20 flex items-center justify-center text-[7px] font-black text-red-500/20 rotate-12 absolute">
                                أكاديمية التميز
                              </div>
                            </div>
                            <p className="text-slate-800 text-[10px]">---------------------------</p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="text-center text-[8px] font-black text-slate-400 mt-10 border-t border-slate-100 pt-3">
                    تم إصدار هذا التقرير إلكترونياً وبشكل آمن من خلال لوحة تحكم المنصة في {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Actual Pure Print Layout (Hidden on screen, shown ONLY on print) */}
      {printModalOpen && selectedUser && (
        <div className="hidden print:block bg-white text-black min-h-screen w-full p-12 relative printable-area" dir="rtl">
          
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-sm">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-black">أكاديمية التميز التعليمية</h2>
                <p className="text-xs text-slate-500 font-bold">المنصة التعليمية الشاملة لإدارة الطلاب</p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 block">رقم المستند المرجعي</span>
              <span className="text-sm font-mono font-black text-black">#REP-{selectedUser.id?.substring(0, 8).toUpperCase() || '0000'}</span>
            </div>
          </div>

          {/* Watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <GraduationCap className="w-[450px] h-[450px] text-black" />
          </div>

          {/* Report Title */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-black bg-slate-100 py-2 px-6 rounded-xl inline-block border border-slate-300">
              {customReportTitle || 'تقرير معلومات مستخدم رسمي'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 font-bold">
              {printDateRange === 'month' && printMonth ? `عن شهر: ${printMonth}` : 
               printDateRange === 'custom' && (reportStartDate || reportEndDate) ? `عن الفترة من: ${reportStartDate || 'البداية'} إلى: ${reportEndDate || 'النهاية'}` : 
               'تاريخ الإصدار: شامل لجميع البيانات'}
            </p>
          </div>

          {/* User Details sections */}
          <div className="space-y-6">
            
            {/* Section 1: Personal info */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-300 pb-1">
                البيانات الشخصية والأساسية
              </h4>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-bold">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">اسم المستخدم:</span>
                  <span className="text-black">{selectedUser.name || 'بدون اسم'}</span>
                </div>
                
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">البريد الإلكتروني:</span>
                  <span className="text-black font-mono">{selectedUser.email || '-'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="text-black font-mono" dir="ltr">{selectedUser.phone || '-'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">تاريخ التسجيل بالمنصة:</span>
                  <span className="text-black">
                    {formatRegistrationDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Account specific education credentials */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-300 pb-1">
                الحالة التعليمية والصلاحيات
              </h4>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-bold">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">الدور / الصلاحية بالمنصة:</span>
                  <span className="text-black">
                    {selectedUser.role === 'student' ? 'طالب' : selectedUser.role === 'teacher' ? 'معلم كادر' : selectedUser.role === 'parent' ? 'ولي أمر' : 'مستخدم عام'}
                  </span>
                </div>

                {selectedUser.role === 'student' && (
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">الصف الدراسي المقيد به:</span>
                    <span className="text-black font-extrabold">{selectedUser.grade || 'غير محدد'}</span>
                  </div>
                )}

                {selectedUser.role === 'teacher' && (
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">المادة الدراسية المسندة:</span>
                    <span className="text-black font-extrabold">{selectedUser.subject || 'غير محدد'}</span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">حالة الحساب والنشاط:</span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    ✓ حساب نشط ومفعل بالكامل
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Event & Academic records section based on date range (Printable) */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-300 pb-1">
                {selectedUser.role === 'teacher' ? 'سجل الأنشطة والحصص التعليمية' : 
                 selectedUser.role === 'parent' ? 'سجل متابعة الحساب وأولياء الأمور' : 
                 'سجل الاختبارات والدرجات الأكاديمية'}
              </h4>
              
              {getFilteredReportRecords().length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">البيان / الإجراء الدراسي</th>
                        <th className="p-3">النوع</th>
                        <th className="p-3 text-center">النتيجة والتقييم</th>
                        <th className="p-3 text-center">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {getFilteredReportRecords().map((rec: any) => (
                        <tr key={rec.id}>
                          <td className="p-3 font-semibold">{rec.name}</td>
                          <td className="p-3 text-slate-500">{rec.type}</td>
                          <td className="p-3 text-center font-bold text-slate-900">{rec.details}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{rec.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-400 font-bold">
                  لا توجد سجلات دراسية متوفرة في النطاق الزمني المحدد
                </div>
              )}
            </div>

            {/* Mock stats */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-200 pb-1">
                مؤشرات التفاعل والنشاط العام
              </h4>
              {selectedUser.role === 'student' ? (
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">متوسط الدرجات والامتحانات</span>
                    <span className="text-lg font-black text-purple-600">{selectedUserAverageQuizScore}%</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">الدروس المستكملة</span>
                    <span className="text-lg font-black text-[#00B4D8]">{selectedUserProgress.reduce((acc, prog) => acc + (Array.isArray(prog.completedLessons) ? prog.completedLessons.length : 0), 0)} درس</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">رصيد المحفظة</span>
                    <span className="text-lg font-black text-emerald-600">{selectedUser.balance || 0} ج.م</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">نسبة الحضور</span>
                    <span className="text-lg font-black text-black">98%</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">إكمال الواجبات</span>
                    <span className="text-lg font-black text-black">92%</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">رصيد المحفظة</span>
                    <span className="text-lg font-black text-black">{selectedUser.balance || 0} ج.م</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Notes if any */}
            {customReportNotes && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-300">
                <h4 className="text-sm font-extrabold text-black mb-2">
                  توصيات وملاحظات الإدارة واللجنة التعليمية:
                </h4>
                <p className="text-slate-800 leading-relaxed text-sm font-medium">{customReportNotes}</p>
              </div>
            )}

            {/* Signatures */}
            {showSignatures && (
              <div className="grid grid-cols-2 gap-12 pt-8 mt-12 border-t border-slate-300">
                <div className="text-center font-bold">
                  <p className="text-slate-500 text-xs">توقيع مدير الشؤون التعليمية</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="text-xs italic text-slate-400">مكتب الإشراف العام</span>
                  </div>
                  <p className="text-black text-xs">---------------------------</p>
                </div>
                <div className="text-center font-bold">
                  <p className="text-slate-500 text-xs">ختم وتوقيع المنصة الرسمي</p>
                  <div className="h-14 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border-4 border-double border-red-500/20 flex items-center justify-center text-[8px] font-black text-red-500/20 rotate-12 absolute">
                      أكاديمية التميز
                    </div>
                  </div>
                  <p className="text-black text-xs">---------------------------</p>
                </div>
              </div>
            )}

          </div>

          <div className="text-center text-[10px] font-bold text-slate-400 mt-16 border-t border-slate-200 pt-4 absolute bottom-8 left-12 right-12">
            تم إصدار هذا التقرير إلكترونياً وبشكل آمن من خلال لوحة تحكم المنصة في {new Date().toLocaleDateString('ar-EG')}
          </div>
        </div>
      )}

            {/* Delete Payment Confirmation Modal */}
      <AnimatePresence>
        {deletePaymentModalOpen && paymentToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletePaymentModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletePaymentModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeletePayment}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                >
                  حذف الطلب
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={executeDelete} 
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Enrolled Students Modal */}
      <AnimatePresence>
        {selectedCourseForStudents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCourseForStudents(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] text-right" dir="rtl">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#2D2D3D] mb-4 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
                    الطلاب المشتركين في الكورس
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mt-1">كورس: <span className="text-[#00B4D8] dark:text-[#D4AF37]">{selectedCourseForStudents.title}</span></p>
                </div>
                <button onClick={() => setSelectedCourseForStudents(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {(() => {
                  const enrolledList = users.filter(u => (selectedCourseForStudents.enrolledStudentIds || []).includes(u.id));
                  if (enrolledList.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-400 font-bold">
                        <p>لا يوجد أي طلاب مشتركين في هذا الكورس حالياً.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-[#2D2D3D] text-xs text-gray-400 font-bold">
                              <th className="pb-3 px-2">الطالب</th>
                              <th className="pb-3 px-2">البريد الإلكتروني</th>
                              <th className="pb-3 px-2">رقم الهاتف</th>
                              <th className="pb-3 px-2">الصف</th>
                              <th className="pb-3 px-2 text-center">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50 text-sm">
                            {enrolledList.map(student => (
                              <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0D0D12]/30 transition-colors">
                                <td className="py-3 px-2 font-black text-gray-900 dark:text-white">{student.name}</td>
                                <td className="py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">{student.email}</td>
                                <td className="py-3 px-2 text-gray-500 dark:text-gray-400 font-mono" dir="ltr">{student.phone}</td>
                                <td className="py-3 px-2 text-purple-500 font-bold">{student.grade || 'غير محدد'}</td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStudentFromCourse(student.id, selectedCourseForStudents)}
                                    className="px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    إلغاء الاشتراك
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Course Details Modal */}
      <AnimatePresence>
        {selectedCourseForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCourseForEdit(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-lg relative z-10 shadow-2xl p-6 text-right max-h-[90vh] overflow-y-auto" style={{ maxHeight: "90vh", overflowY: "auto" }} dir="rtl">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#2D2D3D] mb-4 shrink-0">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
                  تعديل تفاصيل الكورس (مسؤول)
                </h3>
                <button onClick={() => setSelectedCourseForEdit(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditCourseSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">عنوان الكورس</label>
                  <input
                    type="text"
                    value={selectedCourseForEdit.title || ''}
                    onChange={e => setSelectedCourseForEdit({...selectedCourseForEdit, title: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] text-sm font-bold text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">وصف الكورس</label>
                  <textarea
                    value={selectedCourseForEdit.description || ''}
                    onChange={e => setSelectedCourseForEdit({...selectedCourseForEdit, description: e.target.value})}
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] text-sm font-bold text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">المادة الدراسية</label>
                    <input
                      type="text"
                      value={selectedCourseForEdit.subject || ''}
                      onChange={e => setSelectedCourseForEdit({...selectedCourseForEdit, subject: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] text-sm font-bold text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">الصف الدراسي</label>
                    <select
                      value={selectedCourseForEdit.grade || ''}
                      onChange={e => setSelectedCourseForEdit({...selectedCourseForEdit, grade: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <option value="الأول الإعدادي">الأول الإعدادي</option>
                      <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                      <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                      <option value="الأول الثانوي">الأول الثانوي</option>
                      <option value="الثاني الثانوي">الثاني الثانوي</option>
                      <option value="الثالث الثانوي">الثالث الثانوي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">سعر الكورس (ج.م)</label>
                  <input
                    type="number"
                    value={selectedCourseForEdit.price || 0}
                    onChange={e => setSelectedCourseForEdit({...selectedCourseForEdit, price: Number(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-[#00B4D8] text-sm font-bold text-gray-900 dark:text-white font-mono text-left"
                    required
                    min={0}
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-[#2D2D3D]">
                  <button
                    type="button"
                    onClick={() => setSelectedCourseForEdit(null)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء الإجراء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#00B4D8] text-white font-bold rounded-xl hover:bg-[#0096B4] transition-colors cursor-pointer"
                  >
                    حفظ التغييرات
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCourseToDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 text-right max-h-[90vh] overflow-y-auto" style={{ maxHeight: "90vh", overflowY: "auto" }} dir="rtl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد حذف الكورس نهائياً</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف الكورس <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">"{courseToDelete.title}"</span> للأبد؟
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl font-bold leading-relaxed mt-3">
                  ⚠️ تنبيه: هذا الإجراء سيمسح الكورس ومقاطع الفيديو وكل تفاصيله من السيرفر. لن يتمكن أي طالب من مشاهدته بعد الآن حتى وإن كان قد اشترك فيه مسبقاً!
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setCourseToDelete(null)} 
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  تراجع
                </button>
                <button 
                  type="button"
                  onClick={() => executeDeleteCourse(courseToDelete.id)} 
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  نعم، احذف الكورس
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
