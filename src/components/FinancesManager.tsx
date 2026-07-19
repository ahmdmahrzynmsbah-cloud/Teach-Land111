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
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('رواتب ومكافآت');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [addingExpense, setAddingExpense] = useState(false);

  // UI state for expandable teacher rows
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  // UI state for delete confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

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
        ? query(coursesRef, where('teacherId', '==', userData.id))
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
  const confirmDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      // In audit logs, we used exp_ prefix, so we must remove it to get the actual firebase document ID
      const actualId = expenseToDelete.replace('exp_', '');
      await deleteDoc(doc(db, 'expenses', actualId));
      toast.success('تم حذف المصروف بنجاح');
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast.error('حدث خطأ أثناء حذف المصروف');
    } finally {
      setExpenseToDelete(null);
    }
  };

  // --- CALCULATION LOGIC ---

  // Get total course revenue
  const getCourseRevenue = (courseId: string) => {
    const coursePayments = payments.filter(p => p.courseId === courseId);
    return coursePayments.reduce((acc, p) => acc + (p.coursePrice || p.amount || 0), 0);
  };

  // Get total course subscribers
  const getCourseSubscribersCount = (courseId: string) => {
    return payments.filter(p => p.courseId === courseId).length;
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
    <div className="space-y-8" dir="rtl">
      
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
              
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">بيان الصرف / الوصف</label>
                  <input
                    type="text"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="مثال: فاتورة سيرفرات، مكافأة أستاذ، صيانة..."
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:text-white font-bold text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">المبلغ (ج.م)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:text-white font-bold text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">الفئة</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 text-xs font-bold text-gray-700 dark:text-gray-300"
                    >
                      <option value="رواتب ومكافآت">رواتب ومكافآت</option>
                      <option value="صيانة وتشغيل">صيانة وتشغيل</option>
                      <option value="إعلانات وتسويق">إعلانات وتسويق</option>
                      <option value="منصات وسيرفرات">منصات وسيرفرات</option>
                      <option value="أدوات ومستلزمات">أدوات ومستلزمات</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 dark:text-white font-bold text-xs font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingExpense}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  {addingExpense ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      إضافة المصروف للدفتر
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Expenses List Card */}
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[350px]">
              <h3 className="text-base font-black text-gray-800 dark:text-white mb-3 flex items-center gap-2 shrink-0">
                <FileText className="w-5 h-5 text-gray-400" />
                دفتر المصروفات الأخير
              </h3>

              <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pl-1">
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
                          onClick={() => confirmDeleteExpense(exp.id)}
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
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[500px]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="text-base font-black text-gray-800 dark:text-white">حسابات المعلمين التفصيلية</h3>
                  <p className="text-xs text-gray-400 mt-1">تفاصيل كورسات كل معلم، والمشتركين بدقة، والأرباح المحققة</p>
                </div>
                <div className="bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20 px-3 py-1.5 rounded-xl text-xs font-bold">
                  إجمالي المدرسين: {teachers.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3.5 pr-1">
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
          <div className="overflow-x-auto">
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
                      <td className="p-3">
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
                      <td className="p-3">{log.user}</td>
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
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[450px]">
              <div className="shrink-0">
                <h3 className="text-base font-black text-gray-800 dark:text-white">إحصائيات أرباح كورساتي</h3>
                <p className="text-xs text-gray-400 mt-1">تتبع الطلاب المشتركين بدقة والمدفوعات المعتمدة لكل كورس على حدة</p>
              </div>

              <div className="mt-6 flex-1 overflow-y-auto scrollbar-thin">
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
            <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[450px]">
              <h3 className="text-base font-black text-gray-800 dark:text-white mb-2 shrink-0">
                سجل الاشتراكات الأخير
              </h3>
              <p className="text-xs text-gray-400 mb-4 shrink-0">تنبيهات فورية بآخر الطلاب المنضمين لكورساتك</p>

              <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3.5 pl-1">
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

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-[#2D2D3D] shadow-xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">تأكيد الحذف</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
                  هل أنت متأكد من رغبتك في حذف هذا المصروف بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D52] text-gray-700 dark:text-white rounded-xl font-bold transition-colors text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteExpense}
                  className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-500/20 text-sm"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
