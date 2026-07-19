const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const newAdminHome = `            {activeTab === 'home' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 dark:from-[#D4AF37] dark:to-yellow-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <h1 className="text-3xl font-black mb-2">مرحباً بك يا مدير النظام!</h1>
                      <p className="text-white/80 font-medium">هذه لوحة التحكم الرئيسية الخاصة بك لإدارة منصة Teachland.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي الطلاب</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.students.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي المعلمين</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.teachers.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">الكورسات والمواد</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.courses.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">طلبات الشحن المعلقة</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.pendingPayments.toLocaleString('ar-EG')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  <button onClick={() => setActiveTab('admin_panel')} className="p-6 bg-white dark:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D] rounded-3xl hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#20202D] rounded-xl flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
                        <Shield className="w-6 h-6 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-gray-900 dark:text-white mb-1">إدارة المستخدمين</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">الطلاب، المعلمون وأولياء الأمور</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('admin_recharge')} className="p-6 bg-white dark:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D] rounded-3xl hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#20202D] rounded-xl flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
                        <Ticket className="w-6 h-6 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-gray-900 dark:text-white mb-1">مركز الشحن</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">إدارة الدفعات وتوليد الأكواد</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('admin_courses')} className="p-6 bg-white dark:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D] rounded-3xl hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#20202D] rounded-xl flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
                        <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-gray-900 dark:text-white mb-1">إدارة الكورسات</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">الموافقة والمراجعة</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}`;

const oldAdminHome = `            {activeTab === 'home' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 dark:from-[#D4AF37] dark:to-yellow-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <h1 className="text-3xl font-black mb-2">مرحباً بك يا مدير النظام!</h1>
                      <p className="text-white/80 font-medium">هذه لوحة التحكم الرئيسية الخاصة بك لإدارة منصة Teachland.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(oldAdminHome, newAdminHome);

const stateCode = `  const [subscribingLeague, setSubscribingLeague] = useState(false);

  // Admin Stats State
  const [adminStats, setAdminStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    pendingPayments: 0
  });
  const [loadingAdminStats, setLoadingAdminStats] = useState(false);

  useEffect(() => {
    if (userData?.role !== 'admin') return;
    const fetchAdminStats = async () => {
      setLoadingAdminStats(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        let students = 0;
        let teachers = 0;
        usersSnap.forEach(doc => {
           if (doc.data().role === 'student') students++;
           if (doc.data().role === 'teacher') teachers++;
        });

        const coursesSnap = await getDocs(collection(db, 'courses'));
        const courses = coursesSnap.size;

        const paymentsQ = query(collection(db, 'payments'), where('status', '==', 'pending'));
        const paymentsSnap = await getDocs(paymentsQ);
        const pendingPayments = paymentsSnap.size;

        setAdminStats({
          students,
          teachers,
          courses,
          pendingPayments
        });
      } catch(err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoadingAdminStats(false);
      }
    };
    fetchAdminStats();
  }, [userData?.role]);`;

code = code.replace("  const [subscribingLeague, setSubscribingLeague] = useState(false);", stateCode);

fs.writeFileSync('src/components/Dashboard.tsx', code);
