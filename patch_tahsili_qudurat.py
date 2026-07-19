import re

def process_file(filename, prefix, review_type):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add states for pdf and quizzes
    state_injection = """  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [examId, setExamId] = useState('');
  const [teacherQuizzes, setTeacherQuizzes] = useState<any[]>([]);"""
    
    content = re.sub(r'(const \[submitting, setSubmitting\] = useState\(false\);)', r'\1\n' + state_injection, content)

    # 2. Fetch quizzes in useEffect
    fetch_quizzes = f"""    // Fetch quizzes
    const fetchQuizzes = async () => {{
      try {{
        const qzQuery = query(collection(db, 'quizzes'), where('teacherId', '==', userData.id));
        const snap = await getDocs(qzQuery);
        const qzList: any[] = [];
        snap.forEach(d => qzList.push({{ id: d.id, ...d.data() }}));
        setTeacherQuizzes(qzList);
      }} catch (err) {{
        console.error('Error fetching quizzes:', err);
      }}
    }};
    fetchQuizzes();"""
    
    content = re.sub(r'(setLoading\(true\);)', r'\1\n' + fetch_quizzes, content)

    # 3. reset form
    reset_form = """    setPdfUrl('');
    setExamId('');"""
    content = re.sub(r'(setLessonsCount\(5\);\n\s*setDuration\(''\);)', r'\1\n' + reset_form, content)

    # 4. handle open edit
    open_edit = """    setPdfUrl(review.pdfUrl || '');
    setExamId(review.examId || '');"""
    content = re.sub(r'(setLessonsCount\(review.lessonsCount\);\n\s*setDuration\(review.duration \|\| ''\);)', r'\1\n' + open_edit, content)

    # 5. create/update payload
    payload = """      pdfUrl,
      examId,"""
    content = re.sub(r'(lessonsCount: Number\(lessonsCount\),\n\s*duration,)', r'\1\n' + payload, content)
    
    # 6. Add UI for PDF and Exam
    ui_injection = """                  {/* PDF Upload */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">ملف الـ PDF المرفق (اختياري):</label>
                    <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-250 dark:border-[#2D2D3D] p-4 rounded-3xl space-y-3">
                      <div className="flex gap-2 border-b border-gray-150 dark:border-[#20202C] pb-2">
                         <input
                          type="file"
                          accept=".pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPdfUploading(true);
                              try {
                                const url = await uploadChunkedFile(file, () => {});
                                setPdfUrl(url);
                                toast.success('تم رفع الملف بنجاح');
                              } catch(err) {
                                toast.error('فشل الرفع');
                              } finally {
                                setPdfUploading(false);
                              }
                            }
                          }}
                          className="w-full text-xs"
                         />
                      </div>
                      {pdfUploading && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
                      {pdfUrl && !pdfUploading && <p className="text-xs text-green-500">تم إرفاق الملف بنجاح ✓</p>}
                    </div>
                  </div>
                  
                  {/* Exam Selector */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">اختبار على الفيديو (اختياري):</label>
                    <select
                      value={examId}
                      onChange={(e) => setExamId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-bold text-gray-900 dark:text-white"
                    >
                      <option value="">-- بدون اختبار --</option>
                      {teacherQuizzes.map(qz => (
                        <option key={qz.id} value={qz.id}>{qz.title}</option>
                      ))}
                    </select>
                  </div>"""
    
    content = re.sub(r'(\{/\* Duration \*/\})', ui_injection + r'\n                  \1', content)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/components/TeacherTahsili.tsx', 'tahsili', 'TahsiliReview')
process_file('src/components/TeacherQudurat.tsx', 'qudurat', 'QuduratReview')

print("Done patching.")
