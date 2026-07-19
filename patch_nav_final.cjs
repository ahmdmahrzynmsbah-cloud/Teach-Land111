const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  /            \)}\n          <\/div>\n        <\/div>\n      <\/nav>\n/g,
  `            )}
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2D2D3D]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-[#1A1A24] border-b border-gray-100 dark:border-[#2D2D3D] overflow-hidden sticky top-16 z-50 shadow-lg"
          >
            <div className="flex flex-col px-4 py-4 space-y-2">
              <a href="#grades" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-[#2D2D3D] rounded-xl">الصفوف الدراسية</a>
              <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-[#2D2D3D] rounded-xl">المواد الدراسية</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-[#2D2D3D] rounded-xl">مميزات المنصة</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-[#2D2D3D] rounded-xl">الأسئلة الشائعة</a>
              {!user && (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[#00B4D8] dark:text-[#D4AF37] p-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-4 mt-2">تسجيل الدخول</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
