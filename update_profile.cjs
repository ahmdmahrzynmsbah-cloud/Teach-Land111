const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/⭐<\/div>\s*<span className="text-\[10px\] text-gray-400 font-bold block pt-1">النقاط والنجوم<\/span>\s*<h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">\{userData\?\.stars \|\| 0\}<\/h3>\s*<p className="text-\[9px\] text-gray-400 font-bold">تفاعلك الدراسي مستمر<\/p>/, 
`💰</div>
                            <span className="text-[10px] text-gray-400 font-bold block pt-1">رصيد المحفظة</span>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white font-sans">{userData?.walletBalance || 0} <span className="text-xs">ج.م</span></h3>
                            <p className="text-[9px] text-gray-400 font-bold">يمكنك الشحن لاحقاً</p>`);

fs.writeFileSync('src/components/ProfileSection.tsx', code);
