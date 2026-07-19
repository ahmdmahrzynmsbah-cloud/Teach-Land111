const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Update header container
code = code.replace(
  '<header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] px-6 h-20 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">',
  '<header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] px-3 md:px-6 h-16 md:h-20 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">'
);

// 2. Left side mobile menu container
code = code.replace(
  '<div className="flex items-center gap-3 md:hidden">',
  '<div className="flex items-center gap-2 md:hidden shrink-0">'
);

// 3. Right side items container
code = code.replace(
  '<div className="flex items-center gap-4">',
  '<div className="flex items-center gap-1.5 md:gap-4 shrink-0">'
);

// 4. Logout button
code = code.replace(
  'className="md:hidden w-10 h-10 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center border border-red-150 dark:border-red-900/30 transition-all font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer"',
  'className="md:hidden w-8 h-8 md:w-10 md:h-10 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center border border-red-150 dark:border-red-900/30 transition-all font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer"'
);

// 5. Notifications button
code = code.replace(
  'className="w-10 h-10 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222230] transition-colors relative"',
  'className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222230] transition-colors relative"'
);

// 6. Profile button
const oldProfileBtn = 'className={`w-10 h-10 rounded-full border-2 shadow-sm overflow-hidden flex items-center justify-center font-bold text-lg transition-all ${';
const newProfileBtn = 'className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-sm overflow-hidden flex items-center justify-center font-bold text-sm md:text-lg transition-all ${';
code = code.replace(oldProfileBtn, newProfileBtn);

// 7. Hamburger menu button
code = code.replace(
  'className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl"',
  'className="p-1.5 md:p-2 -ml-1 md:-ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl"'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
