import React, { useState, useEffect } from 'react';
import { 
  db 
} from '../lib/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  User as UserIcon, 
  Sparkles, 
  Check, 
  X, 
  Calendar, 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone, 
  MapPin, 
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface SubscriptionRequestsProps {
  adminUserData?: any;
}

export default function SubscriptionRequests({ adminUserData }: SubscriptionRequestsProps) {
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'qudurat' | 'tahsili' | 'both'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Real-time Firestore subscription for special registration requests
  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isSpecialRegistration', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests: User[] = [];
      snapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data() } as User);
      });
      // Sort by creation date (newest first)
      fetchedRequests.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRequests(fetchedRequests);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to subscription requests:", error);
      toast.error("حدث خطأ أثناء تحميل طلبات الاشتراك");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'غير محدد';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Approval Handler
  const handleApprove = async (user: User) => {
    setProcessingId(user.id);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: 'approved',
        isApproved: true
      });
      toast.success(`تم قبول وتفعيل طلب الطالب ${user.name} بنجاح! 🎉`);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error('فشل في قبول الطلب، يرجى المحاولة لاحقاً.');
    } finally {
      setProcessingId(null);
    }
  };

  // Rejection Handler
  const handleReject = async (user: User) => {
    if (!window.confirm(`هل أنت متأكد من رفض طلب الطالب ${user.name}؟`)) return;
    setProcessingId(user.id);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: 'rejected',
        isApproved: false
      });
      toast.error(`تم رفض طلب الطالب ${user.name} ❌`);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error('فشل في رفض الطلب، يرجى المحاولة لاحقاً.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter and Search requests
  const filteredRequests = requests.filter((req) => {
    // Search query match
    const nameMatch = (req.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (req.phone || '').includes(searchQuery);
    const govMatch = (req.governorate || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch || govMatch;

    // Status filter match
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    // Type filter match
    let matchesType = false;
    if (typeFilter === 'all') {
      matchesType = true;
    } else if (typeFilter === 'qudurat') {
      matchesType = req.registrationType === 'qudurat' || req.registrationType === 'both';
    } else if (typeFilter === 'tahsili') {
      matchesType = req.registrationType === 'tahsili' || req.registrationType === 'both';
    } else if (typeFilter === 'both') {
      matchesType = req.registrationType === 'both';
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-[2rem] border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            طلبات الاشتراكات الخاصة
          </h3>
          <p className="text-xs font-bold text-gray-400 mt-1">
            مراجعة وتفعيل حسابات الطلاب الجدد المسجلين بمسارات القدرات والتحصيلي الخاصة
          </p>
        </div>

        {/* Count indicators */}
        <div className="flex flex-wrap gap-2">
          <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black px-3.5 py-2 rounded-xl border border-amber-200/30 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>معلق:</span>
            <span>{requests.filter(r => r.status === 'pending').length}</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black px-3.5 py-2 rounded-xl border border-emerald-200/30 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>مقبول:</span>
            <span>{requests.filter(r => r.status === 'approved').length}</span>
          </div>
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black px-3.5 py-2 rounded-xl border border-red-200/30 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            <span>مرفوض:</span>
            <span>{requests.filter(r => r.status === 'rejected').length}</span>
          </div>
        </div>
      </div>

      {/* Control panel (Filters + Search) */}
      <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-[2rem] border border-gray-100 dark:border-[#2D2D3D] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، أو المحافظة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-11 py-3 rounded-2xl bg-gray-50 dark:bg-[#0D0D12] text-sm text-gray-900 dark:text-white border border-gray-100 dark:border-[#2D2D3D]/50 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all font-bold placeholder:text-gray-400"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 shrink-0">الحالة:</span>
            <div className="flex bg-gray-50 dark:bg-[#0D0D12] p-1 rounded-xl border border-gray-100 dark:border-[#2D2D3D]/50 w-full">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-[#2D2D3D]'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {status === 'pending' && 'معلق'}
                  {status === 'approved' && 'مقبول'}
                  {status === 'rejected' && 'مرفوض'}
                  {status === 'all' && 'الكل'}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 shrink-0">المسار:</span>
            <div className="flex bg-gray-50 dark:bg-[#0D0D12] p-1 rounded-xl border border-gray-100 dark:border-[#2D2D3D]/50 w-full">
              {(['all', 'qudurat', 'tahsili', 'both'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    typeFilter === type
                      ? 'bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-[#2D2D3D]'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {type === 'all' && 'الكل'}
                  {type === 'qudurat' && 'القدرات'}
                  {type === 'tahsili' && 'التحصيلي'}
                  {type === 'both' && 'الاثنين'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main requests list represented as a table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-[#1A1A24] rounded-[2.5rem] border border-gray-100 dark:border-[#2D2D3D]">
          <RefreshCw className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37] animate-spin mb-4" />
          <p className="text-sm font-black text-gray-400">جاري تحميل طلبات الاشتراك...</p>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="bg-white dark:bg-[#1A1A24] rounded-[2rem] border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2D2D3D]">
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F]">الطالب</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F]">رقم الهاتف</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F]">المحافظة</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F]">المسار الدراسي</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F]">تاريخ الطلب</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F]">الحالة</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 bg-gray-50/50 dark:bg-[#15151F] text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredRequests.map((user) => (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50/30 dark:hover:bg-[#1e1e2d]/40 transition-colors"
                    >
                      {/* Name with icon avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="font-black text-sm text-gray-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>

                      {/* Phone number */}
                      <td className="py-4 px-6 text-xs font-bold text-gray-600 dark:text-gray-300" dir="ltr">
                        {user.phone}
                      </td>

                      {/* Governorate */}
                      <td className="py-4 px-6 text-xs font-bold text-gray-600 dark:text-gray-300">
                        {user.governorate || 'غير محدد'}
                      </td>

                      {/* Path/Registration type */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                          user.registrationType === 'qudurat' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30' 
                            : user.registrationType === 'tahsili'
                              ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-900/30'
                              : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/30'
                        }`}>
                          {user.registrationType === 'qudurat' && 'مسار القدرات'}
                          {user.registrationType === 'tahsili' && 'مسار التحصيلي'}
                          {(user.registrationType === 'both' || !user.registrationType) && 'القدرات والتحصيلي'}
                        </span>
                      </td>

                      {/* Request Date */}
                      <td className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black ${
                          user.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : user.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'approved'
                              ? 'bg-emerald-500'
                              : user.status === 'rejected'
                                ? 'bg-red-500'
                                : 'bg-amber-500 animate-pulse'
                          }`} />
                          {user.status === 'approved' && 'مقبول ومفعل'}
                          {user.status === 'rejected' && 'مرفوض'}
                          {user.status === 'pending' && 'قيد الانتظار'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleApprove(user)}
                            disabled={processingId === user.id || user.status === 'approved'}
                            title="قبول وتفعيل الطلب"
                            className={`p-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              user.status === 'approved'
                                ? 'bg-gray-100 dark:bg-[#1F1F2A] text-gray-400 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {user.status !== 'approved' && <span className="text-[10px] pl-1 font-bold">قبول</span>}
                          </button>

                          <button
                            onClick={() => handleReject(user)}
                            disabled={processingId === user.id || user.status === 'rejected'}
                            title="رفض الطلب"
                            className={`p-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              user.status === 'rejected'
                                ? 'bg-gray-100 dark:bg-[#1F1F2A] text-gray-400 cursor-not-allowed'
                                : 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:text-red-400 border border-red-100/50 dark:border-red-900/20'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            {user.status !== 'rejected' && <span className="text-[10px] pl-1 font-bold">رفض</span>}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-24 bg-white dark:bg-[#1A1A24] rounded-[3rem] border border-dashed border-gray-200 dark:border-[#2D2D3D] text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#0D0D12] rounded-3xl flex items-center justify-center mx-auto mb-5 text-gray-300 dark:text-gray-800">
            <Sparkles className="w-10 h-10" />
          </div>
          <h4 className="text-base font-black text-gray-900 dark:text-white">لا توجد طلبات اشتراكات مطابقة للبحث</h4>
          <p className="text-xs font-bold text-gray-400 mt-2 max-w-xs mx-auto">
            يمكنك تغيير الفلاتر أو كلمة البحث في الأعلى للوصول للطلبات الأخرى
          </p>
        </div>
      )}
    </div>
  );
}
