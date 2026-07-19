import re

def process_file(filename, prefix, review_type):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add PDF and Exam buttons
    ui_injection = """
                      {/* Attachments & Exam */}
                      {(review.pdfUrl || review.examId) && (
                        <div className="pt-4 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-wrap gap-3">
                          {review.pdfUrl && (
                            <a
                              href={review.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors border border-rose-200 dark:border-rose-900/30"
                            >
                              <FileText className="w-4 h-4" />
                              <span>تحميل المذكرة (PDF)</span>
                            </a>
                          )}
                          {review.examId && (
                            <button
                              onClick={() => {
                                if (isPurchased(review)) {
                                  navigate(`/exam/${review.examId}`);
                                } else {
                                  toast.error('يجب شراء المراجعة أولاً للوصول للاختبار');
                                }
                              }}
                              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-900/30 cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                              <span>اختبار المراجعة</span>
                            </button>
                          )}
                        </div>
                      )}"""
    
    content = re.sub(r'(\{/\* What you\'ll learn \*/\})', ui_injection + r'\n                      \1', content)

    # 2. Add FileText import if not present
    if "FileText" not in content:
        content = re.sub(r'(import \{ [^}]+) \} from \'lucide-react\';', r'\1, FileText } from \'lucide-react\';', content)
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/components/StudentTahsili.tsx', 'tahsili', 'TahsiliReview')
process_file('src/components/StudentQudurat.tsx', 'qudurat', 'QuduratReview')

print("Done patching student components.")
