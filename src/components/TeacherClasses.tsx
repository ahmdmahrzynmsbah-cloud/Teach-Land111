import React from "react";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, BookOpen, Clock, ImageIcon, X, Image as ImageIcon2, Upload, Eye, EyeOff, Search, AlertTriangle, Printer, Phone, Mail, MapPin } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';
import LuxuriousLoader from './LuxuriousLoader';
import { compressImageToBase64 } from '../lib/upload';
import { toast, Toaster } from 'react-hot-toast';

interface TeacherClassesProps {
  userData: User;
}

export default function TeacherClasses({ userData }: TeacherClassesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Manage Students State
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<User | null>(null);
  const [studentProgressMap, setStudentProgressMap] = useState<Record<string, any>>({});

  // Form State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = async () => {
    if (!userData?.id) return;
    try {
      const q = query(collection(db, 'courses'), where('teacherId', '==', userData.id));
      const querySnapshot = await getDocs(q);
      const fetchedCourses: Course[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(fetchedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userData?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGrade('');
    setPrice('');
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setEditingCourse(null);
    setShowCreateModal(false);
  };

  const handleEditCourseClick = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setGrade(course.grade);
    setPrice(String(course.price));
    setImagePreview(course.imageUrl || '');
    setImageFile(null);
    setShowCreateModal(true);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !grade || !price) {
      toast.error('الرجاء إكمال جميع الحقول');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await compressImageToBase64(imageFile, 800, 600);
      }

      if (editingCourse) {
        // Edit Mode
        const courseRef = doc(db, 'courses', editingCourse.id);
        const updatedFields = {
          title: title.trim(),
          description: description.trim(),
          grade,
          price: Number(price),
          imageUrl
        };

        await updateDoc(courseRef, updatedFields);

        setCourses(courses.map(c => 
          c.id === editingCourse.id 
            ? { ...c, ...updatedFields } 
            : c
        ));

        resetForm();
        toast.success('تم تحديث الكورس بنجاح! ✨');
      } else {
        // Create Mode
        const newCourseData = {
          title: title.trim(),
          description: description.trim(),
          grade,
          price: Number(price),
          teacherId: userData.id,
          teacherName: userData.name,
          subject: userData.subject || '',
          imageUrl,
          enrolledStudents: 0,
          lessonsCount: 0,
          isActive: true,
          status: 'published',
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'courses'), newCourseData);
        setCourses([...courses, { id: docRef.id, ...newCourseData } as Course]);
        
        // Dispatch notifications to students of this grade
        try {
          const studentsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('grade', '==', grade)
          );
          const studentsSnap = await getDocs(studentsQuery);
          const notificationPromises = studentsSnap.docs.map(studentDoc => {
            return addDoc(collection(db, 'notifications'), {
              userId: studentDoc.id,
              title: 'كورس جديد متاح لصفك الدراسي! 📚',
              message: `قام الأستاذ ${userData.name} بنشر كورس جديد بعنوان "${title}" في مادة ${userData.subject || 'مادته الدراسية'}.`,
              type: 'new_course_alert',
              read: false,
              createdAt: new Date().toISOString(),
              courseId: docRef.id
            });
          });
          await Promise.all(notificationPromises);
        } catch (notifErr) {
          console.error("Error creating notifications for new course:", notifErr);
        }
        
        resetForm();
        toast.success('تم إنشاء الكورس بنجاح!');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(editingCourse ? 'حدث خطأ أثناء تحديث الكورس' : 'حدث خطأ أثناء إنشاء الكورس');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourseConfirm = async () => {
    if (!courseToDelete) return;
    try {
      await deleteDoc(doc(db, 'courses', courseToDelete));
      setCourses(courses.filter(c => c.id !== courseToDelete));
      toast.success('تم حذف الكورس بنجاح');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error('حدث خطأ أثناء حذف الكورس: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setCourseToDelete(null);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
  };

  const handleOpenManageStudents = async (course: Course) => {
    setSelectedCourseForStudents(course);
    setShowManageStudentsModal(true);
    setLoadingStudents(true);
    try {
      const enrolledIds = course.enrolledStudentIds || [];
      const suspendedIds = course.suspendedStudentIds || [];
      const allStudentIds = [...new Set([...enrolledIds, ...suspendedIds])];
      if (allStudentIds.length === 0) {
        setCourseStudents([]);
        setStudentProgressMap({});
        return;
      }

      // Fetch users
      const fetchedUsers: User[] = [];
      const progMap: Record<string, any> = {};
      
      // Batch promises
      const userPromises = allStudentIds.map(id => getDoc(doc(db, 'users', id)));
      const progressPromises = allStudentIds.map(id => getDoc(doc(db, 'course_progress', `${id}_${course.id}`)));
      
      const userDocs = await Promise.all(userPromises);
      const progressDocs = await Promise.all(progressPromises);
      
      userDocs.forEach((uDoc, index) => {
        if (uDoc.exists()) {
          fetchedUsers.push({ id: uDoc.id, ...uDoc.data() } as User);
        }
        const pDoc = progressDocs[index];
        if (pDoc.exists()) {
          progMap[uDoc.id] = pDoc.data();
        }
      });
      
      setCourseStudents(fetchedUsers);
      setStudentProgressMap(progMap);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الطلاب');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleStudentStatus = async (studentId: string) => {
    if (!selectedCourseForStudents) return;
    
    try {
      const courseRef = doc(db, 'courses', selectedCourseForStudents.id);
      
      const isSuspended = selectedCourseForStudents.suspendedStudentIds?.includes(studentId);
      
      if (isSuspended) {
        // Unsuspend: add to enrolled, remove from suspended
        const newSuspended = (selectedCourseForStudents.suspendedStudentIds || []).filter(id => id !== studentId);
        const newEnrolled = [...(selectedCourseForStudents.enrolledStudentIds || []), studentId];
        
        await updateDoc(courseRef, {
          suspendedStudentIds: newSuspended,
          enrolledStudentIds: newEnrolled,
          enrolledStudents: newEnrolled.length
        });
        
        setCourses(courses.map(c => 
          c.id === selectedCourseForStudents.id 
            ? { ...c, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length }
            : c
        ));
        
        setSelectedCourseForStudents(prev => prev ? { ...prev, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length } : null);
        toast.success('تم تفعيل الكورس للطالب بنجاح');
      } else {
        // Suspend: add to suspended, remove from enrolled
        const newEnrolled = (selectedCourseForStudents.enrolledStudentIds || []).filter(id => id !== studentId);
        const newSuspended = [...(selectedCourseForStudents.suspendedStudentIds || []), studentId];
        
        await updateDoc(courseRef, {
          suspendedStudentIds: newSuspended,
          enrolledStudentIds: newEnrolled,
          enrolledStudents: newEnrolled.length
        });
        
        setCourses(courses.map(c => 
          c.id === selectedCourseForStudents.id 
            ? { ...c, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length }
            : c
        ));
        
        setSelectedCourseForStudents(prev => prev ? { ...prev, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length } : null);
        toast.success('تم إلغاء تفعيل الكورس للطالب');
      }
    } catch (err) {
      console.error('Error toggling student status:', err);
      toast.error('حدث خطأ أثناء تغيير حالة الطالب');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourseForStudents) return;
    if (!window.confirm("هل أنت متأكد من حذف الطالب من الكورس نهائياً؟")) return;
    
    try {
      const courseRef = doc(db, 'courses', selectedCourseForStudents.id);
      
      const newEnrolled = (selectedCourseForStudents.enrolledStudentIds || []).filter(id => id !== studentId);
      const newSuspended = (selectedCourseForStudents.suspendedStudentIds || []).filter(id => id !== studentId);
      
      await updateDoc(courseRef, {
        enrolledStudents: newEnrolled.length,
        enrolledStudentIds: newEnrolled,
        suspendedStudentIds: newSuspended
      });
      
      setCourseStudents(prev => prev.filter(u => u.id !== studentId));
      setCourses(prev => prev.map(c => 
        c.id === selectedCourseForStudents.id 
          ? { ...c, enrolledStudents: newEnrolled.length, enrolledStudentIds: newEnrolled, suspendedStudentIds: newSuspended }
          : c
      ));
      setSelectedCourseForStudents(prev => prev ? { ...prev, enrolledStudents: newEnrolled.length, enrolledStudentIds: newEnrolled, suspendedStudentIds: newSuspended } : null);
      
      toast.success('تم إزالة الطالب بنجاح');
      if (selectedStudentDetails?.id === studentId) {
        setSelectedStudentDetails(null);
      }
    } catch (err) {
      console.error('Error removing student:', err);
      toast.error('حدث خطأ أثناء إزالة الطالب');
    }
  };

  const handlePrintStudentReport = (student: User) => {
    const progress = studentProgressMap[student.id] || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>تقرير الأداء الأكاديمي - ${student.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 2cm; }
          </style>
        </head>
        <body class="bg-gray-50 text-gray-900 p-8">
          <div class="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
            <!-- Header -->
            <div class="flex items-center justify-between border-b-2 border-gray-100 pb-8 mb-8">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                  ${selectedCourseForStudents?.title.charAt(0)}
                </div>
                <div>
                  <h1 class="text-3xl font-black text-gray-900 mb-1">تقرير الأداء الأكاديمي</h1>
                  <p class="text-gray-500 font-semibold text-lg">${selectedCourseForStudents?.title}</p>
                </div>
              </div>
              <div class="text-left flex flex-col items-end">
                <p class="text-gray-500 font-semibold mb-1 text-left w-full">تاريخ الإصدار</p>
                <p class="text-gray-900 font-bold text-lg text-left w-full" dir="ltr" style="text-align: left;">${new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            <!-- Student Info -->
            <div class="bg-gray-50 rounded-2xl p-6 mb-8">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span class="w-2 h-6 bg-blue-500 rounded-full"></span>
                بيانات الطالب
              </h2>
              <div class="grid grid-cols-2 gap-6">
                <div class="flex flex-col items-start">
                  <p class="text-gray-500 text-sm font-semibold mb-1">اسم الطالب</p>
                  <p class="text-gray-900 font-bold text-lg">${student.name}</p>
                </div>
                <div class="flex flex-col items-start">
                  <p class="text-gray-500 text-sm font-semibold mb-1">رقم الهاتف</p>
                  <p class="text-gray-900 font-bold text-lg text-right w-full" dir="ltr" style="text-align: right;">${student.phone || 'غير متوفر'}</p>
                </div>
                <div class="flex flex-col items-start">
                  <p class="text-gray-500 text-sm font-semibold mb-1">البريد الإلكتروني</p>
                  <p class="text-gray-900 font-bold text-lg text-right w-full" dir="ltr" style="text-align: right;">${student.email || 'غير متوفر'}</p>
                </div>
                <div class="flex flex-col items-start">
                  <p class="text-gray-500 text-sm font-semibold mb-1">المحافظة</p>
                  <p class="text-gray-900 font-bold text-lg">${student.governorate || 'غير متوفر'}</p>
                </div>
              </div>
            </div>

            <!-- Progress Stats -->
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span class="w-2 h-6 bg-green-500 rounded-full"></span>
                إحصائيات التقدم
              </h2>
              <div class="grid grid-cols-3 gap-6">
                <div class="bg-white border-2 border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <p class="text-gray-500 font-semibold mb-2">نسبة الإنجاز</p>
                  <p class="text-4xl font-black text-blue-600 text-center w-full" dir="ltr" style="text-align: center;">${progress.progressPercent || 0}%</p>
                </div>
                <div class="bg-white border-2 border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <p class="text-gray-500 font-semibold mb-2">الدروس المكتملة</p>
                  <p class="text-4xl font-black text-gray-900 text-center w-full">${progress.completedLessons?.length || 0}</p>
                </div>
                <div class="bg-white border-2 border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <p class="text-gray-500 font-semibold mb-2">آخر مشاهدة</p>
                  <p class="text-lg font-bold text-gray-900 mt-2 text-center w-full">${progress.lastWatchedAt ? new Date(progress.lastWatchedAt).toLocaleDateString('ar-EG') : 'لم يبدأ'}</p>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="mt-16 pt-8 border-t-2 border-gray-100 text-center text-gray-500 font-semibold">
              هذا التقرير تم إصداره آلياً من المنصة ولا يحتاج إلى توقيع.
            </div>
          </div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = currentStatus === undefined ? false : !currentStatus;
      await updateDoc(doc(db, 'courses', courseId), {
        isActive: newStatus,
        status: newStatus ? 'published' : 'draft'
      });
      setCourses(courses.map(c => c.id === courseId ? { ...c, isActive: newStatus, status: newStatus ? 'published' : 'draft' } as Course : c));
    } catch (error) {
      console.error('Error updating course status:', error);
    }
  };

  const filteredCourses = courses.filter(course => 
    (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showManageStudentsModal && selectedCourseForStudents) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => setShowManageStudentsModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 hover:bg-[#00B4D8] dark:hover:bg-[#D4AF37] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
                إدارة طلاب: {selectedCourseForStudents.title}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mr-14">
              إجمالي المشتركين: {selectedCourseForStudents.enrolledStudents || 0} طالب
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] p-6 shadow-sm min-h-[500px]">
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center h-full py-32 gap-4">
              <LuxuriousLoader size="md" text="جاري تحميل بيانات الطلاب..." />
            </div>
          ) : courseStudents.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#2D2D3D] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3">لا يوجد طلاب مشتركين بعد</h4>
              <p className="text-gray-500 max-w-md mx-auto">لم يقم أي طالب بالتسجيل في هذا الكورس حتى الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#222230] border-b border-gray-100 dark:border-[#3D3D4D]">
                    <th className="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">الطالب</th>
                    <th className="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">التقدم</th>
                    <th className="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">حالة التفعيل</th>
                    <th className="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStudents.map(student => {
                    const isSuspended = selectedCourseForStudents.suspendedStudentIds?.includes(student.id);
                    return (
                      <React.Fragment key={student.id}>
                        <tr className="border-b border-gray-50 dark:border-[#2D2D3D] hover:bg-gray-50/50 dark:hover:bg-[#222230]/50 transition-colors">
                          <td className="p-4 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-black text-gray-900 dark:text-white text-sm line-clamp-1">{student.name}</h4>
                                <p className="text-xs text-gray-500 font-bold">{student.grade || 'غير محدد'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 min-w-[150px]">
                            <div className="flex flex-col gap-1 w-full max-w-[150px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-900 dark:text-white">{studentProgressMap[student.id]?.progressPercent || 0}%</span>
                                <span className="text-gray-500">{studentProgressMap[student.id]?.completedLessons?.length || 0} درس</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-[#1C1C28] rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-[#00B4D8] dark:bg-[#D4AF37] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${studentProgressMap[student.id]?.progressPercent || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleStudentStatus(student.id)}
                                className={`relative flex h-7 w-12 items-center rounded-full transition-all duration-300 ${!isSuspended ? 'bg-gradient-to-l from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] shadow-inner shadow-blue-500/20' : 'bg-gray-200 dark:bg-[#3D3D4D] shadow-inner'}`}
                                title={!isSuspended ? 'إلغاء التفعيل' : 'تفعيل'}
                              >
                                <motion.div
                                  initial={false}
                                  animate={{
                                    x: !isSuspended ? -20 : 0,
                                  }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center mr-1"
                                >
                                  <motion.div
                                    initial={false}
                                    animate={{ scale: !isSuspended ? 1 : 0, opacity: !isSuspended ? 1 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-2 h-2 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"
                                  />
                                </motion.div>
                              </button>
                              <span className={`text-xs font-bold transition-colors ${!isSuspended ? 'text-[#00B4D8] dark:text-[#D4AF37]' : 'text-gray-400'}`}>
                                {!isSuspended ? 'مفعل' : 'موقوف'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePrintStudentReport(student)}
                                title="طباعة التقرير"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-white dark:bg-[#1C1C28] text-indigo-500 border border-gray-200 dark:border-[#3D3D4D] hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedStudentDetails(selectedStudentDetails?.id === student.id ? null : student)}
                                title="عرض التفاصيل"
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${selectedStudentDetails?.id === student.id ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white border-transparent' : 'bg-white dark:bg-[#1C1C28] text-[#00B4D8] dark:text-[#D4AF37] border-gray-200 dark:border-[#3D3D4D] hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                title="إزالة من الكورس"
                                className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C1C28] border border-gray-200 dark:border-[#3D3D4D] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        <AnimatePresence>
          {selectedStudentDetails && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedStudentDetails(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#1A1A24] rounded-[32px] w-full max-w-xl relative z-10 shadow-2xl border border-gray-100 dark:border-[#2D2D3D] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#222230]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] flex items-center justify-center font-black text-white text-xl shadow-md">
                      {selectedStudentDetails.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        {selectedStudentDetails.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-black bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800/30">
                          {selectedStudentDetails.grade || 'غير محدد'}
                        </span>
                        {selectedStudentDetails.branch && (
                          <span className="text-xs font-black bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 px-2 py-0.5 rounded-lg border border-cyan-100 dark:border-cyan-800/30">
                            {selectedStudentDetails.branch === 'science' ? 'علمي علوم' : 
                             selectedStudentDetails.branch === 'math' ? 'علمي رياضة' : 
                             selectedStudentDetails.branch === 'arts' ? 'أدبي' : 
                             selectedStudentDetails.branch === 'scientific' ? 'علمي' :
                             selectedStudentDetails.branch === 'literary' ? 'أدبي' : selectedStudentDetails.branch}
                          </span>
                        )}
                        {selectedStudentDetails.educationSystem === 'azhar' && (
                          <span className="text-xs font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                            أزهري
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudentDetails(null)}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3D3D4D] text-gray-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h5 className="text-gray-900 dark:text-white font-black mb-4 flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-5 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-full"></span>
                      معلومات التواصل
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#222230] p-3 rounded-xl border border-gray-100 dark:border-[#3D3D4D]">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A24] flex items-center justify-center shadow-sm shrink-0">
                          <Phone className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold mb-0.5">رقم الهاتف</span>
                          <span dir="ltr" className="text-gray-900 dark:text-white font-bold text-sm">{selectedStudentDetails.phone || 'غير متوفر'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#222230] p-3 rounded-xl border border-gray-100 dark:border-[#3D3D4D]">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A24] flex items-center justify-center shadow-sm shrink-0">
                          <MapPin className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold mb-0.5">المحافظة</span>
                          <span className="text-gray-900 dark:text-white font-bold text-sm">{selectedStudentDetails.governorate || 'غير متوفر'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#222230] p-3 rounded-xl border border-gray-100 dark:border-[#3D3D4D] sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A24] flex items-center justify-center shadow-sm shrink-0">
                          <Mail className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[10px] text-gray-500 font-bold mb-0.5">البريد الإلكتروني</span>
                          <span className="text-gray-900 dark:text-white font-bold text-sm truncate">{selectedStudentDetails.email || 'غير متوفر'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-gray-900 dark:text-white font-black mb-4 flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                      النشاط الأخير
                    </h5>
                    <div className="bg-gray-50 dark:bg-[#222230] p-4 rounded-xl border border-gray-100 dark:border-[#3D3D4D]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A24] flex items-center justify-center shadow-sm shrink-0">
                          <Clock className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold mb-0.5">تاريخ آخر مشاهدة</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {studentProgressMap[selectedStudentDetails.id]?.lastWatchedAt ? new Date(studentProgressMap[selectedStudentDetails.id].lastWatchedAt).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'لم يبدأ بمشاهدة الدروس بعد'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">كورساتي</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">أدر الكورسات الخاصة بك وأضف محتوى جديد لطلابك</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> إنشاء كورس جديد
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <input
          type="text"
          placeholder="ابحث في كورساتك..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white placeholder-gray-400"
        />
        <Search className="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LuxuriousLoader size="md" text="جاري تحميل الكورسات..." />
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center border border-gray-100 dark:border-[#2D2D3D] shadow-sm"
        >
          <div className="w-24 h-24 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-[#00B4D8] dark:text-[#D4AF37]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد كورسات حالياً</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">ابدأ الآن بإنشاء كورس جديد لطلابك، وأضف الدروس والمحتوى التعليمي بسهولة.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`bg-white dark:bg-[#1A1A24] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-150 dark:border-[#2D2D3D] group transition-all duration-300 flex flex-col relative h-full hover:-translate-y-1 ${course.isActive === false ? 'opacity-70 grayscale-[30%]' : ''}`}
            >
              <Link to={`/course/${course.id}`} className="absolute inset-0 z-0"></Link>
              
              {/* Image Container with strict 16:10 Aspect Ratio */}
              <div className="aspect-[16/10] w-full relative overflow-hidden bg-gray-50 dark:bg-[#15151F] pointer-events-none">
                {course.imageUrl ? (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title} 
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                    }} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  </div>
                )}
                
                {/* Grade Badge on the top right */}
                <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                  {course.grade}
                </div>

                {/* Status Indicator Badge on the top left */}
                <div className="absolute top-4 left-4">
                  <div className={`backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-white shadow-sm flex items-center gap-1.5 ${
                    course.status === 'published' || course.isActive === true ? 'bg-green-500/90' :
                    course.status === 'under_review' ? 'bg-yellow-500/90' :
                    'bg-gray-500/90'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-white ${course.isActive ? 'animate-pulse' : ''}`} />
                    {course.status === 'published' || course.isActive === true ? 'منشور' :
                      course.status === 'under_review' ? 'قيد المراجعة' :
                      'مسودة'}
                  </div>
                </div>
              </div>

              {/* Content Container */}
              <div className="p-5 flex-1 flex flex-col justify-between pointer-events-none">
                <div>
                  {/* Title */}
                  <h3 className="text-lg font-black text-gray-950 dark:text-white mb-2 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div>
                  {/* Meta Details */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold mb-4 pt-3 border-t border-gray-100 dark:border-[#2D2D3D]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-450 dark:text-gray-500" />
                      <span>{course.enrolledStudents || 0} طالب</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-gray-450 dark:text-gray-500" />
                      <span>{course.lessonsCount || 0} درس</span>
                    </div>
                  </div>

                  {/* Price & Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2D2D3D] relative z-10 pointer-events-auto">
                    <span className="text-base font-black text-[#00B4D8] dark:text-[#D4AF37]">
                      {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleOpenManageStudents(course); }} 
                        title="إدارة الطلاب المشتركين"
                        className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleToggleCourseStatus(course.id, course.isActive); }} 
                        title={course.isActive === false ? 'تفعيل الكورس' : 'إلغاء التفعيل'} 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${course.isActive === false ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {course.isActive === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleEditCourseClick(course); }} 
                        title="تعديل الكورس"
                        className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDeleteCourse(course.id); }} 
                        className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1A1A24]/80 backdrop-blur-xl z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingCourse ? 'تعديل الكورس' : 'إنشاء كورس جديد'}</h3>
                <button
                  onClick={() => !isSubmitting && resetForm()}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D3D] text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="create-course-form" onSubmit={handleCreateCourse} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">غلاف الكورس</label>
                    <div 
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      className={`w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                        imagePreview 
                          ? 'border-transparent' 
                          : 'border-gray-300 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:bg-gray-50 dark:hover:bg-[#222230]'
                      }`}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">اضغط لرفع صورة من جهازك</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">عنوان الكورس</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white"
                        placeholder="مثال: كورس الرياضيات للصف الأول الثانوي"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">الصف الدراسي</label>
                      <select
                        required
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white"
                      >
                        <option value="">اختر الصف الدراسي</option>
                        {userData?.teachingGrades?.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">سعر الكورس (ج.م)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white"
                        placeholder="مثال: 150 (اكتب 0 للمجاني)"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">وصف الكورس</label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white resize-none"
                        placeholder="اكتب وصفاً مختصراً للكورس وما سيتعلمه الطالب..."
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-[#2D2D3D] bg-gray-50 dark:bg-[#0D0D12] flex justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => !isSubmitting && resetForm()}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2D2D3D] transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="create-course-form"
                  disabled={isSubmitting}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    editingCourse ? 'جاري الحفظ...' : 'جاري الإنشاء...'
                  ) : (
                    editingCourse ? 'حفظ التعديلات' : 'إنشاء الكورس'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Course Confirmation Modal */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCourseToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 border border-gray-100 dark:border-[#2D2D3D] text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 dark:text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد حذف الكورس</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الكورس نهائياً؟ ستتم إزالة الكورس وجميع البيانات المرتبطة به ولا يمكن استعادتها مرة أخرى.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors flex-1"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourseConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex-1 shadow-lg shadow-red-500/10"
                >
                  نعم، احذف الكورس
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
