const fs = require('fs');
let code = fs.readFileSync('src/components/CourseDetails.tsx', 'utf8');

// First replace the import
code = code.replace("import { uploadChunkedFile } from '../lib/upload';", "import { uploadChunkedFile, compressImageToBase64 } from '../lib/upload';");

// Then replace the submission logic
const oldLogic = `      // 1. Save payment request to course_payments collection first for instant feedback
      const newPaymentRequest = {
        userId: userData.id,
        userName: userData.name,
        userPhone: userData.phone || '',
        courseId: course.id,
        courseTitle: course.title,
        coursePrice: course.price || 0,
        senderName: paymentSenderName.trim(),
        senderPhone: paymentSenderPhone.trim(),
        screenshotUrl: 'uploading...', // Temporary placeholder
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "course_payments"), newPaymentRequest);
      setPaymentRequest({ id: docRef.id, ...newPaymentRequest });

      // 2. Dispatch notification to course teacher/admin
      await addDoc(collection(db, "notifications"), {
        userId: course.teacherId,
        title: "طلب اشتراك جديد بانتظار الموافقة",
        message: \`طلب الطالب \${userData.name} الاشتراك في كورس \${course.title} عبر فودافون كاش\`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      // Show success IMMEDIATELY to user
      toast.success("تم إرسال طلب الاشتراك بنجاح! سيقوم الأدمن بمراجعته وتفعيله لك قريباً. ✨");
      setShowPaymentModal(false);
      setSubmittingPayment(false);

      // 3. Upload screenshot in the background
      uploadChunkedFile(paymentScreenshotFile, setPaymentUploadProgress)
        .then(async (screenshotUrl) => {
          await updateDoc(docRef, { screenshotUrl });
        })
        .catch(async (err) => {
          console.error("Background upload failed:", err);
          await updateDoc(docRef, { screenshotUrl: 'failed' }).catch(console.error);
        });`;

const newLogic = `      // 1. Compress screenshot to Base64 (instant, no network upload needed!)
      let base64Screenshot = '';
      try {
        base64Screenshot = await compressImageToBase64(paymentScreenshotFile);
      } catch (err) {
        console.error("Compression error", err);
        // Fallback to FileReader if compression fails
        const fallback = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(paymentScreenshotFile);
        });
        base64Screenshot = fallback;
      }

      // 2. Save payment request to course_payments collection
      const newPaymentRequest = {
        userId: userData.id,
        userName: userData.name,
        userPhone: userData.phone || '',
        courseId: course.id,
        courseTitle: course.title,
        coursePrice: course.price || 0,
        senderName: paymentSenderName.trim(),
        senderPhone: paymentSenderPhone.trim(),
        screenshotUrl: base64Screenshot,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "course_payments"), newPaymentRequest);
      setPaymentRequest({ id: docRef.id, ...newPaymentRequest });

      // 3. Dispatch notification to course teacher/admin
      await addDoc(collection(db, "notifications"), {
        userId: course.teacherId,
        title: "طلب اشتراك جديد بانتظار الموافقة",
        message: \`طلب الطالب \${userData.name} الاشتراك في كورس \${course.title} عبر فودافون كاش\`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      toast.success("تم إرسال طلب الاشتراك بنجاح! سيقوم الأدمن بمراجعته وتفعيله لك قريباً. ✨");
      setShowPaymentModal(false);
      setSubmittingPayment(false);`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/CourseDetails.tsx', code);
