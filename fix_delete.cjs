const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const updatedHandleDeletePayment = `  const handleDeletePayment = async () => {
    const id = paymentToDelete;
    if (!id) return;
    
    // Close modal first for snappy UI
    setDeletePaymentModalOpen(false);
    
    try {
      await deleteDoc(doc(db, 'course_payments', id));
      setPayments(prev => prev.filter(p => p.id !== id));
      toast.success('تم حذف الطلب بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      // Clear the id after animation should have finished
      setTimeout(() => setPaymentToDelete(null), 500);
    }
  };`;

code = code.replace(/  const handleDeletePayment = async \(\) => \{[\s\S]*?toast\.error\('حدث خطأ أثناء الحذف'\);\n    \}\n  \};/, updatedHandleDeletePayment);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
