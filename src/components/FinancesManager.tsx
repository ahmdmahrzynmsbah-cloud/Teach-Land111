import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Loader2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  PlusCircle, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface FinancesManagerProps {
  userData: any;
}

export default function FinancesManager({ userData }: FinancesManagerProps) {
  const isTeacher = userData?.role === 'teacher';
  const isAdmin = userData?.role === 'admin';

  // State Variables
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  // Form states for adding expense
  const [expenseTitle, setExpenseTitle] = useState('راتب معلم');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('رواتب ومكافآت');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [addingExpense, setAddingExpense] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newTitleInput, setNewTitleInput] = useState('');
  
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finance_categories');
    return saved ? JSON.parse(saved) : [
      'رواتب ومكافآت', 'صيانة وتشغيل', 'إعلانات وتسويق', 'منصات وسيرفرات', 'أدوات ومستلزمات', 'أخرى'
    ];
  });

  const [availableTitles, setAvailableTitles] = useState<string[]>(() => {
    const saved = localStorage.getItem('finance_titles');
    return saved ? JSON.parse(saved) : [
      'راتب معلم', 'صيانة أجهزة', 'إعلان ممول', 'فاتورة إنترنت', 'أدوات مكتبية', 'أخرى'
    ];
  });

  useEffect(() => {
    localStorage.setItem('finance_categories', JSON.stringify(availableCategories));
  }, [availableCategories]);

  useEffect(() => {
    localStorage.setItem('finance_titles', JSON.stringify(availableTitles));
  }, [availableTitles]);

  // UI state for expandable teacher rows
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'delete' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'delete'
  });

  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [statementGenerated, setStatementGenerated] = useState(false);


  useEffect(() => {
    setLoading(true);
    
    // Listeners and fetches
    let unsubscribeTeachers: () => void = () => {};
    let unsubscribeCourses: () => void = () => {};
    let unsubscribePayments: () => void = () => {};
    let unsubscribeExpenses: () => void = () => {};

    try {
      // 1. Fetch Teachers (only needed for Admin)
      if (isAdmin) {
        const qTeachers = query(collection(db, 'users'), where('role', '==', 'teacher'));
        unsubscribeTeachers = onSnapshot(qTeachers, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTeachers(list);
        }, (err) => {
          console.error("Error fetching teachers for finances:", err);
        });
      }

      // 2. Fetch Courses (Admin gets all, Teacher gets their own)
      const coursesRef = collection(db, 'courses');
      const qCourses = isTeacher 
        ? query(coursesRef, where('teacherId', '==', userData?.id))
        : coursesRef;
      
      unsubscribeCourses = onSnapshot(qCourses, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(list);
      }, (err) => {
        console.error("Error fetching courses for finances:", err);
      });

      // 3. Fetch Approved Payments
      // We will listen to all approved payments. For teacher, we filter in memory by course ownership.
      const paymentsRef = collection(db, 'course_payments');
      const qPayments = query(paymentsRef, where('status', '==', 'approved'));
      
      unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(list);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching payments for finances:", err);
        setLoading(false);
      });

      // 4. Fetch Expenses (only needed for Admin)
      if (isAdmin) {
        const expensesRef = collection(db, 'expenses');
        unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort expenses by date descending
          list.sort((a: any, b: any) => b.date.localeCompare(a.date));
          setExpenses(list);
        }, (err) => {
          console.error("Error fetching expenses:", err);
        });
      }

    } catch (error) {
      console.error("Error initializing finances manager:", error);
      setLoading(false);
    }

    return () => {
      unsubscribeTeachers();
      unsubscribeCourses();
      unsubscribePayments();
      unsubscribeExpenses();
    };
  }, [isAdmin, isTeacher, userData?.id]);

  // Handle adding expense (Admin only)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    setAddingExpense(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        title: expenseTitle.trim(),
        amount: amountNum,
        category: expenseCategory,
        date: expenseDate,
        addedBy: userData?.name || 'مدير المنصة',
        createdAt: new Date().toISOString()
      });
      toast.success('تم تسجيل المصروف بنجاح');
      setExpenseTitle('');
      setExpenseAmount('');
    } catch (err) {
      console.error("Error adding expense:", err);
      toast.error('حدث خطأ أثناء تسجيل المصروف');
    } finally {
      setAddingExpense(false);
    }
  };

  // Handle deleting expense (Admin only)
  const handleDeleteExpense = async (id: string) => {
    if (!isAdmin) {
      toast.error('غير مسموح لك بحذف المصروفات');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المصروف نهائياً',
      message: 'هل أنت متأكد من حذف هذا المصروف؟ لا يمكن استعادة البيانات بعد الحذف.',
      type: 'delete',
      onConfirm: async () => {
        try {
          const docRef = doc(db, 'expenses', id);
          await deleteDoc(docRef);
          toast.success('تم حذف المصروف بنجاح ✅');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Error deleting expense:", err);
          toast.error('حدث خطأ أثناء الحذف. تأكد من صلاحياتك وحاول مجدداً.');
        }
      }
    });
  };

  // --- CALCULATION LOGIC ---

  // Get total course revenue
  const getCourseRevenue = (courseId: string) => {
    const coursePayments = payments.filter(p => p.courseId === courseId);
    return coursePayments.reduce((acc, p) => acc + (p.coursePrice || p.amount || 0), 0);
  };

  // Get total course subscribers
  const getCourseSubscribersCount = (courseId: string) => {
    const c = courses.find(course => course.id === courseId);
    return c?.enrolledStudents || 0;
  };

  // --- ADMIN VIEW SPECIFIC CALCULATIONS ---

  // Total Course Revenues (all courses combined)
  const adminTotalCourseRevenues = payments.reduce((acc, p) => acc + (p.coursePrice || p.amount || 0), 0);

  // Total Platform Expenses
  const adminTotalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Net Profit
  const adminNetProfit = adminTotalCourseRevenues - adminTotalExpenses;

  // Get teacher specific statistics
  const getTeacherStats = (teacherId: string) => {
    const teacherCourses = courses.filter(c => c.teacherId === teacherId);
    let totalSubscribers = 0;
    let totalRevenue = 0;

    teacherCourses.forEach(c => {
      totalSubscribers += getCourseSubscribersCount(c.id);
      totalRevenue += getCourseRevenue(c.id);
    });

    return {
      coursesCount: teacherCourses.length,
      totalSubscribers,
      totalRevenue
    };
  };

  // --- CHART DATA PREPARATION ---
  const getMonthlyData = () => {
    const monthlyStats: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};
    
    // Process payments (revenue)
    payments.forEach(p => {
      if (!p.createdAt) return;
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0 };
      }
      monthlyStats[monthKey].revenue += (p.coursePrice || p.amount || 0);
      monthlyStats[monthKey].profit = monthlyStats[monthKey].revenue - monthlyStats[monthKey].expenses;
    });

    // Process expenses
    expenses.forEach(e => {
      if (!e.date) return;
      // e.date is YYYY-MM-DD
      const monthKey = e.date.substring(0, 7); 
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0 };
      }
      monthlyStats[monthKey].expenses += (e.amount || 0);
      monthlyStats[monthKey].profit = monthlyStats[monthKey].revenue - monthlyStats[monthKey].expenses;
    });

    const sortedData = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
    
    // Format month for display
    return sortedData.map(d => ({
      ...d,
      displayMonth: new Date(d.month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' })
    }));
  };

  const monthlyChartData = getMonthlyData();

  // --- AUDIT LOGS ---
  const getAuditLogs = () => {
    const logs = [
      ...payments.map(p => ({
        id: `inc_${p.id}`,
        type: 'income',
        title: `مبيعات كورس: ${p.courseTitle || 'غير معروف'}`,
        amount: p.coursePrice || p.amount || 0,
        date: p.createdAt || '',
        user: p.userName || 'طالب مجهول',
      })),
      ...expenses.map(e => ({
        id: `exp_${e.id}`,
        type: 'expense',
        title: `مصروف: ${e.title}`,
        amount: e.amount || 0,
        date: e.createdAt || e.date || '',
        user: e.addedBy || 'مدير المنصة',
      }))
    ];
    return logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  };

  const auditLogs = isAdmin ? getAuditLogs() : [];

  // --- TEACHER VIEW SPECIFIC CALCULATIONS ---

  // Teacher owned courses
  const myCourses = courses; // filtered to teacher in useEffect
  const myTotalRevenue = myCourses.reduce((acc, c) => acc + getCourseRevenue(c.id), 0);
  const myTotalSubscribers = myCourses.reduce((acc, c) => acc + getCourseSubscribersCount(c.id), 0);

  // Recent Subscriptions log
  const myRecentSubscribedPayments = payments
    .filter(p => myCourses.some(c => c.id === p.courseId))
    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-200 dark:border-[#2D2D3D]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">جاري تحميل البيانات المالية والحسابات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:w-full print:block" dir="rtl">
            <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الحسابات والمالية</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setStatementModalOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-purple-700 transition">
            <FileText className="w-4 h-4" />
            كشوف الحسابات
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            طباعة التقرير
          </button>
        </div>
      </div>
      
      {/* 1. TOP METRICS PANEL */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isAdmin ? (
          <>
            {/* Admin Metric 1: Total Revenue */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm relative overflow-hidden flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1">إجمالي إيرادات الكورسات</span>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {adminTotalCourseRevenues.toLocaleString('ar-EG')} <span className="text-xs font-black">ج.م</span>
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  من مبيعات الاشتراكات النشطة
                </span>
              </div>
            </div>

            {/* Admin Metric 2: Total Expenses */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm relative overflow-hidden flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
                <TrendingDown className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1">إجمالي المصروفات العامة</span>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {adminTotalExpenses.toLocaleString('ar-EG')} <span className="text-xs font-black">ج.م</span>
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                  تشمل الرواتب، التشغيل والمنصات
                </span>
              </div>
            </div>

            {/* Admin Metric 3: Net Profit */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm relative overflow-hidden flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1">صافي الأرباح الكلية</span>
                <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {adminNetProfit.toLocaleString('ar-EG')} <span className="text-xs font-black">ج.م</span>
                </h3>
                <span className={`text-[10px] mt-1 flex items-center gap-1 font-bold ${adminNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {adminNetProfit >= 0 ? 'أرباح تشغيلية إيجابية 📈' : 'عجز مالي مؤقت 📉'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Teacher Metric 1: Total Revenue */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm relative overflow-hidden flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1">إجمالي أرباح كورساتي</span>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {myTotalRevenue.toLocaleString('ar-EG')} <span className="text-xs font-black">ج.م</span>
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  مبيعات الكورسات التي أنشأتها
                </span>
              </div>
            </div>

            {/* Teacher Metric 2: Total Subscribers */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm relative overflow-hidden flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-[#00B4D8] flex items-center justify-center shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1">إجمالي الطلاب المشتركين</span>
                <h3 className="text-2xl font-black text-[#00B4D8] font-mono">
                  {myTotalSubscribers.toLocaleString('ar-EG')} <span className="text-xs font-black">طالب</span>
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  مسجلين بشكل نشط بكورساتك
                </span>
              </div>
            </div>

            {/* Teacher Metric 3: Active Courses count */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm relative overflow-hidden flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1">عدد كورساتي النشطة</span>
                <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {myCourses.length.toLocaleString('ar-EG')} <span className="text-xs font-black">كورس</span>
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  تدر مبيعات واشتراكات نشطة
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 1.5 ADMIN CHARTS */}
      {isAdmin && (
        <section className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm">
          <h3 className="text-base font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            تحليل الأرباح والمصروفات الشهري
          </h3>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                <Area type="monotone" dataKey="profit" name="صافي الربح" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 2. MAIN SECTION LISTINGS */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Admin Block A: Expense Tracker Form & List (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Add Expense Card */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm shrink-0">
              <h3 className="text-base font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-500" />
                تسجيل مصروفات جديدة
              </h3>
              
              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">المبلغ (ج.م)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 outline-none focus:border-rose-500 dark:text-white font-bold text-sm font-mono transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">تاريخ الصرف</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 outline-none focus:border-rose-500 dark:text-white font-bold text-sm transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Category Section */}
                <div className="p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D] bg-gray-50/80 dark:bg-[#12121A] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">تصنيف المصروف (الفئة)</label>
                    {availableCategories.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const categoryToDelete = expenseCategory;
                          setConfirmModal({
                            isOpen: true,
                            title: 'حذف فئة مصروف',
                            message: `هل أنت متأكد من حذف فئة "${categoryToDelete}" من القائمة؟ سيتم إزالتها من الخيارات المتاحة فقط.`,
                            type: 'delete',
                            onConfirm: () => {
                              setAvailableCategories(prev => {
                                const newCats = prev.filter(c => c !== categoryToDelete);
                                if (newCats.length > 0) setExpenseCategory(newCats[0]);
                                return newCats;
                              });
                              setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              toast.success('تم حذف الفئة من القائمة');
                            }
                          });
                        }}
                        className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors p-1 font-black"
                      >
                        <Trash2 className="w-3 h-3" />
                        حذف الفئة المختارة
                      </button>
                    )}
                  </div>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-rose-500 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أو إضافة فئة..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-rose-500 dark:text-white text-[10px] font-medium transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newCategoryInput.trim();
                        if (val && !availableCategories.includes(val)) {
                          setAvailableCategories(prev => [...prev, val]);
                          setExpenseCategory(val);
                          setNewCategoryInput('');
                        }
                      }}
                      className="bg-gray-200 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                </div>

                {/* Title Section */}
                <div className="p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D] bg-gray-50/80 dark:bg-[#12121A] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">بيان الصرف (الوصف)</label>
                    {availableTitles.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const titleToDelete = expenseTitle;
                          setConfirmModal({
                            isOpen: true,
                            title: 'حذف مسمى مصروف',
                            message: `هل أنت متأكد من حذف مسمى "${titleToDelete}" من القائمة؟`,
                            type: 'delete',
                            onConfirm: () => {
                              setAvailableTitles(prev => {
                                const newTitles = prev.filter(t => t !== titleToDelete);
                                if (newTitles.length > 0) setExpenseTitle(newTitles[0]);
                                return newTitles;
                              });
                              setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              toast.success('تم حذف المسمى من القائمة');
                            }
                          });
                        }}
                        className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors p-1 font-black"
                      >
                        <Trash2 className="w-3 h-3" />
                        حذف المسمى المختار
                      </button>
                    )}
                  </div>
                  <select
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-rose-500 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    {availableTitles.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أو إضافة بيان..."
                      value={newTitleInput}
                      onChange={(e) => setNewTitleInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-2 outline-none focus:border-rose-500 dark:text-white text-[10px] font-medium transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newTitleInput.trim();
                        if (val && !availableTitles.includes(val)) {
                          setAvailableTitles(prev => [...prev, val]);
                          setExpenseTitle(val);
                          setNewTitleInput('');
                        }
                      }}
                      className="bg-gray-200 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={addingExpense}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-4 py-3.5 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    {addingExpense ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري التسجيل...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5" />
                        تأكيد تسجيل المصروف
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Expenses List Card */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden print:overflow-visible print:min-h-0 print:h-auto min-h-[350px]">
              <h3 className="text-base font-black text-gray-800 dark:text-white mb-3 flex items-center gap-2 shrink-0">
                <FileText className="w-5 h-5 text-gray-400" />
                دفتر المصروفات الأخير
              </h3>

              <div className="flex-1 overflow-y-auto print:overflow-visible scrollbar-thin space-y-3 pl-1">
                {expenses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
                    <span className="text-xs font-bold">لا توجد مصروفات مسجلة حالياً</span>
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className="bg-gray-50/50 dark:bg-[#12121A]/30 p-3.5 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-800 dark:text-white">{exp.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-500 px-1.5 py-0.5 rounded-lg font-bold">{exp.category}</span>
                          <span className="flex items-center gap-0.5 font-mono"><Calendar className="w-3 h-3" /> {exp.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-rose-500 font-mono">-{exp.amount} ج.م</span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 bg-white dark:bg-[#1A1A24] rounded-lg border border-gray-100 dark:border-[#2D2D3D] shadow-sm transition-all"
                          title="حذف المصروف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Admin Block B: Teachers & Courses financial list (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden print:overflow-visible print:min-h-0 print:h-auto min-h-[500px]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="text-base font-black text-gray-800 dark:text-white">حسابات المعلمين التفصيلية</h3>
                  <p className="text-xs text-gray-400 mt-1">تفاصيل كورسات كل معلم، والمشتركين بدقة، والأرباح المحققة</p>
                </div>
                <div className="bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20 px-3 py-1.5 rounded-xl text-xs font-bold">
                  إجمالي المدرسين: {teachers.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto print:overflow-visible scrollbar-thin space-y-3.5 pr-1">
                {teachers.length === 0 ? (
                  <div className="py-20 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto opacity-30 mb-3" />
                    <span className="text-sm font-bold">لم يتم تسجيل أي معلمين في المنصة بعد.</span>
                  </div>
                ) : (
                  teachers.map((teacher) => {
                    const stats = getTeacherStats(teacher.id);
                    const isExpanded = expandedTeacherId === teacher.id;

                    return (
                      <div 
                        key={teacher.id} 
                        className={`border rounded-2xl transition-all ${
                          isExpanded 
                            ? 'bg-gray-50/50 dark:bg-[#12121A]/30 border-[#00B4D8]/30 dark:border-[#D4AF37]/30 shadow-sm' 
                            : 'bg-white dark:bg-[#1A1A24] border-gray-150 dark:border-[#2D2D3D] hover:border-[#00B4D8]/20 dark:hover:border-[#D4AF37]/20'
                        }`}
                      >
                        {/* Expandable Teacher Row Header */}
                        <div 
                          onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                          className="p-4 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-150 dark:bg-[#2D2D3D] flex items-center justify-center font-black text-sm text-gray-700 dark:text-white border border-gray-200 dark:border-[#3D3D52]">
                              {teacher.name ? teacher.name.charAt(0) : '?'}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-gray-900 dark:text-white">{teacher.name}</h4>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">المادة: {teacher.subject || 'غير محددة'} | {stats.coursesCount} كورس نشط</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xs text-gray-400 block">إيرادات الكورسات</span>
                              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">+{stats.totalRevenue.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-xs text-gray-400 block">إجمالي الطلاب</span>
                              <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">{stats.totalSubscribers} طالب</span>
                            </div>

                            <button className="text-gray-400 p-1 bg-gray-100 dark:bg-[#2D2D3D] rounded-lg">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Courses Details List */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-[#2D2D3D] p-4 bg-white dark:bg-[#161622] rounded-b-2xl animate-in slide-in-from-top-2 duration-200">
                            <h5 className="text-[11px] font-black text-gray-400 mb-2">كورسات المعلم ومبيعاتها بدقة:</h5>
                            
                            {courses.filter(c => c.teacherId === teacher.id).length === 0 ? (
                              <p className="text-center text-xs text-gray-400 py-4 font-bold">لا توجد كورسات مضافة لهذا المعلم بعد.</p>
                            ) : (
                              <div className="overflow-hidden border border-gray-100 dark:border-[#2D2D3D] rounded-xl">
                                <table className="w-full text-right border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-gray-50 dark:bg-[#12121A] border-b border-gray-100 dark:border-[#2D2D3D] text-gray-500 font-bold">
                                      <th className="p-2.5">اسم الكورس</th>
                                      <th className="p-2.5 text-center">السعر</th>
                                      <th className="p-2.5 text-center">الاشتراكات النشطة</th>
                                      <th className="p-2.5 text-left">صافي الإيراد</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D] font-bold text-gray-700 dark:text-gray-300">
                                    {courses.filter(c => c.teacherId === teacher.id).map((course) => {
                                      const rev = getCourseRevenue(course.id);
                                      const subs = getCourseSubscribersCount(course.id);
                                      return (
                                        <tr key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1A1A24]/30">
                                          <td className="p-2.5 font-black text-gray-900 dark:text-white">{course.title}</td>
                                          <td className="p-2.5 text-center font-mono">{course.price || 0} ج.م</td>
                                          <td className="p-2.5 text-center">
                                            <span className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">{subs} طالب</span>
                                          </td>
                                          <td className="p-2.5 text-left text-emerald-600 dark:text-emerald-400 font-mono">+{rev.toLocaleString('ar-EG')} ج.م</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 1.6 ADMIN AUDIT LOG */}
      {isAdmin && (
        <section className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-150 dark:border-[#2D2D3D] shadow-sm">
          <h3 className="text-base font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            سجل العمليات (Audit Log)
          </h3>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#12121A] border-b border-gray-100 dark:border-[#2D2D3D] text-gray-500 font-bold">
                  <th className="p-3">نوع العملية</th>
                  <th className="p-3">التفاصيل</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الشخص المسؤول</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D] text-gray-700 dark:text-gray-300 font-bold">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">لا توجد حركات مالية مسجلة.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1A1A24]/30">
                      <td className="p-3 text-gray-800 dark:text-gray-200 print:text-gray-800">
                        {log.type === 'income' ? (
                          <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> مبيعات
                          </span>
                        ) : (
                          <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-500 px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> مصروفات
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-900 dark:text-white font-black">{log.title}</td>
                      <td className="p-3 font-mono">
                        <span className={log.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                          {log.type === 'income' ? '+' : '-'}{log.amount.toLocaleString('ar-EG')} ج.م
                        </span>
                      </td>
                      <td className="p-3 text-gray-800 dark:text-gray-200 print:text-gray-800">{log.user}</td>
                      <td className="p-3 text-[10px] text-gray-500 font-mono" dir="ltr">
                        {log.date ? new Date(log.date).toLocaleString('ar-EG') : 'غير متوفر'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Teacher Block A: My Courses Revenue Report (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden print:overflow-visible print:min-h-0 print:h-auto min-h-[450px]">
              <div className="shrink-0">
                <h3 className="text-base font-black text-gray-800 dark:text-white">إحصائيات أرباح كورساتي</h3>
                <p className="text-xs text-gray-400 mt-1">تتبع الطلاب المشتركين بدقة والمدفوعات المعتمدة لكل كورس على حدة</p>
              </div>

              <div className="mt-6 flex-1 overflow-y-auto print:overflow-visible scrollbar-thin">
                {myCourses.length === 0 ? (
                  <div className="py-20 text-center text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto opacity-30 mb-3" />
                    <span className="text-sm font-bold">لم تقم بإضافة أي كورسات بعد.</span>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-150 dark:border-[#2D2D3D] rounded-2xl">
                    <table className="w-full text-right border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-[#12121A] border-b border-gray-150 dark:border-[#2D2D3D] text-gray-500 dark:text-gray-400 font-black">
                          <th className="p-4">عنوان الكورس</th>
                          <th className="p-4 text-center">سعر البيع</th>
                          <th className="p-4 text-center">الطلاب المسجلين</th>
                          <th className="p-4 text-left">إيرادات الكورس</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D] font-bold text-gray-700 dark:text-gray-300">
                        {myCourses.map((course) => {
                          const rev = getCourseRevenue(course.id);
                          const subs = getCourseSubscribersCount(course.id);
                          
                          return (
                            <tr key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1E1E2D]/50 transition-colors">
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <span className="font-black text-gray-900 dark:text-white block">{course.title}</span>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">المادة: {course.subject} | الصف: {course.grade}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center font-mono">{course.price || 0} ج.م</td>
                              <td className="p-4 text-center">
                                <span className="bg-blue-50 dark:bg-blue-950/30 text-[#00B4D8] dark:text-blue-400 px-2.5 py-1 rounded-xl text-xs font-black">
                                  {subs} طالب
                                </span>
                              </td>
                              <td className="p-4 text-left font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                +{rev.toLocaleString('ar-EG')} ج.م
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Teacher Block B: Chronological Subscription Log (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden print:overflow-visible print:min-h-0 print:h-auto min-h-[450px]">
              <h3 className="text-base font-black text-gray-800 dark:text-white mb-2 shrink-0">
                سجل الاشتراكات الأخير
              </h3>
              <p className="text-xs text-gray-400 mb-4 shrink-0">تنبيهات فورية بآخر الطلاب المنضمين لكورساتك</p>

              <div className="flex-1 overflow-y-auto print:overflow-visible scrollbar-thin space-y-3.5 pl-1">
                {myRecentSubscribedPayments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Users className="w-10 h-10 opacity-30 mb-2" />
                    <span className="text-xs font-bold">لم يشترك طلاب في كورساتك بعد</span>
                  </div>
                ) : (
                  myRecentSubscribedPayments.map((p) => (
                    <div key={p.id} className="bg-gray-50/50 dark:bg-[#12121A]/30 p-3.5 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900 dark:text-white">{p.userName || 'طالب مجهول'}</span>
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded-lg">اشتراك مؤكد</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">الكورس: <span className="text-[#00B4D8] dark:text-[#D4AF37]">{p.courseTitle}</span></p>
                        <span className="text-[9px] text-gray-400 block font-mono">{p.createdAt ? p.createdAt.split('T')[0] : ''}</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">+{p.coursePrice || p.amount || 0} ج.م</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}



      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-[#2D2D3D] shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-16 h-16 ${confirmModal.type === 'delete' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500'} rounded-full flex items-center justify-center`}>
                  {confirmModal.type === 'delete' ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{confirmModal.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
                    {confirmModal.message}
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-6">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D52] text-gray-700 dark:text-white rounded-xl font-bold transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className={`flex-1 px-4 py-3 ${confirmModal.type === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-xl font-bold transition-colors shadow-lg text-sm`}
                  >
                    تأكيد
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statement Modal */}
      {statementModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto print:static print:h-auto print:block print:p-0 print:z-auto">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm print:hidden" onClick={() => setStatementModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-5xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6 print:w-full print:max-w-none print:max-h-none print:h-auto print:overflow-visible print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:block">
            
            {/* Controls (Hidden in Print) */}
            <div className="w-full md:w-80 space-y-4 md:border-l md:border-gray-150 md:pl-6 print:hidden shrink-0">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-[#2D2D3D]">
                <h3 className="font-black text-sm text-gray-800 dark:text-gray-200">تخصيص كشف الحساب</h3>
                <button onClick={() => {setStatementModalOpen(false); setStatementGenerated(false);}} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0D0D12] text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1">من تاريخ</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={statementStartDate}
                    onChange={(e) => setStatementStartDate(e.target.value)}
                    
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-3 pr-10 py-2.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                  />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1">إلى تاريخ</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={statementEndDate}
                    onChange={(e) => setStatementEndDate(e.target.value)}
                    
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pl-3 pr-10 py-2.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                  />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button 
                onClick={() => setStatementGenerated(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md shadow-purple-600/20"
              >
                توليد كشف الحساب
              </button>
              
              {statementGenerated && (
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  طباعة الكشف
                </button>
              )}
            </div>

            
            {/* Document Preview */}
            <div className="flex-1 bg-white dark:bg-[#0D0D12] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-6 md:p-8 flex flex-col shadow-sm print:border-none print:shadow-none print:p-0 min-h-[500px] print:bg-white print:text-black">
              {!statementGenerated ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 print:hidden">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-bold">قم بتحديد التواريخ وتوليد الكشف للبدء</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-gray-200 dark:border-[#2D2D3D] print:border-gray-200 pb-6">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white print:text-black">كشف حساب مالي تفصيلي</h2>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
                        عن الفترة من: <span className="font-mono">{statementStartDate || 'البداية'}</span> إلى: <span className="font-mono">{statementEndDate || 'الآن'}</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-lg text-[#00B4D8]">Teachland</h3>
                      <p className="text-xs text-gray-400 font-bold">بوابة الإدارة المالية</p>
                      <p className="text-xs text-gray-400 font-bold mt-1">تاريخ الطباعة: {new Date().toLocaleString('en-GB')}</p>
                    </div>
                  </div>

                  {/* Calculations */}
                  {(() => {
                    const filteredPayments = payments.filter(p => {
                      if (!p.createdAt) return false;
                      const d = p.createdAt.split('T')[0];
                      if (statementStartDate && d < statementStartDate) return false;
                      if (statementEndDate && d > statementEndDate) return false;
                      return true;
                    });
                    const filteredExpenses = expenses.filter(e => {
                      if (!e.date) return false;
                      if (statementStartDate && e.date < statementStartDate) return false;
                      if (statementEndDate && e.date > statementEndDate) return false;
                      return true;
                    });

                    let filteredTeacherPayments = filteredPayments;
                    if (isTeacher) {
                       filteredTeacherPayments = filteredPayments.filter(p => p.teacherId === userData?.id);
                    }

                    const totalRev = filteredTeacherPayments.reduce((acc, p) => acc + (p.coursePrice || p.amount || 0), 0);
                    const totalExp = isAdmin ? filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0) : 0;
                    const net = totalRev - totalExp;

                    return (
                      <>
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
                          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 print:border-emerald-100 print:bg-emerald-50">
                            <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400 mb-1">إجمالي الإيرادات</p>
                            <p className="text-base lg:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono print:text-emerald-600 flex items-center gap-1 flex-wrap-reverse whitespace-nowrap">{totalRev.toLocaleString('ar-EG')} <span>ج.م</span></p>
                            <p className="text-[10px] text-emerald-600/50 dark:text-emerald-500 mt-1 font-bold">{filteredTeacherPayments.length} عملية ناجحة</p>
                          </div>
                          {isAdmin && (
                            <div className="bg-rose-50/50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-800/30 print:border-rose-100 print:bg-rose-50">
                              <p className="text-xs font-bold text-rose-600/70 dark:text-rose-400 mb-1">إجمالي المصروفات</p>
                              <p className="text-base lg:text-lg font-black text-rose-600 dark:text-rose-400 font-mono print:text-rose-600 flex items-center gap-1 flex-wrap-reverse whitespace-nowrap">{totalExp.toLocaleString('ar-EG')} <span>ج.م</span></p>
                              <p className="text-[10px] text-rose-600/50 dark:text-rose-500 mt-1 font-bold">{filteredExpenses.length} عملية منصرف</p>
                            </div>
                          )}
                          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30 print:border-blue-100 print:bg-blue-50">
                            <p className="text-xs font-bold text-blue-600/70 dark:text-blue-400 mb-1">الرصيد الصافي</p>
                            <p className={"text-base lg:text-lg font-black font-mono print:text-blue-600 flex items-center gap-1 flex-wrap-reverse whitespace-nowrap " + (net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400')}>
                              {net.toLocaleString('ar-EG')} <span>ج.م</span>
                            </p>
                            <p className="text-[10px] text-blue-600/50 dark:text-blue-500 mt-1 font-bold">للفترة المحددة</p>
                          </div>
                          {isAdmin && (
                             <div className="bg-amber-50/50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30 print:border-amber-100 print:bg-amber-50">
                              <p className="text-xs font-bold text-amber-600/70 dark:text-amber-400 mb-1">هامش الربح</p>
                              <p className="text-base lg:text-lg font-black text-amber-600 dark:text-amber-400 font-mono print:text-amber-600">
                                {totalRev > 0 ? Math.round((net / totalRev) * 100) : 0}%
                              </p>
                              <p className="text-[10px] text-amber-600/50 dark:text-amber-500 mt-1 font-bold">من إجمالي الإيرادات</p>
                            </div>
                          )}
                        </div>

                        {/* Tables */}
                        <div className="space-y-8">
                          <div>
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2D2D3D] print:border-gray-200 pb-2 mb-4">
                              <h4 className="font-black text-gray-800 dark:text-gray-100 text-sm print:text-gray-800">تفصيل إيرادات المبيعات والاشتراكات</h4>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1A1A24] px-2 py-1 rounded-lg print:bg-gray-100 print:text-gray-500">{filteredTeacherPayments.length} عملية</span>
                            </div>
                            
                            {filteredTeacherPayments.length > 0 ? (
                              <div className="overflow-hidden border border-gray-200 dark:border-[#2D2D3D] rounded-xl print:border-gray-200">
                                <table className="w-full text-right text-xs">
                                  <thead className="bg-gray-50 dark:bg-[#1A1A24] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-200">
                                    <tr>
                                      <th className="p-3 font-bold w-12 text-center text-gray-800 dark:text-gray-200 print:text-gray-800">م</th>
                                      <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">التاريخ والوقت</th>
                                      <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">اسم الطالب</th>
                                      <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">البيان (الكورس)</th>
                                      <th className="p-3 font-bold text-left text-gray-800 dark:text-gray-200 print:text-gray-800">المبلغ (ج.م)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D] print:divide-gray-100">
                                    {filteredTeacherPayments.map((p, index) => {
                                      const d = new Date(p.createdAt);
                                      return (
                                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-[#12121A] transition-colors print:hover:bg-transparent">
                                        <td className="p-3 text-center font-bold text-gray-400 dark:text-gray-500 print:text-gray-400">{index + 1}</td>
                                        <td className="p-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap print:text-gray-500">
                                          {d.toLocaleDateString('en-GB')} <span className="text-[10px] opacity-70 ml-1">{d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
                                        </td>
                                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">{p.userName || p.studentName || 'طالب'}</td>
                                        <td className="p-3 text-gray-800 dark:text-gray-200 print:text-gray-800">{p.courseTitle || 'اشتراك كورس'}</td>
                                        <td className="p-3 font-mono text-emerald-600 font-bold text-left">{(p.coursePrice || p.amount || 0).toLocaleString('ar-EG')}</td>
                                      </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="bg-gray-50 dark:bg-[#12121A] border-t border-gray-200 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-200">
                                    <tr>
                                      <td colSpan={4} className="p-3 font-black text-gray-700 dark:text-gray-200 text-left print:text-gray-700">إجمالي الإيرادات</td>
                                      <td className="p-3 font-black font-mono text-emerald-600 text-left">{totalRev.toLocaleString('ar-EG')}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-gray-50 dark:bg-[#12121A] rounded-xl p-8 text-center border border-gray-100 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-100">
                                <p className="text-sm text-gray-500 font-bold">لا توجد عمليات إيرادات في هذه الفترة.</p>
                              </div>
                            )}
                          </div>

                          {isAdmin && (
                            <div>
                              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2D2D3D] print:border-gray-200 pb-2 mb-4">
                                <h4 className="font-black text-gray-800 dark:text-gray-100 text-sm print:text-gray-800">تفصيل المصروفات والمنصرف</h4>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1A1A24] px-2 py-1 rounded-lg print:bg-gray-100 print:text-gray-500">{filteredExpenses.length} عملية</span>
                              </div>
                              {filteredExpenses.length > 0 ? (
                                <div className="overflow-hidden border border-gray-200 dark:border-[#2D2D3D] rounded-xl print:border-gray-200">
                                  <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50 dark:bg-[#1A1A24] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-200">
                                      <tr>
                                        <th className="p-3 font-bold w-12 text-center text-gray-800 dark:text-gray-200 print:text-gray-800">م</th>
                                        <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">تاريخ الصرف</th>
                                        <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">التصنيف</th>
                                        <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">البيان</th>
                                        <th className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">بواسطة</th>
                                        <th className="p-3 font-bold text-left text-gray-800 dark:text-gray-200 print:text-gray-800">المبلغ (ج.م)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D] print:divide-gray-100">
                                      {filteredExpenses.map((e, index) => (
                                        <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-[#12121A] transition-colors print:hover:bg-transparent">
                                          <td className="p-3 text-center font-bold text-gray-400 dark:text-gray-500 print:text-gray-400">{index + 1}</td>
                                          <td className="p-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap print:text-gray-500">{e.date || '-'}</td>
                                          <td className="p-3 text-gray-800 dark:text-gray-200 print:text-gray-800">
                                            <span className="bg-gray-100 dark:bg-[#1A1A24] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold print:bg-gray-100 print:text-gray-600">
                                              {e.category || '-'}
                                            </span>
                                          </td>
                                          <td className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800">{e.title || '-'}</td>
                                          <td className="p-3 text-gray-500 dark:text-gray-400 print:text-gray-500">{e.addedBy || '-'}</td>
                                          <td className="p-3 font-mono text-rose-600 font-bold text-left">{(e.amount || 0).toLocaleString('ar-EG')}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 dark:bg-[#12121A] border-t border-gray-200 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-200">
                                      <tr>
                                        <td colSpan={5} className="p-3 font-black text-gray-700 dark:text-gray-200 text-left print:text-gray-700">إجمالي المصروفات</td>
                                        <td className="p-3 font-black font-mono text-rose-600 text-left">{totalExp.toLocaleString('ar-EG')}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              ) : (
                                <div className="bg-gray-50 dark:bg-[#12121A] rounded-xl p-8 text-center border border-gray-100 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-100">
                                  <p className="text-sm text-gray-500 font-bold">لا توجد عمليات صرف في هذه الفترة.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-8 mt-12 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                           <p>تم استخراج هذا الكشف آلياً من منصة Teachland ولا يحتاج إلى ختم.</p>
                           <p>توقيع الإدارة: ..............................</p>
                        </div>
                      </>
                    );
                                   })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
