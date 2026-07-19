#!/bin/bash
awk '
/const isTeacher = userData\?.id === course.teacherId;/ {
    print "  const isTeacher = userData?.id === course.teacherId;"
    print "  const isEnrolled = course.enrolledStudentIds?.includes(userData?.id || \"\");"
    print "  const canWatch = isTeacher || isEnrolled || userData?.role === \"admin\";\n"
    print "  const [enrolling, setEnrolling] = useState(false);\n"
    print "  const handleEnroll = async () => {"
    print "    if (!userData || !course || enrolling) return;"
    print "    setEnrolling(true);"
    print "    try {"
    print "      await updateDoc(doc(db, \"courses\", course.id), {"
    print "        enrolledStudents: course.enrolledStudents + 1,"
    print "        enrolledStudentIds: arrayUnion(userData.id)"
    print "      });"
    print "      "
    print "      await addDoc(collection(db, \"notifications\"), {"
    print "        userId: course.teacherId,"
    print "        title: \"طالب جديد مسجل\","
    print "        message: `سجل الطالب ${userData.name} في كورس ${course.title}`,"
    print "        read: false,"
    print "        createdAt: new Date().toISOString(),"
    print "        type: \"enrollment\""
    print "      });"
    print "      "
    print "      setCourse({ ...course, enrolledStudents: course.enrolledStudents + 1, enrolledStudentIds: [...(course.enrolledStudentIds || []), userData.id] });"
    print "    } catch (error) {"
    print "      console.error(\"Error enrolling:\", error);"
    print "    } finally {"
    print "      setEnrolling(false);"
    print "    }"
    print "  };\n"
    next
}
{print}
' src/components/CourseDetails.tsx > src/components/CourseDetails_temp.tsx
mv src/components/CourseDetails_temp.tsx src/components/CourseDetails.tsx
