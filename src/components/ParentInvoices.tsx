import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Receipt, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  itemId: string;
  itemTitle: string;
  amount: number;
  date: string;
  status: string;
}

export default function ParentInvoices({ userData, linkedStudent }: { userData: any, linkedStudent: any }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkedStudent?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'store_orders'),
      where('studentId', '==', linkedStudent.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInvoices(list);
      setLoading(false);
    });

    return () => unsub();
  }, [linkedStudent]);

  if (userData?.role !== 'parent') return null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">الفواتير والمشتريات</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">
              سجل مشتريات الطالب: <span className="text-[#00B4D8]">{linkedStudent?.name || 'غير متصل'}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 font-bold">جاري تحميل الفواتير...</div>
        ) : invoices.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-[#12121A] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-gray-400 opacity-50" />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white mb-1">لا توجد فواتير</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">لم يقم الطالب بأي عمليات شراء من المتجر بعد.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-gray-50 dark:bg-[#12121A] p-5 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#00B4D8]/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-[#1A1A24] rounded-xl flex items-center justify-center border border-gray-100 dark:border-[#2D2D3D] shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">{inv.itemTitle}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(inv.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مدفوعة
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-sm text-gray-500 dark:text-gray-400 block font-bold mb-1">المبلغ الإجمالي</span>
                  <span className="text-xl font-black text-gray-900 dark:text-white font-mono">{inv.amount} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
