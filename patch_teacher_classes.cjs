const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherClasses.tsx', 'utf8');

const target1 = `      setCourseStudents(courseStudents.filter(u => u.id !== studentId));
      setCourses(courses.map(c => 
        c.id === selectedCourseForStudents.id 
          ? { ...c, enrolledStudents: newEnrolled.length, enrolledStudentIds: newEnrolled, suspendedStudentIds: newSuspended }
          : c
      ));
      setSelectedCourseForStudents(prev => prev ? { ...prev, enrolledStudents: newEnrolled.length, enrolledStudentIds: newEnrolled, suspendedStudentIds: newSuspended } : null);`;

const replacement1 = `      setCourseStudents(prev => prev.filter(u => u.id !== studentId));
      setCourses(prev => prev.map(c => 
        c.id === selectedCourseForStudents.id 
          ? { ...c, enrolledStudents: newEnrolled.length, enrolledStudentIds: newEnrolled, suspendedStudentIds: newSuspended }
          : c
      ));
      setSelectedCourseForStudents(prev => prev ? { ...prev, enrolledStudents: newEnrolled.length, enrolledStudentIds: newEnrolled, suspendedStudentIds: newSuspended } : null);`;

code = code.replace(target1, replacement1);

const target2 = `        setCourseStudents(courseStudents.map(u => u)); // Trigger re-render if needed
        setCourses(courses.map(c => 
          c.id === selectedCourseForStudents.id 
            ? { ...c, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length }
            : c
        ));
        setSelectedCourseForStudents(prev => prev ? { ...prev, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length } : null);`;

const replacement2 = `        setCourseStudents(prev => [...prev]); // Trigger re-render if needed
        setCourses(prev => prev.map(c => 
          c.id === selectedCourseForStudents.id 
            ? { ...c, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length }
            : c
        ));
        setSelectedCourseForStudents(prev => prev ? { ...prev, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length } : null);`;

code = code.replace(target2, replacement2);

const target3 = `        setCourseStudents(courseStudents.map(u => u)); // Trigger re-render if needed
        setCourses(courses.map(c => 
          c.id === selectedCourseForStudents.id 
            ? { ...c, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length }
            : c
        ));
        setSelectedCourseForStudents(prev => prev ? { ...prev, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length } : null);`;

// it's the same pattern for suspend and active
const replacement3 = `        setCourseStudents(prev => [...prev]); // Trigger re-render if needed
        setCourses(prev => prev.map(c => 
          c.id === selectedCourseForStudents.id 
            ? { ...c, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length }
            : c
        ));
        setSelectedCourseForStudents(prev => prev ? { ...prev, suspendedStudentIds: newSuspended, enrolledStudentIds: newEnrolled, enrolledStudents: newEnrolled.length } : null);`;

code = code.replace(target3, replacement3);

// Since there are two branches (suspend and active), let's just do a generic replace if target3 failed
fs.writeFileSync('src/components/TeacherClasses.tsx', code);
