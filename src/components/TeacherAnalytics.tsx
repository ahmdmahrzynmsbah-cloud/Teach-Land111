import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Course, Lesson, Review } from '../types';
import { Activity, Users, Video, Star } from 'lucide-react';

export default function TeacherAnalytics({ teacherId }: { teacherId: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const qCourses = query(collection(db, 'courses'), where('teacherId', '==', teacherId));
        const snapshotCourses = await getDocs(qCourses);
        const fetchedCourses = snapshotCourses.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(fetchedCourses);

        let fetchedLessons: Lesson[] = [];
        for (const course of fetchedCourses) {
          const qLessons = query(collection(db, 'lessons'), where('courseId', '==', course.id));
          const snapshotLessons = await getDocs(qLessons);
          fetchedLessons = [...fetchedLessons, ...snapshotLessons.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson))];
        }
        setLessons(fetchedLessons);

        // Fetch reviews
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        const fetchedReviews: Review[] = [];
        reviewsSnap.forEach(doc => {
          const review = { id: doc.id, ...doc.data() } as Review;
          if (fetchedCourses.some(c => c.id === review.courseId)) {
            fetchedReviews.push(review);
          }
        });
        fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalEnrolled = courses.reduce((acc, course) => acc + (course.enrolledStudents || 0), 0);
  const totalViews = lessons.reduce((acc, lesson) => acc + (lesson.views || 0), 0);
  const averageTeacherRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 5.0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] flex items-center gap-4 h-full">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">إجمالي الطلاب المشتركين</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{totalEnrolled}</h3>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] flex items-center gap-4 h-full">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 text-green-500 rounded-xl flex items-center justify-center">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">إجمالي مشاهدات الفيديوهات</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{totalViews}</h3>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] flex items-center gap-4 h-full">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/20 text-purple-500 rounded-xl flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">إجمالي الكورسات</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{courses.length}</h3>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] flex items-center gap-4 h-full">
          <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-500 rounded-xl flex items-center justify-center">
            <Star className="w-7 h-7 fill-[#F5A623] text-[#F5A623]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">متوسط تقييم المحتوى</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1.5 font-mono">
              {averageTeacherRating.toFixed(1)}
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                ({reviews.length} تقييم)
              </span>
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">تفاصيل الكورسات</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2D2D3D] text-gray-500 dark:text-gray-400 text-sm">
                <th className="pb-4 font-medium">الكورس</th>
                <th className="pb-4 font-medium">عدد المشتركين</th>
                <th className="pb-4 font-medium">مشاهدات الدروس</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D]">
              {courses.map(course => {
                const courseLessons = lessons.filter(l => l.courseId === course.id);
                const courseViews = courseLessons.reduce((acc, l) => acc + (l.views || 0), 0);
                return (
                   <tr key={course.id} className="text-sm text-gray-900 dark:text-white">
                    <td className="py-4 font-bold">{course.title}</td>
                    <td className="py-4 font-medium">{course.enrolledStudents || 0}</td>
                    <td className="py-4 font-medium">{courseViews}</td>
                  </tr>
                );
              })}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">لا توجد كورسات حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">المشاهدات حسب الدرس (بالدقة)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2D2D3D] text-gray-500 dark:text-gray-400 text-sm">
                <th className="pb-4 font-medium">الدرس</th>
                <th className="pb-4 font-medium">الكورس</th>
                <th className="pb-4 font-medium">المشاهدات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D]">
              {lessons.sort((a, b) => (b.views || 0) - (a.views || 0)).map(lesson => {
                const course = courses.find(c => c.id === lesson.courseId);
                return (
                  <tr key={lesson.id} className="text-sm text-gray-900 dark:text-white">
                    <td className="py-4 font-bold">{lesson.title}</td>
                    <td className="py-4 text-gray-500">{course?.title || 'غير معروف'}</td>
                    <td className="py-4 font-medium">{lesson.views || 0}</td>
                  </tr>
                );
              })}
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">لا توجد دروس حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">آراء وتقييمات الطلاب لجودة المحتوى</h3>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map(review => {
              const course = courses.find(c => c.id === review.courseId);
              return (
                <div key={review.id} className="p-4 rounded-xl bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] rounded-full flex items-center justify-center text-sm font-black">
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white block">{review.userName}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                          الكورس: {course?.title || 'غير معروف'}
                        </span>
                      </div>
                      {review.isPrivate && (
                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          🔒 تعليق خاص بالمعلم
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300 dark:text-gray-600"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-[#222230]/50 p-3 rounded-lg border border-gray-100 dark:border-[#2C2C3A]">{review.comment}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm font-medium">
              لا توجد تقييمات أو تعليقات من الطلاب بعد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
