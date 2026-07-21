import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { BookOpen, Plus, Trash2, Loader2, FileText, FolderOpen, Edit2 } from 'lucide-react';
import ComprehensiveBankBuilder from './ComprehensiveBankBuilder';

interface BankQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuestionBank {
  id: string;
  teacherId: string;
  title: string;
  subject: string;
  questions: BankQuestion[];
  createdAt: any;
}

export default function TeacherQuestionBank({ userData }: { userData: any }) {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);

  useEffect(() => {
    if (userData?.id) {
      loadBanks();
    }
  }, [userData]);

  const loadBanks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'questionBanks'), where('teacherId', '==', userData.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionBank));
      // sort by newest
      data.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0);
      setBanks(data);
      if (data.length > 0) {
        setSelectedBank(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل بنوك الأسئلة');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBankId(null);
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (bank: QuestionBank) => {
    setEditingBankId(bank.id);
    setIsBuilderOpen(true);
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف بنك الأسئلة بالكامل؟')) return;
    try {
      await deleteDoc(doc(db, 'questionBanks', bankId));
      setBanks(prev => prev.filter(b => b.id !== bankId));
      if (selectedBank?.id === bankId) {
        setSelectedBank(null);
      }
      toast.success('تم حذف بنك الأسئلة');
    } catch (err) {
      console.error(err);
      toast.error('فشل الحذف');
    }
  };

  const onSaveSuccess = (bankData: any) => {
    setBanks(prev => {
      const exists = prev.find(b => b.id === bankData.id);
      if (exists) {
        return prev.map(b => b.id === bankData.id ? bankData : b);
      }
      return [bankData, ...prev];
    });
    setSelectedBank(bankData);
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">بنك الأسئلة الخاص بي</h2>
              <p className="text-gray-500 dark:text-gray-400 font-bold text-xs mt-1">
                قم بإنشاء بنوك أسئلة لموادك لتوليد اختبارات سريعة وعشوائية للطلاب
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="w-full md:w-auto px-6 py-3 bg-[#00B4D8] hover:bg-[#0077B6] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>إنشاء بنك أسئلة جديد</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
            <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banks List */}
            <div className="lg:col-span-1 space-y-3 border-l-0 lg:border-l border-gray-100 dark:border-[#2D2D3D] pl-0 lg:pl-6">
              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">قائمة بنوك الأسئلة</h3>
              {banks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-dashed border-gray-200 dark:border-[#2D2D3D]">
                  <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-500">لا يوجد بنوك أسئلة حالياً</p>
                </div>
              ) : (
                banks.map(bank => (
                  <div key={bank.id} className="relative group">
                    <button
                      onClick={() => setSelectedBank(bank)}
                      className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedBank?.id === bank.id
                          ? 'border-[#00B4D8] bg-[#00B4D8]/5 dark:border-[#D4AF37] dark:bg-[#D4AF37]/5'
                          : 'border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#1E1E2A]'
                      }`}
                    >
                      <h4 className="font-black text-gray-800 dark:text-white text-sm">{bank.title}</h4>
                      {bank.subject && <p className="text-xs text-gray-500 font-bold mt-1">{bank.subject}</p>}
                      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 font-bold">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {bank.questions?.length || 0} أسئلة</span>
                      </div>
                    </button>
                    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleOpenEdit(bank)} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100" title="تعديل البنك">
                         <Edit2 className="w-3 h-3" />
                       </button>
                       <button onClick={() => handleDeleteBank(bank.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100" title="حذف البنك">
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Bank Details */}
            <div className="lg:col-span-2">
              {selectedBank ? (
                <div className="bg-gray-50/50 dark:bg-[#0D0D12]/20 rounded-2xl p-6 border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-[#2D2D3D] pb-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">{selectedBank.title}</h3>
                      <p className="text-xs text-gray-500 font-bold mt-1">
                        يحتوي هذا البنك على {selectedBank.questions?.length || 0} أسئلة
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(selectedBank)}
                      className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0077B6] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>تعديل البنك والأسئلة</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pl-2 pr-2 scroll-smooth">
                    {(!selectedBank.questions || selectedBank.questions.length === 0) ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 font-bold text-sm">لم تقم بإضافة أي أسئلة لهذا البنك بعد</p>
                        <p className="text-gray-400 font-bold text-xs mt-1">انقر على "تعديل البنك" لإضافة الأسئلة</p>
                      </div>
                    ) : (
                      selectedBank.questions.map((q, idx) => (
                        <div key={q.id || idx} className="bg-white dark:bg-[#1A1A24] rounded-2xl p-4 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2D2D3D] text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {q.text}
                              </p>
                              
                              {(q as any).type !== 'essay' && q.options && q.options.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, optIdx) => (
                                    <div 
                                      key={optIdx} 
                                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                        optIdx === ((q as any).correctOptionIndex ?? q.correctAnswer)
                                          ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 text-green-700 dark:text-green-400' 
                                          : 'border-gray-100 dark:border-[#2D2D3D] bg-gray-50 dark:bg-[#0D0D12] text-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        optIdx === ((q as any).correctOptionIndex ?? q.correctAnswer) ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
                                      }`}>
                                        {optIdx === ((q as any).correctOptionIndex ?? q.correctAnswer) && <div className="w-2 h-2 bg-white rounded-full" />}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {q.explanation && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block mb-1">الشرح / التبرير:</span>
                                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 dark:bg-[#0D0D12]/20 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                  <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-black text-gray-400 dark:text-gray-500">اختر بنك أسئلة من القائمة</h3>
                  <p className="text-xs text-gray-400 font-bold mt-2 max-w-sm mx-auto">
                    قم باختيار أحد بنوك الأسئلة لعرض الأسئلة الموجودة به، أو قم بإنشاء بنك جديد.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ComprehensiveBankBuilder 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        db={db}
        userData={userData}
        editingBankId={editingBankId}
        existingBankData={editingBankId ? banks.find(b => b.id === editingBankId) : null}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  );
}
