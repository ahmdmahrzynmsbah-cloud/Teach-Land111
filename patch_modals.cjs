const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /className="bg-white dark:bg-\[#1A1A24\] rounded-[^"]+ max-w-[^"]+ relative z-10 shadow-[^"]+ p-6 text-right"/g,
  '$& style={{ maxHeight: "90vh", overflowY: "auto" }}'
);
// Some might have different padding or missing text-right
code = code.replace(
  /className="bg-white dark:bg-\[#1A1A24\] rounded-3xl w-full max-w-lg relative z-10 shadow-2xl p-6 text-right"/g,
  'className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-lg relative z-10 shadow-2xl p-6 text-right max-h-[90vh] overflow-y-auto"'
);
code = code.replace(
  /className="bg-white dark:bg-\[#1A1A24\] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 text-right"/g,
  'className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 text-right max-h-[90vh] overflow-y-auto"'
);
code = code.replace(
  /className="bg-white dark:bg-\[#1A1A24\] rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl p-6 text-right"/g,
  'className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl p-6 text-right max-h-[90vh] overflow-y-auto"'
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
