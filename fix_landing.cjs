const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const correctNav = `
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600 dark:text-gray-300">
            <a href="#grades" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الصفوف الدراسية</a>
            <a href="#subjects" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">المواد الدراسية</a>
            <a href="#how-it-works" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">مميزات المنصة</a>
            <a href="#faq" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-1 sm:gap-2">
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors px-2 sm:px-4 py-2 hidden sm:block">تسجيل الدخول</Link>
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-1 sm:gap-2">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
`;

code = code.replace(/<div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600 dark:text-gray-300">[\s\S]*?<\/nav>/, correctNav + '\n        </div>\n      </nav>');

fs.writeFileSync('src/components/LandingPage.tsx', code);
