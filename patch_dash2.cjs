const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const headerTarget = `           <div className="flex items-center gap-3 md:hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-xl shadow-md" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                    {settings.logoChar}
                </div>
              )}
           </div>`;

const newHeader = `           <div className="flex items-center gap-3 md:hidden">
              <button 
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl"
              >
                <Menu className="w-6 h-6" />
              </button>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-xl shadow-md" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                    {settings.logoChar}
                </div>
              )}
           </div>`;

code = code.replace(headerTarget, newHeader);
fs.writeFileSync('src/components/Dashboard.tsx', code);
