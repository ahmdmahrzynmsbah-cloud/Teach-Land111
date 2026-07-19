#!/bin/bash
awk '
/<div className="bg-white\/90 dark:bg-black\/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-\[#00B4D8\] dark:text-\[#D4AF37\] shadow-sm">/ {
    inGrade = 1
    print
    next
}
inGrade && /<\/div>/ {
    print
    inGrade = 0
    print "                  {/* Status Indicator */}"
    print "                  <div className={`backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1.5 ${"
    print "                    course.status === '"'"'published'"'"' || course.isActive === true ? '"'"'bg-green-500/90'"'"' :"
    print "                    course.status === '"'"'under_review'"'"' ? '"'"'bg-yellow-500/90'"'"' :"
    print "                    '"'"'bg-gray-500/90'"'"'"
    print "                  }`}>"
    print "                    <div className=\"w-1.5 h-1.5 rounded-full bg-white\" />"
    print "                    {course.status === '"'"'published'"'"' || course.isActive === true ? '"'"'منشور'"'"' : "
    print "                     course.status === '"'"'under_review'"'"' ? '"'"'قيد المراجعة'"'"' : "
    print "                     '"'"'مسودة'"'"'}"
    print "                  </div>"
    next
}
/{course.isActive === false && \(/ {
    skipIsActive = 1
    next
}
skipIsActive && /<EyeOff className="w-3 h-3" \/>/ {
    next
}
skipIsActive && /<\/div>/ {
    next
}
skipIsActive && /}\)/ {
    skipIsActive = 0
    next
}
{print}
' src/components/TeacherClasses.tsx > src/components/TeacherClasses_temp.tsx
mv src/components/TeacherClasses_temp.tsx src/components/TeacherClasses.tsx
