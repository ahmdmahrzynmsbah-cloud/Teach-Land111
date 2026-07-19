#!/bin/bash
sed -i '/enrolledStudentIds: arrayUnion(userData.id)/a \      });\n      await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {\n        userId: userData.id,\n        courseId: course.id,\n        lastWatchedAt: new Date().toISOString()\n' src/components/CourseDetails.tsx
