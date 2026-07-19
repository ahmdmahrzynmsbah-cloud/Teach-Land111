const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const deleteFunc = `
  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'course_payments', paymentId));
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success('تم حذف الطلب بنجاح');
    } catch (err) {
      console.error("Error deleting payment:", err);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleApprovePayment`;

code = code.replace("  const handleApprovePayment", deleteFunc);

const uiChange = `
                                  <span className={\`px-2.5 py-1 rounded-lg text-[10px] font-black \${
                                    payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                    payment.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                                    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                  }\`}>
                                    {payment.status === 'approved' ? 'تم القبول' : payment.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                  </span>
                                  <button onClick={() => handleDeletePayment(payment.id)} className="mr-2 text-rose-500 hover:text-rose-700 p-1 bg-rose-50 dark:bg-rose-950/30 rounded-lg" title="حذف الطلب">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                `;

code = code.replace(/<span className={`px-2\.5 py-1 rounded-lg text-\[10px\] font-black \${[\s\S]*?<\/span>\n\s*<\/div>/, uiChange);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
