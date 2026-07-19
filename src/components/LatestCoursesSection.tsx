import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, BookOpen, Users, Star, Clock, Play } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';
import { useNavigate } from 'react-router-dom';

import { User } from '../types';

interface LatestCoursesSectionProps {
  userData?: User | null;
}

export default function LatestCoursesSection({ userData }: LatestCoursesSectionProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, 'courses'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' }); // Scroll left in RTL is next
    }
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' }); // Scroll right in RTL is prev
    }
  };

  if (loading || courses.length === 0) return null;

  return (
    <section className="py-20 relative overflow-hidden bg-gray-50/50 dark:bg-[#0D0D12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl text-right">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B4D8]/10 text-[#00B4D8] font-bold text-sm mb-6"
            >
              <Star className="w-4 h-4" fill="currentColor" />
              أحدث الكورسات
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight"
            >
              اكتشف <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B]">أقوى الكورسات</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 dark:text-gray-400 font-medium"
            >
              مجموعة متميزة من الكورسات التعليمية يقدمها نخبة من أفضل المعلمين.
            </motion.p>
          </div>
          
          {courses.length > 3 && (
            <div className="flex gap-3 self-start md:self-auto" dir="ltr">
              <button 
                onClick={scrollNext}
                className="w-12 h-12 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-[#00B4D8] hover:text-white hover:border-[#00B4D8] dark:hover:bg-[#D4AF37] dark:hover:text-black dark:hover:border-[#D4AF37] transition-all hover:scale-110 active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={scrollPrev}
                className="w-12 h-12 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-[#00B4D8] hover:text-white hover:border-[#00B4D8] dark:hover:bg-[#D4AF37] dark:hover:text-black dark:hover:border-[#D4AF37] transition-all hover:scale-110 active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[300px] md:min-w-[350px] max-w-[350px] bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group snap-center shrink-0 flex flex-col"
            >
              <div 
                onClick={() => navigate('/course/' + course.id)}
                className="relative h-48 bg-gray-100 dark:bg-[#0D0D12] overflow-hidden cursor-pointer"
              >
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {/* Overlay Play Icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-white text-[#00B4D8] dark:text-[#D4AF37] flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current mr-1" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                  {course.subject}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-bold mb-3">
                  <span className="bg-gray-100 dark:bg-[#2D2D3D] px-2 py-1 rounded-md">{course.grade}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.enrolledStudents || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{course.lessonsCount || 0} درس</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] flex items-center justify-center text-white font-bold text-xs">
                        {course.teacherName?.[0] || 'م'}
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{course.teacherName}</span>
                    </div>
                    <div className="text-lg font-black text-[#00B4D8] dark:text-[#D4AF37] font-mono">
                      {course.price > 0 ? `${course.price} ج.م` : 'مجاني'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full pt-1">
                    <button 
                      onClick={() => navigate('/course/' + course.id)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-900 dark:text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-95"
                    >
                      الدخول للكورس
                    </button>
                    <button 
                      onClick={() => navigate('/course/' + course.id)}
                      className="flex-1 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0077B6] hover:to-[#023E8A] dark:from-[#D4AF37] dark:to-[#B8860B] dark:hover:from-[#B8860B] dark:hover:to-[#996B00] text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center shadow-md active:scale-95"
                    >
                      الاشتراك بالكورس
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
