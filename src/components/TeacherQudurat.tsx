import { useState, useEffect } from 'react';
import { 
  Plus, Video, Eye, EyeOff, Save, Trash2, Edit2, Star, Sparkles, 
  Check, Play, Clock, BookOpen, Layers, Award, Film, Loader2, Search, X, ChevronRight, CheckCircle2,
  Upload, Link, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, logVideoLink } from '../lib/firebase';
import { User, QuduratReview } from '../types';
import { toast } from 'react-hot-toast';
import { uploadChunkedFile, compressImageToBase64, uploadFileToFirebase } from '../lib/upload';

interface TeacherQuduratProps {
  userData: User;
}

export default function TeacherQudurat({ userData }: TeacherQuduratProps) {
  const [reviews, setReviews] = useState<QuduratReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<QuduratReview | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'hidden'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [promoImage, setPromoImage] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [bunnyVideoId, setBunnyVideoId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [lessonsCount, setLessonsCount] = useState<number>(5);
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'hidden'>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [examId, setExamId] = useState('');
  const [teacherQuizzes, setTeacherQuizzes] = useState<any[]>([]);

  // Upload progress states
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  
  const [promoImageUploading, setPromoImageUploading] = useState(false);
  const [promoImageProgress, setPromoImageProgress] = useState(0);

  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const [pdfProgress, setPdfProgress] = useState(0);

  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;
    setThumbnailUploading(true);
    setThumbnailProgress(10);
    try {
      setThumbnailProgress(45);
      const base64 = await compressImageToBase64(file, 800, 600);
      setThumbnailProgress(100);
      setThumbnail(base64);
      toast.success('تم رفع وحفظ صورة الغلاف بنجاح! 📸');
    } catch (err: any) {
      console.error('Thumbnail upload failed:', err);
      toast.error('فشل معالجة صورة الغلاف: ' + (err.message || ''));
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handlePromoImageUpload = async (file: File) => {
    if (!file) return;
    setPromoImageUploading(true);
    setPromoImageProgress(10);
    try {
      setPromoImageProgress(45);
      const base64 = await compressImageToBase64(file, 800, 600);
      setPromoImageProgress(100);
      setPromoImage(base64);
      toast.success('تم رفع وحفظ الصورة الترويجية بنجاح! 📸');
    } catch (err: any) {
      console.error('Promo image upload failed:', err);
      toast.error('فشل معالجة الصورة الترويجية: ' + (err.message || ''));
    } finally {
      setPromoImageUploading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const result = await uploadChunkedFile(file, (p) => setVideoProgress(p));
      if (result.startsWith('bunny:')) {
        const bId = result.replace('bunny:', '');
        setBunnyVideoId(bId);
        setVideoUrl(''); // we're using bunnyVideoId
      } else {
        setVideoUrl(result);
        setBunnyVideoId('');
      }
      toast.success('تم رفع ملف الفيديو بنجاح! 🎥');
    } catch (err: any) {
      console.error('Video upload failed:', err);
      toast.error('فشل رفع الفيديو: ' + (err.message || ''));
    } finally {
      setVideoUploading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    setPdfUploading(true);
    setPdfProgress(0);
    try {
      const url = await uploadChunkedFile(file, (p) => setPdfProgress(p), {
        bunny: false
      });
      setPdfUrl(url);
      toast.success('تم رفع ملف المذكرة الـ PDF بنجاح! 📄');
    } catch (err: any) {
      console.error('PDF upload failed:', err);
      toast.error('فشل رفع ملف الـ PDF: ' + (err.message || ''));
    } finally {
      setPdfUploading(false);
    }
  };

  // Load teacher reviews
  useEffect(() => {
    if (!userData?.id) return;
    setLoading(true);
    // Fetch quizzes
    const fetchQuizzes = async () => {
      try {
        const qzQuery = query(collection(db, 'quizzes'), where('teacherId', '==', userData.id));
        const snap = await getDocs(qzQuery);
        const qzList: any[] = [];
        snap.forEach(d => qzList.push({ id: d.id, ...d.data() }));
        setTeacherQuizzes(qzList);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      }
    };
    fetchQuizzes();

    const q = query(
      collection(db, 'qudurat_reviews'),
      where('teacherId', '==', userData.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: QuduratReview[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as QuduratReview);
      });
      // Sort by creation time newest first
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(fetched);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching Qudurat reviews:', error);
      toast.error('خطأ في تحميل بيانات مراجعات القدرات');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.id]);

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingReview(null);
    setTitle('');
    setDescription('');
    setThumbnail('');
    setPromoImage('');
    setSubject(userData.subject || 'الرياضيات');
    setGrade('الثاني الثانوي');
    setVideoUrl('');
    setBunnyVideoId('');
    setPrice(0);
    setDiscountPrice('');
    setLessonsCount(5);
    setDuration('١٠ ساعات');
    setStatus('published');
    setIsFeatured(false);
    
    setThumbnailUploading(false);
    setThumbnailProgress(0);
    setPromoImageUploading(false);
    setPromoImageProgress(0);
    setVideoUploading(false);
    setVideoProgress(0);

    setPdfUrl('');
    setPdfUploading(false);
    setPdfProgress(0);
    setExamId('');

    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (review: QuduratReview) => {
    setEditingReview(review);
    setTitle(review.title);
    setDescription(review.description);
    setThumbnail(review.thumbnail);
    setPromoImage(review.promoImage || '');
    setSubject(review.subject);
    setGrade(review.grade);
    setVideoUrl(review.videoUrl || '');
    setBunnyVideoId(review.bunnyVideoId || '');
    setPdfUrl(review.pdfUrl || '');
    setExamId(review.examId || '');
    setPrice(review.price);
    setDiscountPrice(review.discountPrice ? String(review.discountPrice) : '');
    setLessonsCount(review.lessonsCount);
    setDuration(review.duration);
    setStatus(review.status);
    setIsFeatured(review.isFeatured || false);

    setThumbnailUploading(false);
    setThumbnailProgress(0);
    setPromoImageUploading(false);
    setPromoImageProgress(0);
    setVideoUploading(false);
    setVideoProgress(0);

    setShowModal(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !thumbnail.trim() || !subject.trim() || !grade.trim() || (!videoUrl.trim() && !bunnyVideoId.trim()) || !duration.trim()) {
      toast.error('الرجاء تعبئة جميع الحقول المطلوبة بما في ذلك فيديو المراجعة');
      return;
    }

    setSubmitting(true);

    let finalVideoUrl = videoUrl.trim();
    if (finalVideoUrl && finalVideoUrl.includes('tiktok.com')) {
      try {
        const resolveRes = await fetch(`/api/resolve-tiktok?url=${encodeURIComponent(finalVideoUrl)}`);
        if (resolveRes.ok) {
          const resolveData = await resolveRes.json();
          if (resolveData.url) {
            finalVideoUrl = resolveData.url;
          }
        }
      } catch (resolveError) {
        console.error("Failed to resolve TikTok URL:", resolveError);
      }
    }

    const parsedDiscountPrice = discountPrice ? parseFloat(discountPrice) : undefined;

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      thumbnail: thumbnail.trim(),
      promoImage: promoImage.trim() || null,
      subject: subject.trim(),
      grade: grade.trim(),
      teacherName: userData.name,
      teacherId: userData.id,
      videoUrl: finalVideoUrl,
      bunnyVideoId: bunnyVideoId.trim() || null,
      pdfUrl: pdfUrl.trim() || null,
      examId: examId.trim() || null,
      price: Number(price),
      discountPrice: parsedDiscountPrice !== undefined ? Number(parsedDiscountPrice) : null,
      lessonsCount: Number(lessonsCount),
      duration: duration.trim(),
      status: status,
      isFeatured: isFeatured,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingReview) {
        const docRef = doc(db, 'qudurat_reviews', editingReview.id);
        await updateDoc(docRef, payload);

        // Secretly log videoUrl on update
        if (videoUrl.trim() || finalVideoUrl) {
          logVideoLink(videoUrl.trim() || finalVideoUrl, 'qudurat_review', {
            action: 'update',
            reviewId: editingReview.id,
            title: payload.title,
            originalInputUrl: videoUrl.trim(),
            finalVideoUrl: finalVideoUrl,
            bunnyVideoId: bunnyVideoId
          });
        }

        toast.success('تم تحديث مراجعة القدرات بنجاح ✨');
      } else {
        const completePayload = {
          ...payload,
          enrolledStudentIds: [],
          createdAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'qudurat_reviews'), completePayload);

        // Secretly log videoUrl on create
        if (videoUrl.trim() || finalVideoUrl) {
          logVideoLink(videoUrl.trim() || finalVideoUrl, 'qudurat_review', {
            action: 'create',
            reviewId: docRef.id,
            title: payload.title,
            originalInputUrl: videoUrl.trim(),
            finalVideoUrl: finalVideoUrl,
            bunnyVideoId: bunnyVideoId
          });
        }

        toast.success('تمت إضافة مراجعة قدرات جديدة بنجاح 🎉');
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving Qudurat review:', err);
      toast.error('فشل حفظ المراجعة، يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDelete = (id: string) => {
    setDeletingReviewId(id);
  };

  // Confirm and perform actual deletion
  const confirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'qudurat_reviews', id));
      toast.success('تم حذف المراجعة بنجاح ✨');
    } catch (err) {
      console.error('Error deleting Qudurat review:', err);
      toast.error('فشل في حذف المراجعة');
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (review: QuduratReview) => {
    const nextStatus = review.status === 'published' ? 'hidden' : 'published';
    try {
      await updateDoc(doc(db, 'qudurat_reviews', review.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(nextStatus === 'published' ? 'تم النشر بنجاح 🟢' : 'تم الإخفاء بنجاح 🔴');
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('فشل تعديل حالة النشر');
    }
  };

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-950 dark:via-purple-900 dark:to-pink-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>المنتج الممتاز المخصص: مراجعات القدرات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">إدارة قسم مراجعات القدرات 🎓</h1>
            <p className="text-white/80 font-bold text-xs sm:text-sm max-w-xl leading-relaxed">
              قم بإنشاء وتعديل مراجعات القدرات المدفوعة للطلاب. المراجعات تظهر للطلاب كمنتج متميز منفصل لمساعدتهم على اجتياز اختبار القدرات بتفوق.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer border-0 shrink-0 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>إنشاء مراجعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن مراجعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'published', 'draft', 'hidden'] as const).map((filter) => {
            const labels = { all: 'الكل', published: 'المنشور', draft: 'المسودة', hidden: 'المخفي' };
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer border-0 ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10' 
                    : 'bg-gray-50 dark:bg-[#0D0D12] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-150 dark:border-[#2D2D3D] p-5 h-72 animate-pulse space-y-4">
              <div className="h-40 bg-gray-100 dark:bg-[#2D2D3D] rounded-xl w-full" />
              <div className="h-4 bg-gray-100 dark:bg-[#2D2D3D] rounded w-2/3" />
              <div className="h-4 bg-gray-100 dark:bg-[#2D2D3D] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center border border-gray-150 dark:border-[#2D2D3D] shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">لا توجد مراجعات قدرات بعد</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
            لم تقم بإنشاء مراجعات قدرات مطابقة لشروط الفلترة الحالية. ابدأ الآن بإنشاء أول فيديو مراجعة مدفوع ومتميز!
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer border-0 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء مراجعة</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => {
            const hasDiscount = review.discountPrice !== undefined && review.discountPrice !== null && review.discountPrice < review.price;
            return (
              <motion.div
                key={review.id}
                layoutId={review.id}
                className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group relative"
              >
                {/* Image & Badges */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden shrink-0">
                  <img 
                    src={review.thumbnail} 
                    alt={review.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  {/* Category Badges */}
                  <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 bg-purple-600/90 text-white rounded-lg text-[10px] font-black backdrop-blur-md">
                      {review.subject}
                    </span>
                    <span className="px-2.5 py-1 bg-black/60 text-white rounded-lg text-[10px] font-bold backdrop-blur-md">
                      {review.grade}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {review.isFeatured && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-gray-900 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span>مميز</span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {review.status === 'published' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 text-white rounded-lg text-[10px] font-black backdrop-blur-md">
                        <Check className="w-3 h-3" /> منشور
                      </span>
                    ) : review.status === 'draft' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/90 text-white rounded-lg text-[10px] font-black backdrop-blur-md">
                        <EyeOff className="w-3 h-3" /> مسودة
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/90 text-white rounded-lg text-[10px] font-black backdrop-blur-md">
                        <EyeOff className="w-3 h-3" /> مخفي للطلاب
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {review.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-2">
                      {review.description}
                    </p>
                    
                    {/* Attachment Badges */}
                    {(review.pdfUrl || review.examId) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {review.pdfUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black border border-rose-100 dark:border-rose-900/20">
                            <FileText className="w-3 h-3" />
                            مذكرة PDF
                          </span>
                        )}
                        {review.examId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-100 dark:border-emerald-900/20">
                            <Award className="w-3 h-3" />
                            اختبار مرتبط
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stat Bar */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-bold border-t border-b border-gray-100 dark:border-[#2D2D3D] py-2.5">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 text-purple-500" />
                      <span>{review.lessonsCount} درس مراجعة</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      <span>مدة {review.duration}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>{review.enrolledStudentIds?.length || 0} طالب</span>
                    </span>
                  </div>

                  {/* Pricing and Action buttons */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {hasDiscount ? (
                          <>
                            <span className="text-base font-black text-purple-600 dark:text-purple-400">
                              {review.discountPrice} ر.س
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              {review.price} ر.س
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-black text-purple-600 dark:text-purple-400">
                            {review.price === 0 ? 'مجاني' : `${review.price} ر.س`}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold block">مراجعة قدرات مدفوعة</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        title={review.status === 'published' ? 'إخفاء عن الطلاب' : 'نشر للطلاب'}
                        onClick={() => handleToggleStatus(review)}
                        className="p-2.5 bg-gray-50 dark:bg-[#20202C] text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all cursor-pointer border-0"
                      >
                        {review.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        title="تعديل المراجعة"
                        onClick={() => handleOpenEdit(review)}
                        className="p-2.5 bg-gray-50 dark:bg-[#20202C] text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all cursor-pointer border-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title="حذف المراجعة"
                        onClick={() => handleDelete(review.id)}
                        className="p-2.5 bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-150 dark:border-[#2D2D3D] flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Film className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    {editingReview ? 'تعديل مراجعة القدرات' : 'إنشاء مراجعة قدرات جديدة'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#2D2D3D] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-right">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">عنوان المراجعة (مثال: الشامل في فيزياء القدرات):</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">الوصف الدراسي بالتفصيل:</label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>

                  {/* Subject and Grade */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">المادة الدراسية:</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">الصف المستهدف:</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="الثالث الثانوي">الثالث الثانوي</option>
                      <option value="الثاني الثانوي">الثاني الثانوي</option>
                      <option value="الأول الثانوي">الأول الثانوي</option>
                    </select>
                  </div>

                  {/* Thumbnail Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">صورة غلاف المراجعة (Thumbnail):</label>
                    <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-250 dark:border-[#2D2D3D] p-3 rounded-2xl space-y-2">
                      <div className="flex gap-2 border-b border-gray-150 dark:border-[#20202C] pb-2">
                        <button
                          type="button"
                          className="flex-1 py-1 px-3 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black border-0 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع ملف من جهازك</span>
                        </button>
                      </div>

                      <div className="relative border border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-100/50 dark:hover:bg-[#151520] transition-colors cursor-pointer min-h-[100px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleThumbnailUpload(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {thumbnailUploading ? (
                          <div className="space-y-2 w-full max-w-[150px] mx-auto">
                            <Loader2 className="w-5 h-5 text-purple-500 animate-spin mx-auto" />
                            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">جاري الرفع {thumbnailProgress.toFixed(0)}%</p>
                            <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${thumbnailProgress}%` }} />
                            </div>
                          </div>
                        ) : thumbnail ? (
                          <div className="space-y-2">
                            <img src={thumbnail} alt="Preview" className="h-16 w-24 object-cover rounded-lg border border-gray-200 dark:border-[#2D2D3D] mx-auto" />
                            <p className="text-[10px] text-emerald-500 font-bold">تم تعيين الغلاف بنجاح ✓</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">اسحب صورة الغلاف هنا أو اضغط للاختيار</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Promo Image Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">الصورة الترويجية (اختياري):</label>
                    <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-250 dark:border-[#2D2D3D] p-3 rounded-2xl space-y-2">
                      <div className="flex gap-2 border-b border-gray-150 dark:border-[#20202C] pb-2">
                        <button
                          type="button"
                          className="flex-1 py-1 px-3 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black border-0 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع ملف من جهازك</span>
                        </button>
                      </div>

                      <div className="relative border border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-100/50 dark:hover:bg-[#151520] transition-colors cursor-pointer min-h-[100px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handlePromoImageUpload(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {promoImageUploading ? (
                          <div className="space-y-2 w-full max-w-[150px] mx-auto">
                            <Loader2 className="w-5 h-5 text-purple-500 animate-spin mx-auto" />
                            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">جاري الرفع {promoImageProgress.toFixed(0)}%</p>
                            <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${promoImageProgress}%` }} />
                            </div>
                          </div>
                        ) : promoImage ? (
                          <div className="space-y-2">
                            <img src={promoImage} alt="Preview" className="h-16 w-24 object-cover rounded-lg border border-gray-200 dark:border-[#2D2D3D] mx-auto" />
                            <p className="text-[10px] text-emerald-500 font-bold">تم تعيين الصورة بنجاح ✓</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">اسحب الصورة الترويجية هنا أو اضغط للاختيار</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Selector */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">الفيديو الترويجي أو الدرس المفتوح (Preview Video):</label>
                    <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-250 dark:border-[#2D2D3D] p-4 rounded-3xl space-y-3">
                      <div className="flex gap-2 border-b border-gray-150 dark:border-[#20202C] pb-2">
                        <button
                          type="button"
                          className="py-1 px-3 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black border-0 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>رفع فيديو من جهازك</span>
                        </button>
                      </div>

                      <div className="relative border border-dashed border-gray-350 dark:border-[#2D2D3D] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-100/50 dark:hover:bg-[#151520] transition-colors cursor-pointer min-h-[120px]">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {videoUploading ? (
                          <div className="space-y-2 w-full max-w-[200px] mx-auto">
                            <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
                            <p className="text-xs font-black text-purple-600 dark:text-purple-400">جاري الرفع والدمج: {videoProgress.toFixed(0)}%</p>
                            <p className="text-[10px] text-gray-400 font-bold">الرجاء عدم إغلاق الصفحة أثناء المعالجة</p>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                            </div>
                          </div>
                        ) : bunnyVideoId ? (
                          <div className="space-y-2">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-black text-emerald-500">تم رفع الفيديو وحفظه بنجاح! ✓</p>
                            <p className="text-[10px] text-gray-400 font-mono">معرّف الفيديو: {bunnyVideoId}</p>
                          </div>
                        ) : videoUrl ? (
                          <div className="space-y-2">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                              <Video className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-black text-blue-500">تم تعيين رابط الفيديو بنجاح ✓</p>
                            <p className="text-[10px] text-gray-400 font-mono line-clamp-1 max-w-sm mx-auto">{videoUrl}</p>
                          </div>
                        ) : (
                          <>
                            <Video className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">اسحب ملف الفيديو هنا أو اضغط للاختيار</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-1">يدعم صيغ MP4, WebM ويقوم بحفظها وتشفيرها تلقائياً</p>
                          </>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-gray-150 dark:border-[#20202C]">
                        <p className="text-[11px] text-gray-400 font-black">أو أدخل رابط الفيديو من يوتيوب، تيك توك، أو أي رابط خارجي:</p>
                        <input
                          type="text"
                          placeholder="رابط فيديو يوتيوب، تيك توك، أرنب (Bunny) أو فيديو مباشر"
                          value={videoUrl}
                          onChange={(e) => {
                            setVideoUrl(e.target.value);
                            if (e.target.value.trim()) {
                              setBunnyVideoId('');
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Discount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">السعر الأساسي (ر.س):</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">السعر بعد الخصم (ر.س - اختياري):</label>
                    <input
                      type="number"
                      min={0}
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* PDF and Exam Attachment Section */}
                  <div className="sm:col-span-2 border border-gray-150 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-[#0D0D12]/30 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-[#2D2D3D]">
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">الملفات المرفقة والاختبارات المرتبطة</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* PDF Upload */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <span>ملف المذكرة الدراسية (PDF):</span>
                          <span className="text-[10px] text-gray-400 font-bold">(اختياري)</span>
                        </label>

                        <div className="relative border border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-100/50 dark:hover:bg-[#151520] transition-colors cursor-pointer min-h-[120px] bg-white dark:bg-[#1A1A24]">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePdfUpload(file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={pdfUploading}
                          />

                          {pdfUploading ? (
                            <div className="space-y-2 w-full max-w-[180px]">
                              <Loader2 className="w-6 h-6 text-rose-500 animate-spin mx-auto" />
                              <p className="text-[11px] font-black text-rose-600 dark:text-rose-400">جاري رفع الملف: {pdfProgress.toFixed(0)}%</p>
                              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${pdfProgress}%` }} />
                              </div>
                            </div>
                          ) : pdfUrl ? (
                            <div className="space-y-2 w-full">
                              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <p className="text-xs font-black text-emerald-500">تم رفع الملف بنجاح ✓</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono line-clamp-1 max-w-[200px] mx-auto text-center" style={{ direction: 'ltr' }}>
                                {pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1) || 'pdf_document.pdf'}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPdfUrl('');
                                }}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg transition-colors border border-red-100 dark:border-red-950/20 cursor-pointer mx-auto block"
                              >
                                حذف الملف الحالي
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-7 h-7 text-gray-400 mb-1.5" />
                              <p className="text-[11px] font-black text-gray-700 dark:text-gray-300">اسحب ملف PDF هنا أو اضغط للرفع</p>
                              <p className="text-[9px] text-gray-400 font-bold mt-1">الحد الأقصى للملف: 50 ميجابايت</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Exam Link */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <span>ربط اختبار شامل بالمراجعة:</span>
                          <span className="text-[10px] text-gray-400 font-bold">(اختياري)</span>
                        </label>
                        <div className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-4 space-y-3 min-h-[120px] flex flex-col justify-center">
                          <select
                            value={examId}
                            onChange={(e) => setExamId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          >
                            <option value="">-- اختر اختبارًا من اختباراتك --</option>
                            {teacherQuizzes.map((q) => (
                              <option key={q.id} value={q.id}>
                                {q.title || q.name || q.id}
                              </option>
                            ))}
                          </select>
                          
                          <div className="relative flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#2D2D3D]">
                            <span className="text-[9px] text-gray-400 font-black shrink-0">أو اكتب ID مخصص:</span>
                            <input
                              type="text"
                              placeholder="أدخل معرّف الاختبار يدوياً"
                              value={examId}
                              onChange={(e) => setExamId(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-lg text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lessons Count and Duration */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">عدد دروس المراجعة بالفيديو:</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={lessonsCount}
                      onChange={(e) => setLessonsCount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">إجمالي مدة المراجعة (مثال: ١٢ ساعة):</label>
                    <input
                      type="text"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Publish Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 dark:text-gray-300">حالة النشر:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="published">منشور للطلاب 🟢</option>
                      <option value="draft">مسودة (حفظ مؤقت) 🟡</option>
                      <option value="hidden">مخفي بالكامل للطلاب 🔴</option>
                    </select>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                    />
                    <label htmlFor="isFeatured" className="text-xs font-black text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      تثبيت كمراجعة مميزة في الواجهة الرئيسية ⭐
                    </label>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-150 dark:border-[#2D2D3D] mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingReview ? 'حفظ التعديلات' : 'إنشاء ونشر المراجعة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs hover:bg-gray-200 dark:hover:bg-[#333] transition-all cursor-pointer border-0"
                  >
                    إلغاء التراجع
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingReviewId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-right"
              dir="rtl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  تأكيد الحذف النهائي للمراجعة
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                  هل أنت متأكد تماماً من رغبتك في حذف مراجعة القدرات هذه نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيلغي اشتراك جميع الطلاب المسجلين بها فوراً.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => confirmDelete(deletingReviewId)}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-red-600/20 cursor-pointer border-0"
                >
                  نعم، احذف نهائياً
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingReviewId(null)}
                  className="flex-1 py-3.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs hover:bg-gray-200 dark:hover:bg-[#3D3D4F] transition-all cursor-pointer border-0"
                >
                  تراجع وإلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
