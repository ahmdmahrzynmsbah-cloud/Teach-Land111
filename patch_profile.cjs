const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

const target = `<input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="مثال: كيمياء، فيزياء، أحياء"
                        />`;

const replacement = `<input
                          type="text"
                          required
                          disabled
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-gray-100 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed opacity-70"
                          title="لا يمكن تغيير المادة بعد التسجيل. تواصل مع الإدارة للتعديل."
                        />
                        <p className="text-[10px] text-gray-500 mt-1 font-bold">لا يمكن تغيير المادة بعد التسجيل. تواصل مع الإدارة للتعديل.</p>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/ProfileSection.tsx', code);
