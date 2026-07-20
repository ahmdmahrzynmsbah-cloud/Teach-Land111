import { useState, useEffect } from 'react';
import { 
  Play, Lock, Unlock, ArrowRight, BookOpen, Clock, Users, Star, 
  Sparkles, ShieldCheck, CreditCard, ChevronLeft, CheckCircle2, 
  Compass, Award, RefreshCw, Volume2, Info, Loader2, ArrowLeft,
  Tv, Film, PlayCircle, Layers, CheckCircle
, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, addDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { User, QuduratReview } from '../types';
import { toast } from 'react-hot-toast';
import BunnyVideoPlayer from './BunnyVideoPlayer';
import TikTokPlayer from './TikTokPlayer';

interface StudentQuduratProps {
  userData?: User | null;
  setUserData?: (user: User) => void;
  initialSelectedReviewId?: string | null;
}

export default function StudentQudurat({ userData, setUserData, initialSelectedReviewId }: StudentQuduratProps) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<QuduratReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<QuduratReview | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [purchasing, setPurchasing] = useState(false);

  // local state for watched lessons map, key: reviewId_lessonIndex -> boolean
  const [watchedLessons, setWatchedLessons] = useState<Record<string, boolean>>({});

  // Subscribe to published Qudurat reviews
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'qudurat_reviews'),
      where('status', '==', 'published')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: QuduratReview[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as QuduratReview);
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
      console.error('Error fetching Qudurat reviews:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialSelectedReviewId]);

  // Load watched state from localStorage
  useEffect(() => {
    if (userData?.id) {
      const saved = localStorage.getItem(`qudurat_watched_${userData.id}`);
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
      localStorage.setItem(`qudurat_watched_${userData.id}`, JSON.stringify(updated));
    }
  };

  // Check if student has purchased the active review
  const isPurchased = (review: QuduratReview) => {
    if (!userData) return false;
    return review.enrolledStudentIds?.includes(userData.id) || false;
  };

  // Generate dynamic lessons list based on review settings
  const getReviewLessons = (review: QuduratReview) => {
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
        description: `شرح تفصيلي مع حل التجميعات الحديثة وأهم التوقعات لاختبار القدرات.`,
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
        return `https://www.youtube.com/embed/${videoId}`;
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
  const handlePurchase = async (review: QuduratReview) => {
    if (!userData) {
      toast((t) => (
        <div className="text-right space-y-2 p-1" dir="rtl">
          <p className="font-black text-sm text-purple-700">🔐 يرجى تسجيل الدخول أو إنشاء حساب</p>
          <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
            لشراء مراجعة "{review.title}" المتميزة ومباشرة الدراسة والتعلم، يرجى تسجيل الدخول أولاً أو إنشاء حساب جديد مجاني بالكامل في ثوانٍ معدودة!
          </p>
          <div className="flex gap-2 justify-end pt-1.5">
            <button 
              onClick={() => { toast.dismiss(t.id); navigate('/register'); }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black cursor-pointer border-0 shadow-sm transition-colors"
            >
              إنشاء حساب جديد
            </button>
            <button 
              onClick={() => { toast.dismiss(t.id); navigate('/login'); }}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-black cursor-pointer border-0 transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      ), { duration: 6000 });
      return;
    }

    const priceToPay = review.discountPrice !== undefined && review.discountPrice !== null && review.discountPrice < review.price
      ? review.discountPrice
      : review.price;

    const balance = userData.balance || 0;

    if (balance < priceToPay) {
      toast.error(
        <div className="text-right space-y-1">
          <p className="font-black text-xs text-red-600">❌ عذراً، رصيد محفظتك غير كافٍ</p>
          <p className="text-[11px] text-gray-500 font-bold">تحتاج إلى شحن محفظتك بـ {(priceToPay - balance).toLocaleString('ar-EG')} ر.س إضافية لشراء هذه المراجعة.</p>
        </div>
      );
      return;
    }

    if (!window.confirm(`هل أنت متأكد من رغبتك في شراء مراجعة "${review.title}" بسعر ${priceToPay} ر.س خصماً من محفظتك؟`)) return;

    setPurchasing(true);
    try {
      const nextBalance = balance - priceToPay;

      // 1. Update User Balance
      await updateDoc(doc(db, 'users', userData.id), {
        balance: nextBalance
      });

      // 2. Add Student to Review Enrolled List
      const enrolledList = [...(review.enrolledStudentIds || []), userData.id];
      await updateDoc(doc(db, 'qudurat_reviews', review.id), {
        enrolledStudentIds: enrolledList
      });

      // 3. Create wallet transaction record
      await addDoc(collection(db, 'wallet_transactions'), {
        userId: userData.id,
        userName: userData.name,
        amount: -priceToPay,
        type: 'qudurat_purchase',
        description: `شراء مراجعة القدرات الممتازة: ${review.title}`,
        createdAt: new Date().toISOString()
      });

      // 4. Create system notification
      await addDoc(collection(db, 'notifications'), {
        userId: userData.id,
        title: '🎉 تم تفعيل مراجعة القدرات بنجاح!',
        message: `تهانينا! لقد تم شحن وتفعيل مراجعة "${review.title}" بنجاح. يمكنك الآن مشاهدة جميع الفيديوهات دون قيود والبدء بالتعلم فوراً!`,
        read: false,
        type: 'system',
        createdAt: new Date().toISOString()
      });

      toast.success('تم الشراء وتفعيل المراجعة بنجاح! استمتع بالتعلم المميز 🚀');
      
      // Update local state instantly for UI responsiveness
      const updatedReview = { ...review, enrolledStudentIds: enrolledList };
      setSelectedReview(updatedReview);

      if (setUserData) {
        setUserData({ ...userData, balance: nextBalance });
      }
    } catch (err) {
      console.error('Error purchasing Qudurat review:', err);
      toast.error('فشل في إتمام عملية الشراء، الرجاء المحاولة مرة أخرى');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
        <p className="text-sm text-gray-500 font-bold dark:text-gray-400">جاري تحميل مراجعات القدرات الفاخرة...</p>
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
                  <span>برنامج القدرات الفاخر</span>
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  🎓 قسم مراجعات القدرات المتميزة
                </h1>
                <p className="text-slate-200/90 font-bold text-xs sm:text-sm max-w-2xl leading-relaxed">
                  مستقبلك يبدأ من هنا. مراجعات فيديو مكثفة ومصممة بدقة متناهية بأحدث تجميعات القدرات، يقدمها نخبة من أفضل المعلمين لمساعدتك على تأمين نسبة +95٪ بإذن الله.
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
                  يقوم معلّمونا حالياً برفع وتجهيز أحدث مراجعات وفيديوهات القدرات الحصرية لك. ستظهر هنا فور نشرها مباشرة! 🚀
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

                    return (
                      <motion.div
                        key={review.id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer"
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
                            <span className="flex items-center gap-1">
                              <Film className="w-3.5 h-3.5 text-purple-500" />
                              <span>{review.lessonsCount} درس مراجعة</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-purple-500" />
                              <span>مدة {review.duration}</span>
                            </span>
                          </div>

                          {/* Footer: Price and Purchase Button */}
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                {discount ? (
                                  <>
                                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                                      {review.discountPrice} ر.س
                                    </span>
                                    <span className="text-[10px] text-gray-400 line-through">
                                      {review.price} ر.س
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                                    {review.price === 0 ? 'مجاني' : `${review.price} ر.س`}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-gray-400 font-bold block">مراجعة قدرات شاملة</span>
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
                                  setSelectedReview(review);
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
            const completionPercent = Math.round((reviewWatchedCount / lessons.length) * 100);

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
                    <div className="bg-slate-950 border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-2xl relative aspect-video">
                      {/* Video embed / player */}
                      {(!purchased && !activeLesson.isFree) ? (
                        // LOCKED PREVIEW BLUR OVERLAY
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

                          <button
                            onClick={() => handlePurchase(review)}
                            disabled={purchasing}
                            className="relative z-10 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer border-0 flex items-center gap-2"
                          >
                            {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                            <span>شراء الآن بـ {displayPrice} ر.س</span>
                          </button>
                        </div>
                      ) : (
                        // ACTUAL UNLOCKED VIDEO PLAYER
                        review.bunnyVideoId ? (
                          <div className="absolute inset-0 w-full h-full">
                            <BunnyVideoPlayer videoId={review.bunnyVideoId} />
                          </div>
                        ) : activeLesson.videoUrl?.includes('tiktok.com') ? (
                          <TikTokPlayer videoUrl={activeLesson.videoUrl} />
                        ) : (activeLesson.videoUrl?.startsWith('/uploads/') || activeLesson.videoUrl?.includes('.mp4') || activeLesson.videoUrl?.includes('.webm')) ? (
                          <video
                            src={activeLesson.videoUrl}
                            className="w-full h-full object-contain bg-black"
                            controls
                            playsInline
                          />
                        ) : (
                          <iframe
                            src={getEmbedUrl(activeLesson.videoUrl)}
                            className="w-full h-full object-cover border-0"
                            title={activeLesson.title}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        )
                      )}
                    </div>

                    {/* Review Info Tab */}
                    <div className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                        <div className="space-y-1">
                          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                            {review.title}
                          </h1>
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-bold">
                            الدرس النشط حالياً: {activeLesson.title}
                          </p>
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
                                  window.open(review.pdfUrl, '_blank');
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
                            <span>اختبارات تجريبية مطابقة لمعايير قياس والقدرات.</span>
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
                          <span className="text-xs font-black bg-white/20 py-0.5 px-2.5 rounded-full">المنتج: القدرات</span>
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
                                    {review.discountPrice} ر.س
                                  </span>
                                  <span className="text-xs text-slate-400 line-through">
                                    {review.price} ر.س
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-black text-yellow-300">
                                  {review.price === 0 ? 'مجاني' : `${review.price} ر.س`}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold block">خصم مباشر من المحفظة</span>
                          </div>
                        </div>

                        {/* Buy Button */}
                        <button
                          onClick={() => handlePurchase(review)}
                          disabled={purchasing}
                          className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 rounded-2xl font-black text-xs transition-all shadow-lg hover:shadow-xl cursor-pointer border-0 flex items-center justify-center gap-2"
                        >
                          {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                          <span>اشترك الآن وباشر التعلم</span>
                        </button>

                        <div className="text-center">
                          <span className="text-[9.5px] text-slate-400 font-bold">رصيدك الحالي في المحفظة: {(userData?.balance || 0).toLocaleString('ar-EG')} ر.س</span>
                        </div>
                      </div>
                    )}

                    {/* PROGRESS CARD - IF PURCHASED */}
                    {purchased && (
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

                    {/* LESSONS PLAYLIST SIDEBAR */}
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
                  </div>

                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}
