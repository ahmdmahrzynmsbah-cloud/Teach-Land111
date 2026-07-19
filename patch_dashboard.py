import re

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    imports = """import TeacherTahsili from './TeacherTahsili';
import StudentTahsili from './StudentTahsili';
import TeacherQudurat from './TeacherQudurat';
import StudentQudurat from './StudentQudurat';"""
    content = re.sub(r'import TeacherTahsili from \'./TeacherTahsili\';\nimport StudentTahsili from \'./StudentTahsili\';', imports, content)

    # 2. Add Qudurat states
    qudurat_states = """  // Qudurat Premium Feature states
  const [hasPublishedQudurat, setHasPublishedQudurat] = useState(false);
  const [selectedQuduratReviewId, setSelectedQuduratReviewId] = useState<string | null>(null);
  const [publishedQuduratReviews, setPublishedQuduratReviews] = useState<any[]>([]);"""
    content = re.sub(r'(  // Tahsili Premium Feature states)', qudurat_states + r'\n\1', content)

    # 3. Fetch Qudurat reviews
    fetch_qudurat = """    // Subscription to published Qudurat Reviews
    const qQudurat = query(collection(db, 'qudurat_reviews'), where('status', '==', 'published'));
    const unsubscribeQudurat = onSnapshot(qQudurat, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPublishedQuduratReviews(list);
      setHasPublishedQudurat(list.length > 0);
    });"""
    content = re.sub(r'(    // Subscription to published Tahsili Reviews)', fetch_qudurat + r'\n\1', content)
    content = re.sub(r'(return \(\) => \{\n\s*unsubscribeUser\(\);\n\s*unsubscribeTahsili\(\);)', r'\1\n      unsubscribeQudurat();', content)

    # 4. Teacher sidebar tab
    teacher_tab = """              { id: 'qudurat', label: 'مراجعات القدرات', icon: BookOpen },"""
    content = re.sub(r'(              \{ id: \'tahsili\', label: \'مراجعات التحصيلي\', icon: BookOpen \},)', r'\1\n' + teacher_tab, content)

    # 5. Student sidebar tab
    student_tab = """              { id: 'qudurat', label: 'مراجعات القدرات', icon: Film, isPremium: true, showPing: true },"""
    content = re.sub(r'(              \{ id: \'tahsili\', label: \'مراجعات التحصيلي\', icon: Film, isPremium: true, showPing: true \},)', r'\1\n' + student_tab, content)

    # 6. Admin sidebar tab
    admin_tab = """              { id: 'qudurat', label: 'مراجعات القدرات', icon: Film, isPremium: true },"""
    content = re.sub(r'(              \{ id: \'tahsili\', label: \'مراجعات التحصيلي\', icon: Film, isPremium: true \},)', r'\1\n' + admin_tab, content)

    # 7. Render teacher content
    teacher_render = """                {activeTab === 'qudurat' && (
                  <TeacherQudurat userData={userData} />
                )}"""
    content = re.sub(r'(                \{activeTab === \'tahsili\' && \(\n\s*<TeacherTahsili userData=\{userData\} />\n\s*\)\})', r'\1\n' + teacher_render, content)

    # 8. Render student content
    student_render = """                {activeTab === 'qudurat' && (
                  <StudentQudurat 
                    userData={userData} 
                    setUserData={setUserData} 
                    initialSelectedReviewId={selectedQuduratReviewId}
                  />
                )}"""
    content = re.sub(r'(                \{activeTab === \'tahsili\' && \(\n\s*<StudentTahsili \n\s*userData=\{userData\} \n\s*setUserData=\{setUserData\}\n\s*initialSelectedReviewId=\{selectedTahsiliReviewId\}\n\s*/>\n\s*\)\})', r'\1\n' + student_render, content)

    # 9. Dashboard overview cards
    overview_card = """                    {/* Qudurat Premium section */}
                    {hasPublishedQudurat && userData?.role !== 'student' && (
                      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden group mt-6">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                          <Film className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                              <Star className="w-3.5 h-3.5" /> ميزة ممتازة جديدة
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black">مراجعات القدرات</h3>
                            <p className="text-emerald-100 font-medium max-w-lg text-sm sm:text-base leading-relaxed">
                              اكتشف أقوى مراجعات القدرات المكثفة للوصول إلى نسبة +95٪ بإذن الله.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-4">
                              <button 
                                onClick={() => {
                                  setActiveTab('qudurat');
                                  setSelectedQuduratReviewId(null);
                                }}
                                className="px-6 py-2.5 bg-white text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
                              >
                                تصفح جميع المراجعات
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {publishedQuduratReviews.slice(0, 3).map((review) => {
                              const isUnlocked = userData?.role === 'admin' || (userData?.purchasedTahsiliReviews || []).includes(review.id);
                              return (
                                <button
                                  key={review.id}
                                  onClick={() => {
                                    setActiveTab('qudurat');
                                    setSelectedQuduratReviewId(review.id);
                                  }}
                                  className="flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-right group/item"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-bold text-white line-clamp-1">{review.title}</p>
                                      <p className="text-[10px] text-emerald-200">الأستاذ: {review.teacherName}</p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}"""
    
    content = re.sub(r'(\{/\* Tahsili Premium section \*/\})', overview_card + r'\n                    \1', content)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/components/Dashboard.tsx')

print("Done patching dashboard.")
