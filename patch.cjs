const fs = require('fs');
let code = fs.readFileSync('src/components/CourseDetails.tsx', 'utf8');

const targetStr = `      // 3. Create transaction record`;

const replacement = `      // 2.5. Create course payment record for teacher revenue
      try {
        await addDoc(collection(db, "course_payments"), {
          userId: userData.id,
          userName: userData.name,
          userPhone: userData.phone || '',
          courseId: course.id,
          courseTitle: course.title,
          coursePrice: course.price || 0,
          senderName: 'الدفع بالمحفظة',
          senderPhone: userData.phone || '',
          screenshotUrl: '',
          status: 'approved',
          paymentMethod: 'wallet',
          teacherId: course.teacherId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "course_payments");
      }

      // 3. Create transaction record`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/CourseDetails.tsx', code);
