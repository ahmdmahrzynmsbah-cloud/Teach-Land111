import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SupportRequest } from '../types';
import { Mail, Phone, Calendar, CheckCircle, Trash2, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportRequestsAdmin() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'support_requests'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportRequest[];
      
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching support requests:', error);
      toast.error('حدث خطأ أثناء جلب طلبات المراسلة');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'support_requests', id), {
        status: 'resolved'
      });
      toast.success('تم تحديد الطلب كمنجز');
    } catch (error) {
      console.error('Error resolving request:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    try {
      await deleteDoc(doc(db, 'support_requests', id));
      toast.success('تم حذف الطلب بنجاح');
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('حدث خطأ أثناء حذف الطلب');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'غير متوفر';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
          طلبات المراسلة (الدعم الفني)
        </h2>
        <div className="bg-white dark:bg-[#1A1A24] px-4 py-2 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex items-center gap-2">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">إجمالي الطلبات:</span>
          <span className="bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-2 py-1 rounded-lg text-sm font-black">
            {requests.length}
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D]">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد طلبات مراسلة حالياً</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(request => (
            <div 
              key={request.id} 
              className={`bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border transition-all ${
                request.status === 'resolved' 
                  ? 'border-gray-100 dark:border-[#2D2D3D] opacity-75' 
                  : 'border-[#00B4D8]/30 dark:border-[#D4AF37]/30 shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="space-y-2 text-right">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">{request.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                      request.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {request.status === 'resolved' ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> منجز</>
                      ) : (
                        <><Clock className="w-3.5 h-3.5" /> قيد الانتظار</>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5" dir="ltr">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{request.emailOrPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleResolve(request.id!)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      تحديد كمنجز
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(request.id!)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-black transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0D0D12] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {request.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
