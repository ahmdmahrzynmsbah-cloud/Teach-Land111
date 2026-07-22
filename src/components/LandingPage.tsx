import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, BookOpen, GraduationCap, Play, Star, Users, Trophy, Award, ChevronDown, CheckCircle2, 
  Sparkles, Mail, Send, CheckCircle, ArrowUpRight, Shield, Heart, Zap, Phone, MapPin, MessageSquare,
  Calculator, FlaskConical, Dna, Languages, BookOpenText, Scroll, Globe, X, TrendingUp, Menu, Film, Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import PremiumFeaturesSection from './PremiumFeaturesSection';
import StudentTahsili from './StudentTahsili';
import StudentQudurat from './StudentQudurat';
import BunnyVideoPlayer from './BunnyVideoPlayer';
import TikTokPlayer from './TikTokPlayer';
import CleanYoutubePlayer from './CleanYoutubePlayer';
import InstallAppModal from './InstallAppModal';
import LatestCoursesSection from './LatestCoursesSection';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import * as LucideIcons from 'lucide-react';

const IconMap: Record<string, any> = {
  Calculator: LucideIcons.Calculator,
  Zap: LucideIcons.Zap,
  FlaskConical: LucideIcons.FlaskConical,
  Dna: LucideIcons.Dna,
  Languages: LucideIcons.Languages,
  BookOpenText: LucideIcons.BookOpenText,
  Scroll: LucideIcons.Scroll,
  Globe: LucideIcons.Globe,
  BookOpen: LucideIcons.BookOpen,
  Trophy: LucideIcons.Trophy,
  Award: LucideIcons.Award,
  GraduationCap: LucideIcons.GraduationCap,
  Star: LucideIcons.Star,
  Users: LucideIcons.Users,
  Shield: LucideIcons.Shield,
  Heart: LucideIcons.Heart,
  MessageSquare: LucideIcons.MessageSquare,
  Phone: LucideIcons.Phone,
  Mail: LucideIcons.Mail,
  MapPin: LucideIcons.MapPin,
  Facebook: LucideIcons.Facebook,
  Twitter: LucideIcons.Twitter,
  Youtube: LucideIcons.Youtube,
  Instagram: LucideIcons.Instagram
};

export default function LandingPage() {
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtu.be/') 
          ? url.split('youtu.be/')[1].split('?')[0] 
          : new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3`;
      }
      if (url.includes('youtube.com/embed/')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}modestbranding=1&rel=0&iv_load_policy=3`;
      }
      return url;
    } catch {
      return url;
    }
  };
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isHeroVideoModalOpen, setIsHeroVideoModalOpen] = useState(false);
  const [isHeroVideoPlayingInline, setIsHeroVideoPlayingInline] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const renderHeroVideo = (url: string, provider?: string, title?: string, poster?: string) => {
    if (!url) return null;

    if (provider === 'bunny' || (!url.includes('http') && !url.includes('youtube') && !url.includes('tiktok'))) {
      return <BunnyVideoPlayer videoId={url} />;
    }

    if (provider === 'tiktok' || url.includes('tiktok.com')) {
      return <TikTokPlayer videoUrl={url} />;
    }

    if (provider === 'direct' || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.m3u8')) {
      return (
        <video
          src={url}
          poster={poster}
          controls
          autoPlay
          className="w-full h-full object-cover rounded-xl"
        >
          متصفحك لا يدعم تشغيل الفيديو المباشر.
        </video>
      );
    }

    return (
      <CleanYoutubePlayer
        videoUrl={url}
        title={title}
        poster={poster}
      />
    );
  };
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Subject Browser States (Removed)

  // Legal and Help Modals State
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'copyright' | 'support' | null>(null);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const handleSupportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) return;
    setSupportSubmitting(true);
    
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'support_requests'), {
        name: supportName,
        emailOrPhone: supportEmail,
        message: supportMessage,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSupportSubmitting(false);
      setSupportSubmitted(true);
      setSupportMessage('');
    } catch (error) {
      console.error('Error submitting support request:', error);
      setSupportSubmitting(false);
      // fallback if error, still show success or maybe a toast?
      setSupportSubmitted(true);
      setSupportMessage('');
    }
  };

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubscribed(true);
      setEmailInput('');
    }, 1000);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'student')
        );
        const snapshot = await getDocs(q);
        const studentsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'طالب مجهول',
            stars: Number(data.stars) || 50,
            current: auth.currentUser?.uid === doc.id
          };
    });

        // Sort descending by stars
        studentsList.sort((a, b) => b.stars - a.stars);

        setLeaderboard(studentsList);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [user]);

  useEffect(() => {
    let unsubscribeUserDoc: () => void = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        unsubscribeUserDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ id: docSnap.id, ...docSnap.data() });
          }
        });
      } else {
        setUserData(null);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);

  const defaultFaqsList = [
    {
      q: 'هل تسجيل الدخول وإنشاء الحساب في المنصة مجاني؟',
      a: 'نعم، التسجيل في المنصة مجاني تماماً ويمكنك استكشاف الواجهة وتجربة بعض الدروس المجانية، ولفتح الكورسات والمواد كاملة يمكنك الاشتراك في الباقات المتاحة.'
    },
    {
      q: 'إزاي أقدر أشترك في الباقات أو أشحن المحفظة؟',
      a: 'نوفر عدة طرق سهلة ومريحة تشمل: الدفع الإلكتروني (فودافون كاش، إنستا باي، التحويل البنكي)، أو شحن رصيد المحفظة باستخدام كروت الشحن وأكواد التفعيل.'
    },
    {
      q: 'هل يمكنني مشاهدة الدروس أو تحميل المذكرات؟',
      a: 'يمكنك مشاهدة جميع دروسك أونلاين بجودة عالية وبدون تقطيع، كما يمكنك تحميل جميع المذكرات والملخصات بصيغة PDF لمذاكرتها ومراجعتها في أي وقت.'
    }
  ];

  const faqs = settings.customFaqs && settings.customFaqs.length > 0 ? settings.customFaqs : defaultFaqsList;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white font-sans selection:bg-primary/30">
      {/* Navbar */}
      <nav className="bg-white/90 dark:bg-[#12121A]/90 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-white/5 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between relative">
          
          <div className="flex items-center gap-8 min-w-0">
            <div className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer min-w-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-xl shadow-sm shrink-0" />
              ) : (
                <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                  {settings.logoChar}
                </div>
              )}
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal drop-shadow-sm truncate max-w-[150px] sm:max-w-[250px] lg:max-w-[300px]">{settings.platformName}</span>
            </div>
          </div>

          
          <div className="hidden xl:flex items-center gap-6 text-sm font-bold text-gray-600 dark:text-gray-300">
            <a href="#grades" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#00B4D8] dark:after:bg-[#D4AF37] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right whitespace-nowrap">الصفوف الدراسية</a>
            <a href="#subjects" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#00B4D8] dark:after:bg-[#D4AF37] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right whitespace-nowrap">المواد الدراسية</a>
            <a href="#tahsili" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#00B4D8] dark:after:bg-[#D4AF37] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right whitespace-nowrap">التحصيلي</a>
            <a href="#qudurat" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#00B4D8] dark:after:bg-[#D4AF37] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right whitespace-nowrap">القدرات</a>
            <a href="#how-it-works" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#00B4D8] dark:after:bg-[#D4AF37] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right whitespace-nowrap">مميزات المنصة</a>
            <a href="#faq" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#00B4D8] dark:after:bg-[#D4AF37] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right whitespace-nowrap">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-50/50 dark:bg-white/5 pl-1 pr-3 py-1 rounded-full border border-gray-200/50 dark:border-white/5">
                {userData?.role && (
                  <div 
                    title={`أنت مسجل حالياً كـ ${userData.role === 'student' ? 'طالب' : userData.role === 'teacher' ? 'معلم' : userData.role === 'parent' ? 'ولي أمر' : 'إدارة'}`}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-sm border transition-all ${
                      userData.role === 'student'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : userData.role === 'teacher'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        : userData.role === 'admin' || userData.role === 'sub_admin' || userData.role === 'developer'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {userData.role === 'student' && <GraduationCap className="w-3.5 h-3.5 shrink-0" />}
                    {userData.role === 'teacher' && <Award className="w-3.5 h-3.5 shrink-0" />}
                    {(userData.role === 'admin' || userData.role === 'sub_admin' || userData.role === 'developer') && <Shield className="w-3.5 h-3.5 shrink-0" />}
                    {userData.role === 'parent' && <Users className="w-3.5 h-3.5 shrink-0" />}
                    
                    <span className="flex items-center gap-1">
                      <span>
                        {userData.role === 'student' && 'طالب'}
                        {userData.role === 'teacher' && 'معلم'}
                        {(userData.role === 'admin' || userData.role === 'sub_admin' || userData.role === 'developer') && 'إدارة'}
                        {userData.role === 'parent' && 'ولي أمر'}
                      </span>
                    </span>
                  </div>
                )}
                <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  لوحة التحكم
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors px-3 py-2 hidden sm:block">تسجيل الدخول</Link>
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 hover:shadow-xl transition-all flex items-center gap-2">
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`xl:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-[#12121A]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 shadow-lg transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[400px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4 text-sm font-bold text-gray-600 dark:text-gray-300">
            <a href="#grades" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2 border-b border-gray-100 dark:border-white/5">الصفوف الدراسية</a>
            <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2 border-b border-gray-100 dark:border-white/5">المواد الدراسية</a>
            <a href="#tahsili" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2 border-b border-gray-100 dark:border-white/5">التحصيلي</a>
            <a href="#qudurat" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2 border-b border-gray-100 dark:border-white/5">القدرات</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2 border-b border-gray-100 dark:border-white/5">مميزات المنصة</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2">الأسئلة الشائعة</a>
            
            {!user && (
              <Link to="/login" className="sm:hidden text-center hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors py-2 mt-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-32 bg-white dark:bg-[#1A1A24]">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-start text-right"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#0077B6] dark:text-[#B8860B] mb-4 sm:mb-6 text-xs sm:text-sm font-bold">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#00B4D8] dark:fill-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]" /> المنصة التعليمية الأسرع نمواً
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.2] sm:leading-[1.1] mb-4 sm:mb-6 text-gray-900 dark:text-white">{settings.heroTitle}</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg leading-relaxed font-medium">{settings.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {user ? (
                <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  الذهاب للوحة التحكم
                </Link>
              ) : (
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  سجل مجاناً دلوقتي
                </Link>
              )}
              <button 
                onClick={() => {
                  if (settings.heroVideoUrl) {
                    setIsHeroVideoModalOpen(true);
                  } else {
                    const el = document.getElementById('grades');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg border-2 border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-300 hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all flex items-center justify-center gap-2 bg-white dark:bg-[#1A1A24] cursor-pointer shadow-sm hover:shadow-md"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[#00B4D8] dark:text-[#D4AF37] fill-[#00B4D8] dark:fill-[#D4AF37]" /> 
                {settings.heroVideoUrl ? (settings.heroVideoTitle || 'شاهد الفيديو التعريفي 🎬') : 'جرب حصة مجانية'}
              </button>
            </div>
            
            <div className="mt-8 sm:mt-10 flex items-center gap-4 sm:gap-6">
               <div className="flex -space-x-3 sm:-space-x-4 space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gray-200 dark:bg-[#2D2D3D] flex items-center justify-center font-bold text-xs`} style={{ zIndex: 5-i }}>
                       <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  ))}
               </div>
               <div className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                  انضم لآلاف <span className="text-[#00B4D8] dark:text-[#D4AF37]">الطلاب المتفوقين</span>
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
             {/* Mockup illustration area */}
             <div className="relative w-full aspect-square bg-gradient-to-br from-[#00B4D8]/5 to-transparent rounded-[3rem] border border-gray-100 dark:border-white/5 p-8 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-white dark:bg-[#1A1A24]/40 backdrop-blur-3xl rounded-[3rem]"></div>
                
                {/* Floating UI Elements imitating Abwaab */}
                <div className="relative w-[85%] h-[90%] bg-white dark:bg-[#1A1A24] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#2D2D3D] overflow-hidden flex flex-col">
                   <div className="h-12 bg-gray-50 dark:bg-[#0D0D12] border-b border-gray-200 dark:border-[#2D2D3D] flex items-center justify-between px-4 gap-2">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-red-400"></div>
                         <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                         <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                         {settings.heroVideoTitle || settings.platformName}
                      </span>
                   </div>
                   <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="w-3/4 h-7 bg-gray-100 dark:bg-[#222230] rounded-lg flex items-center px-3">
                         <span className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] truncate">
                            {settings.heroVideoTitle || 'الفيديو التعريفي للمنصة 🚀'}
                         </span>
                      </div>
                      
                      {/* Video Container */}
                      <div className="w-full aspect-video bg-gray-950 rounded-xl relative flex items-center justify-center overflow-hidden shadow-inner group border border-gray-800">
                         {settings.heroVideoUrl && isHeroVideoPlayingInline ? (
                            renderHeroVideo(settings.heroVideoUrl, settings.heroVideoProvider, settings.heroVideoTitle, settings.heroVideoPoster)
                         ) : (
                            <div 
                               onClick={() => {
                                  if (settings.heroVideoUrl) {
                                     setIsHeroVideoPlayingInline(true);
                                  } else {
                                     setIsHeroVideoModalOpen(true);
                                  }
                               }}
                               className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4 cursor-pointer group hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                            >
                               {settings.heroVideoPoster && (
                                  <img 
                                     src={settings.heroVideoPoster} 
                                     alt={settings.heroVideoTitle || "Hero Poster"} 
                                     className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500" 
                                  />
                               )}
                               <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                               <div className="relative z-10 w-14 h-14 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#00B4D8]/40 dark:shadow-[#D4AF37]/40 group-hover:scale-110 transition-all duration-300">
                                  <Play className="w-6 h-6 text-white ml-1 fill-white" />
                               </div>
                               <span className="relative z-10 text-xs font-bold text-gray-200 mt-3 group-hover:text-white transition-colors bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                                  {settings.heroVideoUrl ? 'اضغط لمشاهدة الفيديو التعريفي 🎬' : 'معاينة المنصة'}
                               </span>
                            </div>
                         )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-1">
                         <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-xl border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 p-3 flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-lg flex items-center justify-center shrink-0">
                               <Film className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                               <div className="text-[11px] font-black text-gray-800 dark:text-white truncate">فيديوهات تفاعلية</div>
                               <div className="text-[9px] text-gray-400 font-bold truncate">شرح بأحدث الوسائل</div>
                            </div>
                         </div>
                         <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-xl border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 p-3 flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-lg flex items-center justify-center shrink-0">
                               <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                               <div className="text-[11px] font-black text-gray-800 dark:text-white truncate">اختبارات ذكية</div>
                               <div className="text-[9px] text-gray-400 font-bold truncate">تصحيح فوري وتقارير</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                
             </div>
          </motion.div>
        </div>
      </section>

      {/* Grades Section */}
      <section id="grades" className="py-20 sm:py-28 bg-[#F8FAFC] dark:bg-[#0A0A10] relative overflow-hidden">
        {/* Decorative ambient background lights */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none translate-y-1/2" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16 sm:mb-20 max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-[#00B4D8]/10 text-[#0077B6] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مستقبلك يبدأ من هنا</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              الصفوف الدراسية المتاحة
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg font-medium max-w-2xl mx-auto">
              اختر صفك الدراسي المعتمد وابدأ رحلة تميزك الأكاديمي مع أقوى شرح تفاعلي ونخبة من عمالقة التدريس.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                id: 'prep-1',
                title: 'الصف الأول الإعدادي',
                desc: 'تأسيس قوي للمرحلة الإعدادية ومفاهيم مبسطة للمواد الأساسية لضمان تفوقك المستقبلي.',
                icon: BookOpen,
                colorClass: 'text-emerald-500 dark:text-emerald-400',
                bgClass: 'from-emerald-500 to-emerald-600',
                glowColor: 'hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30',
                badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
                features: ['شرح بالرسوم التوضيحية', 'بنك أسئلة متكامل', 'متابعة أسبوعية']
              },
              {
                id: 'prep-2',
                title: 'الصف الثاني الإعدادي',
                desc: 'تطوير عميق للمهارات العلمية وحل تطبيقات وتدريبات مستمرة لمواكبة المنهج الجديد.',
                icon: Trophy,
                colorClass: 'text-teal-500 dark:text-teal-400',
                bgClass: 'from-teal-500 to-teal-600',
                glowColor: 'hover:shadow-teal-500/20 dark:hover:shadow-teal-500/10 hover:border-teal-500/30 dark:hover:border-teal-500/30',
                badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
                features: ['خرائط ذهنية تفاعلية', 'اختبارات تقييم ذكية', 'تقارير أداء دورية']
              },
              {
                id: 'prep-3',
                title: 'الصف الثالث الإعدادي',
                desc: 'استعداد احترافي للشهادة الإعدادية لضمان الانتقال لأفضل مراحل الثانوي العام بثقة تامة.',
                icon: Award,
                colorClass: 'text-[#00B4D8] dark:text-[#00B4D8]',
                bgClass: 'from-[#00B4D8] to-blue-600',
                glowColor: 'hover:shadow-[#00B4D8]/20 dark:hover:shadow-[#00B4D8]/10 hover:border-[#00B4D8]/30 dark:hover:border-[#00B4D8]/30',
                badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
                isSpecial: true,
                specialText: 'سنة الشهادة 🎓',
                features: ['توقعات ليلة الامتحان', 'حل امتحانات السنين السابقة', 'مراجعة نهائية مكثفة']
              },
              {
                id: 'grade-1',
                title: 'الصف الأول الثانوي',
                desc: 'تأسيس شامل واستراتيجي لرحلة الثانوية العامة وفق أحدث الأنظمة ونظام الأسئلة الحديث.',
                icon: BookOpen,
                colorClass: 'text-sky-500 dark:text-sky-400',
                bgClass: 'from-sky-500 to-blue-600',
                glowColor: 'hover:shadow-sky-500/20 dark:hover:shadow-sky-500/10 hover:border-sky-500/30 dark:hover:border-sky-500/30',
                badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
                features: ['تدريب على التابلت', 'نظام الفهم والتحليل', 'دعم متواصل']
              },
              {
                id: 'grade-2',
                title: 'الصف الثاني الثانوي',
                desc: 'خطوات ثابتة واحترافية متقدمة لكل من الشعبتين العلمية والأدبية بتغطية شاملة لكل الأبواب.',
                icon: Trophy,
                colorClass: 'text-purple-500 dark:text-purple-400',
                bgClass: 'from-purple-500 to-indigo-600',
                glowColor: 'hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10 hover:border-purple-500/30 dark:hover:border-purple-500/30',
                badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
                features: ['قسم خاص للغات', 'شعبة علمي وأدبي تفصيلياً', 'ورش عمل دورية']
              },
              {
                id: 'grade-3',
                title: 'الصف الثالث الثانوي',
                desc: 'بوابة العبور لأحلامك وكليات القمة. خطط دراسية حصرية وتدريب متواصل على شكل ومضمون الامتحان.',
                icon: GraduationCap,
                colorClass: 'text-[#D4AF37] dark:text-[#D4AF37]',
                bgClass: 'from-[#D4AF37] to-amber-600',
                glowColor: 'hover:shadow-[#D4AF37]/30 dark:hover:shadow-[#D4AF37]/20 hover:border-[#D4AF37]/40 dark:hover:border-[#D4AF37]/40',
                badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
                isSpecial: true,
                specialText: 'سنة الحسم 🔥',
                features: ['نماذج الاسترشادية للوزارة', 'بنك أسئلة منسق بالكامل', 'دعم نفسي وفني ٢٤/٧']
              }
            ].map((grade, i) => {
              const IconComponent = grade.icon;
              return (
                <motion.div
                  key={grade.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.1 }}
                  className={`relative bg-white dark:bg-[#13131F] rounded-[2rem] border border-gray-150 dark:border-[#222235] transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between h-full group overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl ${grade.glowColor}`}
                >
                  {/* Subtle color overlay on hover */}
                  <div className={`absolute -inset-1 bg-gradient-to-tr ${grade.bgClass} opacity-0 group-hover:opacity-[0.02] dark:group-hover:opacity-[0.05] transition-opacity duration-300 rounded-[2rem] pointer-events-none blur-xl`} />
                  
                  {/* Glowing gradient accent circle on top-right */}
                  <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${grade.bgClass} opacity-0 group-hover:opacity-[0.08] transition-all duration-300 rounded-full blur-xl pointer-events-none`} />

                  {/* Main Content */}
                  <div className="relative z-10 space-y-4 text-right">
                    {/* Icon and special badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${grade.bgClass} text-white flex items-center justify-center shadow-lg shadow-black/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      
                      {grade.isSpecial && (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide ${grade.badgeBg} animate-pulse`}>
                          {grade.specialText}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="pt-2">
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-gray-950 dark:group-hover:text-[#D4AF37]">
                        {grade.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm leading-relaxed min-h-[3rem]">
                      {grade.desc}
                    </p>

                    {/* Features list tags */}
                    <div className="flex flex-wrap gap-1.5 justify-start pt-2">
                      {grade.features.map((feat, fIdx) => (
                        <span 
                          key={fIdx}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#1C1C2D]/50 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800/40 transition-colors group-hover:bg-white dark:group-hover:bg-[#1A1A28] group-hover:border-gray-200 dark:group-hover:border-gray-800"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Premium Action CTA Button */}
                  <div className="mt-6 sm:mt-8 relative z-10">
                    <Link 
                      to={user ? "/dashboard" : "/register"} 
                      className="w-full bg-gray-50 dark:bg-[#1B1B29] text-gray-700 dark:text-gray-300 font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border border-gray-150 dark:border-[#29293C] hover:-translate-y-0.5 group-hover:bg-gradient-to-r group-hover:from-[#00B4D8] group-hover:to-blue-600 dark:group-hover:from-[#D4AF37] dark:group-hover:to-amber-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-sky-500/10 dark:group-hover:shadow-amber-500/10"
                    >
                      <span>ابدأ الآن واستكشف المواد</span>
                      <ArrowRight className="w-4 h-4 -rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-16 sm:py-24 bg-gray-50 dark:bg-[#0D0D12]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 text-gray-900 dark:text-white">{settings.subjectsTitle || 'كل المواد اللي بتدور عليها'}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg font-medium">{settings.subjectsSubtitle || 'اختار مادتك وابدأ اتعلم بطريقة ممتعة ومبسطة، مع أفضل المدرسين.'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {(settings.subjects || []).map((subject, i) => {
              const IconComponent = IconMap[subject.iconName] || LucideIcons.BookOpen;
              const isQuduratTahsili = subject.title?.includes('القدرات') || subject.title?.includes('التحصيلي');
              const subType = subject.title?.includes('القدرات') ? 'qudurat' : 'tahsili';

              return (
                <motion.div
                  key={subject.id || i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  onClick={() => {
                    if (!user) {
                      if (isQuduratTahsili) {
                        navigate(`/special-register?type=${subType}`);
                      } else {
                        navigate('/register');
                      }
                    } else {
                      navigate('/dashboard?tab=subjects&subject=' + encodeURIComponent(subject.title));
                    }
                  }}
                  className="group cursor-pointer bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#00B4D8]/5 dark:hover:shadow-[#D4AF37]/5 transition-all text-center flex flex-col items-center justify-center h-full"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${subject.color || 'bg-blue-100 text-blue-600'} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">{subject.title}</h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


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

          {/* Qudurat Intro Video Showcase */}
          {settings.quduratVideoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 max-w-5xl mx-auto bg-white dark:bg-[#111118]/80 backdrop-blur-xl rounded-[2rem] border border-gray-200/60 dark:border-white/5 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Left Column: Video Player Container */}
              <div className="lg:col-span-7 xl:col-span-8 relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg border border-gray-100 dark:border-white/5 group">
                {settings.quduratVideoProvider === 'youtube' && (
                  <CleanYoutubePlayer 
                    videoUrl={settings.quduratVideoUrl} 
                    title={settings.quduratVideoTitle} 
                    poster={settings.quduratVideoPoster}
                  />
                )}
                {settings.quduratVideoProvider === 'tiktok' && (
                  <TikTokPlayer videoUrl={settings.quduratVideoUrl} />
                )}
                {settings.quduratVideoProvider === 'bunny' && (
                  <BunnyVideoPlayer videoId={settings.quduratVideoUrl} />
                )}
                {settings.quduratVideoProvider === 'direct' && (
                  <video 
                    src={settings.quduratVideoUrl} 
                    poster={settings.quduratVideoPoster}
                    controls 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Right Column: Dynamic Content & Call to Action */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center space-y-5">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مقدمة المسار التعريفي</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {settings.quduratVideoTitle || 'شاهد الفيديو التعريفي لمسار القدرات 🎯'}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  شاهد الشرح التعريفي الحصري لتتعرف على طريقتنا المبتكرة في تبسيط القدرات وحل أعقد المسائل في ثوانٍ معدودة وبأسهل الطرق الذكية.
                </p>

                <div className="space-y-3 pt-1">
                  {[
                    "شرح تكتيكات الحل السريع للكمي واللفظي",
                    "أحدث التجميعات المحوسبة والورقية لعام 1447هـ",
                    "نماذج محاكاة للاختبار الحقيقي بدقة متناهية"
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/15 hover:shadow-emerald-600/25 hover:-translate-y-0.5 transition-all text-center"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('qudurat-reviews-list') || document.getElementById('qudurat');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        // Scroll down a bit to the course elements
                        window.scrollBy({ top: 400, behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>عرض باقات ومراجعات القدرات</span>
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <StudentQudurat userData={userData} setUserData={setUserData} />
        </div>
      </section>

      {/* Latest Courses Section */}
      <LatestCoursesSection userData={userData} />

      {/* Tahsili Section */}
      <section id="tahsili" className="py-20 sm:py-28 bg-white dark:bg-[#07070B] text-gray-900 dark:text-white relative overflow-hidden">
        {/* Decorative background light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12 max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 tracking-wide uppercase">
              <Film className="w-3.5 h-3.5 animate-pulse text-purple-500" />
              <span>أقوى مراجعات التحصيلي الممتازة</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 dark:from-purple-400 dark:via-pink-400 dark:to-[#D4AF37] bg-clip-text text-transparent">
              قسم مراجعات التحصيلي المتميزة
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base font-medium max-w-2xl mx-auto">
              مستقبلك يبدأ من هنا. مراجعات فيديو مكثفة ومصممة بدقة متناهية بأحدث تجميعات التحصيلي، يقدمها نخبة من أفضل المعلمين لمساعدتك على تأمين نسبة +95٪ بإذن الله.
            </p>
          </div>

          {/* Tahsili Intro Video Showcase */}
          {settings.tahsiliVideoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 max-w-5xl mx-auto bg-white dark:bg-[#111118]/80 backdrop-blur-xl rounded-[2rem] border border-gray-200/60 dark:border-white/5 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Left Column: Video Player Container */}
              <div className="lg:col-span-7 xl:col-span-8 relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg border border-gray-100 dark:border-white/5 group">
                {settings.tahsiliVideoProvider === 'youtube' && (
                  <CleanYoutubePlayer 
                    videoUrl={settings.tahsiliVideoUrl} 
                    title={settings.tahsiliVideoTitle} 
                    poster={settings.tahsiliVideoPoster}
                  />
                )}
                {settings.tahsiliVideoProvider === 'tiktok' && (
                  <TikTokPlayer videoUrl={settings.tahsiliVideoUrl} />
                )}
                {settings.tahsiliVideoProvider === 'bunny' && (
                  <BunnyVideoPlayer videoId={settings.tahsiliVideoUrl} />
                )}
                {settings.tahsiliVideoProvider === 'direct' && (
                  <video 
                    src={settings.tahsiliVideoUrl} 
                    poster={settings.tahsiliVideoPoster}
                    controls 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Right Column: Dynamic Content & Call to Action */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center space-y-5">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مقدمة المسار التعريفي</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {settings.tahsiliVideoTitle || 'شاهد الفيديو التعريفي لمسار التحصيلي 🚀'}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  شاهد الشرح التعريفي لتتعرف على خريطة الطريق الذهبية لاجتياز اختبار التحصيلي والوصول للقبول الجامعي المباشر بكل سهولة ويسر.
                </p>

                <div className="space-y-3 pt-1">
                  {[
                    "تغطية شاملة لكل من الرياضيات، الفيزياء، الكيمياء، والأحياء",
                    "ربط ذكي ومبتكر للمفاهيم يمنع النسيان تماماً",
                    "حلول ومناقشة التجميعات التاريخية والأحدث تفصيلياً"
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-purple-600/15 hover:shadow-purple-600/25 hover:-translate-y-0.5 transition-all text-center"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('tahsili-reviews-list') || document.getElementById('tahsili');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.scrollBy({ top: 400, behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>عرض باقات ومراجعات التحصيلي</span>
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <StudentTahsili userData={userData} setUserData={setUserData} />
        </div>
      </section>

      {/* How it works / Premium Features */}
      {settings.showFeaturesSection && <PremiumFeaturesSection />}

      {/* FAQ Section */}
      {settings.showFaqSection && (
        <section id="faq" className="py-24 bg-gray-50 dark:bg-[#0D0D12]">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white">{settings.faqTitle || 'الأسئلة الشائعة'}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{settings.faqSubtitle || 'كل اللي محتاج تعرفه عن منصتنا'}</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${openFaqIndex === i ? 'bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border-[#00B4D8]/30 dark:border-[#D4AF37]/30 shadow-md' : 'bg-white dark:bg-[#1A1A24] border-gray-200 dark:border-[#2D2D3D] hover:border-[#00B4D8]/30 dark:hover:border-[#D4AF37]/30'}`}
                >
                  <button 
                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-right outline-none"
                  >
                    <span className={`font-bold text-base sm:text-lg transition-colors duration-300 ${openFaqIndex === i ? 'text-[#00B4D8] dark:text-[#D4AF37]' : 'text-gray-900 dark:text-white'}`}>{faq.q}</span>
                    <div
                      className={`p-1.5 rounded-full transition-all duration-300 ${openFaqIndex === i ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] rotate-180' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaqIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Ultra-Premium Footer */}
      <footer className="bg-gray-50 dark:bg-[#0D0D12] pt-16 pb-8 border-t border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-300">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-right">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-xl shadow-md" />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 border border-white/10 select-none">
                    {settings.logoChar}
                  </div>
                )}
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal">{settings.platformName}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                منصة {settings.platformName} تقدم تجربة تعلم تفاعلية متكاملة لطلاب المرحلتين الإعدادية والثانوية في مصر، تهدف لتقديم أفضل مستويات الشرح بطرق حديثة تناسب جميع الطلاب.
              </p>
              <div className="pt-2 flex items-center gap-3">
                {settings.socialLinks?.facebook && (
                  <a href={settings.socialLinks.facebook} className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                    <LucideIcons.Facebook className="w-4 h-4" />
                  </a>
                )}
                {settings.socialLinks?.twitter && (
                  <a href={settings.socialLinks.twitter} className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                    <LucideIcons.Twitter className="w-4 h-4" />
                  </a>
                )}
                {settings.socialLinks?.youtube && (
                  <a href={settings.socialLinks.youtube} className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                    <LucideIcons.Youtube className="w-4 h-4" />
                  </a>
                )}
                {settings.socialLinks?.instagram && (
                  <a href={settings.socialLinks.instagram} className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                    <LucideIcons.Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-gray-900 dark:text-white font-black text-sm mb-4 pb-1 border-b-2 border-[#00B4D8]/20 dark:border-[#D4AF37]/20 w-fit">
                تصفح المنصة
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
                <li><a href="#grades" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> الصفوف الدراسية</a></li>
                <li><a href="#subjects" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> المواد الدراسية</a></li>
                <li><a href="#tahsili" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> قسم التحصيلي</a></li>
                <li><a href="#how-it-works" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> مميزات المنصة</a></li>
                
                <li><a href="#faq" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> الأسئلة الأكثر شيوعاً</a></li>
              </ul>
            </div>

            {/* Column 3: Legal & Support */}
            <div>
              <h3 className="text-gray-900 dark:text-white font-black text-sm mb-4 pb-1 border-b-2 border-[#00B4D8]/20 dark:border-[#D4AF37]/20 w-fit">
                المساعدة والقانونية
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
                <li>
                  <button 
                    onClick={() => { setActiveModal('privacy'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" /> 
                    <span>سياسة الخصوصية والأمان</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveModal('terms'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 
                    <span>الشروط والأحكام العامة</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveModal('copyright'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <Heart className="w-3.5 h-3.5 shrink-0" /> 
                    <span>حقوق الملكية الفكرية</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveModal('support'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" /> 
                    <span>تواصل مع الدعم الفني</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div className="space-y-4">
              <h3 className="text-gray-900 dark:text-white font-black text-sm mb-4 pb-1 border-b-2 border-[#00B4D8]/20 dark:border-[#D4AF37]/20 w-fit">
                تواصل معنا
              </h3>
              <div className="space-y-3 text-xs sm:text-sm font-medium">
                {settings.contactPhone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-right">
                      <p className="text-gray-400 text-[10px]">الخط الساخن والواتساب</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200" dir="ltr">{settings.contactPhone}</p>
                    </div>
                  </div>
                )}
                {settings.contactEmail && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-right">
                      <p className="text-gray-400 text-[10px]">الدعم والمبيعات</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{settings.contactEmail}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-right text-gray-500 dark:text-gray-400 font-bold">
                    {settings.contactAddress || 'المملكة العربية السعودية، الرياض.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 mt-6 border-t border-gray-200/60 dark:border-[#2D2D3D]/60 flex flex-col md:flex-row items-center justify-center gap-4 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 text-center">
            <div 
              onClick={(e) => {
                const count = (Number(e.currentTarget.getAttribute('data-clicks') || 0)) + 1;
                e.currentTarget.setAttribute('data-clicks', String(count));
                if (count >= 3) {
                  window.dispatchEvent(new CustomEvent('open-dev-modal'));
                  e.currentTarget.setAttribute('data-clicks', '0');
                }
                setTimeout(() => e.currentTarget.setAttribute('data-clicks', '0'), 2000);
              }}
              className="cursor-default select-none"
            >
              جميع الحقوق محفوظة لـ <span className="text-gray-800 dark:text-gray-200">منصة Teachland</span> © ٢٠٢٦
            </div>
          </div>
        </div>
      </footer>

      {/* Legal & Support Modals */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <div
              className="relative bg-white dark:bg-[#13131A] max-w-2xl w-full rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-2xl overflow-hidden z-10 text-right font-sans"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between bg-gray-50/50 dark:bg-[#1A1A24]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37]">
                    {activeModal === 'privacy' && <Shield className="w-5 h-5" />}
                    {activeModal === 'terms' && <CheckCircle2 className="w-5 h-5" />}
                    {activeModal === 'copyright' && <Heart className="w-5 h-5" />}
                    {activeModal === 'support' && <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {activeModal === 'privacy' && 'سياسة الخصوصية والأمان'}
                      {activeModal === 'terms' && 'الشروط والأحكام العامة'}
                      {activeModal === 'copyright' && 'حقوق الملكية الفكرية'}
                      {activeModal === 'support' && 'الدعم الفني المباشر'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      منصة Teachland للمرحلة الثانوية
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2D2D3D] hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-medium">
                {activeModal === 'privacy' && (
                  <div className="space-y-4">
                    {settings.privacyPolicyText ? (
                      <div className="whitespace-pre-line text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-gray-50/50 dark:bg-[#1A1A24]/50 p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                        {settings.privacyPolicyText}
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-900 dark:text-white font-extrabold text-base">
                          مرحباً بك في سياسة الخصوصية الخاصة بـ منصة Teachland. خصوصيتك وأمان بياناتك هي أهم أولوياتنا.
                        </p>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ١. البيانات التي نقوم بجمعها
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            نقوم بجمع البيانات الأساسية اللازمة لإنشاء حسابك الدراسي، وتشمل: الاسم الكامل، رقم الهاتف (للطالب وولي الأمر لتلقي تقارير الدرجات)، البريد الإلكتروني، والمستوى الدراسي (إعدادي أو ثانوي).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٢. كيف نستخدم بياناتك ونحميها؟
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            تُستخدم البيانات فقط لتقديم تجربة تعليمية مخصصة، ومتابعة تقدمك في المواد،  جميع كلمات المرور وبياناتك مشفرة بالكامل عبر خوادم مأمنة ومحمية ببروتوكولات حماية متطورة تمنع أي وصول غير مصرح به.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٣. سرية المعلومات والجهات الخارجية
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            نلتزم التزاماً تاماً بعدم بيع أو مشاركة أو تأجير أي من بياناتك الشخصية لأي جهة تجارية أو إعلانية خارجية. بياناتك ملكك وحدك وتُستخدم حصرياً داخل بيئة "Teachland" التعليمية.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٤. أمان العمليات والمدفوعات
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            تتم جميع العمليات المالية وشحن المحافظ عبر قنوات معتمدة وموفرين معتمدين لخدمات الدفع الإلكتروني في مصر (مثل فوري والمحافظ الإلكترونية) وتخضع لأقصى معايير الأمان المصرفي الرقمي.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeModal === 'terms' && (
                  <div className="space-y-4">
                    {settings.termsConditionsText ? (
                      <div className="whitespace-pre-line text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-gray-50/50 dark:bg-[#1A1A24]/50 p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                        {settings.termsConditionsText}
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-900 dark:text-white font-extrabold text-base">
                          باستخدامك لمنصة Teachland، فإنك توافق على الالتزام الكامل بالشروط والأحكام التالية المبرمة لضمان بيئة تعليمية عادلة ومثمرة لجميع الطلاب.
                        </p>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ١. شروط الاستخدام والحسابات
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            المنصة مخصصة للاستخدام الشخصي لطلاب المرحلة الثانوية فقط. يحق لكل طالب تسجيل حساب واحد فقط. يمنع منعاً باتاً مشاركة بيانات تسجيل الدخول مع أي شخص آخر، ويحتفظ النظام بالحق في إيقاف أي حساب يسجل دخول من أجهزة متعددة بشكل يثير الشبهة.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٢. المحتوى التعليمي والاشتراكات
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            توفر المنصة محتوى مجاني وآخر مدفوع (بنظام الاشتراك الشهري أو شراء الكورسات الفردية). بمجرد إتمام الشراء، يصبح المحتوى متاحاً للطالب طوال فترة العام الدراسي الجاري ولا يحق استرداد الرسوم بعد تفعيل الكورس وبدء المشاهدة.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٣. قواعد السلوك العام والتعليقات
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            نحن فخورون ببيئتنا التعليمية الراقية. يُمنع منعاً باتاً نشر أي تعليقات مسيئة، سياسية، أو غير لائقة في أقسام الأسئلة والتعليقات تحت المحاضرات. سيؤدي ارتكاب أي من ذلك إلى حظر فوري للحساب دون إنذار ودون استرداد للمستحقات.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٤. النزاهة في الاختبارات
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            تحتفظ إدارة المنصة بالحق في مراجعة تقدم الطلاب الحاصلين على المراكز الأولى في الدوري الأسبوعي لضمان عدم وجود تلاعب أو غش في حل الواجبات والاختبارات الإلكترونية.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeModal === 'copyright' && (
                  <div className="space-y-4">
                    {settings.intellectualPropertyText ? (
                      <div className="whitespace-pre-line text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-gray-50/50 dark:bg-[#1A1A24]/50 p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                        {settings.intellectualPropertyText}
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-900 dark:text-white font-extrabold text-base">
                          الملكية الفكرية لـ منصة Teachland محمية بموجب القوانين المصرية والدولية لحماية حقوق المؤلف والملكية الفكرية.
                        </p>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ١. حقوق المؤلف الحصرية للمواد العلمية
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            جميع المحاضرات المرئية، الفيديوهات التوضيحية، بنوك الأسئلة، الاختبارات، المذكرات الرقمية والملخصات المعروضة على المنصة هي ملكية فكرية حصرية لـ "منصة Teachland" ونخبة المدرسين المتعاقد معهم.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            ٢. الحظر القانوني وعقوبة تسريب المحتوى
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            يُحظر تماماً وبشكل قاطع: تسجيل شاشة المحاضرات، إعادة رفع مقاطع الفيديو على يوتيوب أو فيسبوك أو تليجرام، أو طبع وتوزيع مذكرات المنصة خارج إطار الاستخدام الشخصي المباشر.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                            ٣. العلامة المائية الرقمية المدمجة
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            تستخدم المنصة تقنيات مائية رقمية متطورة تدمج اسم الطالب ورقم هاتفه وبيانات حسابه بشكل غير مرئي ومرئي على الشاشة وأوراق العمل لسهولة تعقب وتحديد أي شخص يقوم بتسريب المحتوى.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            ٤. الملاحقة القانونية الصارمة
                          </h4>
                          <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            سيتم ملاحقة أي محاولة للتعدي على حقوق الملكية الفكرية قضائياً وجنائياً بالتنسيق مع مباحث الإنترنت بوزارة الداخلية المصرية وتطبيق العقوبات والغرامات المقررة بموجب قانون مكافحة جرائم تقنية المعلومات المصري.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeModal === 'support' && (
                  <div className="space-y-4">
                    {supportSubmitted ? (
                      <div 
                        className="text-center py-8 space-y-4"
                      >
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                          <CheckCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-gray-900 dark:text-white">تم إرسال طلبك بنجاح!</h4>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold max-w-md mx-auto">
                            شكراً لتواصلك معنا يا {supportName}! سيتواصل معك أحد ممثلي الدعم الفني عبر البريد الإلكتروني أو واتساب خلال أقل من ٢٤ ساعة لحل مشكلتك.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSupportSubmitted(false);
                            setSupportName('');
                            setSupportEmail('');
                          }}
                          className="px-6 py-2 rounded-2xl bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] text-white font-bold text-xs sm:text-sm transition-all"
                        >
                          إرسال رسالة أخرى
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSupportSubmit} className="space-y-4">
                        <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
                          يسعدنا مساعدتك في أي وقت! يرجى ملء التفاصيل التالية وسيتم تزويدك بالدعم الفوري والمساعدة التقنية.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-right">
                            <label className="text-xs font-black text-gray-700 dark:text-gray-300">الاسم بالكامل</label>
                            <input
                              type="text"
                              required
                              value={supportName}
                              onChange={(e) => setSupportName(e.target.value)}
                              placeholder="مثال: أحمد محمد علي"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                            />
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-xs font-black text-gray-700 dark:text-gray-300">البريد الإلكتروني أو رقم الهاتف</label>
                            <input
                              type="text"
                              required
                              value={supportEmail}
                              onChange={(e) => setSupportEmail(e.target.value)}
                              placeholder="مثال: +201001234567"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-right">
                          <label className="text-xs font-black text-gray-700 dark:text-gray-300">تفاصيل المشكلة أو الاستفسار</label>
                          <textarea
                            rows={4}
                            required
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="اكتب رسالتك أو استفسارك بالتفصيل هنا..."
                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={supportSubmitting}
                          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] hover:opacity-90 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                        >
                          {supportSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>جاري إرسال طلبك...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>إرسال الطلب الآن</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Panel */}
              <div className="p-4 bg-gray-50 dark:bg-[#1A1A24]/40 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2.5 rounded-2xl bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3D3D4D] text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Hero Video Modal */}
      {isHeroVideoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#181822] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[85vh]">
            <div className="px-4 py-3 bg-gray-50 dark:bg-[#12121A] border-b border-gray-200 dark:border-[#222230] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-8 h-8 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] rounded-lg flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                    {settings.heroVideoTitle || 'الفيديو التعريفي للمنصة 🚀'}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">تعرّف على منصة {settings.platformName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHeroVideoModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#252533] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full aspect-video bg-black relative flex items-center justify-center overflow-hidden">
              {settings.heroVideoUrl ? (
                renderHeroVideo(settings.heroVideoUrl, settings.heroVideoProvider, settings.heroVideoTitle)
              ) : (
                <div className="p-6 text-center space-y-2">
                  <Film className="w-10 h-10 text-gray-500 dark:text-gray-600 mx-auto" />
                  <p className="text-xs font-bold text-gray-300 dark:text-gray-400">لم يتم إضافة فيديو تعريفي بعد من إعدادات المنصة عند الأدمن.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <InstallAppModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
      />
    </div>
  );
}
