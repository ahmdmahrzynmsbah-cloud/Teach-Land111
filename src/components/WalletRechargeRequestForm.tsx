import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { 
  CreditCard, Upload, X, Image as ImageIcon, Clock, CheckCircle, 
  XCircle, Copy, Sparkles, Eye, Info, Coins, Loader2, ArrowLeft, ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

interface WalletRechargeRequestFormProps {
  userData: any;
  linkedStudent?: any;
}

export default function WalletRechargeRequestForm({ userData, linkedStudent }: WalletRechargeRequestFormProps) {
  const { settings } = usePlatformSettings();
  const [amount, setAmount] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [activeFormType, setActiveFormType] = useState<'details' | 'form'>('details');

  const targetUserId = (userData?.role === 'parent' && linkedStudent) ? linkedStudent.id : userData?.id;
  const targetUserObj = (userData?.role === 'parent' && linkedStudent) ? linkedStudent : userData;

  // Real-time listener for student's recharge requests
  useEffect(() => {
    if (!targetUserId) return;

    setLoadingRequests(true);
    const q = query(
      collection(db, 'wallet_charge_requests'),
      where('studentId', '==', targetUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date descending
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRequests(list);
      setLoadingRequests(false);
    }, (error) => {
      console.error("Error listening to charge requests:", error);
      setLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [targetUserId]);

  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${title} بنجاح! 📋`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Validate size (max 800KB for Firestore documents Base64 storage)
    if (file.size > 800 * 1024) {
      toast.error('حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 800 كيلوبايت.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.onerror = () => {
      toast.error('فشل في قراءة ملف الصورة');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    const chargeAmount = parseFloat(amount);
    if (isNaN(chargeAmount) || chargeAmount <= 0) {
      toast.error('يرجى تحديد مبلغ شحن صحيح');
      return;
    }

    if (!imageBase64) {
      toast.error('يرجى إرفاق صورة إيصال الدفع أو التحويل');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'wallet_charge_requests'), {
        studentId: targetUserId,
        studentName: targetUserObj?.name || 'طالب مجهول',
        studentEmail: targetUserObj?.email || '',
        studentPhone: targetUserObj?.phone || '',
        amount: chargeAmount,
        receiptUrl: imageBase64,
        status: 'pending',
        createdAt: new Date().toISOString(),
        adminNotes: '',
        reviewedAt: '',
        reviewedBy: ''
      });

      toast.success('تم إرسال طلب شحن المحفظة بنجاح! قيد المراجعة والتحقق بواسطة الإدارة. 🎉');
      setAmount('');
      setImageFile(null);
      setImageBase64('');
      setActiveFormType('details');
    } catch (error) {
      console.error("Error submitting recharge request:", error);
      toast.error('فشل في إرسال طلب الشحن، يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Choice Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37]">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-right">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">شحن الرصيد عبر التحويل الإلكتروني أو المحافظ البنكية</h3>
              <p className="text-gray-400 dark:text-gray-500 font-bold text-xs mt-0.5">يمكنك التحويل وإرسال صورة الإيصال لشحن محفظتك تلقائياً بعد المراجعة</p>
            </div>
          </div>
          
          <button
            onClick={() => setActiveFormType(activeFormType === 'details' ? 'form' : 'details')}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] hover:scale-105 active:scale-95 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            {activeFormType === 'details' ? (
              <>
                <span>ابدأ عملية الشحن والتحويل</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                <span>عودة لبيانات التحويل</span>
              </>
            )}
          </button>
        </div>

        {activeFormType === 'details' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Payment Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vodafone Cash */}
              {settings.isVodafoneCashEnabled && settings.vodafoneCashNumber && (
                <div className="p-5 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                  <div className="space-y-1 relative z-10 text-right">
                    <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">محفظة إلكترونية</span>
                    <h4 className="text-sm font-black text-gray-800 dark:text-gray-100 mt-2">فودافون كاش / المحافظ الإلكترونية</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold leading-relaxed mt-1">قم بتحويل المبلغ المطلوب إلى الرقم التالي:</p>
                    <p className="text-base font-black text-rose-600 dark:text-rose-400 font-mono tracking-wider mt-2 select-all">{settings.vodafoneCashNumber}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(settings.vodafoneCashNumber, 'رقم المحفظة')}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرقم</span>
                  </button>
                </div>
              )}

              {/* InstaPay */}
              {settings.isInstapayEnabled && settings.instapayHandle && (
                <div className="p-5 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                  <div className="space-y-1 relative z-10 text-right">
                    <span className="text-[10px] font-black text-teal-500 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">انستاباي - InstaPay</span>
                    <h4 className="text-sm font-black text-gray-800 dark:text-gray-100 mt-2">عنوان الدفع الفوري (InstaPay IPN)</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold leading-relaxed mt-1">قم بالتحويل المباشر من تطبيق انستاباي إلى العنوان:</p>
                    <p className="text-sm font-black text-teal-600 dark:text-teal-400 tracking-wide mt-2 select-all">{settings.instapayHandle}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(settings.instapayHandle || '', 'عنوان InstaPay')}
                    className="w-full py-2 bg-teal-500/10 hover:bg-teal-500 hover:text-white dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ العنوان</span>
                  </button>
                </div>
              )}

              {/* Bank Transfer */}
              {settings.isBankAccountEnabled && settings.bankAccountDetails && (
                <div className="p-5 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/10 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                  <div className="space-y-1 relative z-10 text-right">
                    <span className="text-[10px] font-black text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">حساب بنكي رسمي</span>
                    <h4 className="text-sm font-black text-gray-800 dark:text-gray-100 mt-2">تحويل بنكي / إيداع صراف آلي</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold leading-relaxed mt-1">بيانات الحساب البنكي للإيداع والتحويل:</p>
                    <p className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 leading-relaxed mt-2 select-all">{settings.bankAccountDetails}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(settings.bankAccountDetails || '', 'بيانات الحساب البنكي')}
                    className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ بيانات الحساب</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start text-right">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                <p className="font-black mb-1">توجيهات هامة قبل التحويل:</p>
                <ul className="list-decimal list-inside space-y-1">
                  <li>قم بتحويل المبلغ المطلوب من خلال إحدى قنوات الدفع المتاحة بالأعلى أولاً.</li>
                  <li>تأكد من التقاط لقطة شاشة (Screenshot) واضحة تظهر تفاصيل العملية بالكامل، أو تصوير إيصال ماكينة الإيداع.</li>
                  <li>اضغط على زر <span className="font-black text-[#00B4D8] dark:text-[#D4AF37]">"ابدأ عملية الشحن والتحويل"</span> بالركن الأيسر العلوي لتسجيل بيانات تحويلك وإرفاق الصورة.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Charge Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500">مبلغ التحويل / الشحن المطلوب (ج.م) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="مثال: 150"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] dark:text-white font-mono font-black text-base"
                    disabled={isSubmitting}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold text-xs">ج.م</span>
                </div>
              </div>

              {/* Receipt File upload */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500">صورة إيصال التحويل أو لقطة الشاشة *</label>
                {!imageBase64 ? (
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isSubmitting}
                    />
                    <div className="w-full bg-gray-50 dark:bg-[#12121A] hover:bg-gray-100 dark:hover:bg-[#1A1A24]/50 border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] rounded-2xl py-3.5 px-4 text-center transition-all flex items-center justify-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37] group-hover:scale-110 transition-transform">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-gray-700 dark:text-gray-300">اختر صورة إيصال الدفع</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">صيغة JPG/PNG بحد أقصى 800 كيلوبايت</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center gap-2.5 z-10">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-white dark:bg-gray-800">
                        <img src={imageBase64} alt="Receipt preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#0077B6] dark:text-[#D4AF37]">تم إرفاق الإيصال بنجاح</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">{(imageFile?.size ? imageFile.size / 1024 : 0).toFixed(1)} كيلوبايت</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageBase64('');
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer z-10 border-0"
                      title="حذف الصورة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !amount || !imageBase64}
              className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري إرسال طلب الشحن...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5" />
                  <span>تأكيد وإرسال طلب الشحن للإدارة</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Requests History List */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
        <h3 className="text-lg font-black text-gray-900 dark:text-white">طلبات التحويل السابقة وحالتها</h3>
        
        {loadingRequests ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
            <p className="text-xs text-gray-400 font-bold">جاري تحميل طلبات الشحن...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div 
                key={req.id} 
                className="p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/50 bg-gray-50/30 dark:bg-[#12121A]/30 flex justify-between items-start gap-4 relative overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-3 flex-1 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3 animate-pulse" />
                        قيد المراجعة ⏳
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        تم القبول وشحن الرصيد 🎉
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        مرفوض ❌
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">المبلغ المطلوب شحنه</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white font-mono">{req.amount.toLocaleString('ar-EG')} ج.م</p>
                  </div>

                  <p className="text-[10px] text-gray-400 font-bold">
                    تاريخ الطلب: {new Date(req.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {req.status === 'rejected' && req.adminNotes && (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-relaxed mt-2">
                      <span className="font-black">سبب الرفض:</span> {req.adminNotes}
                    </div>
                  )}
                </div>

                {/* Receipt Preview Thumbnail */}
                {req.receiptUrl && (
                  <div className="relative group shrink-0 w-20 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white dark:bg-gray-800">
                    <img src={req.receiptUrl} alt="Receipt image" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setSelectedReceipt(req.receiptUrl)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-300 border-0 cursor-pointer"
                    >
                      <Eye className="w-5 h-5 scale-90 group-hover:scale-100 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-6 font-bold text-sm">لا توجد طلبات شحن سابقة مسجلة.</p>
        )}
      </div>

      {/* Lightbox / High resolution modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReceipt(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-white dark:bg-[#12121A] rounded-3xl overflow-hidden p-2 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all border-0 hover:scale-105 z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={selectedReceipt} alt="Full receipt" className="w-full max-h-[80vh] object-contain rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
