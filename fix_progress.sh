#!/bin/bash
sed -i '/await updateDoc(doc(db, "lessons", lesson.id), {/i \        await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {\n          userId: userData.id,\n          courseId: course.id,\n          lastWatchedAt: new Date().toISOString()\n        }, { merge: true });\n' src/components/CourseDetails.tsx
