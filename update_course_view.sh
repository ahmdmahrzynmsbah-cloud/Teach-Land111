#!/bin/bash
awk '
/const canWatch = isTeacher \|\| isEnrolled/ {
    print
    print "  const handleViewLesson = async (lesson: Lesson) => {"
    print "    if (!canWatch) return;"
    print "    setActiveLesson(lesson);"
    print "    if (userData?.role === \"student\" && !isTeacher) {"
    print "      try {"
    print "        await updateDoc(doc(db, \"lessons\", lesson.id), {"
    print "          views: increment(1)"
    print "        });"
    print "      } catch (error) {"
    print "        console.error(\"Error updating views:\", error);"
    print "      }"
    print "    }"
    print "  };"
    next
}
/onClick={() => canWatch \&\& setActiveLesson(lesson)}/ {
    print "                    onClick={() => handleViewLesson(lesson)}"
    next
}
{print}
' src/components/CourseDetails.tsx > src/components/CourseDetails_temp.tsx
mv src/components/CourseDetails_temp.tsx src/components/CourseDetails.tsx
