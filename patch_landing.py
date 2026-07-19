import re

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    imports = """import StudentTahsili from './StudentTahsili';
import StudentQudurat from './StudentQudurat';"""
    content = re.sub(r'import StudentTahsili from \'./StudentTahsili\';', imports, content)

    # 2. Add Qudurat section
    qudurat_section = """
      {/* Qudurat Section */}
      <section id="qudurat" className="py-20 sm:py-28 bg-gray-50 dark:bg-[#0A0A10] text-gray-900 dark:text-white relative overflow-hidden">
        {/* Decorative background light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
              <Star className="w-4 h-4" />
              ميزة ممتازة
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
              قسم مراجعات القدرات المتميزة
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base font-medium max-w-2xl mx-auto">
              مستقبلك يبدأ من هنا. مراجعات فيديو مكثفة ومصممة بدقة متناهية بأحدث تجميعات القدرات، يقدمها نخبة من أفضل المعلمين لمساعدتك على تأمين نسبة +95٪ بإذن الله.
            </p>
          </div>

          <StudentQudurat userData={userData} setUserData={setUserData} />
        </div>
      </section>"""
    
    content = re.sub(r'(      \{/\* Latest Courses Section \*/\})', qudurat_section + r'\n\n\1', content)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/components/LandingPage.tsx')

print("Done patching landing.")
