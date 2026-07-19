import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User, Course } from '../types';
import { Award, Star, Medal, Trophy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface StudentBadgesProps {
  userData: User;
}

interface Badge {
  id: string;
  courseId: string;
  courseTitle: string;
  dateEarned: Date;
  type: 'gold' | 'silver' | 'bronze';
}

export default function StudentBadges({ userData }: StudentBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.id || userData.role !== 'student') return;

    const fetchBadges = async () => {
      try {
        const qProg = query(collection(db, 'course_progress'), where('userId', '==', userData.id));
        const progSnap = await getDocs(qProg);
        
        const earnedBadges: Badge[] = [];
        
        for (const docSnap of progSnap.docs) {
          const data = docSnap.data();
          let isCompleted = false;
          
          if (data.progressPercent && data.progressPercent >= 100) {
            isCompleted = true;
          } else if (data.completedLessons && data.completedLessons.length > 0) {
            // Need to know course lessons count. Let's query the course
            try {
              const courseDoc = await getDoc(doc(db, 'courses', data.courseId));
              if (courseDoc.exists()) {
                const courseData = courseDoc.data() as Course;
                if (data.completedLessons.length >= (courseData.lessonsCount || 1)) {
                  isCompleted = true;
                }
              }
            } catch (e) {
              console.error("Error fetching course for badge check", e);
            }
          }

          if (isCompleted) {
            // Check if course exists to get title
            let cTitle = "كورس مكتمل";
            try {
              const cDoc = await getDoc(doc(db, 'courses', data.courseId));
              if (cDoc.exists()) {
                cTitle = cDoc.data().title;
              }
            } catch (e) {}

            earnedBadges.push({
              id: `badge-${data.courseId}`,
              courseId: data.courseId,
              courseTitle: cTitle,
              dateEarned: new Date(data.updatedAt || data.createdAt || Date.now()),
              type: 'gold' // Make it gold by default for course completion
            });
          }
        }
        
        setBadges(earnedBadges);
      } catch (err) {
        console.error("Error fetching badges:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userData?.id]);

  const handleBadgeClick = (badge: Badge) => {
    // Fire confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#00B4D8', '#FFD700', '#FFFFFF']
    });

    setAnimatingId(null);
    setTimeout(() => {
      setAnimatingId(badge.id);
    }, 10);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="flex gap-4">
           <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
           <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return null; // Don't show section if no badges
  }

  return (
    <div className="bg-gradient-to-br from-[#00B4D8]/5 to-indigo-500/5 dark:from-[#D4AF37]/5 dark:to-yellow-600/5 rounded-3xl p-6 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 blur-2xl rounded-full"></div>
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <Trophy className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
        <h2 className="text-xl font-black text-gray-900 dark:text-white">
          أوسمة Teachland ({badges.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-4 relative z-10">
        {badges.map((badge, idx) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBadgeClick(badge)}
            className="cursor-pointer relative group flex flex-col items-center gap-2 w-28"
          >
            <motion.div
              animate={animatingId === badge.id ? {
                scale: [1, 1.25, 0.9, 1.15, 1],
                rotate: [0, 180, 360],
              } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              onAnimationComplete={() => {
                if (animatingId === badge.id) {
                  setAnimatingId(null);
                }
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 dark:from-[#D4AF37] dark:to-yellow-700 p-1 shadow-lg shadow-yellow-500/30 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 blur-sm group-hover:bg-white/40 transition-colors"></div>
              <div className="w-full h-full bg-[#1A1A24] rounded-full flex items-center justify-center relative z-10 overflow-hidden border-2 border-yellow-200 dark:border-yellow-500">
                <Medal className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>
            
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">
                {badge.courseTitle}
              </p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                {badge.dateEarned.toLocaleDateString('ar-EG')}
              </p>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
              وسام إتمام الكورس بنجاح 🏆
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
