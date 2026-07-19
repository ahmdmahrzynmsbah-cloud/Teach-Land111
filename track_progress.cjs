const fs = require('fs');
let code = fs.readFileSync('src/components/CourseDetails.tsx', 'utf8');

const effectCode = `  // Auto-save generic progress for all lessons (including YouTube/external)
  useEffect(() => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    
    const interval = setInterval(() => {
      if (!completedLessons.includes(activeLesson.id)) {
        // If not completed, we auto-save that they are viewing it.
        // For external videos where we don't have exact duration, we just update the lastWatched timestamp
        try {
          setDoc(doc(db, "course_progress", \`\${userData.id}_\${course.id}\`), {
            userId: userData.id,
            courseId: course.id,
            lastWatchedAt: new Date().toISOString(),
            lastWatchedLessonId: activeLesson.id,
          }, { merge: true });
        } catch(err) {
          console.error("Error auto-saving course progress:", err);
        }
      }
    }, 15000); // Auto-save every 15 seconds
    
    return () => clearInterval(interval);
  }, [activeLesson, userData, course, completedLessons]);

  const handleVideoTimeUpdate`;

code = code.replace(/  const handleVideoTimeUpdate/g, effectCode);

fs.writeFileSync('src/components/CourseDetails.tsx', code);
