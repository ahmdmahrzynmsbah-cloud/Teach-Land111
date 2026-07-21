const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const targetStr = `      } else if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('email-already-in-use'))) {
        setError('هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في المنصة، يرجى تسجيل الدخول مباشرة.');
      } else if (err.code === 'auth/weak-password') {`;

const replacementStr = `      } else if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('email-already-in-use'))) {
        if (!isLogin) {
          try {
            // Check if this is a zombie account (Auth exists but Firestore doc is missing)
            const loginAttempt = await signInWithEmailAndPassword(auth, email, password);
            const docCheck = await getDoc(doc(db, 'users', loginAttempt.user.uid));
            if (!docCheck.exists()) {
              // Recreate the document!
              const baseData = {
                email,
                name: formData.get('name') as string,
                phone: combinePhone('phone'),
                governorate: formData.get('governorate') as string,
                role,
                password,
                createdAt: new Date().toISOString()
              };
              
              if (role === 'student') {
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  grade: formData.get('grade') as string,
                  school: formData.get('school') as string,
                  parentPhone: combinePhone('parentPhone'),
                  educationSystem: formData.get('educationSystem') as string,
                  branch: (formData.get('branch') as string) || null,
                  isApproved: false
                });
              } else if (role === 'teacher') {
                const grades = [];
                if (formData.get('grade_1')) grades.push('الأول الإعدادي');
                if (formData.get('grade_2')) grades.push('الثاني الإعدادي');
                if (formData.get('grade_3')) grades.push('الثالث الإعدادي');
                if (formData.get('grade_4')) grades.push('الأول الثانوي');
                if (formData.get('grade_5')) grades.push('الثاني الثانوي');
                if (formData.get('grade_6')) grades.push('الثالث الثانوي');
                const finalGrades = grades.length > 0 ? grades : ['غير محدد'];
                
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  subject: formData.get('subject') as string,
                  nationalId: formData.get('nationalId') as string,
                  dateOfBirth: formData.get('dateOfBirth') as string,
                  teachingGrades: finalGrades,
                  isApproved: false
                });
              } else if (role === 'parent') {
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  studentPhone: combinePhone('studentPhone'),
                  isApproved: false
                });
              } else if (role === 'admin') {
                await setDoc(doc(db, 'users', loginAttempt.user.uid), {
                  ...baseData,
                  isApproved: true
                });
              }
              navigate('/dashboard');
              return;
            } else {
              setError('هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في المنصة، يرجى تسجيل الدخول مباشرة.');
            }
          } catch (e) {
            setError('هذا البريد الإلكتروني مسجل مسبقاً. إذا كان حسابك محذوفاً يرجى التواصل مع الإدارة، أو حاول تسجيل الدخول بكلمة المرور القديمة.');
          }
        } else {
          setError('هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في المنصة، يرجى تسجيل الدخول مباشرة.');
        }
      } else if (err.code === 'auth/weak-password') {`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('src/components/Auth.tsx', code);
