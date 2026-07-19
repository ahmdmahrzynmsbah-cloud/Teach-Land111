#!/bin/bash
awk '
BEGIN {
    in_analytics = 0
}
/import TeacherClasses from/ {
    print
    print "import TeacherAnalytics from \"./TeacherAnalytics\";"
    next
}
/{userData\?.role === .teacher. \?/ {
    if (in_analytics == 0) {
        print "                  {userData?.role === \"teacher\" ? ("
        print "                    <TeacherAnalytics teacherId={userData.id} />"
        print "                  ) : ("
        print "                    <div className=\"bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] text-center\">"
        print "                       <p className=\"text-gray-500 font-medium\">سيتم عرض تقارير مفصلة عن أداء الطالب هنا بعد الانتهاء من الاختبارات.</p>"
        print "                    </div>"
        print "                  )}"
        in_analytics = 1
    }
    next
}
in_analytics == 1 {
    if (match($0, /                  \)}/)) {
        in_analytics = 2
    }
    next
}
{print}
' src/components/Dashboard.tsx > src/components/Dashboard_temp.tsx
mv src/components/Dashboard_temp.tsx src/components/Dashboard.tsx
