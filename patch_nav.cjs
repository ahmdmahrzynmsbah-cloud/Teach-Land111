const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const navEnd = `            )}
          </div>
        </div>
      </nav>`;

const newNavEnd = `            )}
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
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
            className="md:hidden bg-white dark:bg-[#1A1A24] border-b border-gray-100 dark:border-[#2D2D3D] overflow-hidden"
          >
            <div className="flex flex-col px-4 py-4 space-y-4">
              <a href="#grades" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300">الصفوف الدراسية</a>
              <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300">المواد الدراسية</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300">مميزات المنصة</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300">الأسئلة الشائعة</a>
              {!user && (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-600 dark:text-gray-300">تسجيل الدخول</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(navEnd, newNavEnd);
fs.writeFileSync('src/components/LandingPage.tsx', code);
