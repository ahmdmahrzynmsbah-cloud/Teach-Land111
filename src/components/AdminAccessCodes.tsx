import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Copy, Plus, Trash2, Key, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AdminAccessCodes({ userData }: { userData: any }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const q = query(collection(db, 'adminInvitations'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء جلب الأكواد');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      setGenerating(true);
      const code = 'ADMIN-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Valid for 7 days
      
      const newDoc = {
        code,
        createdBy: userData.id,
        createdAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        used: false
      };
      
      const docRef = await addDoc(collection(db, 'adminInvitations'), newDoc);
      setCodes([{ id: docRef.id, ...newDoc }, ...codes]);
      toast.success('تم توليد كود جديد بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء توليد الكود');
    } finally {
      setGenerating(false);
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'adminInvitations', id));
      setCodes(codes.filter(c => c.id !== id));
      toast.success('تم حذف الكود بنجاح');
      setCodeToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ الكود');
  };

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-100 dark:border-[#2D2D3D]/50 shadow-sm relative overflow-hidden mt-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B4D8]/5 rounded-full blur-3xl -z-10"></div>
      
      {codeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-[#2D2D3D]">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-6">هل أنت متأكد من رغبتك في حذف هذا الكود نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteCode(codeToDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setCodeToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-[#3D3D4D] transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B4D8]/20 to-[#0077B6]/20 flex items-center justify-center text-[#00B4D8]">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">أكواد دعوة المديرين</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">توليد وإدارة أكواد التحقق للمديرين الجدد (صالحة لمدة 7 أيام)</p>
          </div>
        </div>
        <button
          onClick={generateCode}
          disabled={generating}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          {generating ? <span className="animate-pulse">جاري التوليد...</span> : <><Plus className="w-4 h-4" /> توليد كود جديد</>}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#00B4D8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-bold">جاري تحميل الأكواد...</p>
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-[#0D0D12]/30 rounded-2xl border border-dashed border-gray-200 dark:border-[#2D2D3D]">
          <Key className="w-12 h-12 mx-auto text-gray-400 mb-4 opacity-50" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد أكواد مولدة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {codes.map(code => {
            const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
            const statusColor = code.used ? 'bg-gray-100 text-gray-500 dark:bg-[#2D2D3D] dark:text-gray-400' : isExpired ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            const statusText = code.used ? 'تم الاستخدام' : isExpired ? 'منتهي الصلاحية' : 'فعال';
            const StatusIcon = code.used ? CheckCircle : isExpired ? Clock : Key;

            return (
              <div key={code.id} className={`p-5 rounded-2xl border ${code.used || isExpired ? 'border-gray-200 dark:border-[#2D2D3D]' : 'border-[#00B4D8]/30 dark:border-[#00B4D8]/30'} bg-white dark:bg-[#1A1A24] relative group transition-all hover:shadow-md`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusColor}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusText}
                  </div>
                  <button
                    onClick={() => setCodeToDelete(code.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="حذف الكود"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <code className="flex-1 text-center font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider text-sm sm:text-base">
                    {code.code}
                  </code>
                  <button
                    onClick={() => copyToClipboard(code.code)}
                    className="p-2.5 bg-white dark:bg-[#1A1A24] text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] shadow-sm rounded-lg border border-gray-200 dark:border-[#2D2D3D] transition-colors"
                    title="نسخ الكود"
                  >
                    <Copy className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold">
                  <span>تم الإنشاء: {format(new Date(code.createdAt), 'dd MMM yyyy', { locale: ar })}</span>
                  {code.expiresAt && !code.used && (
                    <span className={isExpired ? 'text-red-500' : ''}>ينتهي: {format(new Date(code.expiresAt), 'dd MMM yyyy', { locale: ar })}</span>
                  )}
                  {code.used && code.usedAt && (
                    <span>استخدم في: {format(new Date(code.usedAt), 'dd MMM', { locale: ar })}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
