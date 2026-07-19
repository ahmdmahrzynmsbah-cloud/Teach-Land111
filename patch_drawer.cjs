const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const sidebarRegex = /{\/\* Sidebar \*\/}/;

const drawerCode = `      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] md:hidden"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-[#1A1A24] z-[101] shadow-2xl flex flex-col md:hidden border-l border-gray-200 dark:border-[#2D2D3D]"
          >
            <div className="h-20 border-b border-gray-200 dark:border-[#2D2D3D] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2.5">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-xl shadow-md" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                        {settings.logoChar}
                    </div>
                  )}
                  <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal">{settings.platformName}</span>
              </div>
              <button onClick={() => setIsMobileDrawerOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {(userData?.role === 'admin' ? [
                { id: 'home', label: 'الرئيسية', icon: Target },
                { id: 'admin', label: 'لوحة الإدارة', icon: Shield },
                { id: 'admin_recharge', label: 'شحن الرصيد', icon: Ticket },
                { id: 'admin_courses', label: 'الكورسات', icon: BookOpen },
                { id: 'analytics', label: 'التقارير والإحصائيات', icon: Flame },
                { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
              ] : userData?.role === 'teacher' ? [
                { id: 'home', label: 'الرئيسية', icon: Target },
                { id: 'classes', label: 'فصولي وإدارة الطلاب', icon: Users },
                { id: 'quizzes', label: 'إدارة الاختبارات والواجبات', icon: Award },
                { id: 'analytics', label: 'تحليلات الأداء المتقدمة', icon: Activity },
                { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
              ] : userData?.role === 'parent' ? [
                { id: 'home', label: 'الرئيسية (متابعة الأبناء)', icon: Target },
                { id: 'quizzes', label: 'نتائج الاختبارات والتقييمات', icon: Award },
                { id: 'schedule', label: 'الجدول الدراسي للحصص', icon: Clock },
                { id: 'wallet', label: 'المحفظة الإلكترونية', icon: Ticket },
                { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
              ] : [
                { id: 'home', label: 'الرئيسية', icon: Target },
                { id: 'subjects', label: 'كورساتي', icon: BookOpen },
                { id: 'teachers_list', label: 'المعلمون', icon: Users },
                { id: 'quizzes', label: 'الاختبارات والواجبات', icon: Award },
                { id: 'badges', label: 'الأوسمة والإنجازات', icon: Trophy },
                { id: 'schedule', label: 'الجدول الدراسي للحصص', icon: Clock },
                { id: 'wallet', label: 'المحفظة الإلكترونية وشحن الرصيد', icon: Ticket },
                { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
              ]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                     setActiveTab(item.id);
                     setIsMobileDrawerOpen(false);
                  }}
                  className={\`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all \${
                    activeTab === item.id 
                      ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white shadow-md shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 scale-100' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]/50 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02]'
                  }\`}
                >
                  <item.icon className={\`w-5 h-5 \${activeTab === item.id ? 'opacity-100' : 'opacity-70'}\`} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-[#2D2D3D] shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl transition-all font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* Sidebar */}`;

code = code.replace(sidebarRegex, drawerCode);

// Remove the old Mobile Navigation that is fixed at the bottom.
const mobileNavRegex = /{\/\* Mobile Navigation \*\/}[\s\S]*?<\/nav>/;
code = code.replace(mobileNavRegex, '');

fs.writeFileSync('src/components/Dashboard.tsx', code);
