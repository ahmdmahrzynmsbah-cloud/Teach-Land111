import { useState, useEffect, useRef } from 'react';
import { 
  Play, Lock, Unlock, ArrowRight, BookOpen, Clock, Users, Star, 
  Sparkles, ShieldCheck, CreditCard, ChevronLeft, CheckCircle2, 
  Compass, Award, RefreshCw, Volume2, Info, Loader2, ArrowLeft,
  Tv, Film, PlayCircle, Layers, CheckCircle, FileText, X, Wallet, Check, AlertTriangle, Copy, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, addDoc, collection, query, where, onSnapshot, setDoc, getDoc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { User, TahsiliReview } from '../types';
import { toast } from 'react-hot-toast';
import BunnyVideoPlayer from './BunnyVideoPlayer';
import TikTokPlayer from './TikTokPlayer';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { compressImageToBase64 } from '../lib/upload';

interface StudentTahsiliProps {
  userData?: User | null;
  setUserData?: (user: User) => void;
  initialSelectedReviewId?: string | null;
}

export default function StudentTahsili({ userData, setUserData, initialSelectedReviewId }: StudentTahsiliProps) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<TahsiliReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<TahsiliReview | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [purchasing, setPurchasing] = useState(false);
  const { settings: platformSettings } = usePlatformSettings();

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'vodafone'>('wallet');
  const [paymentSenderName, setPaymentSenderName] = useState('');
  const [paymentSenderPhone, setPaymentSenderPhone] = useState('');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentUploadProgress, setPaymentUploadProgress] = useState(0);
  const [isPayingWithWallet, setIsPayingWithWallet] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const vodafoneCashNumber = platformSettings.vodafoneCashNumber || "";
  const isVodafoneCashEnabled = platformSettings.isVodafoneCashEnabled ?? true;
  const isInstapayEnabled = platformSettings.isInstapayEnabled ?? false;
  const instapayHandle = platformSettings.instapayHandle || "";
  const isBankAccountEnabled = platformSettings.isBankAccountEnabled ?? false;
  const customPaymentMethods = platformSettings.customPaymentMethods || [];
  const bankAccountDetails = platformSettings.bankAccountDetails || "";

  // local state for watched lessons map, key: reviewId_lessonIndex -> boolean
  const [watchedLessons, setWatchedLessons] = useState<Record<string, boolean>>({});

  // Subscribe to published Tahsili reviews
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'tahsili_reviews'),
      where('status', '==', 'published')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: TahsiliReview[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as TahsiliReview);
      });
      // Sort newest first or featured first
      fetched.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });
      setReviews(fetched);
      setLoading(false);

      // If initialSelectedReviewId was passed, find and set it
      if (initialSelectedReviewId) {
        const found = fetched.find(r => r.id === initialSelectedReviewId);
        if (found) {
          setSelectedReview(found);
        }
      }
    }, (error) => {
      console.error('Error fetching Tahsili reviews:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialSelectedReviewId]);

  // Load watched state from localStorage
  useEffect(() => {
    if (userData?.id) {
      const saved = localStorage.getItem(`tahsili_watched_${userData.id}`);
      if (saved) {
        try {
          setWatchedLessons(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [userData?.id]);

  // Save watched state to localStorage
  const toggleWatched = (reviewId: string, index: number) => {
    const key = `${reviewId}_${index}`;
    const updated = {
      ...watchedLessons,
      [key]: !watchedLessons[key]
    };
    setWatchedLessons(updated);
    if (userData?.id) {
      localStorage.setItem(`tahsili_watched_${userData.id}`, JSON.stringify(updated));
    }
  };

  // Check if student has purchased the active review
  const isPurchased = (review: TahsiliReview) => {
    if (!userData) return false;
    return review.enrolledStudentIds?.includes(userData.id) || false;
  };

  // Generate dynamic lessons list based on review settings
  const getReviewLessons = (review: TahsiliReview) => {
    if (review.contentType && review.contentType !== 'video_course') return [];
    const count = review.lessonsCount || 5;
    const lessons = [];
    
    // Subject specific title generation
    const sub = review.subject || '';
    let topics = ['التأسيس والمفاهيم الشاملة', 'شرح الأسئلة والتجميعات', 'حل الأفكار الذهبية', 'تقنيات الحل السريع المتقدمة', 'الاختبار التجريبي الشامل'];
    if (sub.includes('فيزياء')) {
      topics = ['ميكانيكا وقوانين الحركة والجاذبية', 'الكهرباء والمغناطيسية والدوائر', 'الاهتزازات والموجات والصوت', 'الفيزياء الحديثة والنواة', 'حل تجميعات الفيزياء الحديثة والفيزياء العامة'];
    } else if (sub.includes('كيمياء')) {
      topics = ['مقدمة في الكيمياء والجدول الدوري', 'الروابط والمستويات والطاقة', 'كيمياء المحاليل والأحماض والقواعد', 'الكيمياء العضوية والبوليمرات', 'حل تجميعات الكيمياء الشاملة'];
    } else if (sub.includes('رياضيات')) {
      topics = ['المنطق الرياضي والهندسة والزوايا', 'المصفوفات والمحددات والمتجهات', 'الدوال الدائرية والمثلثات وحساب المثلثات', 'النهايات والاشتقاق والتكامل', 'حل تجميعات الرياضيات الشاملة'];
    } else if (sub.includes('أحياء')) {
      topics = ['تصنيف المخلوقات الحية والممالك', 'الخلية والتنفس والتركيب الكيميائي', 'علم البيئة والسلاسل الغذائية', 'الوراثة والتطور والكروموسومات', 'حل تجميعات الأحياء الشاملة'];
    }

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      lessons.push({
        title: `الدرس ${i + 1}: ${topic}`,
        duration: `${Math.round(45 + (i * 12) % 35)} دقيقة`,
        description: `شرح تفصيلي مع حل التجميعات الحديثة وأهم التوقعات لاختبار التحصيلي.`,
        isFree: i === 0, // First lesson is preview video
        videoUrl: review.videoUrl // In a real app we'd have dynamic URLs, but using the review main video is robust
      });
    }
    return lessons;
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtu.be/') ? url.split('youtu.be/')[1].split('?')[0] : new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3`;
      }
      if (url.includes('youtube.com/embed/')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}modestbranding=1&rel=0&iv_load_policy=3`;
      }
      if (url.includes('tiktok.com')) {
        const match = url.match(/\/(?:video|photo|v)\/(\d+)/);
        if (match && match[1]) {
          return `https://www.tiktok.com/embed/v2/${match[1]}`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  // Purchase Review Handler
  const handlePurchaseClick = (review: TahsiliReview) => {
    if (!userData) {
      toast.error('يرجى تسجيل حساب أولاً للمتابعة والاشتراك في المراجعة.');
      navigate('/special-register?type=tahsili');
      return;
    }

    if (userData.isSpecialRegistration && userData.status === 'pending') {
      toast.error('حسابك قيد المراجعة حالياً من قبل الإدارة. بمجرد قبول حسابك، ستتمكن من الاشتراك والدفع لتفعيل هذه المراجعة! ⏳');
      return;
    }

    if (review.enrolledStudentIds?.includes(userData.id)) {
      toast.success('أنت مشترك بالفعل في هذه المراجعة! استمتع بالتعلم');
      return;
    }

    setSelectedReview(review);
    setShowPaymentModal(true);
  };

  const handleWalletPayment = async () => {
    if (!userData || !selectedReview || isPayingWithWallet) return;
    
    const priceToPay = selectedReview.discountPrice !== undefined && selectedReview.discountPrice !== null && selectedReview.discountPrice < selectedReview.price
      ? selectedReview.discountPrice
      : selectedReview.price;

    const balance = userData.balance || 0;

    if (balance < priceToPay) {
      toast.error("عذراً، رصيدك في المحفظة لا يكفي");
      return;
    }

    setIsPayingWithWallet(true);
    try {
      const nextBalance = balance - priceToPay;

      // 1. Update User Balance
      await updateDoc(doc(db, 'users', userData.id), {
        balance: nextBalance
      });

      // 2. Add Student to Review Enrolled List
      const enrolledList = [...(selectedReview.enrolledStudentIds || []), userData.id];
      await updateDoc(doc(db, 'tahsili_reviews', selectedReview.id), {
        enrolledStudentIds: enrolledList
      });

      // 3. Create wallet transaction record
      await addDoc(collection(db, 'wallet_transactions'), {
        userId: userData.id,
        userName: userData.name,
        amount: -priceToPay,
        type: 'tahsili_purchase',
        description: `شراء مراجعة التحصيلي: ${selectedReview.title}`,
        createdAt: new Date().toISOString()
      });

      // 4. Create system notification
      await addDoc(collection(db, 'notifications'), {
        userId: userData.id,
        title: '🎉 تم تفعيل مراجعة التحصيلي بنجاح!',
        message: `تهانينا! لقد تم تفعيل مراجعة "${selectedReview.title}" بنجاح خصماً من محفظتك.`,
        read: false,
        type: 'system',
        createdAt: new Date().toISOString()
      });

      toast.success('تم الشراء وتفعيل المراجعة بنجاح! 🚀');
      
      if (setUserData) {
        setUserData({ ...userData, balance: nextBalance });
      }
      
      // Update local state instantly
      setSelectedReview({ ...selectedReview, enrolledStudentIds: enrolledList });
      
      setShowPaymentModal(false);
    } catch (err) {
      console.error('Error purchasing with wallet:', err);
      toast.error('فشل في إتمام العملية، الرجاء المحاولة مرة أخرى');
    } finally {
      setIsPayingWithWallet(false);
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(vodafoneCashNumber);
    setCopiedNumber(true);
    toast.success("تم نسخ الرقم بنجاح! 📋");
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ بنجاح! 📋");
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !selectedReview) return;
    if (!paymentSenderName.trim()) {
      toast.error("الرجاء إدخال اسمك بالكامل");
      return;
    }
    if (!paymentSenderPhone.trim()) {
      toast.error("الرجاء إدخال الرقم الذي قمت بالتحويل منه");
      return;
    }
    if (!paymentScreenshotFile) {
      toast.error("الرجاء إرفاق صورة إثبات أو لقطة شاشة التحويل");
      return;
    }

    setSubmittingPayment(true);
    try {
      // 1. Compress screenshot to Base64
      let base64Screenshot = '';
      try {
        base64Screenshot = await compressImageToBase64(paymentScreenshotFile);
      } catch (err) {
        console.error("Compression error:", err);
      }

      // 2. Create the payment request document
      const priceToPay = selectedReview.discountPrice !== undefined && selectedReview.discountPrice !== null && selectedReview.discountPrice < selectedReview.price
        ? selectedReview.discountPrice
        : selectedReview.price;

      await addDoc(collection(db, 'review_payments'), {
        userId: userData.id,
        userEmail: userData.email || '',
        reviewId: selectedReview.id,
        reviewTitle: selectedReview.title,
        reviewType: 'tahsili',
        amount: priceToPay,
        senderName: paymentSenderName.trim(),
        senderPhone: paymentSenderPhone.trim(),
        screenshot: base64Screenshot, // Storing as Base64 for instant approval
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      toast.success("تم إرسال طلب الاشتراك بنجاح! سيتم تفعيل المراجعة بعد مراجعة الإدارة للتحويل خلال وقت قصير. ✨");
      setShowPaymentModal(false);
      setPaymentSenderName("");
      setPaymentSenderPhone("");
      setPaymentScreenshotFile(null);
      setPaymentScreenshotPreview(null);
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("حدث خطأ أثناء إرسال طلب الاشتراك، يرجى المحاولة لاحقاً");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
        <p className="text-sm text-gray-500 font-bold dark:text-gray-400">جاري تحميل مراجعات التحصيلي الفاخرة...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2" dir="rtl">
      <AnimatePresence mode="wait">
        {!selectedReview ? (
          // ================= REVIEWS EXPLORER (GRID VIEW) =================
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Luxurious Header */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')] bg-cover opacity-10 bg-center" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
              
              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-xs font-black backdrop-blur-md border border-purple-500/30 text-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>برنامج التحصيلي الفاخر</span>
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  🎓 قسم مراجعات التحصيلي المتميزة
                </h1>
                <p className="text-slate-200/90 font-bold text-xs sm:text-sm max-w-2xl leading-relaxed">
                  مستقبلك يبدأ من هنا. مراجعات فيديو مكثفة ومصممة بدقة متناهية بأحدث تجميعات التحصيلي، يقدمها نخبة من أفضل المعلمين لمساعدتك على تأمين نسبة +95٪ بإذن الله.
                </p>
              </div>
            </div>

            {/* List Section */}
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm max-w-md mx-auto p-8 space-y-4">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <Compass className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-gray-200">القسم قيد التحضير والتجهيز</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
                  يقوم معلّمونا حالياً برفع وتجهيز أحدث مراجعات وفيديوهات التحصيلي الحصرية لك. ستظهر هنا فور نشرها مباشرة! 🚀
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-150 dark:border-[#2D2D3D] pb-3">
                  <Award className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">المراجعات الشاملة المتاحة للطلب</h2>
                  <span className="text-xs bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md font-bold">
                    {reviews.length} مراجعة متميزة
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map((review) => {
                    const lessons = getReviewLessons(review);
                    const purchased = isPurchased(review);
                    const discount = review.discountPrice !== undefined && review.discountPrice !== null && review.discountPrice < review.price;
                    const displayPrice = discount ? review.discountPrice : review.price;

                    const isPdf = review.contentType === 'pdf_book';
                    const isExam = review.contentType === 'exam';
                    const cardStyleClass = isPdf 
                      ? 'border-rose-200 dark:border-rose-950/50 hover:border-rose-400 dark:hover:border-rose-800/80 shadow-rose-100/10 dark:shadow-none hover:shadow-rose-500/5' 
                      : isExam 
                      ? 'border-emerald-200 dark:border-emerald-950/50 hover:border-emerald-400 dark:hover:border-emerald-800/80 shadow-emerald-100/10 dark:shadow-none hover:shadow-emerald-500/5' 
                      : 'border-gray-150 dark:border-[#2D2D3D] hover:border-purple-300 dark:hover:border-purple-800/80 shadow-gray-100/10 dark:shadow-none hover:shadow-purple-500/5';

                    return (
                      <motion.div
                        key={review.id}
                        whileHover={{ y: -5 }}
                        className={`bg-white dark:bg-[#1A1A24] border ${cardStyleClass} rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer`}
                        onClick={() => setSelectedReview(review)}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-900 overflow-hidden shrink-0">
                          <img 
                            src={review.thumbnail} 
                            alt={review.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                          
                          {/* Content Type Badge Overlay */}
                          {review.contentType === 'pdf_book' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                              <div className="bg-rose-600/90 backdrop-blur-md px-3 py-2 rounded-2xl flex flex-col items-center gap-1 shadow-2xl border border-rose-400/30">
                                <FileText className="w-6 h-6 text-white" />
                                <span className="text-white font-black text-[10px]">ملف / مذكرة</span>
                              </div>
                            </div>
                          )}
                          {review.contentType === 'exam' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                              <div className="bg-emerald-600/90 backdrop-blur-md px-3 py-2 rounded-2xl flex flex-col items-center gap-1 shadow-2xl border border-emerald-400/30">
                                <Award className="w-6 h-6 text-white" />
                                <span className="text-white font-black text-[10px]">اختبار إلكتروني</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Subject and Grade Badges */}
                          <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-purple-600/90 text-white rounded-lg text-[10px] font-black backdrop-blur-md">
                              {review.subject}
                            </span>
                            <span className="px-2.5 py-1 bg-black/50 text-slate-200 rounded-lg text-[10px] font-bold backdrop-blur-md">
                              {review.grade}
                            </span>
                          </div>

                          {/* Premium and Featured Badges */}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            {review.isFeatured && (
                              <span className="px-2 py-0.5 bg-yellow-400 text-gray-900 rounded-md text-[9px] font-black flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" /> مميز
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-black">
                              مدفوع
                            </span>
                            {review.contentType === 'pdf_book' ? (
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[9px] font-black flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" /> ملف PDF
                              </span>
                            ) : review.contentType === 'exam' ? (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" /> اختبار
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md text-[9px] font-black flex items-center gap-0.5">
                                <Film className="w-2.5 h-2.5" /> كورس مسجل
                              </span>
                            )}
                          </div>

                          {/* Lock / Unlock Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                              {purchased ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            {/* Teacher Profile Row */}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-black text-[10px]">
                                {review.teacherName.charAt(0)}
                              </div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">الأستاذ: {review.teacherName}</span>
                            </div>

                            <h3 className="font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1 text-sm">
                              {review.title}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-bold line-clamp-2">
                              {review.description}
                            </p>
                          </div>

                          {/* Duration & Lessons Bar */}
                          <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold border-t border-b border-gray-50 dark:border-[#2D2D3D] py-2.5">
                            {(!review.contentType || review.contentType === 'video_course') ? (
                              <>
                                <span className="flex items-center gap-1">
                                  <Film className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{review.lessonsCount} درس مراجعة</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                                  <span>مدة {review.duration}</span>
                                </span>
                              </>
                            ) : review.contentType === 'pdf_book' ? (
                              <span className="flex items-center gap-1 text-gray-500 font-bold">
                                <FileText className="w-3.5 h-3.5 text-rose-500" />
                                <span>مذكرة دراسية (PDF)</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500 font-bold">
                                <Award className="w-3.5 h-3.5 text-emerald-500" />
                                <span>اختبار إلكتروني تفاعلي</span>
                              </span>
                            )}
                          </div>

                          {/* Footer: Price and Purchase Button */}
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                {discount ? (
                                  <>
                                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                                      {review.discountPrice} ج.م
                                    </span>
                                    <span className="text-[10px] text-gray-400 line-through">
                                      {review.price} ج.م
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                                    {review.price === 0 ? 'مجاني' : `${review.price} ج.م`}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-gray-400 font-bold block">مراجعة تحصيلي شاملة</span>
                            </div>

                            {purchased ? (
                              <button className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>مفعّل ومفتوح</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchaseClick(review);
                                }}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer border-0 shadow-md shadow-purple-600/10 flex items-center gap-1"
                              >
                                <span>اشترك الآن</span>
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // ================= COURSE LANDING & PLAYING PAGE (DETAILED VIEW) =================
          (() => {
            const review = selectedReview;
            const purchased = isPurchased(review);
            const discount = review.discountPrice !== undefined && review.discountPrice !== null && review.discountPrice < review.price;
            const displayPrice = discount ? review.discountPrice : review.price;
            const lessons = getReviewLessons(review);
            const activeLesson = lessons[activeLessonIndex] || lessons[0];

            // Progress tracking
            const reviewWatchedCount = lessons.filter((_, idx) => watchedLessons[`${review.id}_${idx}`]).length;
            const completionPercent = Math.round((reviewWatchedCount / (lessons.length || 1)) * 100);

            return (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                {/* Back button */}
                <button 
                  onClick={() => setSelectedReview(null)}
                  className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group border-0 bg-transparent"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>العودة لجميع المراجعات</span>
                </button>

                {/* Hero Banner Grid (Apple/Stripe Inspired Glassmorphism) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left/Main Column: Video Player and Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Premium Video Frame Container */}
                    {(!selectedReview.contentType || selectedReview.contentType === 'video_course') ? (
    <div className="bg-slate-950 border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-2xl relative aspect-video">
                      {/* Video embed / player */}
                      {(!purchased && !activeLesson?.isFree) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center space-y-5 z-20">
                          <div className="absolute inset-0 bg-cover bg-center blur-md opacity-30" style={{ backgroundImage: `url(${review.thumbnail})` }} />
                          <div className="relative z-10 w-16 h-16 bg-purple-600/30 border border-purple-500 text-purple-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <Lock className="w-8 h-8" />
                          </div>
                          <div className="relative z-10 space-y-2">
                            <h3 className="text-lg font-black text-white">الدرس مغلق! 🔒</h3>
                            <p className="text-xs text-slate-300 font-bold max-w-sm mx-auto leading-relaxed">
                              اشترك الآن لمشاهدة المراجعة كاملة وفتح جميع المزايا ودروس المراجعة الحصرية مع حلول التجميعات.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                          {review.bunnyVideoId ? (
                            <BunnyVideoPlayer videoId={review.bunnyVideoId} />
                          ) : activeLesson?.videoUrl?.includes('tiktok.com') ? (
                            <TikTokPlayer videoUrl={activeLesson.videoUrl} />
                          ) : activeLesson?.videoUrl ? (
                            <iframe
                              src={getEmbedUrl(activeLesson.videoUrl)}
                              className="w-full h-full object-cover border-0"
                              title={activeLesson.title || 'Video'}
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          ) : (
                            <p className="text-white text-xs">لا يوجد فيديو</p>
                          )}
                        </div>
                      )}
                    </div>
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#12121A] border border-gray-150 dark:border-[#2D2D3D] p-8 rounded-3xl shadow-xl min-h-[300px] mb-6">
      <img src={selectedReview.promoImage || selectedReview.thumbnail} className="w-48 h-48 object-cover rounded-3xl shadow-lg mb-6" alt="Cover" />
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{selectedReview.contentType === 'exam' ? 'اختبار إلكتروني' : 'ملف دراسي / مذكرة'}</h2>
      <p className="text-sm text-gray-500 font-bold mb-6 text-center max-w-lg">{selectedReview.title}</p>
      
      {!purchased && selectedReview.price > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 px-4 py-2 rounded-xl text-xs font-bold border border-yellow-200 dark:border-yellow-900/30">
          اشترك الآن للوصول إلى المحتوى
        </div>
      )}
    </div>
  )}
  {/* Review Info Tab */}
                    <div className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                        <div className="space-y-1">
                          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                            {review.title}
                          </h1>
                          {(!selectedReview.contentType || selectedReview.contentType === 'video_course') && (
<p className="text-xs text-gray-500 dark:text-slate-400 font-bold">
الدرس النشط حالياً: {activeLesson?.title}
</p>
)}
                        </div>
                        
                        <span className="px-3.5 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded-xl text-xs font-black shrink-0">
                          مادة: {review.subject}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white">تفاصيل عن المراجعة الشاملة:</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                          {review.description}
                        </p>
                      </div>

                      
                      {/* Attachments & Exam */}
                      {(review.pdfUrl || review.examId) && (
                        <div className="pt-4 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-wrap gap-3">
                          {review.pdfUrl && (
                            <button
                              onClick={() => {
                                if (review.price === 0 || isPurchased(review)) {
                                  const link = document.createElement('a');
                                  link.href = review.pdfUrl;
                                  link.target = '_blank';
                                  link.download = review.title || 'document';
                                  link.rel = 'noopener noreferrer';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  toast.error('يجب شراء المراجعة أولاً لتحميل المذكرة 🔒');
                                }
                              }}
                              className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors border border-rose-200 dark:border-rose-900/30 cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              <span>تحميل المذكرة (PDF)</span>
                              {(review.price > 0 && !isPurchased(review)) && <Lock className="w-3.5 h-3.5 text-rose-400" />}
                            </button>
                          )}
                          {review.examId && (
                            <button
                              onClick={() => {
                                if (review.price === 0 || isPurchased(review)) {
                                  navigate(`/exam/${review.examId}`);
                                } else {
                                  toast.error('يجب شراء المراجعة أولاً للوصول للاختبار 🔒');
                                }
                              }}
                              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-900/30 cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                              <span>اختبار المراجعة</span>
                              {(review.price > 0 && !isPurchased(review)) && <Lock className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          )}
                        </div>
                      )}
                      {/* What you'll learn */}
                      <div className="pt-4 border-t border-gray-100 dark:border-[#2D2D3D] space-y-3">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span>ماذا ستتعلم في هذه المراجعة الممتازة؟</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 font-bold">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>تأسيس نظري متكامل لجميع المناهج والمفاهيم.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>حل مئات أسئلة التجميعات والشروحات الحصرية.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>استراتيجيات الحل الذكي السريع واجتياز التوقيت.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>اختبارات تجريبية مطابقة لمعايير قياس والتحصيلي.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Checkout or Lessons List Sidebar */}
                  <div className="space-y-6">
                    {/* PURCHASE GATE CARD - ONLY IF NOT PURCHASED */}
                    {!purchased && (
                      <div className="bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500/30 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-black bg-white/20 py-0.5 px-2.5 rounded-full">المنتج: التحصيلي</span>
                          <span className="text-xs text-yellow-300 font-black flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" /> تفعيل فوري
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-black">اشترك الآن لفتح المراجعة كاملة</h3>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                            ادفع مرة واحدة واحصل على إمكانية الوصول الأبدي لكافة الفيديوهات وتحديثات المراجعة وحلول التجميعات.
                          </p>
                        </div>

                        {/* Price Area */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">السعر المطلوب:</span>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              {discount ? (
                                <>
                                  <span className="text-xl font-black text-yellow-300">
                                    {review.discountPrice} ج.م
                                  </span>
                                  <span className="text-xs text-slate-400 line-through">
                                    {review.price} ج.م
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-black text-yellow-300">
                                  {review.price === 0 ? 'مجاني' : `${review.price} ج.م`}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold block">خصم مباشر من المحفظة</span>
                          </div>
                        </div>

                        {/* Buy Button */}
                        <button
                          onClick={() => handlePurchaseClick(review)}
                          className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-2xl font-black text-xs transition-all shadow-lg hover:shadow-xl cursor-pointer border-0 flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>اشترك الآن وباشر التعلم</span>
                        </button>

                        <div className="text-center">
                          <span className="text-[9.5px] text-slate-400 font-bold">رصيدك الحالي في المحفظة: {(userData?.balance || 0).toLocaleString('ar-EG')} ج.م</span>
                        </div>
                      </div>
                    )}

                    {/* PROGRESS CARD - IF PURCHASED AND CONTENT IS VIDEO */}
                    {purchased && (!review.contentType || review.contentType === 'video_course') && (
                      <div className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-gray-900 dark:text-white">معدل الإنجاز والتقدم:</h3>
                          <span className="text-xs font-black text-purple-600 dark:text-purple-400">%{completionPercent}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 dark:bg-[#2D2D3D] rounded-full h-2.5" dir="ltr">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-bold pt-1">
                          <span>الدروس المكتملة: {reviewWatchedCount} من {lessons.length}</span>
                          <span className="text-emerald-500 flex items-center gap-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> مفعّل بنجاح
                          </span>
                        </div>
                      </div>
                    )}

                    {/* PDF BOOK CARD - IF PURCHASED AND CONTENT IS PDF */}
                    {purchased && review.contentType === 'pdf_book' && (
                      <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/10 dark:to-rose-900/5 border border-rose-100 dark:border-rose-950 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white">الملف جاهز للتحميل 📄</h4>
                            <span className="text-[10px] font-bold text-gray-400">صيغة الملف: PDF عالي الجودة</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                          يمكنك تصفح المذكرة وتحميلها مباشرة للطباعة أو المذاكرة على جهازك بالضغط على الزر أدناه.
                        </p>
                        {review.pdfUrl ? (
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = review.pdfUrl || '';
                              link.target = '_blank';
                              link.download = review.title || 'document';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-md shadow-rose-600/10"
                          >
                            <FileText className="w-4 h-4" />
                            <span>تحميل المذكرة الآن</span>
                          </button>
                        ) : (
                          <p className="text-xs text-rose-500 font-bold">يرجى من المعلم إرفاق ملف المذكرة.</p>
                        )}
                      </div>
                    )}

                    {/* EXAM CARD - IF PURCHASED AND CONTENT IS EXAM */}
                    {purchased && review.contentType === 'exam' && (
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/10 dark:to-emerald-900/5 border border-emerald-100 dark:border-emerald-950 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white">الاختبار الإلكتروني جاهز 🏆</h4>
                            <span className="text-[10px] font-bold text-gray-400">تفاعلي بالكامل مع التصحيح الفوري</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                          اضغط على الزر أدناه لبدء حل اختبار التقييم لقياس مدى استيعابك للمفاهيم والحصول على الدرجة فوراً.
                        </p>
                        {review.examId ? (
                          <button
                            onClick={() => navigate(`/exam/${review.examId}`)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
                          >
                            <Award className="w-4 h-4" />
                            <span>ابدأ حل الاختبار الآن</span>
                          </button>
                        ) : (
                          <p className="text-xs text-emerald-500 font-bold">يرجى من المعلم إرفاق الاختبار المرتبط.</p>
                        )}
                      </div>
                    )}

                    {/* LESSONS PLAYLIST SIDEBAR - ONLY FOR VIDEOS */}
                    {(!review.contentType || review.contentType === 'video_course') && (
                      <div className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-sm flex flex-col">
                        <div className="p-4 bg-gray-50 dark:bg-[#1C1C28] border-b border-gray-100 dark:border-[#2D2D3D]">
                          <h3 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-600" />
                            <span>فهرس ودروس المراجعة</span>
                          </h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-[#2D2D3D] custom-scrollbar">
                          {lessons.map((lesson, idx) => {
                            const isFree = lesson.isFree;
                            const locked = !purchased && !isFree;
                            const isActive = activeLessonIndex === idx;
                            const isWatched = watchedLessons[`${review.id}_${idx}`];

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (!locked) {
                                    setActiveLessonIndex(idx);
                                  } else {
                                    toast.error('الرجاء شراء المراجعة لفتح هذا الدرس المدفوع');
                                  }
                                }}
                                className={`p-4 flex gap-3 text-right cursor-pointer transition-all ${
                                  isActive 
                                    ? 'bg-purple-500/5 dark:bg-purple-500/10 border-r-4 border-purple-600' 
                                    : 'hover:bg-gray-50 dark:hover:bg-[#1F1F2C]'
                                } ${locked ? 'opacity-65' : ''}`}
                              >
                                {/* Left status indicator */}
                                <div className="shrink-0 flex items-start pt-1">
                                  {locked ? (
                                    <div className="w-7 h-7 bg-gray-100 dark:bg-[#20202D] text-gray-400 rounded-lg flex items-center justify-center">
                                      <Lock className="w-3.5 h-3.5" />
                                    </div>
                                  ) : isWatched ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWatched(review.id, idx);
                                      }}
                                      className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-200 dark:border-emerald-900/30 rounded-lg flex items-center justify-center cursor-pointer"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWatched(review.id, idx);
                                      }}
                                      className="w-7 h-7 bg-purple-50 dark:bg-purple-950/20 text-purple-500 border border-purple-200 dark:border-purple-900/30 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <PlayCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                {/* Middle texts */}
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`text-xs font-black truncate ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                                      {lesson.title}
                                    </h4>
                                    {isFree && (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded text-[8.5px] font-black shrink-0">
                                        مفتوح مجاناً
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1 font-bold">
                                    {lesson.description}
                                  </p>
                                  <span className="text-[9.5px] text-gray-400 dark:text-gray-500 font-bold block">{lesson.duration}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-[#2D2D3D] flex flex-col overflow-hidden max-h-[90vh]"
              dir="rtl"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-[#1C1C28]/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">طرق الاشتراك المتاحة</h3>
                      <p className="text-[10px] font-bold text-gray-400">اختر الوسيلة المناسبة لك لتفعيل المراجعة</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-full transition-colors text-gray-500 cursor-pointer bg-transparent border-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Method Selector Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-[#0D0D12] rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                      paymentMethod === 'wallet' 
                        ? 'bg-white dark:bg-[#1A1A24] text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    رصيد المحفظة
                  </button>
                  
                  {(isVodafoneCashEnabled || isInstapayEnabled || isBankAccountEnabled || customPaymentMethods.some(m => m.isEnabled)) && (
                    <button
                      onClick={() => setPaymentMethod('vodafone')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                        paymentMethod === 'vodafone' 
                          ? 'bg-white dark:bg-[#1A1A24] text-rose-500 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <span className="text-base">💰</span>
                      تحويل مباشر
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {!userData ? (
                  <div className="p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-purple-50 dark:bg-purple-950/20 rounded-full flex items-center justify-center mx-auto text-purple-600">
                      <Lock className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">يجب تسجيل الدخول أولاً</h4>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                        للاشتراك في المراجعة وتفعيلها على حسابك، يرجى تسجيل الدخول أو إنشاء حساب جديد.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-black text-xs shadow-md border-0 cursor-pointer"
                      >
                        تسجيل الدخول
                      </button>
                      <button
                        onClick={() => navigate('/register')}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-black text-xs border-0 cursor-pointer"
                      >
                        إنشاء حساب جديد
                      </button>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {paymentMethod === 'wallet' ? (
                    <motion.div
                      key="wallet-tab"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6 space-y-6"
                    >
                      <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-3xl p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-white dark:bg-[#0D0D12] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-purple-100 dark:border-purple-900/30">
                          <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">رصيدك الحالي في المحفظة</p>
                          <h4 className="text-3xl font-black text-gray-900 dark:text-white font-sans mt-1">
                            {userData?.balance || 0} <span className="text-sm font-bold opacity-60">ج.م</span>
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D]">
                          <span className="text-xs font-bold text-gray-500">سعر المراجعة:</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                            {selectedReview.discountPrice || selectedReview.price} ج.م
                          </span>
                        </div>

                        {userData && (userData.balance || 0) < (selectedReview.discountPrice || selectedReview.price || 0) ? (
                          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                              عذراً، رصيدك الحالي لا يكفي لإتمام عملية الشراء. يرجى شحن محفظتك أولاً أو استخدام طريقة دفع أخرى.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex gap-3">
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                              رصيدك كافٍ! سيتم تفعيل المراجعة فوراً عند تأكيد العملية وخصم المبلغ من محفظتك.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                        <button
                          onClick={handleWalletPayment}
                          disabled={isPayingWithWallet || (userData?.balance || 0) < (selectedReview.discountPrice || selectedReview.price || 0)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                        >
                          {isPayingWithWallet ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>جاري إتمام الدفع...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 stroke-[3px]" />
                              <span>تأكيد الدفع والاشتراك الآن</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="vodafone-tab"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Form */}
                      <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
                        {/* Manual Payment Details */}
                        <div className="bg-gray-50/50 dark:bg-[#0D0D12]/50 border border-gray-100 dark:border-[#2D2D3D] rounded-2xl p-4 space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2D2D3D] pb-3">
                            <span className="text-xs font-black text-gray-700 dark:text-gray-300">طرق الدفع المتاحة للتحويل المباشر:</span>
                            <span className="text-[11px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-lg font-sans">
                              {selectedReview.discountPrice || selectedReview.price} ج.م
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {isVodafoneCashEnabled && vodafoneCashNumber && (
                              <div className="flex flex-col gap-2 bg-white dark:bg-[#12121A] border border-rose-100 dark:border-rose-950/30 rounded-xl p-3">
                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">فودافون كاش (Vodafone Cash)</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-black text-gray-900 dark:text-white font-sans tracking-wider" dir="ltr">
                                    {vodafoneCashNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCopyNumber}
                                    className="p-2 bg-gray-50 hover:bg-rose-50 dark:bg-[#1A1A24] dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg transition-all active:scale-95 border border-gray-100 dark:border-[#2D2D3D]"
                                  >
                                    {copiedNumber ? <Check className="w-4 h-4 stroke-[3px]" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {isInstapayEnabled && instapayHandle && (
                              <div className="flex flex-col gap-2 bg-white dark:bg-[#12121A] border border-purple-100 dark:border-purple-900/30 rounded-xl p-3">
                                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">حساب إنستاباي (Instapay)</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black text-gray-900 dark:text-white font-sans tracking-wider" dir="ltr">
                                    {instapayHandle}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(instapayHandle)}
                                    className="p-2 bg-gray-50 hover:bg-purple-50 dark:bg-[#1A1A24] dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg transition-all active:scale-95 border border-gray-100 dark:border-[#2D2D3D]"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {isBankAccountEnabled && bankAccountDetails && (
                              <div className="flex flex-col gap-2 bg-white dark:bg-[#12121A] border border-blue-100 dark:border-blue-900/30 rounded-xl p-3">
                                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">تحويل بنكي (Bank Transfer)</span>
                                <div className="flex items-start justify-between">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {bankAccountDetails}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(bankAccountDetails)}
                                    className="p-2 bg-gray-50 hover:bg-blue-50 dark:bg-[#1A1A24] dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all active:scale-95 border border-gray-100 dark:border-[#2D2D3D] shrink-0 mr-3"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                            {customPaymentMethods?.filter(m => m.isEnabled).map(method => (
                              <div key={method.id} className="flex flex-col gap-2 bg-white dark:bg-[#12121A] border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{method.name}</span>
                                <div className="flex items-start justify-between">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {method.details}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(method.details)}
                                    className="p-2 bg-gray-50 hover:bg-emerald-50 dark:bg-[#1A1A24] dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all active:scale-95 border border-gray-100 dark:border-[#2D2D3D] shrink-0 mr-3"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed text-right mt-4">
                            ⚠️ يرجى تحويل مبلغ المراجعة كاملاً وهو <span className="font-extrabold text-rose-600 dark:text-rose-400">{selectedReview.discountPrice || selectedReview.price} ج.م</span> إلى إحدى الطرق الموضحة أعلاه، ثم ملء البيانات أدناه لرفع إثبات التحويل لتفعيل المراجعة.
                          </p>
                        </div>

                        {/* Sender Full Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-700 dark:text-gray-200 block">اسمك بالكامل (اسم الطالب):</label>
                          <input
                            type="text"
                            required
                            value={paymentSenderName}
                            onChange={(e) => setPaymentSenderName(e.target.value)}
                            placeholder="أدخل اسمك ثلاثياً أو رباعياً لسهولة المطابقة..."
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 outline-none focus:border-purple-600 dark:text-white font-bold text-xs font-sans"
                          />
                        </div>

                        {/* Sender Phone Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-700 dark:text-gray-200 block">رقم الهاتف المحول منه (محفظة التحويل):</label>
                          <input
                            type="tel"
                            required
                            value={paymentSenderPhone}
                            onChange={(e) => setPaymentSenderPhone(e.target.value)}
                            placeholder="مثال: 01012345678"
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 outline-none focus:border-purple-600 dark:text-white font-bold text-xs font-sans text-right"
                            dir="ltr"
                          />
                        </div>

                        {/* Screenshot Upload */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-700 dark:text-gray-200 block">إرفاق لقطة شاشة التحويل (إسكرين الإثبات):</label>
                          <div 
                            onClick={() => {
                              const el = document.getElementById('payment-screenshot-input');
                              el?.click();
                            }}
                            className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#13131C] transition-all relative overflow-hidden p-4 group"
                          >
                            {paymentScreenshotPreview ? (
                              <div className="w-full h-full relative">
                                <img 
                                  src={paymentScreenshotPreview} 
                                  alt="إسكرين التحويل" 
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5">
                                  <Upload className="w-4 h-4" /> تغيير الصورة
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                <div className="p-3 bg-gray-100 dark:bg-[#1A1A24] rounded-2xl mb-2 text-rose-500">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-black text-gray-700 dark:text-gray-300">اضغط لرفع لقطة الشاشة</span>
                                <span className="text-[10px] text-gray-400 mt-1">يُقبل الصور (PNG, JPG, JPEG)</span>
                              </div>
                            )}
                            <input
                              id="payment-screenshot-input"
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotChange}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-[#2D2D3D]">
                          <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-100 dark:hover:bg-[#222230] text-gray-700 dark:text-gray-300 text-xs font-black transition-colors cursor-pointer bg-transparent"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            disabled={submittingPayment}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 border-0"
                          >
                            {submittingPayment ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري إرسال الطلب...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                <span>تأكيد التحويل وإرسال الطلب</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
