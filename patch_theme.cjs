const fs = require('fs');
let code = fs.readFileSync('src/components/ThemeToggle.tsx', 'utf8');

code = code.replace(
  'className="relative p-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center justify-center transition-all hover:ring-2 hover:ring-[#00B4D8]/50 dark:hover:ring-[#D4AF37]/50"',
  'className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center justify-center transition-all hover:ring-2 hover:ring-[#00B4D8]/50 dark:hover:ring-[#D4AF37]/50"'
);

// Scale icons slightly for mobile
code = code.replace(
  '<Sun className="w-5 h-5 text-[#F5A623]" />',
  '<Sun className="w-4 h-4 md:w-5 md:h-5 text-[#F5A623]" />'
);
code = code.replace(
  '<Moon className="w-5 h-5 text-[#D4AF37]" />',
  '<Moon className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />'
);

fs.writeFileSync('src/components/ThemeToggle.tsx', code);
