const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  '<Bell className="w-5 h-5" />',
  '<Bell className="w-4 h-4 md:w-5 md:h-5" />'
);

code = code.replace(
  '<LogOut className="w-4 h-4 shrink-0" />',
  '<LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />'
);

code = code.replace(
  '<Menu className="w-6 h-6" />',
  '<Menu className="w-5 h-5 md:w-6 md:h-6" />'
);

// Logo size
code = code.replace(
  'className="w-8 h-8 object-contain rounded-xl shadow-md"',
  'className="w-7 h-7 md:w-8 md:h-8 object-contain rounded-xl shadow-md"'
);
code = code.replace(
  'className="w-8 h-8 bg-gradient-to-tr',
  'className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-tr'
);
code = code.replace(
  'justify-center font-black text-lg text-white',
  'justify-center font-black text-base md:text-lg text-white'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
