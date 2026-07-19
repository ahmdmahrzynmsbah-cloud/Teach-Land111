const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const updatedExecuteDelete = `  const executeDelete = async () => {
    if (!userToDelete) return;
    
    const id = userToDelete;
    setDeleteModalOpen(false);

    try {
      const deletedUser = users.find(u => u.id === id);
      const userName = deletedUser ? deletedUser.name : '';
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
      showSuccessToast('تم حذف حساب الطالب بنجاح من قاعدة البيانات', 'delete', userName);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error('فشل حذف المستخدم. تأكد من الصلاحيات.');
    } finally {
      setTimeout(() => setUserToDelete(null), 500);
    }
  };`;

code = code.replace(/  const executeDelete = async \(\) => \{[\s\S]*?toast\.error\('فشل حذف المستخدم\. تأكد من الصلاحيات\.'\);\n    \}\n  \};/, updatedExecuteDelete);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
