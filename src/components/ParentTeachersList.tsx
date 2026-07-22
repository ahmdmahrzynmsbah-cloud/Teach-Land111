import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User, Course } from '../types';
import { 
  Users, MessageSquare, Phone, Mail, ExternalLink, 
  Search, BookOpen, User as UserIcon, Loader2,
  Calendar, Award, Star, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParentTeachersListProps {
  userData: User;
  linkedStudent: User | null;
}

const ParentTeachersList: React.FC<ParentTeachersListProps> = ({ userData, linkedStudent }) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!linkedStudent?.id) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch courses the student is enrolled in
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('enrolledStudentIds', 'array-contains', linkedStudent.id));
        const coursesSnap = await getDocs(q);
        
        const teacherIds = new Set<string>();
        coursesSnap.forEach(doc => {
          const course = doc.data() as Course;
          if (course.teacherId) {
            teacherIds.add(course.teacherId);
          }
        });

        // 2. Fetch teacher details
        const teacherPromises = Array.from(teacherIds).map(async (id) => {
          const teacherDoc = await getDoc(doc(db, 'users', id));
          if (teacherDoc.exists()) {
            return { id: teacherDoc.id, ...teacherDoc.data() } as User;
          }
          return null;
        });

        const teacherResults = await Promise.all(teacherPromises);
        setTeachers(teacherResults.filter(t => t !== null) as User[]);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [linkedStudent?.id]);

  const filteredTeachers = teachers.filter(t => 
    (t.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (t.subject || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-[#00B4D8] animate-spin" />
        <p className="text-gray-500 font-bold">جاري تحميل بيانات المعلمين...</p>
      </div>
    );
  }

  if (!linkedStudent) {
    return (
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-center">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">لم يتم ربط طالب بعد</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">يرجى ربط حساب ابنك لتتمكن من التواصل مع معلميه.</p>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/20 text-[#00B4D8] dark:text-[#D4AF37] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">لا يوجد معلمون حالياً</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">يبدو أن ابنك <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">{linkedStudent.name}</span> لم يشترك في أي كورس بعد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-[#00B4D8] dark:text-[#D4AF37]" /> تواصل مع معلمي {linkedStudent.name.split(' ')[0]}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold mt-1 text-sm">قائمة بجميع المعلمين الذين يتابع معهم ابنك حالياً.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن معلم أو مادة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl pr-10 pl-4 py-2.5 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] text-sm font-bold text-gray-900 dark:text-white transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTeachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00B4D8]/10 to-transparent dark:from-[#D4AF37]/10 rounded-bl-[100px] -z-0" />
              
              <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-[#0D0D12] flex items-center justify-center mb-4 relative z-10 border-2 border-white dark:border-[#2D2D3D] shadow-sm">
                <span className="text-3xl font-black text-[#00B4D8] dark:text-[#D4AF37]">
                  {teacher.name.charAt(0)}
                </span>
              </div>

              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 relative z-10">{teacher.name}</h3>
              <p className="text-xs font-bold text-[#00B4D8] dark:text-[#D4AF37] mb-4 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                {teacher.subject || 'معلم متخصص'}
              </p>

              <div className="w-full space-y-2 mb-6 relative z-10">
                <div className="flex items-center justify-between text-xs font-bold p-3 rounded-xl bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D]">
                  <span className="text-gray-500">رقم الهاتف</span>
                  <span className="text-gray-900 dark:text-white font-mono" dir="ltr">{teacher.phone || 'غير متوفر'}</span>
                </div>
                {teacher.email && (
                  <div className="flex items-center justify-between text-xs font-bold p-3 rounded-xl bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D]">
                    <span className="text-gray-500">البريد الإلكتروني</span>
                    <span className="text-gray-900 dark:text-white truncate max-w-[140px]">{teacher.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full relative z-10">
                <a
                  href={`tel:${teacher.phone}`}
                  className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 py-3 rounded-2xl text-xs font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-100 dark:border-emerald-900/30"
                >
                  <Phone className="w-3.5 h-3.5" /> اتصل الآن
                </a>
                <a
                  href={`https://wa.me/${teacher.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] py-3 rounded-2xl text-xs font-black hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> واتساب
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTeachers.length === 0 && searchTerm && (
          <div className="col-span-full py-12 text-center text-gray-500 font-bold">
            لا توجد نتائج بحث تطابق "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentTeachersList;
