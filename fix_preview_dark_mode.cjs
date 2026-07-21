const fs = require('fs');
const file = 'src/components/FinancesManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    from: 'className="flex-1 bg-white text-gray-900 border border-gray-200 rounded-2xl p-6 md:p-8 flex flex-col shadow-sm print:border-none print:shadow-none print:p-0 min-h-[500px]"',
    to: 'className="flex-1 bg-white dark:bg-[#0D0D12] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-6 md:p-8 flex flex-col shadow-sm print:border-none print:shadow-none print:p-0 min-h-[500px] print:bg-white print:text-black"'
  },
  {
    from: '<h2 className="text-2xl font-black text-gray-900">كشف حساب مالي تفصيلي</h2>',
    to: '<h2 className="text-2xl font-black text-gray-900 dark:text-white print:text-black">كشف حساب مالي تفصيلي</h2>'
  },
  {
    from: 'border-b border-gray-200',
    to: 'border-b border-gray-200 dark:border-[#2D2D3D] print:border-gray-200'
  },
  {
    from: 'className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100"',
    to: 'className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 print:border-emerald-100 print:bg-emerald-50"'
  },
  {
    from: 'className="bg-rose-50/50 p-4 rounded-xl border border-rose-100"',
    to: 'className="bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800/30 print:border-rose-100 print:bg-rose-50"'
  },
  {
    from: 'className="bg-blue-50/50 p-4 rounded-xl border border-blue-100"',
    to: 'className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 print:border-blue-100 print:bg-blue-50"'
  },
  {
    from: 'className="bg-amber-50/50 p-4 rounded-xl border border-amber-100"',
    to: 'className="bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 print:border-amber-100 print:bg-amber-50"'
  },
  {
    from: 'className="font-black text-gray-800 text-sm"',
    to: 'className="font-black text-gray-800 dark:text-gray-100 text-sm print:text-gray-800"'
  },
  {
    from: 'className="overflow-hidden border border-gray-200 rounded-xl"',
    to: 'className="overflow-hidden border border-gray-200 dark:border-[#2D2D3D] rounded-xl print:border-gray-200"'
  },
  {
    from: 'className="bg-gray-50 text-gray-600 border-b border-gray-200"',
    to: 'className="bg-gray-50 dark:bg-[#12121A] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-[#2D2D3D] print:bg-gray-50 print:text-gray-600 print:border-gray-200"'
  },
  {
    from: 'className="divide-y divide-gray-100"',
    to: 'className="divide-y divide-gray-100 dark:divide-[#2D2D3D] print:divide-gray-100"'
  },
  {
    from: 'className="hover:bg-gray-50/50 transition-colors"',
    to: 'className="hover:bg-gray-50/50 dark:hover:bg-[#12121A] transition-colors print:hover:bg-transparent"'
  },
  {
    from: 'className="bg-gray-50 border-t border-gray-200"',
    to: 'className="bg-gray-50 dark:bg-[#12121A] border-t border-gray-200 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-200"'
  },
  {
    from: 'className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100"',
    to: 'className="bg-gray-50 dark:bg-[#12121A] rounded-xl p-8 text-center border border-gray-100 dark:border-[#2D2D3D] print:bg-gray-50 print:border-gray-100"'
  },
  {
    from: 'className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold"',
    to: 'className="bg-gray-100 dark:bg-[#1A1A24] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold print:bg-gray-100 print:text-gray-600"'
  },
  {
    from: 'className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg"',
    to: 'className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1A1A24] px-2 py-1 rounded-lg print:bg-gray-100 print:text-gray-500"'
  },
  {
    from: 'className="p-3 font-black text-gray-700 text-left"',
    to: 'className="p-3 font-black text-gray-700 dark:text-gray-200 text-left print:text-gray-700"'
  },
  {
    from: 'className="p-3 text-center font-bold text-gray-400"',
    to: 'className="p-3 text-center font-bold text-gray-400 dark:text-gray-500 print:text-gray-400"'
  },
  {
    from: 'className="p-3 font-mono text-gray-500 whitespace-nowrap"',
    to: 'className="p-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap print:text-gray-500"'
  },
  {
    from: 'className="p-3 font-bold"',
    to: 'className="p-3 font-bold text-gray-800 dark:text-gray-200 print:text-gray-800"'
  },
  {
    from: 'className="p-3 text-gray-500"',
    to: 'className="p-3 text-gray-500 dark:text-gray-400 print:text-gray-500"'
  }
];

let newCode = code;
for (const rep of replacements) {
  // Use global replace if needed, or simply string replacement
  newCode = newCode.split(rep.from).join(rep.to);
}

// Special case: make sure td class "p-3" without extra classes gets text color
newCode = newCode.replace(/<td className="p-3">/g, '<td className="p-3 text-gray-800 dark:text-gray-200 print:text-gray-800">');

fs.writeFileSync(file, newCode);
