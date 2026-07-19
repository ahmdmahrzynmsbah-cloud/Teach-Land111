const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /{\/\* Hero Section \*\//;

const newNavEnd = `
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 ml-2"
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
            className="md:hidden bg-white dark:bg-[#1A1A24] border-b border-gray-100 dark:border-[#2D2D3D] overflow-hidden sticky top-16 z-[100]"
          >
            <div className="flex flex-col px-4 py-4 space-y-4">
              <a href="#grades" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2">الصفوف الدراسية</a>
              <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2">المواد الدراسية</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2">مميزات المنصة</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2">الأسئلة الشائعة</a>
              {!user && (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300 p-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-4">تسجيل الدخول</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */`;

// But wait, the button needs to go inside the `<div className="flex items-center gap-2 sm:gap-4">`.
code = code.replace(
  /<\/nav>\s*{\/\* Hero Section \*\//,
  `</nav>\n      {/* Hero Section */`
); // Dummy replace first to see if I can target the exact closing tag.

