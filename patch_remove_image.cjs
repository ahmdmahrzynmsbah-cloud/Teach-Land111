const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherClasses.tsx', 'utf8');

const uploadSection = `                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">غلاف الكورس</label>
                    <div 
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      className={\`w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden \${
                        imagePreview 
                          ? 'border-transparent' 
                          : 'border-gray-300 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:bg-gray-50 dark:hover:bg-[#222230]'
                      }\`}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">اضغط لرفع صورة من جهازك</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>`;

code = code.replace(uploadSection, '');

fs.writeFileSync('src/components/TeacherClasses.tsx', code);
