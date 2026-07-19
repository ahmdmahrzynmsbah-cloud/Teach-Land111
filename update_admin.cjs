const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Add walletBalance to editFormData state inside Edit Modal
code = code.replace(
  /كلمة المرور \(إن وجدت\)<\/label>\s*<input type="text" value=\{editFormData\.password \|\| ''\} onChange=\{e => setEditFormData\(\{\.\.\.editFormData, password: e\.target\.value\}\)\} className="w-full bg-gray-50 dark:bg-\[\#0D0D12\] border border-gray-200 dark:border-\[\#2D2D3D\] rounded-xl px-4 py-2 outline-none focus:border-\[\#00B4D8\] dark:text-white font-bold" \/>\s*<\/div>/,
  `كلمة المرور (إن وجدت)</label>
                  <input type="text" value={editFormData.password || ''} onChange={e => setEditFormData({...editFormData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                </div>
                {selectedUser.role === 'student' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">رصيد المحفظة (ج.م)</label>
                    <input type="number" min="0" step="any" value={editFormData.walletBalance !== undefined ? editFormData.walletBalance : ''} onChange={e => setEditFormData({...editFormData, walletBalance: e.target.value ? Number(e.target.value) : 0})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                  </div>
                )}`
);

// 2. Change dummy text "نقاط التميز" to "رصيد المحفظة"
code = code.replace(/نقاط التميز الأكاديمي/g, 'رصيد المحفظة');
code = code.replace(/نقاط التميز/g, 'رصيد المحفظة');
code = code.replace(/340 نقطة/g, '0 ج.م');

fs.writeFileSync('src/components/AdminPanel.tsx', code);
