const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add State
const stateToAdd = `  const [deletePaymentModalOpen, setDeletePaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);`;

code = code.replace("  // Delete Modal State", stateToAdd + "\n  // Delete Modal State");

// Update onClick to open modal
code = code.replace(
  "onClick={() => handleDeletePayment(payment.id)} className=\"mr-2 text-rose-500 hover:text-rose-700 p-1 bg-rose-50 dark:bg-rose-950/30 rounded-lg\" title=\"حذف الطلب\"",
  "onClick={() => { setPaymentToDelete(payment.id); setDeletePaymentModalOpen(true); }} className=\"mr-2 text-rose-500 hover:text-rose-700 p-1 bg-rose-50 dark:bg-rose-950/30 rounded-lg\" title=\"حذف الطلب\""
);

// Update handleDeletePayment to remove window.confirm and use the paymentToDelete state if paymentId is not provided
code = code.replace(
  "const handleDeletePayment = async (paymentId: string) => {\n    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;",
  "const handleDeletePayment = async () => {\n    const id = paymentToDelete;\n    if (!id) return;"
);
code = code.replace(
  "await deleteDoc(doc(db, 'course_payments', paymentId));",
  "await deleteDoc(doc(db, 'course_payments', id));"
);
code = code.replace(
  "setPayments(prev => prev.filter(p => p.id !== paymentId));",
  "setPayments(prev => prev.filter(p => p.id !== id));\n      setDeletePaymentModalOpen(false);\n      setPaymentToDelete(null);"
);

// Add Modal JSX right before Delete Confirmation Modal for Users
const modalJsx = `      {/* Delete Payment Confirmation Modal */}
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

      {/* Delete Confirmation Modal */}`;

code = code.replace("{/* Delete Confirmation Modal */}", modalJsx);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
