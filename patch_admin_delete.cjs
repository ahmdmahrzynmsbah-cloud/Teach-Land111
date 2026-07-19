const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const target = `      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
      showSuccessToast('تم حذف حساب الطالب بنجاح من قاعدة البيانات', 'delete', userName);`;

const replacement = `      await deleteDoc(doc(db, 'users', id));
      
      // Remove student from all courses they are enrolled in
      const qCourses = query(collection(db, 'courses'), where('enrolledStudentIds', 'array-contains', id));
      const coursesSnap = await getDocs(qCourses);
      const updatePromises = coursesSnap.docs.map(courseDoc => {
        const courseData = courseDoc.data();
        const newEnrolledIds = (courseData.enrolledStudentIds || []).filter(enrolledId => enrolledId !== id);
        return updateDoc(doc(db, 'courses', courseDoc.id), {
          enrolledStudentIds: newEnrolledIds,
          enrolledStudents: newEnrolledIds.length
        });
      });
      await Promise.all(updatePromises);
      
      setUsers(prev => prev.filter(u => u.id !== id));
      showSuccessToast('تم حذف حساب الطالب بنجاح من قاعدة البيانات', 'delete', userName);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
