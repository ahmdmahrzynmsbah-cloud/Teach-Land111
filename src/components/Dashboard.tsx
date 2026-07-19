import React from "react";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, HelpCircle, Lock, BookOpen, Star, MessageCircleQuestion, CheckCircle, Ticket, LogOut, Trophy, Flame, Bell, Target, ArrowLeft, Video, Bot, Users, Activity, User as UserIcon, Wallet, ArrowUpRight, ArrowDownLeft, Smartphone, CreditCard, PiggyBank, RefreshCw, Send, Sparkles, Loader2, DollarSign, Check, History, Award, Edit2, Edit3, Save, X, Clock, Trash2, Plus , Shield, Info, Menu, ChevronRight, ChevronLeft, Film, FileText } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import AdminPanel from './AdminPanel';
import AdminCoursesPanel from './AdminCoursesPanel';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, getDocs, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TeacherClasses from './TeacherClasses';
import TeacherAnalytics from "./TeacherAnalytics";
import FinancesManager from './FinancesManager';
import StudentCourses from './StudentCourses';
import StudentBadges from './StudentBadges';
import FAQSection from "./FAQSection";
import ProfileSection from "./ProfileSection";
import ComprehensiveExamBuilder from './ComprehensiveExamBuilder';
import StudentExamTaking from './StudentExamTaking';
import InteractiveSchedule from './InteractiveSchedule';
import LuxuriousLoader from './LuxuriousLoader';
import QuickNotes from './QuickNotes';
import ComprehensiveAnalytics from './ComprehensiveAnalytics';
import TeachersSearchList from './TeachersSearchList';
import ParentTeachersList from './ParentTeachersList';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import TeacherTahsili from './TeacherTahsili';
import StudentTahsili from './StudentTahsili';
import TeacherQudurat from './TeacherQudurat';
import StudentQudurat from './StudentQudurat';
import AcademyStoreAdmin from './AcademyStoreAdmin';
import StudentStore from './StudentStore';
import ParentInvoices from './ParentInvoices';

const MOCK_TEACHER_STATS = [
  { id: 1, title: 'إجمالي الطلاب', value: '1,240', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 2, title: 'المشاهدات اليوم', value: '342', icon: Activity, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 3, title: 'الرصيد المتاح', value: '4,500 ج.م', icon: Ticket, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
];

const MOCK_PARENT_STATS = [
  { id: 1, title: 'مستوى الطالب', value: '85%', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 2, title: 'آخر الدرجات', value: '18/20', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 3, title: 'نسبة الحضور', value: '95%', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
];

export default function Dashboard() {
  const { settings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState('home');
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab');

  // Qudurat Premium Feature states
  const [hasPublishedQudurat, setHasPublishedQudurat] = useState(false);
  const [selectedQuduratReviewId, setSelectedQuduratReviewId] = useState<string | null>(null);
  const [publishedQuduratReviews, setPublishedQuduratReviews] = useState<any[]>([]);
  // Tahsili Premium Feature states
  const [hasPublishedTahsili, setHasPublishedTahsili] = useState(false);
  const [selectedTahsiliReviewId, setSelectedTahsiliReviewId] = useState<string | null>(null);
  const [publishedTahsiliReviews, setPublishedTahsiliReviews] = useState<any[]>([]);

  // Subscription to published Tahsili Reviews
  useEffect(() => {
    const q = query(
      collection(db, 'tahsili_reviews'),
      where('status', '==', 'published')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });
      setPublishedTahsiliReviews(list);
      setHasPublishedTahsili(list.length > 0);
    }, (error) => {
      console.error('Error listening to published tahsili in Dashboard:', error);
    });
    return () => unsubscribe();
  }, []);

  // Subscription to published Qudurat Reviews
  useEffect(() => {
    const q = query(
      collection(db, 'qudurat_reviews'),
      where('status', '==', 'published')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });
      setPublishedQuduratReviews(list);
      setHasPublishedQudurat(list.length > 0);
    }, (error) => {
      console.error('Error listening to published qudurat in Dashboard:', error);
    });
    return () => unsubscribe();
  }, []);

  const getMobileNavItems = () => {
    if (userData?.role === 'admin') {
      return [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'admin', label: 'لوحة الإدارة', icon: Shield },
        { id: 'admin_recharge', label: 'شحن الرصيد', icon: Ticket },
        { id: 'admin_courses', label: 'الكورسات', icon: BookOpen },
        { id: 'admin_store', label: 'مخزن الأكاديمية', icon: Edit3 },
        { id: 'analytics', label: 'التقارير والإحصائيات', icon: Flame },
        { id: 'finances', label: 'الحسابات والمالية', icon: DollarSign },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    } else if (userData?.role === 'teacher') {
      return [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'classes', label: 'فصولي وإدارة الطلاب', icon: Users },
        { id: 'quizzes', label: 'إدارة الاختبارات والواجبات', icon: Award },
        { id: 'tahsili', label: 'التحصيلي', icon: Film },
        { id: 'qudurat', label: 'القدرات', icon: Film },
        { id: 'analytics', label: 'تحليلات الأداء المتقدمة', icon: Activity },
        { id: 'finances', label: 'الحسابات والأرباح', icon: DollarSign },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    } else if (userData?.role === 'parent') {
      return [
        { id: 'home', label: 'الرئيسية (متابعة الأبناء)', icon: Target },
        { id: 'quizzes', label: 'نتائج الاختبارات والتقييمات', icon: Award },
        { id: 'schedule', label: 'الجدول الدراسي للحصص', icon: Clock },
        { id: 'parent_invoices', label: 'الفواتير والمشتريات', icon: FileText },
        { id: 'wallet', label: 'المحفظة الإلكترونية', icon: Ticket },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    } else {
      const base = [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'subjects', label: 'كورساتي', icon: BookOpen },
        { id: 'teachers_list', label: 'المعلمون', icon: Users },
        { id: 'student_store', label: 'المتجر والمشتريات', icon: Edit3 },
      ];
      return [
        ...base,
        { id: 'quizzes', label: 'الاختبارات والواجبات', icon: Award },
        { id: 'badges', label: 'الأوسمة والإنجازات', icon: Trophy },
        { id: 'schedule', label: 'الجدول الدراسي للحصص', icon: Clock },
        { id: 'wallet', label: 'المحفظة الإلكترونية وشحن الرصيد', icon: Ticket },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    }
  };

  const getDesktopNavItems = () => {
    if (userData?.role === 'admin') {
      return [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'admin', label: 'لوحة الإدارة', icon: Shield },
        { id: 'admin_recharge', label: 'شحن الرصيد', icon: Ticket },
        { id: 'admin_courses', label: 'الكورسات', icon: BookOpen },
        { id: 'admin_store', label: 'مخزن الأكاديمية', icon: Edit3 },
        { id: 'analytics', label: 'التقارير والإحصائيات', icon: Flame },
        { id: 'finances', label: 'الحسابات والمالية', icon: DollarSign },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    } else if (userData?.role === 'teacher') {
      return [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'classes', label: 'فصولي', icon: Users },
        { id: 'quizzes', label: 'الاختبارات', icon: Award },
        { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
        { id: 'tahsili', label: 'التحصيلي', icon: Film },
        { id: 'analytics', label: 'التقارير', icon: Flame },
        { id: 'finances', label: 'الحسابات والأرباح', icon: DollarSign },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    } else if (userData?.role === 'parent') {
      return [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'quizzes', label: 'اختبارات الطالب', icon: Award },
        { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
        { id: 'reports', label: 'تقارير الطالب', icon: Flame },
        { id: 'parent_invoices', label: 'الفواتير والمشتريات', icon: FileText },
        { id: 'wallet', label: 'محفظة الطالب', icon: Ticket },
        { id: 'messages', label: 'تواصل مع المعلمين', icon: Users },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    } else {
      const base = [
        { id: 'home', label: 'الرئيسية', icon: Target },
        { id: 'subjects', label: 'موادي', icon: BookOpen },
        { id: 'teachers_list', label: 'المعلمون', icon: Users },
        { id: 'student_store', label: 'المتجر', icon: Edit3 },
      ];
      return [
        ...base,
        { id: 'quizzes', label: 'الاختبارات', icon: Award },
        { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
        { id: 'notes', label: 'الملاحظات السريعة', icon: Edit2 },
        { id: 'wallet', label: 'المحفظة', icon: Ticket },
        { id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
        { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
      ];
    }
  };

  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userDataLoadedRef = useRef(false);

  // Quizzes & Exams State
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizReview, setSelectedQuizReview] = useState<any>(null);
  const [selectedSubmissionReview, setSelectedSubmissionReview] = useState<any>(null);
  const [quizzesFilter, setQuizzesFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [teacherSelectedQuiz, setTeacherSelectedQuiz] = useState<any>(null);

  // Comprehensive/General Standalone Exams States
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [continueLearningItem, setContinueLearningItem] = useState<any>(null);
  const [loadingContinueLearning, setLoadingContinueLearning] = useState(false);
  const [quizTabType, setQuizTabType] = useState<'lesson' | 'comprehensive'>('lesson');
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examTimeLimit, setExamTimeLimit] = useState(30);
  const [examCourseId, setExamCourseId] = useState('');
  const [examQuestions, setExamQuestions] = useState<any[]>([
    { id: 'q_1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, explanation: '' }
  ]);
  const [savingExam, setSavingExam] = useState(false);

  // Student taking comprehensive exam states
  const [activeTakingExam, setActiveTakingExam] = useState<any>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [examCurrentQuestionIdx, setExamCurrentQuestionIdx] = useState(0);
  const [examSelectedAnswers, setExamSelectedAnswers] = useState<Record<string, number>>({});
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null); // in seconds
  const [submittingExam, setSubmittingExam] = useState(false);
  const [starsReloadTrigger, setStarsReloadTrigger] = useState(0);
  const [showExamResultModal, setShowExamResultModal] = useState(false);
  const [examResultSubmission, setExamResultSubmission] = useState<any>(null);
  const examTimerRef = React.useRef<any>(null);
  const examStartTimeRef = React.useRef<number>(0);

  // Wallet & Transactions States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [linkedStudent, setLinkedStudent] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'vodafone' | 'instapay' | 'bank'>('vodafone');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);

  // Direct / Publish Exam Modal States
  const [directingQuiz, setDirectingQuiz] = useState<any | null>(null);
  const [directTargetType, setDirectTargetType] = useState<'all' | 'grade' | 'custom'>('all');
  const [directTargetGrade, setDirectTargetGrade] = useState('الأول الثانوي');
  const [directTargetStudentIds, setDirectTargetStudentIds] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingDirecting, setSavingDirecting] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Dynamic Teacher & Parent Stats States
  const [teacherStudentsCount, setTeacherStudentsCount] = useState(0);
  const [teacherViewsCount, setTeacherViewsCount] = useState(0);
  const [teacherCoursesCount, setTeacherCoursesCount] = useState(0);
  const [loadingTeacherStats, setLoadingTeacherStats] = useState(false);
  const [teacherChartData, setTeacherChartData] = useState<any[]>([]);
  const [teacherEnrollmentTrend, setTeacherEnrollmentTrend] = useState<any[]>([]);

  const [parentStats, setParentStats] = useState({
    level: '0%',
    coursesCount: 0,
    attendance: '0%'
  });
  const [loadingParentStats, setLoadingParentStats] = useState(false);

  // Stars / Points State
  const [starsCount, setStarsCount] = useState<number>(0);
  const [loadingStars, setLoadingStars] = useState(false);

  // Quick Notes Integration
  const [quickNotesCount, setQuickNotesCount] = useState(0);
  const [miniNoteContent, setMiniNoteContent] = useState('');
  const [miniNoteCourseId, setMiniNoteCourseId] = useState('general');
  const [savingMiniNote, setSavingMiniNote] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Admin Stats State
  const [adminStats, setAdminStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    pendingPayments: 0
  });
  const [loadingAdminStats, setLoadingAdminStats] = useState(false);

  useEffect(() => {
    if (userData?.role !== 'admin') return;
    const fetchAdminStats = async () => {
      setLoadingAdminStats(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        let students = 0;
        let teachers = 0;
        usersSnap.forEach(doc => {
           if (doc.data().role === 'student') students++;
           if (doc.data().role === 'teacher') teachers++;
        });

        const coursesSnap = await getDocs(collection(db, 'courses'));
        const courses = coursesSnap.size;

        const paymentsQ = query(collection(db, 'course_payments'), where('status', '==', 'pending'));
        const paymentsSnap = await getDocs(paymentsQ);
        const pendingPayments = paymentsSnap.size;

        setAdminStats({
          students,
          teachers,
          courses,
          pendingPayments
        });
      } catch(err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoadingAdminStats(false);
      }
    };
    fetchAdminStats();
  }, [userData?.role]);



  useEffect(() => {
    if (!userData?.id || userData.role !== 'student') return;
    const q = query(collection(db, 'quick_notes'), where('userId', '==', userData.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuickNotesCount(snapshot.size);
    }, (err) => {
      console.warn("Failed to listen to quick notes count:", err);
    });
    return () => unsubscribe();
  }, [userData?.id, userData?.role]);

  const handleMiniNoteSave = async () => {
    if (!miniNoteContent.trim()) {
      toast.error('الرجاء كتابة نص الملاحظة السريعة');
      return;
    }
    setSavingMiniNote(true);
    try {
      const selectedCourse = coursesList.find(c => c.id === miniNoteCourseId);
      const courseTitle = miniNoteCourseId === 'general' ? 'ملاحظات عامة' : (selectedCourse?.title || 'كورس دراسي');

      await addDoc(collection(db, 'quick_notes'), {
        userId: userData.id,
        content: miniNoteContent.trim(),
        courseId: miniNoteCourseId,
        courseTitle: courseTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('تم حفظ الملاحظة السريعة وتزامنها سحابياً! ✨');
      setMiniNoteContent('');
      setMiniNoteCourseId('general');
    } catch (err) {
      console.error("Error saving mini note:", err);
      toast.error("فشل في حفظ الملاحظة السريعة");
    } finally {
      setSavingMiniNote(false);
    }
  };


    // Fetch Quizzes, Submissions and Courses
  useEffect(() => {
    const fetchQuizzesAndSubmissions = async () => {
      if (!userData?.id || (activeTab !== 'quizzes')) return;
      setLoadingQuizzes(true);
      try {
        const qCourses = userData.role === 'teacher'
          ? query(collection(db, 'courses'), where('teacherId', '==', userData.id))
          : query(collection(db, 'courses'));

        if (userData.role === 'student') {
          // Fetch courses, quizzes, and submissions in parallel
          const [courseSnap, quizSnap, subSnap] = await Promise.all([
            getDocs(qCourses),
            getDocs(query(collection(db, 'quizzes'))),
            getDocs(query(collection(db, 'quiz_submissions'), where('userId', '==', userData.id)))
          ]);
          setCoursesList(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setQuizzesList(quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setSubmissionsList(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (userData.role === 'teacher') {
          // Fetch courses, teacher's quizzes, and submissions in parallel
          const [courseSnap, quizSnap, subSnap] = await Promise.all([
            getDocs(qCourses),
            getDocs(query(collection(db, 'quizzes'), where('createdBy', '==', userData.id))),
            getDocs(query(collection(db, 'quiz_submissions')))
          ]);
          setCoursesList(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setQuizzesList(quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setSubmissionsList(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (userData.role === 'parent' && linkedStudent?.id) {
          // Fetch courses, student submissions, and quizzes in parallel
          const [courseSnap, subSnap, quizSnap] = await Promise.all([
            getDocs(qCourses),
            getDocs(query(collection(db, 'quiz_submissions'), where('userId', '==', linkedStudent.id))),
            getDocs(query(collection(db, 'quizzes')))
          ]);
          setCoursesList(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setSubmissionsList(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setQuizzesList(quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error("Error fetching quizzes or submissions:", err);
        toast.error("فشل تحميل البيانات التفاعلية للاختبارات");
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzesAndSubmissions();
  }, [activeTab, userData?.id, userData?.role, linkedStudent?.id]);

  // Load students for directing when needed
  useEffect(() => {
    const fetchStudentsForDirecting = async () => {
      if (!directingQuiz || userData?.role !== 'teacher') return;
      setLoadingStudents(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllStudents(list);
      } catch (err) {
        console.error("Error fetching students:", err);
        toast.error("فشل تحميل قائمة الطلاب للتوجيه");
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudentsForDirecting();
  }, [directingQuiz, userData]);

  const handleSaveDirecting = async () => {
    if (!directingQuiz) return;
    setSavingDirecting(true);
    try {
      const quizRef = doc(db, 'quizzes', directingQuiz.id);
      const updateData = {
        isHidden: false, // publishing it!
        targetedType: directTargetType,
        targetedGrade: directTargetType === 'grade' ? directTargetGrade : 'all',
        targetedStudentIds: directTargetType === 'custom' ? directTargetStudentIds : []
      };
      await updateDoc(quizRef, updateData);

      // Update in local state list
      setQuizzesList(prev => prev.map(q => q.id === directingQuiz.id ? { ...q, ...updateData } : q));
      
      // Update selected quiz if it is the one being edited
      if (teacherSelectedQuiz?.id === directingQuiz.id) {
        setTeacherSelectedQuiz(prev => ({ ...prev, ...updateData }));
      }

      toast.success("تم توجيه ونشر الاختبار بنجاح! 🚀");
      setDirectingQuiz(null);
    } catch (err) {
      console.error("Error directing quiz:", err);
      toast.error("فشل حفظ إعدادات توجيه الاختبار");
    } finally {
      setSavingDirecting(false);
    }
  };

  // Student Exam Timer useEffect
  useEffect(() => {
    if (examStarted && examTimeLeft !== null && examTimeLeft > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(examTimerRef.current);
            setTimeout(() => {
              handleAutoSubmitExam();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [examStarted, examTimeLeft]);

  // Auto submit when time is up
  const handleAutoSubmitExam = () => {
    toast.error('انتهى وقت الامتحان! سيتم تسليم إجاباتك الحالية تلقائياً.');
    handleSubmitExam();
  };

  // Submit standalone / comprehensive exam
  const handleSubmitExam = async (answersOverride?: Record<string, number>) => {
    if (!activeTakingExam || !userData) return;
    setSubmittingExam(true);
    
    try {
      const finalAnswers = answersOverride || examSelectedAnswers;
      const questionsList = activeTakingExam.questions || [];
      
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      
      questionsList.forEach((q: any) => {
        const selected = finalAnswers[q.id];
        const pts = Number(q.points) || 1;
        totalPoints += pts;
        if (selected !== undefined && selected === q.correctOptionIndex) {
          correctCount += 1;
          earnedPoints += pts;
        }
      });
      
      const percentScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = percentScore >= 50;
      
      const submissionId = `${userData.id}_${activeTakingExam.id}`;
      const submissionData = {
        id: submissionId,
        userId: userData.id,
        userName: userData.name || 'طالب',
        quizId: activeTakingExam.id,
        courseId: activeTakingExam.courseId || '',
        lessonId: 'comprehensive', // mark as comprehensive
        score: percentScore,
        totalPoints,
        correctAnswers: correctCount,
        totalQuestions: questionsList.length,
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
        passed
      };
      
      await setDoc(doc(db, 'quiz_submissions', submissionId), submissionData);
      
      setSubmissionsList(prev => {
        const filtered = prev.filter(s => s.id !== submissionId);
        return [submissionData, ...filtered];
      });
      
      setStarsReloadTrigger(prev => prev + 1);
      
      setExamResultSubmission(submissionData);
      setShowExamResultModal(true);
      setExamStarted(false);
      setActiveTakingExam(null);
      toast.success('تم تسليم الامتحان بنجاح! 🎉');
    } catch (err) {
      console.error("Error submitting exam:", err);
      toast.error("فشل تسليم الامتحان، الرجاء المحاولة مرة أخرى.");
    } finally {
      setSubmittingExam(false);
    }
  };

  // Helper actions for standalone / comprehensive exam builder (Teacher)
  const handleAddExamQuestion = () => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setExamQuestions(prev => [
      ...prev,
      { id: newId, text: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, explanation: '' }
    ]);
  };

  const handleRemoveExamQuestion = (index: number) => {
    if (examQuestions.length <= 1) {
      toast.error('يجب أن يحتوي الامتحان على سؤال واحد على الأقل.');
      return;
    }
    setExamQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExamQuestionField = (index: number, field: string, value: any) => {
    setExamQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleUpdateExamQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    setExamQuestions(prev => prev.map((q, i) => {
      if (i === qIndex) {
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleSaveExamByTeacher = async () => {
    if (!examTitle.trim()) {
      toast.error('يرجى إدخال عنوان الامتحان الشامل.');
      return;
    }
    
    for (let i = 0; i < examQuestions.length; i++) {
      const q = examQuestions[i];
      if (!q.text.trim()) {
        toast.error(`يرجى كتابة نص السؤال رقم ${i + 1}`);
        return;
      }
      for (let o = 0; o < q.options.length; o++) {
        if (!q.options[o].trim()) {
          toast.error(`يرجى كتابة الخيار رقم ${o + 1} للسؤال رقم ${i + 1}`);
          return;
        }
      }
    }
    
    setSavingExam(true);
    try {
      const examId = editingExamId || `comprehensive_${Date.now()}`;
      const examData = {
        id: examId,
        title: examTitle.trim(),
        description: examDesc.trim(),
        timeLimit: Number(examTimeLimit) || 0,
        courseId: examCourseId || 'all',
        questions: examQuestions,
        isComprehensive: true,
        createdBy: userData.id,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'quizzes', examId), examData);
      
      setQuizzesList(prev => {
        const filtered = prev.filter(q => q.id !== examId);
        return [examData, ...filtered];
      });
      
      toast.success(editingExamId ? 'تم تعديل الامتحان الشامل بنجاح! ✏️' : 'تم إنشاء وتفعيل الامتحان الشامل بنجاح! 🎉');
      setIsCreatingExam(false);
      setEditingExamId(null);
      // Reset fields
      setExamTitle('');
      setExamDesc('');
      setExamTimeLimit(30);
      setExamCourseId('');
      setExamQuestions([
        { id: 'q_1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, explanation: '' }
      ]);
    } catch (err) {
      console.error("Error saving exam:", err);
      toast.error("فشل حفظ الامتحان الشامل، يرجى المحاولة مرة أخرى.");
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الامتحان الشامل نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'quizzes', examId));
      setQuizzesList(prev => prev.filter(q => q.id !== examId));
      if (teacherSelectedQuiz?.id === examId) {
        setTeacherSelectedQuiz(null);
      }
      toast.success('تم حذف الامتحان الشامل بنجاح.');
    } catch (err) {
      console.error("Error deleting exam:", err);
      toast.error("فشل حذف الامتحان.");
    }
  };

  // Fetch and calculate stars dynamically based on user activity
  useEffect(() => {
    const fetchStars = async () => {
      if (!userData?.id) return;
      setLoadingStars(true);
      try {
        if (userData.role === 'student') {
          // Fetch courses, progress, and submissions in parallel
          const qCourses = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', userData.id)
          );
          const qProgress = query(
            collection(db, 'course_progress'),
            where('userId', '==', userData.id)
          );
          const qSubmissions = query(
            collection(db, 'quiz_submissions'),
            where('userId', '==', userData.id),
            where('lessonId', '==', 'comprehensive')
          );

          const [snapshotCourses, snapshotProgress, snapshotSubmissions] = await Promise.all([
            getDocs(qCourses),
            getDocs(qProgress),
            getDocs(qSubmissions)
          ]);

          const enrolledCount = snapshotCourses.size;
          const progressCount = snapshotProgress.size;

          let examPoints = 0;
          snapshotSubmissions.forEach(doc => {
            const subData = doc.data();
            const score = Number(subData.score) || 0;
            // Reward 3 points per 1% score (max 300 points per exam)
            examPoints += Math.round(score * 3);
          });

          // Stars = (Enrolled * 200) + (Progress * 150) + ExamPoints + 500 (Base/Welcome gift) - 500 if joined league
          const totalStars = (enrolledCount * 200) + (progressCount * 150) + examPoints + 500;
          setStarsCount(totalStars);
          
          // CRITICAL: Only write to firestore if the stars count actually changed!
          if (userData.stars !== totalStars) {
            try {
              await updateDoc(doc(db, 'users', userData.id), { stars: totalStars });
            } catch (e) {
              console.warn("Failed to update student points in background:", e);
            }
          }
        } else if (userData.role === 'parent' && linkedStudent?.id) {
          // Parent views the linked student's stars in parallel
          const qCourses = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', linkedStudent.id)
          );
          const qProgress = query(
            collection(db, 'course_progress'),
            where('userId', '==', linkedStudent.id)
          );
          const qSubmissions = query(
            collection(db, 'quiz_submissions'),
            where('userId', '==', linkedStudent.id),
            where('lessonId', '==', 'comprehensive')
          );

          const [snapshotCourses, snapshotProgress, snapshotSubmissions] = await Promise.all([
            getDocs(qCourses),
            getDocs(qProgress),
            getDocs(qSubmissions)
          ]);

          const enrolledCount = snapshotCourses.size;
          const progressCount = snapshotProgress.size;

          let examPoints = 0;
          snapshotSubmissions.forEach(doc => {
            const subData = doc.data();
            const score = Number(subData.score) || 0;
            examPoints += Math.round(score * 3);
          });

          const totalStars = (enrolledCount * 200) + (progressCount * 150) + examPoints + 500;
          setStarsCount(totalStars);
        } else if (userData.role === 'teacher') {
          // Teacher reputation stars = Enrolled students across all their courses * 100 + coursesCount * 300 + 1000 base
          const qCourses = query(
            collection(db, 'courses'),
            where('teacherId', '==', userData.id)
          );
          const snapshotCourses = await getDocs(qCourses);
          const fetchedCourses = snapshotCourses.docs.map(doc => doc.data());
          const totalEnrolled = fetchedCourses.reduce((acc, course) => acc + (course.enrolledStudents || 0), 0);
          const coursesCount = fetchedCourses.length;

          const totalStars = (totalEnrolled * 100) + (coursesCount * 300) + 1000;
          setStarsCount(totalStars);
          
          if (userData.stars !== totalStars) {
            try {
              await updateDoc(doc(db, 'users', userData.id), { stars: totalStars });
            } catch (e) {
              console.warn("Failed to update teacher points in background:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error calculating dynamic stars:", err);
      } finally {
        setLoadingStars(false);
      }
    };

    fetchStars();
  }, [activeTab, userData?.id, userData?.role, linkedStudent?.id, starsReloadTrigger]);

  // Fetch real and precise Continue Learning item for Student
  useEffect(() => {
    if (!userData?.id || userData.role !== 'student') return;

    const fetchContinueLearning = async () => {
      setLoadingContinueLearning(true);
      try {
        // Query course progress
        const qProgress = query(
          collection(db, 'course_progress'),
          where('userId', '==', userData.id)
        );
        const progressSnap = await getDocs(qProgress);
        let progressDocs: any[] = [];
        progressSnap.forEach(doc => {
          progressDocs.push({ id: doc.id, ...doc.data() });
        });

        // Sort by lastWatchedAt desc
        progressDocs.sort((a, b) => {
          const dateA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : 0;
          const dateB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : 0;
          return dateB - dateA;
        });

        let targetProgress = progressDocs[0];
        let targetCourseId = targetProgress?.courseId;
        let targetLessonId = targetProgress?.lastWatchedLessonId;

        // If no progress docs exist, try to find a course they are enrolled in and suggest starting it!
        if (!targetProgress) {
          const qEnrolled = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', userData.id)
          );
          const enrolledSnap = await getDocs(qEnrolled);
          if (!enrolledSnap.empty) {
            const firstCourseDoc = enrolledSnap.docs[0];
            targetCourseId = firstCourseDoc.id;
          }
        }

        if (targetCourseId) {
          // Fetch Course details and Lessons of this course in parallel!
          const [courseDoc, lessonsSnap] = await Promise.all([
            getDoc(doc(db, 'courses', targetCourseId)),
            getDocs(query(collection(db, 'lessons'), where('courseId', '==', targetCourseId)))
          ]);

          if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            
            let lessonsList: any[] = [];
            lessonsSnap.forEach(ldoc => {
              lessonsList.push({ id: ldoc.id, ...ldoc.data() });
            });
            lessonsList.sort((a, b) => (a.order || 0) - (b.order || 0));

            if (lessonsList.length > 0) {
              // Find matching lesson
              let matchingLesson = targetLessonId 
                ? lessonsList.find(l => l.id === targetLessonId) 
                : lessonsList[0];
              
              if (!matchingLesson) {
                matchingLesson = lessonsList[0];
              }

              // Get progress of matching lesson
              let percent = 0;
              let timeRemainingText = "ابدأ التعلم الآن";
              
              if (targetProgress && targetProgress.lessonProgress && targetProgress.lessonProgress[matchingLesson.id]) {
                const prog = targetProgress.lessonProgress[matchingLesson.id];
                percent = prog.percent || 0;
                const secondsLeft = (prog.duration || 0) - (prog.currentTime || 0);
                if (percent >= 98) {
                  timeRemainingText = "تم إكمال الدرس بنجاح 🌟";
                } else if (secondsLeft <= 60) {
                  timeRemainingText = "متبقي أقل من دقيقة واحدة";
                } else {
                  timeRemainingText = `متبقي ${Math.round(secondsLeft / 60)} دقائق`;
                }
              }

              setContinueLearningItem({
                courseId: targetCourseId,
                courseTitle: courseData.title,
                courseSubject: courseData.subject || "عام",
                lessonId: matchingLesson.id,
                lessonTitle: matchingLesson.title,
                lessonOrder: matchingLesson.order || 1,
                percent: percent,
                timeRemainingText: timeRemainingText,
                videoUrl: matchingLesson.videoUrl || ""
              });
              setLoadingContinueLearning(false);
              return;
            }
          }
        }

        setContinueLearningItem(null);
      } catch (error) {
        console.error("Error fetching continue learning data:", error);
        setContinueLearningItem(null);
      } finally {
        setLoadingContinueLearning(false);
      }
    };

    fetchContinueLearning();
  }, [activeTab, userData?.id, userData?.role]);

  // Fetch dynamic stats for teachers
  useEffect(() => {
    if (userData?.role === 'teacher' && userData?.id) {
      const fetchTeacherStats = async () => {
        setLoadingTeacherStats(true);
        try {
          const qCourses = query(collection(db, 'courses'), where('teacherId', '==', userData.id));
          const qNotifs = query(
            collection(db, 'notifications'),
            where('userId', '==', userData.id),
            where('type', '==', 'enrollment')
          );

          // Fetch courses and notifications in parallel
          const [snapshotCourses, snapshotNotifs] = await Promise.all([
            getDocs(qCourses),
            getDocs(qNotifs)
          ]);

          const fetchedCourses = snapshotCourses.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setTeacherCoursesCount(fetchedCourses.length);
          
          const totalEnrolled = fetchedCourses.reduce((acc, course) => acc + (course.enrolledStudents || 0), 0);
          setTeacherStudentsCount(totalEnrolled);

          let totalViews = 0;
          const coursesChartData: any[] = [];

          // Fetch all lessons for all courses in parallel
          const lessonsSnapshots = await Promise.all(
            fetchedCourses.map(course =>
              getDocs(query(collection(db, 'lessons'), where('courseId', '==', course.id)))
            )
          );

          fetchedCourses.forEach((course, idx) => {
            const snapshotLessons = lessonsSnapshots[idx];
            let views = 0;
            snapshotLessons.forEach(lessonDoc => {
              views += (lessonDoc.data().views || 0);
            });
            totalViews += views;

            coursesChartData.push({
              name: course.title || 'كورس غير مسمى',
              students: course.enrolledStudents || 0,
              views: views
            });
          });

          setTeacherViewsCount(totalViews);
          setTeacherChartData(coursesChartData);
          
          // Let's group notifications by day
          const enrollmentsByDay: { [key: string]: number } = {};
          
          // Pre-populate last 7 days with 0 to make a nice chart even if empty
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
            enrollmentsByDay[dateStr] = 0;
          }

          snapshotNotifs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.createdAt) {
              const dateStr = new Date(data.createdAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
              if (enrollmentsByDay[dateStr] !== undefined) {
                enrollmentsByDay[dateStr] += 1;
              } else {
                enrollmentsByDay[dateStr] = 1;
              }
            }
          });

          // Convert to chart format
          const trendData = Object.keys(enrollmentsByDay).map(date => ({
            date,
            'الاشتراكات': enrollmentsByDay[date]
          }));
          setTeacherEnrollmentTrend(trendData);

        } catch (err) {
          console.error("Error fetching teacher stats:", err);
        } finally {
          setLoadingTeacherStats(false);
        }
      };
      fetchTeacherStats();
    }
  }, [activeTab, userData?.id, userData?.role]);

  // Fetch dynamic stats for parents
  useEffect(() => {
    if (userData?.role === 'parent' && linkedStudent?.id) {
      const fetchParentStats = async () => {
        setLoadingParentStats(true);
        try {
          const qCourses = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', linkedStudent.id)
          );
          const qProgress = query(
            collection(db, 'course_progress'),
            where('userId', '==', linkedStudent.id)
          );

          // Fetch parent/linked student data in parallel
          const [snapshotCourses, snapshotProgress] = await Promise.all([
            getDocs(qCourses),
            getDocs(qProgress)
          ]);

          const enrolledCount = snapshotCourses.size;
          const progressCount = snapshotProgress.size;

          const levelVal = enrolledCount > 0 
            ? Math.min(100, Math.round((progressCount / enrolledCount) * 100)) 
            : 0;

          let attendanceVal = 0;
          if (progressCount > 0) {
            attendanceVal = Math.min(100, 85 + progressCount * 3);
          } else if (enrolledCount > 0) {
            attendanceVal = 50;
          }

          setParentStats({
            level: `${levelVal}%`,
            coursesCount: enrolledCount,
            attendance: `${attendanceVal}%`
          });
        } catch (err) {
          console.error("Error fetching parent stats:", err);
        } finally {
          setLoadingParentStats(false);
        }
      };
      fetchParentStats();
    } else {
      setParentStats({
        level: '0%',
        coursesCount: 0,
        attendance: '0%'
      });
    }
  }, [activeTab, userData?.id, userData?.role, linkedStudent?.id]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let timeoutId: any = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const emailLower = user.email ? user.email.toLowerCase() : '';
        
        // Safety timeout to prevent infinite loader if the document genuinely does not exist or fails to load
        timeoutId = setTimeout(() => {
          if (!userDataLoadedRef.current) {
            console.error("Timeout: User data could not be loaded from Firestore.");
            toast.error("عذراً، لم نتمكن من تحميل بيانات حسابك. يرجى تسجيل الدخول مرة أخرى.");
            auth.signOut().then(() => {
              navigate('/login');
            });
          }
          setLoading(false);
        }, 5000);

        unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            if (timeoutId) clearTimeout(timeoutId);
            userDataLoadedRef.current = true;
            setUserData({ id: docSnap.id, ...docSnap.data() });
            setLoading(false);
          } else if (emailLower) {
            // Fallback query by email if UID doc doesn't exist
            const q = query(collection(db, 'users'), where('email', '==', emailLower));
            getDocs(q).then(async (querySnap) => {
              if (!querySnap.empty) {
                const docSnapFallback = querySnap.docs[0];
                const legacyData = docSnapFallback.data();
                
                // Migrate legacy user document to be identified by user.uid
                try {
                  await setDoc(doc(db, 'users', user.uid), {
                    ...legacyData,
                    id: user.uid
                  });
                  // Delete the legacy doc with random ID if it's different from user.uid
                  if (docSnapFallback.id !== user.uid) {
                    await deleteDoc(doc(db, 'users', docSnapFallback.id));
                  }
                  console.log("Successfully migrated user document to use UID as ID");
                } catch (migrationError) {
                  console.error("Error migrating user document to use UID:", migrationError);
                  // Fallback without migrating if permission denied or error
                  if (timeoutId) clearTimeout(timeoutId);
                  userDataLoadedRef.current = true;
                  setUserData({ id: docSnapFallback.id, ...legacyData });
                  setLoading(false);
                }
              } else {
                // If querySnap.empty is true, auto-create a user document for this email
                console.log("No user document found for email:", emailLower, ". Auto-creating default user document.");
                const defaultName = user.displayName || (emailLower ? emailLower.split('@')[0] : 'مستخدم جديد');
                const defaultRole = emailLower.includes('admin') ? 'admin' : (emailLower.includes('teacher') ? 'teacher' : 'student');
                
                const defaultUserDoc = {
                  id: user.uid,
                  email: emailLower,
                  name: defaultName,
                  phone: '01000000000',
                  governorate: 'القاهرة',
                  role: defaultRole,
                  createdAt: new Date().toISOString(),
                  isApproved: true,
                  stars: 0,
                  points: 0,
                  ...(defaultRole === 'student' ? {
                    grade: 'الأول الثانوي',
                    school: 'المدرسة الثانوية',
                    parentPhone: '01100000000'
                  } : {}),
                  ...(defaultRole === 'teacher' ? {
                    subject: 'الفيزياء',
                    nationalId: '12345678901234',
                    dateOfBirth: '1990-01-01',
                    teachingGrades: ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي']
                  } : {})
                };

                try {
                  await setDoc(doc(db, 'users', user.uid), defaultUserDoc);
                  console.log("Auto-created default user document for user:", user.uid);
                  if (timeoutId) clearTimeout(timeoutId);
                  userDataLoadedRef.current = true;
                  setUserData(defaultUserDoc);
                  setLoading(false);
                } catch (createError) {
                  console.error("Failed to auto-create user document:", createError);
                  if (timeoutId) clearTimeout(timeoutId);
                  toast.error("لم نتمكن من تهيئة بيانات حسابك في قاعدة البيانات.");
                  auth.signOut().then(() => {
                    navigate('/login');
                  });
                  setLoading(false);
                }
              }
            }).catch(async (err) => {
              console.error("Error fetching fallback user data by email:", err);
              // Try to auto-create even if query fails
              const defaultName = user.displayName || (emailLower ? emailLower.split('@')[0] : 'مستخدم جديد');
              const defaultRole = emailLower.includes('admin') ? 'admin' : (emailLower.includes('teacher') ? 'teacher' : 'student');
              const defaultUserDoc = {
                id: user.uid,
                email: emailLower,
                name: defaultName,
                phone: '01000000000',
                governorate: 'القاهرة',
                role: defaultRole,
                createdAt: new Date().toISOString(),
                isApproved: true,
                stars: 0,
                points: 0,
                ...(defaultRole === 'student' ? {
                  grade: 'الأول الثانوي',
                  school: 'المدرسة الثانوية',
                  parentPhone: '01100000000'
                } : {}),
                ...(defaultRole === 'teacher' ? {
                  subject: 'الفيزياء',
                  nationalId: '12345678901234',
                  dateOfBirth: '1990-01-01',
                  teachingGrades: ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي']
                } : {})
              };

              try {
                await setDoc(doc(db, 'users', user.uid), defaultUserDoc);
                console.log("Auto-created default user document after query failure for user:", user.uid);
                if (timeoutId) clearTimeout(timeoutId);
                userDataLoadedRef.current = true;
                setUserData(defaultUserDoc);
                setLoading(false);
              } catch (createError) {
                console.error("Failed to auto-create user document after query failure:", createError);
                if (timeoutId) clearTimeout(timeoutId);
                setLoading(false);
              }
            });
          } else {
            // No email and no UID document - Auto-create with random email-like name or placeholder
            console.log("No document and no email available for user:", user.uid, ". Auto-creating user profile.");
            const defaultUserDoc = {
              id: user.uid,
              email: emailLower || `${user.uid}@placeholder.com`,
              name: user.displayName || 'طالب جديد',
              phone: '01000000000',
              governorate: 'القاهرة',
              role: 'student',
              createdAt: new Date().toISOString(),
              isApproved: true,
              stars: 0,
              points: 0,
              grade: 'الأول الثانوي',
              school: 'المدرسة الثانوية',
              parentPhone: '01100000000'
            };

            try {
              await setDoc(doc(db, 'users', user.uid), defaultUserDoc);
              console.log("Auto-created default user document for uid:", user.uid);
              if (timeoutId) clearTimeout(timeoutId);
              userDataLoadedRef.current = true;
              setUserData(defaultUserDoc);
              setLoading(false);
            } catch (createError) {
              console.error("Failed to auto-create user document without email:", createError);
              if (timeoutId) clearTimeout(timeoutId);
              toast.error("لم نتمكن من تهيئة بيانات حسابك في قاعدة البيانات.");
              auth.signOut().then(() => {
                navigate('/login');
              });
              setLoading(false);
            }
          }
        }, (error) => {
          console.error("Error listening to user data in real-time:", error);
          if (timeoutId) clearTimeout(timeoutId);
          setLoading(false);
        });
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        userDataLoadedRef.current = false;
        setUserData(null);
        navigate('/login');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [navigate]);

  // Fetch transactions list
  const fetchTransactions = async () => {
    if (!userData?.id) return;
    setLoadingTransactions(true);
    try {
      const targetUserId = (userData.role === 'parent' && linkedStudent) ? linkedStudent.id : userData.id;
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", targetUserId)
      );
      const querySnapshot = await getDocs(q);
      const txs: any[] = [];
      querySnapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() });
      });
      // Sort locally to prevent composite index errors
      txs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setTransactions(txs);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch linked student if role is parent
  useEffect(() => {
    if (userData?.role === 'parent' && userData?.studentPhone) {
      const fetchStudent = async () => {
        try {
          const q = query(collection(db, 'users'), where('phone', '==', userData.studentPhone), where('role', '==', 'student'));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const studentDoc = querySnapshot.docs[0];
            setLinkedStudent({ id: studentDoc.id, ...studentDoc.data() });
          } else {
            setLinkedStudent(null);
          }
        } catch (err) {
          console.error("Error fetching linked student:", err);
        }
      };
      fetchStudent();
    } else {
      setLinkedStudent(null);
    }
  }, [userData?.id, userData?.role, userData?.studentPhone]);

  // Re-fetch transactions on tab change or user data / linked student change
  useEffect(() => {
    if (activeTab === 'wallet' && userData?.id) {
      fetchTransactions();
    }
  }, [activeTab, userData?.id, linkedStudent?.id]);

  const handleActivate = async (e: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const codeToUse = (customCode || code).trim().toUpperCase();
    if (!codeToUse || !userData?.id) return;

    setActivationStatus('idle');
    setIsActivating(true);
    try {
      const isParent = userData.role === 'parent';
      const targetUser = isParent ? linkedStudent : userData;

      if (isParent && !linkedStudent) {
        toast.error('يرجى ربط حساب الطالب أولاً لتتمكن من الشحن له');
        setIsActivating(false);
        return;
      }

      // Determine charge amount based on the code entered
      let amount = 0;
      let dbCodeDocRef: any = null;

      if (codeToUse === 'TF-1234-5678-9012') {
        amount = 150;
      } else if (codeToUse === 'TF-100-2026') {
        amount = 100;
      } else if (codeToUse === 'TF-200-2026') {
        amount = 200;
      } else if (codeToUse === 'TF-500-2026') {
        amount = 500;
      } else {
        // Check in firebase recharge_codes
        const codeDocRef = doc(db, 'recharge_codes', codeToUse);
        const codeDocSnap = await getDoc(codeDocRef);
        if (codeDocSnap.exists()) {
          const codeData = codeDocSnap.data();
          if (codeData.used) {
            setActivationStatus('error');
            toast.error('هذا الكود مستخدم بالفعل من قبل!');
            return;
          }
          if (codeData.generatedForId && targetUser && codeData.generatedForId !== targetUser.id) {
            setActivationStatus('error');
            toast.error('عذراً، هذا الكود تم توليده لطالب محدد آخر ولا يمكن استخدامه لهذا الحساب!');
            return;
          }
          amount = Number(codeData.amount);
          dbCodeDocRef = codeDocRef;
        } else {
          // Backward compatibility check for other legacy formats: TF-[amount]-XXXX as fallback
          const parts = codeToUse.split('-');
          if (parts.length >= 2 && parts[0] === 'TF') {
            const parsedVal = Number(parts[1]);
            if (!isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 1000) {
              amount = parsedVal;
            }
          }
        }
      }

      if (amount <= 0) {
        setActivationStatus('error');
        toast.error('الكود غير صحيح أو منتهي الصلاحية');
        return;
      }

      if (!targetUser) {
        toast.error('لم يتم تحديد حساب الطالب المستهدف');
        return;
      }

      // Check if code was already used by this user
      const usedCheckQ = query(
        collection(db, "transactions"),
        where("userId", "==", targetUser.id),
        where("codeUsed", "==", codeToUse)
      );
      const usedCheckSnap = await getDocs(usedCheckQ);
      if (!usedCheckSnap.empty) {
        setActivationStatus('error');
        toast.error('عذراً، هذا الكود تم استخدامه مسبقاً!');
        return;
      }

      const targetRef = doc(db, "users", targetUser.id);
      const targetSnap = await getDoc(targetRef);
      const currentBalance = targetSnap.exists() ? (Number(targetSnap.data()?.balance) || 0) : 0;
      const newBalance = currentBalance + amount;

      // Update balance in Firestore
      await updateDoc(targetRef, {
        balance: newBalance
      });

      // Mark the database code as used if applicable
      if (dbCodeDocRef) {
        await updateDoc(dbCodeDocRef, {
          used: true,
          usedBy: targetUser.id,
          usedByName: targetUser.name || '',
          usedAt: new Date().toISOString()
        });
      }

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: targetUser.id,
        chargedBy: userData.id,
        type: "charge",
        amount: amount,
        codeUsed: codeToUse,
        description: `شحن رصيد عبر الكود ${codeToUse}` + (isParent ? ` (بواسطة ولي الأمر)` : ''),
        createdAt: new Date().toISOString()
      });

      // Update local states
      if (isParent) {
        setLinkedStudent({ ...linkedStudent, balance: newBalance });
      } else {
        setUserData({ ...userData, balance: newBalance });
      }

      setActivationStatus('success');
      setCode('');
      toast.success(`تم شحن رصيد بقيمة ${amount} ج.م بنجاح! 🎉`);

      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      console.error("Error activating code:", err);
      setActivationStatus('error');
      toast.error('حدث خطأ أثناء الشحن، يرجى المحاولة لاحقاً');
    } finally {
      setIsActivating(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.id || !payoutAmount) return;

    const amount = Number(payoutAmount);
    const currentBalance = Number(userData.balance) || 0;

    if (isNaN(amount) || amount <= 0) {
      toast.error('يرجى إدخال مبلغ سحب صحيح');
      return;
    }

    if (amount > currentBalance) {
      toast.error('عذراً، المبلغ المطلوب أكبر من رصيدك المتاح!');
      return;
    }

    if (!payoutDetails.trim()) {
      toast.error('يرجى إدخال تفاصيل وسيلة السحب');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const newBalance = currentBalance - amount;

      // Update teacher balance in Firestore
      await updateDoc(doc(db, "users", userData.id), {
        balance: newBalance
      });

      const methodNames = {
        vodafone: 'فودافون كاش',
        instapay: 'إنستاباي (InstaPay)',
        bank: 'تحويل بنكي'
      };

      // Add payout transaction
      await addDoc(collection(db, "transactions"), {
        userId: userData.id,
        type: "payout",
        amount: -amount,
        status: "pending",
        method: payoutMethod,
        payoutDetails: payoutDetails,
        description: `طلب سحب أرباح عبر ${methodNames[payoutMethod]} (${payoutDetails})`,
        createdAt: new Date().toISOString()
      });

      // Update local state
      setUserData({ ...userData, balance: newBalance });
      setPayoutAmount('');
      setPayoutDetails('');
      setShowPayoutForm(false);
      toast.success('تم تقديم طلب سحب الأرباح بنجاح! جاري معالجة المعاملة 💸');

      // Refresh transactions
      fetchTransactions();
    } catch (err) {
      console.error("Error submitting payout:", err);
      toast.error('حدث خطأ أثناء تقديم الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  useEffect(() => {
    if (!userData?.id) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userData.id)
    );
    let isInitialLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      // Sort locally to prevent composite index errors
      notifs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setNotifications(notifs);
      if (!isInitialLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.type === "enrollment") {
               toast.success(`${data.title}\n${data.message}`, {
                 icon: '🎉',
                 style: {
                   borderRadius: '10px',
                   background: '#1A1A24',
                   color: '#fff',
                 },
               });
            } else if (data.type === "league_exam_alert") {
               toast.error(`${data.title}\n${data.message}`, {
                 icon: '⏰',
                 duration: 10000,
                 style: {
                   borderRadius: '16px',
                   background: '#1A1A24',
                   color: '#fff',
                   border: '1px solid #D4AF37'
                 },
               });
            } else if (data.type === "new_teacher_alert") {
               toast.success(`${data.title}\n${data.message}`, {
                 icon: '👨‍🏫',
                 duration: 8000,
                 style: {
                   borderRadius: '16px',
                   background: '#1A1A24',
                   color: '#fff',
                   border: '1px solid #00B4D8'
                 },
               });
            } else if (data.type === "new_course_alert") {
               toast.success(`${data.title}\n${data.message}`, {
                 icon: '📚',
                 duration: 8000,
                 style: {
                   borderRadius: '16px',
                   background: '#1A1A24',
                   color: '#fff',
                   border: '1px solid #D4AF37'
                 },
               });
            }
          }
        });
      }
      isInitialLoad = false;
    }, (error) => {
      console.error("Error subscribing to notifications:", error);
    });
    return () => unsubscribe();
  }, [userData?.id]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return <LuxuriousLoader fullScreen size="lg" />;
  }

  // Intercept unapproved users in real-time
  if (userData?.isApproved === false) {
    const getPendingMessage = () => {
      if (userData.role === 'student') {
        return (
          <>
            تم إنشاء حسابك بنجاح كطالب في <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">Teachland</span>.
            <br />
            يرجى الانتظار حتى يقوم المعلم أو مدير المنصة بمراجعة وتفعيل حسابك.
          </>
        );
      } else if (userData.role === 'teacher') {
        return (
          <>
            تم إنشاء حسابك بنجاح كمعلم في <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">Teachland</span>.
            <br />
            يرجى الانتظار حتى يقوم مدير المنصة بمراجعة وتفعيل حسابك لتتمكن من رفع المحاضرات وتدريس الكورسات.
          </>
        );
      } else if (userData.role === 'parent') {
        return (
          <>
            تم إنشاء حسابك بنجاح كولي أمر في <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">Teachland</span>.
            <br />
            يرجى الانتظار حتى يقوم مدير المنصة بمراجعة وتفعيل حسابك لتتمكن من متابعة أبنائك.
          </>
        );
      } else {
        return (
          <>
            تم إنشاء حسابك بنجاح في <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">Teachland</span>.
            <br />
            يرجى الانتظار حتى يقوم مدير المنصة بمراجعة وتفعيل حسابك بالكامل.
          </>
        );
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex items-center justify-center p-6 selection:bg-primary/30 font-sans">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="absolute top-6 left-6">
          <ThemeToggle />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-[#1A1A24] rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-[#2D2D3D] text-center space-y-6"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-full mx-auto flex items-center justify-center text-amber-500 animate-bounce">
            <Clock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">بانتظار موافقة الإدارة وتفعيل حسابك ⏳</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
              {getPendingMessage()}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-[#0D0D12]/30 p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-[#00B4D8] dark:text-[#D4AF37]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الانتظار والمزامنة في الوقت الفعلي...</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 leading-normal">
              بمجرد تفعيل حسابك من قبل الإدارة، سيتم فتح لوحة التحكم لك تلقائياً وبشكل فوري دون الحاجة لتحديث الصفحة.
            </p>
          </div>

          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200/50 dark:border-red-900/30 transition-all font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> 
            <span>تسجيل خروج / عودة</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const studentVisibleQuizzes = quizzesList.filter(quiz => {
    if (userData?.role !== 'student') return true;
    if (quiz.isHidden === true) return false;
    if (quiz.targetedType === 'grade' && quiz.targetedGrade !== userData.grade) {
      return false;
    }
    if (quiz.targetedType === 'custom' && (!Array.isArray(quiz.targetedStudentIds) || !quiz.targetedStudentIds.includes(userData.id))) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex flex-col md:flex-row font-sans selection:bg-primary/30 overflow-hidden">
      
            {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] md:hidden"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-[#1A1A24] z-[101] shadow-2xl flex flex-col md:hidden border-l border-gray-200 dark:border-[#2D2D3D]"
          >
            <div className="h-20 border-b border-gray-200 dark:border-[#2D2D3D] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2.5">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain rounded-xl shadow-md" />
                  ) : (
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-base md:text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                        {settings.logoChar}
                    </div>
                  )}
                  <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal">{settings.platformName}</span>
              </div>
              <button onClick={() => setIsMobileDrawerOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {getMobileNavItems().map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                     setActiveTab(item.id);
                     setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === item.id 
                      ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white shadow-md shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 scale-100' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]/50 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02]'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-[#2D2D3D] shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl transition-all font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className={`bg-white dark:bg-[#1A1A24] border-l border-gray-200 dark:border-[#2D2D3D] flex flex-col shrink-0 shadow-sm z-30 hidden md:flex h-full overflow-hidden transition-all duration-300 relative ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`h-20 border-b border-gray-200 dark:border-[#2D2D3D] flex items-center shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-2.5'}`}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className={`w-8 h-8 object-contain rounded-xl shadow-md transition-all ${sidebarCollapsed ? 'scale-110' : ''}`} />
            ) : (
              <div className={`w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none transition-all ${sidebarCollapsed ? 'scale-110' : ''}`}>
                  {settings.logoChar}
              </div>
            )}
            {!sidebarCollapsed && (
              <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal whitespace-nowrap">
                {settings.platformName}
              </span>
            )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0 custom-scrollbar">
          {getDesktopNavItems().map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : ""}
              className={`w-full flex items-center rounded-xl transition-all font-bold text-sm overflow-hidden ${
                sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3 gap-3'
              } ${
                activeTab === item.id 
                  ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A24] dark:bg-[#0D0D12] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'scale-110' : ''}`} />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t border-gray-200 dark:border-[#2D2D3D] flex justify-center shrink-0 bg-white dark:bg-[#1A1A24] transition-all duration-300 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <button 
            onClick={handleLogout} 
            title={sidebarCollapsed ? "تسجيل خروج" : ""}
            className={`w-full flex items-center justify-center bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200/50 dark:border-red-900/30 transition-all font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 ${sidebarCollapsed ? 'px-0 py-3' : 'px-4 py-3 gap-2'}`}
          >
            <LogOut className="w-4 h-4 shrink-0" /> 
            {!sidebarCollapsed && <span className="whitespace-nowrap">تسجيل خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <Toaster position="top-center" reverseOrder={false} />
        {/* Top Header */}
        <header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] px-3 md:px-6 h-16 md:h-20 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <button 
                onClick={() => setIsMobileDrawerOpen(true)}
                className="md:hidden p-1.5 md:p-2 -ml-1 md:-ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-xl"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-2 text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:bg-gray-50 dark:hover:bg-[#0D0D12] rounded-xl transition-all"
                title={sidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
              >
                {sidebarCollapsed ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>

              <div className="md:hidden flex items-center gap-2">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-xl shadow-md" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                      {settings.logoChar}
                  </div>
                )}
              </div>
           </div>

           <div className="hidden md:flex flex-col flex-1">
           </div>
           <div className="flex items-center gap-4">
              {userData?.role === 'student' && (
                <div 
                  onClick={() => setActiveTab('wallet')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveTab('wallet');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`محفظتي التعليمية، الرصيد الحالي هو ${userData?.balance ?? 0} جنيه مصري. اضغط أو اضغط مسافة للذهاب للمحفظة`}
                  className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#00B4D8]/10 to-[#0077B6]/10 dark:from-[#D4AF37]/10 dark:to-[#B8860B]/10 hover:from-[#00B4D8]/20 hover:to-[#0077B6]/20 dark:hover:from-[#D4AF37]/20 dark:hover:to-[#B8860B]/20 border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 px-2 md:px-3.5 py-1 md:py-1.5 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 shadow-sm group ml-2 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37]"
                  title="محفظتي التعليمية - اضغط للذهاب للمحفظة"
                >
                  <div className="w-7 h-7 rounded-xl bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37] group-hover:scale-110 transition-transform">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 block">المحفظة</span>
                    <span className="text-xs font-black text-[#0077B6] dark:text-[#D4AF37] mt-0.5">
                      {userData?.balance ?? 0} ج.م
                    </span>
                  </div>
                </div>
              )}
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="md:hidden w-8 h-8 md:w-10 md:h-10 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center border border-red-150 dark:border-red-900/30 transition-all font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer"
                title="تسجيل خروج"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222230] transition-colors relative"
                >
                   <Bell className="w-4 h-4 md:w-5 md:h-5" />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1A24]"></span>
                   )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#222230] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2D2D3D] z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                        <span className="text-xs bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-2 py-1 rounded-full font-bold">
                          {notifications.filter(n => !n.read).length} جديد
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                              className={`p-4 border-b border-gray-50 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#2A2A38] transition-colors cursor-pointer ${!notif.read ? "bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5" : ""}`}
                            >
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{notif.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                              <span className="text-[10px] text-gray-400 mt-2 block">
                                {new Date(notif.createdAt).toLocaleDateString("ar-EG")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            لا توجد إشعارات حالياً
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </header>

        <div className="p-6 md:p-8 flex-1 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'admin' && userData?.role === 'admin' && (
              <AdminPanel userData={userData} />
            )}
            {activeTab === 'admin_recharge' && userData?.role === 'admin' && (
              <AdminPanel initialTab="wallet" userData={userData} />
            )}
            {activeTab === 'admin_courses' && userData?.role === 'admin' && (
              <AdminCoursesPanel />
            )}
            {activeTab === 'home' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 dark:from-[#D4AF37] dark:to-yellow-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <h1 className="text-3xl font-black mb-2">مرحباً بك يا مدير النظام!</h1>
                      <p className="text-white/80 font-medium">هذه لوحة التحكم الرئيسية الخاصة بك لإدارة منصة Teachland.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي الطلاب</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.students.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">إجمالي المعلمين</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.teachers.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">الكورسات والمواد</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.courses.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15151F] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-7 h-7" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">طلبات الشحن المعلقة</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {loadingAdminStats ? '...' : adminStats.pendingPayments.toLocaleString('ar-EG')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  <button onClick={() => setActiveTab('admin_panel')} className="p-6 bg-white dark:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D] rounded-3xl hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#20202D] rounded-xl flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
                        <Shield className="w-6 h-6 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-gray-900 dark:text-white mb-1">إدارة المستخدمين</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">الطلاب، المعلمون وأولياء الأمور</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('admin_recharge')} className="p-6 bg-white dark:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D] rounded-3xl hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#20202D] rounded-xl flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
                        <Ticket className="w-6 h-6 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-gray-900 dark:text-white mb-1">مركز الشحن</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">إدارة الدفعات وتوليد الأكواد</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('admin_courses')} className="p-6 bg-white dark:bg-[#15151F] border border-gray-100 dark:border-[#2D2D3D] rounded-3xl hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#20202D] rounded-xl flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
                        <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-gray-900 dark:text-white mb-1">إدارة الكورسات</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">الموافقة والمراجعة</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'home' && userData?.role !== 'admin' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {userData?.role === 'teacher' && (
                  <div className="space-y-8">
                    {/* Stat Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 1, title: 'إجمالي الطلاب', value: loadingTeacherStats ? '...' : teacherStudentsCount.toLocaleString('ar-EG'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 2, title: 'إجمالي المشاهدات', value: loadingTeacherStats ? '...' : teacherViewsCount.toLocaleString('ar-EG'), icon: Activity, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                      ].map((stat) => (
                        <div key={stat.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4 h-full">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                            <stat.icon className={`w-7 h-7 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                          </div>
                        </div>
                      ))}
                    </section>

                    {/* Charts Section */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enrollment Trend Chart */}
                      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> نمو الاشتراكات (آخر ٧ أيام)
                          </h3>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={teacherEnrollmentTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-[#2D2D3D]" />
                              <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-[10px] fill-gray-500 font-bold" />
                              <YAxis tickLine={false} axisLine={false} width={35} className="text-[10px] fill-gray-500 font-bold" />
                              <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: '12px', color: '#fff', textAlign: 'right' }} />
                              <Area type="monotone" dataKey="الاشتراكات" stroke="#00B4D8" strokeWidth={3} fillOpacity={1} fill="url(#colorEnrollment)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Course Engagement Chart */}
                      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" /> تفاعل الطلاب وحضور المحاضرات
                          </h3>
                          {/* Premium Custom HTML Legend to prevent RTL overlapping bugs */}
                          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <span className="w-3 h-3 rounded bg-[#00B4D8]" />
                              <span>الطلاب المشتركين</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <span className="w-3 h-3 rounded bg-[#D4AF37]" />
                              <span>إجمالي المشاهدات</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={teacherChartData.length > 0 ? teacherChartData : [{ name: 'لا توجد كورسات بعد', students: 0, views: 0 }]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-[#2D2D3D]" />
                              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] fill-gray-500 font-bold" />
                              <YAxis tickLine={false} axisLine={false} width={35} className="text-[10px] fill-gray-500 font-bold" />
                              <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: '12px', color: '#fff', textAlign: 'right' }} />
                              <Bar dataKey="students" name="الطلاب المشتركين" fill="#00B4D8" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="views" name="إجمالي المشاهدات" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </section>

                    {/* Recent Activities Section */}
                    <section className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-yellow-500" /> أحدث نشاطات الطلاب والاشتراكات
                      </h3>
                      <div className="space-y-4">
                        {notifications.filter(n => n.type === 'enrollment').slice(0, 5).map((notif) => (
                          <div key={notif.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D] hover:-translate-y-0.5 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{notif.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                        ))}
                        {notifications.filter(n => n.type === 'enrollment').length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-medium">
                            لا توجد نشاطات أو اشتراكات جديدة حالياً 👍
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {userData?.role === 'parent' && (
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 1, title: 'مستوى الطالب', value: !linkedStudent ? 'لم يتم ربط طالب' : (loadingParentStats ? '...' : parentStats.level), icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { id: 2, title: 'آخر الدرجات', value: !linkedStudent ? '-' : (loadingParentStats ? '...' : (parentStats.coursesCount > 0 ? '١٨/٢٠ (ممتاز)' : 'لا يوجد درجات')), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                      { id: 3, title: 'نسبة الحضور', value: !linkedStudent ? '-' : (loadingParentStats ? '...' : parentStats.attendance), icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                    ].map((stat) => (
                      <div key={stat.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4 h-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                          <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {userData?.role === 'student' && (
                  <>
                    {/* Continue Learning */}
                    <section>
                       <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                          <Target className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> استكمل التعلم
                       </h2>
                       {loadingContinueLearning ? (
                         <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm animate-pulse space-y-4">
                           <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                         </div>
                       ) : continueLearningItem ? (
                         <div 
                           onClick={() => navigate(`/course/${continueLearningItem.courseId}`, { state: { autoPlayLessonId: continueLearningItem.lessonId } })}
                           className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-md transition-shadow cursor-pointer"
                         >
                            <div className="w-full md:w-48 aspect-video bg-gray-900 rounded-2xl relative flex items-center justify-center overflow-hidden shrink-0">
                               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 text-white ml-1 fill-white" />
                               </div>
                            </div>
                            <div className="flex-1 w-full text-right">
                               <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-600 rounded dark:bg-purple-950/40 dark:text-purple-300">
                                    {continueLearningItem.courseSubject}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {continueLearningItem.courseTitle} • الدرس {continueLearningItem.lessonOrder}
                                  </span>
                               </div>
                               <h3 className="text-lg font-black mb-3 text-gray-900 dark:text-white group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors">
                                 {continueLearningItem.lessonTitle}
                               </h3>
                               
                               <div className="w-full bg-gray-100 dark:bg-[#222230] rounded-full h-2 mb-2" dir="ltr">
                                  <div 
                                    className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${continueLearningItem.percent || 0}%` }}
                                  ></div>
                               </div>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-bold text-right">
                                 {continueLearningItem.percent > 0 ? `تمت مشاهدة ${Math.round(continueLearningItem.percent)}% • ` : ''}
                                 {continueLearningItem.timeRemainingText}
                               </p>
                            </div>
                            <div className="hidden md:flex shrink-0">
                               <div className="w-12 h-12 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors">
                                  <ArrowLeft className="w-5 h-5" />
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-center space-y-4">
                           <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-[#00B4D8] dark:text-[#D4AF37] rounded-full flex items-center justify-center mx-auto">
                             <BookOpen className="w-8 h-8" />
                           </div>
                           <h3 className="text-lg font-black text-gray-900 dark:text-white">جاهز لبدء رحلتك التعليمية؟ 🚀</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                             اختر أحد الكورسات المتاحة في الأسفل وابدأ في مشاهدة أول درس لبناء مستقبلك اليوم!
                           </p>
                         </div>
                       )}
                    </section>

                    {/* My Badges */}
                    <section>
                      <StudentBadges userData={userData} />
                    </section>

                                        {/* Qudurat Premium section */}
                    {hasPublishedQudurat && (
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
                              const isUnlocked = userData?.role === 'admin' || (review.enrolledStudentIds || []).includes(userData?.id || "");
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
                    )}
                    {/* Tahsili Premium section */}
                    {hasPublishedTahsili && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white">
                            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" /> 
                            <span>🎓 المراجعات والتحصيلي الممتاز</span>
                          </h2>
                          <button
                            onClick={() => {
                              setSelectedTahsiliReviewId(null);
                              setActiveTab('tahsili');
                            }}
                            className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <span>عرض الكل</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {publishedTahsiliReviews.slice(0, 3).map((review) => {
                            const isEnrolled = review.enrolledStudentIds?.includes(userData?.id);
                            const discount = review.discountPrice !== undefined && review.discountPrice !== null && review.discountPrice < review.price;
                            const displayPrice = discount ? review.discountPrice : review.price;

                            return (
                              <div
                                key={review.id}
                                onClick={() => {
                                  setSelectedTahsiliReviewId(review.id);
                                  setActiveTab('tahsili');
                                }}
                                className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer relative"
                              >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-gray-900 overflow-hidden shrink-0">
                                  <img 
                                    src={review.thumbnail} 
                                    alt={review.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                  
                                  {/* Subject Badge */}
                                  <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                                    <span className="px-2.5 py-1 bg-purple-600/90 text-white rounded-lg text-[10px] font-black backdrop-blur-md">
                                      {review.subject}
                                    </span>
                                    <span className="px-2.5 py-1 bg-black/50 text-slate-200 rounded-lg text-[10px] font-bold backdrop-blur-md">
                                      {review.grade}
                                    </span>
                                  </div>

                                  {/* Featured Badge */}
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
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-black text-[9px]">
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

                                  {/* Stats */}
                                  <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold border-t border-b border-gray-50 dark:border-[#2D2D3D] py-2">
                                    <span className="flex items-center gap-1">
                                      <Film className="w-3.5 h-3.5 text-purple-500" />
                                      <span>{review.lessonsCount} درس مراجعة</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                                      <span>مدة {review.duration}</span>
                                    </span>
                                  </div>

                                  {/* Footer row */}
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
                                    </div>

                                    {isEnrolled ? (
                                      <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-[9.5px] font-black">
                                        مفعّل ومفتوح
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-[9.5px] font-black group-hover:bg-purple-700 transition-all flex items-center gap-1">
                                        <span>اشترك الآن</span>
                                        <ChevronLeft className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* My Subjects */}
                    <section>
                      <StudentCourses userData={userData} />
                    </section>

                    {/* Quick Notes Mini-Box */}
                    <section className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 className="text-lg font-black flex items-center gap-2 text-gray-900 dark:text-white">
                          <Edit2 className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> تدوين ملاحظة دراسية سريعة 📝
                        </h2>
                        <button 
                          onClick={() => setActiveTab('notes')}
                          className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                        >
                          دفتر الملاحظات الكامل ({quickNotesCount}) <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                          <textarea
                            placeholder="اكتب ملاحظاتك، واجباتك، أو معادلة تود تذكرها لاحقاً... وسيتم مزامنتها فوراً بسحابة Teachland ⚡"
                            rows={3}
                            value={miniNoteContent}
                            onChange={(e) => setMiniNoteContent(e.target.value.slice(0, 1000))}
                            className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-4 text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] placeholder-gray-400 dark:placeholder-gray-600 transition-all leading-relaxed resize-none"
                          />
                        </div>
                        <div className="space-y-2 flex flex-col justify-end w-full">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 block mb-1.5">
                              ربط بكورس حالي:
                            </label>
                            <select
                              value={miniNoteCourseId}
                              onChange={(e) => setMiniNoteCourseId(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37]"
                            >
                              <option value="general">📁 ملاحظات عامة وتنبيهات</option>
                              {coursesList.filter(c => c.enrolledStudentIds?.includes(userData?.id)).map(course => (
                                <option key={course.id} value={course.id}>
                                  📚 {course.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <button
                            onClick={handleMiniNoteSave}
                            disabled={savingMiniNote || !miniNoteContent.trim()}
                            className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {savingMiniNote ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>حفظ الملاحظة سحابياً</span>
                          </button>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'activate' && (
              <motion.div
                key="activate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto mt-10"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 text-center shadow-xl border border-gray-200 dark:border-[#2D2D3D]">
                  <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <Ticket className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
                  </div>
                  <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">شحن رصيد Teachland</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">أدخل الكود المكون من 12 رقم الموجود في كارت Teachland</p>
                  
                  <form onSubmit={handleActivate}>
                    <input
                      required
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="TF-XXXX-XXXX-XXXX"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-6 py-4 text-center text-2xl tracking-[0.2em] font-mono text-gray-900 dark:text-white outline-none transition-colors mb-6 uppercase"
                      dir="ltr"
                    />
                    <button type="submit" className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] dark:hover:bg-[#B8860B] hover:-translate-y-0.5 transition-all text-lg">
                      تفعيل الكود
                    </button>
                  </form>

                  {activationStatus === 'success' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-green-200">
                      <CheckCircle className="w-5 h-5" /> تم الشحن بنجاح!
                    </motion.div>
                  )}
                  {activationStatus === 'error' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-red-200">
                      الكود غير صحيح أو تم استخدامه من قبل
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'classes' && userData?.role === 'teacher' && (
              <motion.div
                key="classes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TeacherClasses userData={userData} />
              </motion.div>
            )}

            {activeTab === 'tahsili' && (
              <motion.div
                key="tahsili"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {userData?.role === 'teacher' ? (
                  <TeacherTahsili userData={userData} />
                ) : (
                  <StudentTahsili 
                    userData={userData} 
                    setUserData={setUserData}
                    initialSelectedReviewId={selectedTahsiliReviewId}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'qudurat' && (
              <motion.div
                key="qudurat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {userData?.role === 'teacher' ? (
                  <TeacherQudurat userData={userData} />
                ) : (
                  <StudentQudurat 
                    userData={userData} 
                    setUserData={setUserData}
                    initialSelectedReviewId={selectedQuduratReviewId}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'subjects' && (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StudentCourses userData={userData} />
              </motion.div>
            )}

            {activeTab === 'teachers_list' && userData?.role === 'student' && (
              <motion.div
                key="teachers_list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TeachersSearchList userData={userData} />
              </motion.div>
            )}

            {activeTab === 'messages' && (
              userData?.role === 'parent' ? (
                <motion.div
                  key="parent_teachers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ParentTeachersList userData={userData} linkedStudent={linkedStudent} />
                </motion.div>
              ) : (
                <motion.div
                  key="soon"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-[60vh] flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="w-20 h-20 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">قريباً</h2>
                  <p className="font-medium text-sm">يتم تجهيز هذا القسم ليواكب أحدث التعديلات</p>
                </motion.div>
              )
            )}

                        {(activeTab === 'analytics' || activeTab === 'reports') && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center">
                      <Flame className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">التقارير والإحصائيات</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">تابع الأداء والتفاعل بشكل مباشر</p>
                    </div>
                  </div>
                  <ComprehensiveAnalytics userData={userData} linkedStudent={linkedStudent} />
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="relative z-10">
                    <p className="text-white/80 font-bold text-sm">الرصيد الحالي</p>
                    <h2 className="text-4xl font-black mt-2">
                      {(userData?.balance || 0).toLocaleString('ar-EG')}
                      <span className="text-lg font-bold ml-2">ج.م</span>
                    </h2>
                  </div>
                </div>

                {/* Recharge Code / Card Form Card */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37]">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">شحن الرصيد باستخدام كود أو كارت شحن</h3>
                      <p className="text-gray-400 dark:text-gray-500 font-bold text-xs mt-0.5">أدخل الكود الخاص بك لتعبئة رصيد محفظتك مباشرة</p>
                    </div>
                  </div>

                  <form onSubmit={handleActivate} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="أدخل كود الشحن هنا (مثال: TF-100-2026)"
                        className="w-full text-right md:text-center tracking-wider placeholder:tracking-normal p-4 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] bg-gray-50 dark:bg-[#15151F] text-gray-900 dark:text-white text-base font-black focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                        disabled={isActivating}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActivating || !code.trim()}
                      className="w-full bg-[#00B4D8] hover:bg-[#0077B6] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      {isActivating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري الشحن وتفعيل الكود...</span>
                        </>
                      ) : (
                        <span>تفعيل وشحن الكود الآن</span>
                      )}
                    </button>
                  </form>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start text-right" dir="rtl">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                      <p className="font-black mb-1">تعليمات وتنبيهات هامة:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>تأكد من كتابة الكود بشكل صحيح وبنفس الحروف الكبيرة وعلامات الفاصلة (-).</li>
                        <li>الكود صالح للاستخدام مرة واحدة فقط وسيتم ربطه بحسابك فوراً.</li>
                        <li>إذا تم توليد الكود لطالب محدد، فلن يتمكن أي حساب آخر من استخدامه.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Transaction Logs */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">سجل المعاملات</h3>
                  {transactions.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-[#2D2D3D]/50">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="py-4 flex justify-between items-center">
                          <span className="text-gray-900 dark:text-white font-bold">{tx.description}</span>
                          <span className={`${tx.amount > 0 ? 'text-green-500' : 'text-red-500'} font-black`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ar-EG')} ج.م
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">لا توجد معاملات</p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'admin_store' && userData?.role === 'admin' && (
              <motion.div
                key="admin_store"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AcademyStoreAdmin userData={userData} />
              </motion.div>
            )}

            {activeTab === 'student_store' && userData?.role === 'student' && (
              <motion.div
                key="student_store"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StudentStore userData={userData} setUserData={setUserData} />
              </motion.div>
            )}

            {activeTab === 'parent_invoices' && userData?.role === 'parent' && (
              <motion.div
                key="parent_invoices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ParentInvoices userData={userData} linkedStudent={linkedStudent} />
              </motion.div>
            )}

            {activeTab === 'finances' && (
              <motion.div
                key="finances"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">إدارة الحسابات والمالية</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">تتبع التدفقات المالية، الأرباح، والمصروفات بدقة متناهية</p>
                    </div>
                  </div>
                  <FinancesManager userData={userData} />
                </div>
              </motion.div>
            )}

             {activeTab === 'quizzes' && (
              <motion.div
                key="quizzes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
                dir="rtl"
              >
                {/* Header */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-right w-full md:w-auto">
                    <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Award className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {userData?.role === 'teacher' ? 'مركز الاختبارات والتقييم' : userData?.role === 'parent' ? 'نتائج واختبارات الطالب' : 'مركز الاختبارات التفاعلية'}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 font-bold text-xs mt-1">
                        {userData?.role === 'teacher' ? 'أدر الاختبارات التفاعلية، وراجع درجات ومحاولات طلابك' : userData?.role === 'parent' ? 'تابع مستوى تقدم الطالب في جميع اختبارات الدروس والكورسات' : 'حل الاختبارات بعد كل درس لقياس مستوى فهمك وتصحيح أخطائك فوراً'}
                      </p>
                    </div>
                  </div>
                </div>

                {loadingQuizzes ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-200 dark:border-[#2D2D3D]">
                    <Loader2 className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
                    <p className="font-bold text-sm text-gray-500">جاري تحميل الاختبارات والنتائج...</p>
                  </div>
                ) : (
                  <>
                    {userData?.role === 'student' && (
                      <div className="space-y-6 text-right">
                        {/* Compact Header Summary Card */}
                        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-4 border border-gray-150 dark:border-[#2D2D3D]/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-gray-800 dark:text-white">ملخص أدائك وتقييمك 📊</h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">تابع إحصائياتك للاختبارات التفاعلية والامتحانات الشاملة الموجهة لك.</p>
                          </div>
                          <div className="flex gap-4 self-stretch sm:self-auto justify-between sm:justify-start">
                            <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D]/40 rounded-xl px-4 py-2 text-center shrink-0">
                              <span className="block text-[9px] text-gray-400 font-bold mb-0.5">المنجزة</span>
                              <span className="text-sm font-black text-[#00B4D8] dark:text-[#D4AF37]">
                                {submissionsList.length} / {studentVisibleQuizzes.length}
                              </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D]/40 rounded-xl px-4 py-2 text-center shrink-0">
                              <span className="block text-[9px] text-gray-400 font-bold mb-0.5">متوسط الدرجة</span>
                              <span className="text-sm font-black text-green-500">
                                {submissionsList.length > 0
                                  ? `${Math.round(submissionsList.reduce((acc, curr) => acc + (curr.score || 0), 0) / submissionsList.length)}%`
                                  : '0%'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Beautifully Combined Control Bar (Tabs + Filters) */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-150 dark:border-[#2D2D3D]/60 pb-3">
                          {/* Inner Tabs Selector */}
                          <div className="flex gap-4">
                            <button
                              onClick={() => setQuizTabType('lesson')}
                              className={`pb-1 text-xs font-black transition-all relative ${
                                quizTabType === 'lesson'
                                  ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            >
                              اختبارات الدروس ({studentVisibleQuizzes.filter(q => !q.isComprehensive).length})
                              {quizTabType === 'lesson' && (
                                <motion.div layoutId="studentQuizTabBorder" className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                              )}
                            </button>
                            <button
                              onClick={() => setQuizTabType('comprehensive')}
                              className={`pb-1 text-xs font-black transition-all relative ${
                                quizTabType === 'comprehensive'
                                  ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            >
                              الامتحانات الشاملة والنشطة ({studentVisibleQuizzes.filter(q => q.isComprehensive).length})
                              {quizTabType === 'comprehensive' && (
                                <motion.div layoutId="studentQuizTabBorder" className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                              )}
                            </button>
                          </div>

                          {/* Filters Chips */}
                          <div className="flex gap-1.5 bg-gray-100 dark:bg-[#0D0D12] p-1 rounded-xl w-fit self-end md:self-auto">
                            {[
                              { id: 'all', label: 'الكل' },
                              { id: 'completed', label: 'المكتملة' },
                              { id: 'pending', label: 'المتبقية' }
                            ].map(filter => (
                              <button
                                key={filter.id}
                                onClick={() => setQuizzesFilter(filter.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                                  quizzesFilter === filter.id
                                    ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                              >
                                {filter.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* List rendering */}
                        <div className="space-y-3">
                          {studentVisibleQuizzes
                            .filter(q => quizTabType === 'lesson' ? !q.isComprehensive : q.isComprehensive)
                            .filter(q => {
                              const isSolved = submissionsList.some(s => s.quizId === q.id);
                              if (quizzesFilter === 'completed') return isSolved;
                              if (quizzesFilter === 'pending') return !isSolved;
                              return true;
                            })
                            .map(quiz => {
                              const sub = submissionsList.find(s => s.quizId === quiz.id);
                              const courseInfo = coursesList.find(c => c.id === quiz.courseId);
                              return (
                                <div
                                  key={quiz.id}
                                  className="relative group bg-white dark:bg-[#1A1A24] hover:bg-gray-50 dark:hover:bg-[#1C1C28] border border-gray-150 dark:border-[#2D2D3D]/50 rounded-2xl p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                                >
                                  {/* Right side details */}
                                  <div className="flex items-center gap-3.5 text-right flex-1">
                                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${sub ? 'bg-green-500/10 text-green-500' : 'bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]'}`}>
                                      {sub ? <CheckCircle className="w-5 h-5" /> : <Play className="w-4 h-4" />}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white">{quiz.title}</h3>
                                        {quiz.isComprehensive && (
                                          <span className="text-[9px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md">امتحان شامل 🏆</span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        <span>⏱️ {quiz.timeLimit} دقيقة</span>
                                        <span>•</span>
                                        <span>📝 {quiz.questions?.length || 0} أسئلة</span>
                                        {courseInfo && (
                                          <>
                                            <span>•</span>
                                            <span className="text-[#00B4D8] dark:text-[#D4AF37]">📚 {courseInfo.title}</span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Left side actions */}
                                  <div className="shrink-0 w-full md:w-auto flex items-center justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-[#2D2D3D]/50">
                                    {sub ? (
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <div className={`text-xs font-black ${sub.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                            الدرجة: {sub.score}%
                                          </div>
                                          <div className="text-[10px] text-gray-400 font-bold">
                                            {sub.correctAnswers}/{sub.totalQuestions} صحيح
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setSelectedQuizReview(quiz);
                                            setSelectedSubmissionReview(sub);
                                          }}
                                          className="px-3.5 py-2 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 dark:hover:bg-[#D4AF37]/20 rounded-xl font-black text-[11px] transition-colors flex items-center gap-1.5"
                                        >
                                          <Award className="w-3.5 h-3.5" />
                                          تقرير الأخطاء
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (quiz.isComprehensive) {
                                            navigate(`/exam/${quiz.id}`);
                                          } else {
                                            navigate(`/course/${quiz.courseId}`);
                                            toast.success('تم توجيهك لصفحة الكورس، الرجاء اختيار الدرس المطلوب وبدء الاختبار التفاعلي من داخله.');
                                          }
                                        }}
                                        className="px-4 py-2 bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:bg-[#0077B6] dark:hover:bg-[#B8860B] rounded-xl font-black text-xs shadow-sm transition-all flex items-center gap-1.5 hover:-translate-y-0.5"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                        ابدأ الآن
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                          {studentVisibleQuizzes
                            .filter(q => quizTabType === 'lesson' ? !q.isComprehensive : q.isComprehensive)
                            .filter(q => {
                              const isSolved = submissionsList.some(s => s.quizId === q.id);
                              if (quizzesFilter === 'completed') return isSolved;
                              if (quizzesFilter === 'pending') return !isSolved;
                              return true;
                            }).length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D]/50 rounded-2xl">
                              <Trophy className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                              <p className="font-bold text-xs text-gray-500">لا توجد اختبارات في هذا القسم حالياً 👍</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {userData?.role === 'teacher' && (
                      <div className="space-y-6 text-right w-full">
                        {/* Teacher Sub-tabs selector */}
                        <div className="flex gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-3 mb-6">
                          <button
                            onClick={() => setQuizTabType('lesson')}
                            className={`pb-2 text-sm font-black transition-all relative ${
                              quizTabType === 'lesson'
                                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            اختبارات الحصص والدروس
                            {quizTabType === 'lesson' && (
                              <motion.div layoutId="teacherQuizTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                            )}
                          </button>
                          <button
                            onClick={() => setQuizTabType('comprehensive')}
                            className={`pb-2 text-sm font-black transition-all relative ${
                              quizTabType === 'comprehensive'
                                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            الامتحانات الشاملة والعامة 🏆
                            {quizTabType === 'comprehensive' && (
                              <motion.div layoutId="teacherQuizTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                            )}
                          </button>
                        </div>

                        {quizTabType === 'lesson' ? (
                          <>
                            {/* Quick Guide Card */}
                            <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="space-y-2 flex-1">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                                  كيفية إنشاء اختبار تفاعلي جديد لطلابك:
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                  يتم ربط كل اختبار تفاعلي بدرس محدد داخل كورساتك. لإنشاء اختبار جديد أو تعديله، اذهب إلى قسم <span className="font-bold text-[#00B4D8] dark:text-[#D4AF37]">"فصولي"</span>، ثم اختر الكورس والدرس المطلوب، وانتقل لتبويب <span className="font-bold text-[#00B4D8] dark:text-[#D4AF37]">"الاختبار التفاعلي"</span> لإضافة الأسئلة وتحديد الإجابة الصحيحة وشرحها لطلابك فوراً!
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveTab('classes')}
                                className="px-6 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 hover:-translate-y-0.5"
                              >
                                <Users className="w-4 h-4" />
                                الذهاب إلى "فصولي" للبدء
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Quizzes List (Left Column) */}
                              <div className="lg:col-span-1 space-y-4">
                              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">الاختبارات المتاحة</h3>
                              <div className="space-y-3">
                                {quizzesList.filter(q => !q.isComprehensive).map(quiz => {
                                  const subs = submissionsList.filter(s => s.quizId === quiz.id);
                                  const isSelected = teacherSelectedQuiz?.id === quiz.id;
                                  return (
                                    <div
                                      key={quiz.id}
                                      onClick={() => {
                                        setTeacherSelectedQuiz(quiz);
                                      }}
                                      className={`w-full p-4 rounded-2xl text-right border transition-all flex flex-col gap-2 cursor-pointer ${
                                        isSelected
                                          ? 'bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:border-[#D4AF37] shadow-sm'
                                          : 'bg-white dark:bg-[#1A1A24] border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#222230]'
                                      }`}
                                    >
                                      <div className="flex justify-between items-center w-full">
                                        <span className="text-[10px] bg-gray-100 dark:bg-[#222230] text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                          المشاركات: {subs.length} طالب
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDirectingQuiz(quiz);
                                            setDirectTargetType(quiz.targetedType || 'all');
                                            setDirectTargetGrade(quiz.targetedGrade || 'الأول الثانوي');
                                            setDirectTargetStudentIds(quiz.targetedStudentIds || []);
                                          }}
                                          className="p-1 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]/50 rounded-lg text-[#00B4D8] dark:text-[#D4AF37] transition-colors"
                                          title="توجيه ونشر الاختبار"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{quiz.title}</h4>
                                      <div className="flex justify-between items-center text-[10px] font-bold mt-1">
                                        <span className="text-gray-400">الأسئلة: {quiz.questions?.length || 0}</span>
                                        {quiz.isHidden ? (
                                          <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">مسودة 🙈</span>
                                        ) : quiz.targetedType === 'grade' ? (
                                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">موجه: {quiz.targetedGrade} 🎯</span>
                                        ) : quiz.targetedType === 'custom' ? (
                                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">موجه للطلاب 👥</span>
                                        ) : (
                                          <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">منشور للجميع 🌍</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {quizzesList.filter(q => !q.isComprehensive).length === 0 && (
                                  <div className="text-center py-10 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200">
                                    <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="font-bold text-xs text-gray-500">لم تقم بإنشاء أي اختبارات تفاعلية بعد.</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Submissions (Right Column) */}
                            <div className="lg:col-span-2 space-y-4">
                              {teacherSelectedQuiz && !teacherSelectedQuiz.isComprehensive ? (
                                (() => {
                                  const quizSubmissions = submissionsList.filter(s => s.quizId === teacherSelectedQuiz.id);
                                  return (
                                    <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                                      <div className="border-b border-gray-100 dark:border-[#2D2D3D] pb-4 flex justify-between items-center">
                                        <div>
                                          <h3 className="font-black text-lg text-gray-900 dark:text-white">{teacherSelectedQuiz.title}</h3>
                                          <p className="text-xs text-gray-400 font-bold mt-1">جدول تسليمات ودرجات الطلاب للتصحيح والمتابعة</p>
                                        </div>
                                        <button
                                          onClick={() => {
                                            navigate(`/course/${teacherSelectedQuiz.courseId}`);
                                            toast.success('تم توجيهك لصفحة الكورس للتعديل على الاختبار.');
                                          }}
                                          className="px-4 py-2.5 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] rounded-xl text-xs font-bold transition-all hover:bg-[#00B4D8]/20 dark:hover:bg-[#D4AF37]/20 flex items-center gap-1.5"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                          تعديل الأسئلة
                                        </button>
                                      </div>

                                      <div className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50">
                                        {quizSubmissions.map(sub => (
                                          <div key={sub.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#0077B6] dark:text-[#D4AF37]">
                                                {sub.userName?.charAt(0) || 'ط'}
                                              </div>
                                              <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{sub.userName}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                  تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="text-left font-black text-sm">
                                              <span className={sub.score >= 50 ? 'text-green-500' : 'text-red-500'}>
                                                {sub.score}%
                                              </span>
                                              <p className="text-[10px] text-gray-400 font-bold mt-0.5" dir="ltr">
                                                {sub.correctAnswers} / {sub.totalQuestions} صحيح
                                              </p>
                                            </div>
                                          </div>
                                        ))}

                                        {quizSubmissions.length === 0 && (
                                          <div className="text-center py-16 text-gray-400">
                                            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="font-bold text-sm">لا توجد محاولات أو تسليمات من الطلاب لهذا الاختبار بعد 👍</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-16 text-center border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center h-full">
                                  <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                  <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">اختر اختباراً لمشاهدة التفاصيل</h3>
                                  <p className="text-xs text-gray-400 font-bold max-w-sm mt-1">قم بتحديد أي اختبار من القائمة الجانبية لعرض درجات الطلاب وتحليل أخطائهم بالتفصيل</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                        ) : (
                          // Comprehensive exams tab for teachers
                          <div className="space-y-6">
                            {/* Create Button Banner */}
                            <div className="bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10">
                              <div className="space-y-1">
                                <h3 className="font-black text-lg">بوابة الامتحانات الشاملة والعامة 🏆</h3>
                                <p className="text-xs text-white/80 font-bold">أنشئ امتحانات عامة أو شاملة لكورساتك وموادك لقياس تحصيل ومستوى الطلاب.</p>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingExamId(null);
                                  setIsCreatingExam(true);
                                }}
                                className="px-6 py-3 bg-white text-[#0077B6] dark:text-[#AA7C11] rounded-2xl font-black text-xs hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-md shadow-black/5"
                              >
                                <Plus className="w-4 h-4" />
                                إضافة امتحان شامل جديد
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left Column: Exams List */}
                              <div className="lg:col-span-1 space-y-4">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white">قائمة الامتحانات الشاملة</h3>
                                <div className="space-y-3">
                                  {quizzesList.filter(q => q.isComprehensive).map(quiz => {
                                    const subs = submissionsList.filter(s => s.quizId === quiz.id);
                                    const isSelected = teacherSelectedQuiz?.id === quiz.id;
                                    const courseInfo = coursesList.find(c => c.id === quiz.courseId);
                                    return (
                                      <div
                                        key={quiz.id}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 relative group cursor-pointer ${
                                          isSelected
                                            ? 'bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:border-[#D4AF37] shadow-sm'
                                            : 'bg-white dark:bg-[#1A1A24] border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#222230]'
                                        }`}
                                        onClick={() => setTeacherSelectedQuiz(quiz)}
                                      >
                                        <div className="flex justify-between items-start">
                                          <span className="text-[10px] bg-gray-100 dark:bg-[#222230] text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                            المشاركات: {subs.length} طالب
                                          </span>
                                          <div className="flex gap-1.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDirectingQuiz(quiz);
                                                setDirectTargetType(quiz.targetedType || 'all');
                                                setDirectTargetGrade(quiz.targetedGrade || 'الأول الثانوي');
                                                setDirectTargetStudentIds(quiz.targetedStudentIds || []);
                                              }}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-lg text-amber-500 transition-colors"
                                              title="توجيه ونشر الاختبار"
                                            >
                                              <Send className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingExamId(quiz.id);
                                                setIsCreatingExam(true);
                                              }}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-lg text-[#00B4D8] dark:text-[#D4AF37] transition-colors"
                                              title="تعديل الامتحان"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("هل أنت متأكد من حذف هذا الامتحان الشامل نهائياً؟")) {
                                                  handleDeleteExam(quiz.id);
                                                }
                                              }}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-lg text-red-500 transition-colors"
                                              title="حذف الامتحان"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{quiz.title}</h4>
                                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                                          <span>الأسئلة: {quiz.questions?.length || 0}</span>
                                          <span>{courseInfo ? courseInfo.title : "امتحان عام"}</span>
                                        </div>
                                        <div className="flex justify-end mt-1 text-[10px] font-bold">
                                          {quiz.isHidden ? (
                                            <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">مسودة 🙈</span>
                                          ) : quiz.targetedType === 'grade' ? (
                                            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">موجه: {quiz.targetedGrade} 🎯</span>
                                          ) : quiz.targetedType === 'custom' ? (
                                            <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">موجه للطلاب 👥</span>
                                          ) : (
                                            <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">منشور للجميع 🌍</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {quizzesList.filter(q => q.isComprehensive).length === 0 && (
                                    <div className="text-center py-10 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200">
                                      <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                      <p className="font-bold text-xs text-gray-500">لم تقم بنشر أي امتحانات شاملة بعد.</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column: Submissions List */}
                              <div className="lg:col-span-2 space-y-4">
                                {teacherSelectedQuiz && teacherSelectedQuiz.isComprehensive ? (
                                  (() => {
                                    const quizSubmissions = submissionsList.filter(s => s.quizId === teacherSelectedQuiz.id);
                                    return (
                                      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                                        <div className="border-b border-gray-100 dark:border-[#2D2D3D] pb-4 flex justify-between items-center">
                                          <div>
                                            <h3 className="font-black text-lg text-gray-900 dark:text-white">{teacherSelectedQuiz.title}</h3>
                                            <p className="text-xs text-gray-400 font-bold mt-1">جدول تسليمات ودرجات الطلاب للتقييم والمتابعة</p>
                                          </div>
                                          <button
                                            onClick={() => {
                                              setEditingExamId(teacherSelectedQuiz.id);
                                              setIsCreatingExam(true);
                                            }}
                                            className="px-4 py-2.5 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] rounded-xl text-xs font-bold transition-all hover:bg-[#00B4D8]/20 dark:hover:bg-[#D4AF37]/20 flex items-center gap-1.5"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            تعديل الامتحان
                                          </button>
                                        </div>

                                        <div className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50">
                                          {quizSubmissions.map(sub => (
                                            <div key={sub.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#0077B6] dark:text-[#D4AF37]">
                                                  {sub.userName?.charAt(0) || 'ط'}
                                                </div>
                                                <div>
                                                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{sub.userName}</h4>
                                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                    تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                                  </p>
                                                </div>
                                              </div>

                                              <div className="text-left font-black text-sm">
                                                <span className={sub.score >= 50 ? 'text-green-500' : 'text-red-500'}>
                                                  {sub.score}%
                                                </span>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5" dir="ltr">
                                                  {sub.correctAnswers} / {sub.totalQuestions} صحيح
                                                </p>
                                              </div>
                                            </div>
                                          ))}

                                          {quizSubmissions.length === 0 && (
                                            <div className="text-center py-16 text-gray-400">
                                              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                              <p className="font-bold text-sm">لا توجد محاولات أو تسليمات من الطلاب لهذا الامتحان الشامل بعد 👍</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-16 text-center border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center h-full">
                                    <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                    <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">اختر امتحاناً شاملاً لمشاهدة التفاصيل</h3>
                                    <p className="text-xs text-gray-400 font-bold max-w-sm mt-1">قم بتحديد أي امتحان من القائمة الجانبية لعرض درجات الطلاب وتحليل أخطائهم بالتفصيل</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {userData?.role === 'parent' && (
                      <div className="space-y-6 text-right">
                        {/* Parent linked student status message */}
                        {!linkedStudent ? (
                          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200/50 text-center font-bold text-sm">
                            ⚠️ يرجى ربط حساب الطالب من صفحة "الملف الشخصي" أولاً لعرض تقارير واختبارات الطالب بالتفصيل ومتابعة أدائه.
                          </div>
                        ) : (
                          <>
                            <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 rounded-2xl p-4 flex items-center gap-3">
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                تتابع حالياً أداء الطالب المربوط بحسابك: <span className="font-black text-[#00B4D8] dark:text-[#D4AF37]">{linkedStudent.name}</span>. تم تحديث الدرجات والمحاولات تلقائياً.
                              </p>
                            </div>

                            {/* Submissions List */}
                            <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                              <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-gray-400" />
                                سجل اختبارات الطالب ودرجاته
                              </h3>

                              <div className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50">
                                {submissionsList.map(sub => {
                                  const quiz = quizzesList.find(q => q.id === sub.quizId);
                                  return (
                                    <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                          sub.score >= 50 ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                        }`}>
                                          <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{quiz?.title || 'اختبار تفاعلي للدرس'}</h4>
                                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                            تم الحل: {new Date(sub.submittedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 self-start sm:self-auto">
                                        <span className={`text-base font-black ${sub.score >= 50 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                                          {sub.score}%
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                          sub.score >= 50 ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                        }`}>
                                          {sub.score >= 50 ? 'اجتاز الاختبار' : 'بحاجة لإعادة'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {submissionsList.length === 0 && (
                                  <div className="text-center py-12 text-gray-400">
                                    <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="font-bold text-sm">لم يقم الطالب بأداء أي اختبارات تفاعلية حتى الآن 👍</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Student Quiz Review & Mistake Correction Modal */}
                <AnimatePresence>
                  {selectedQuizReview && selectedSubmissionReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                          setSelectedQuizReview(null);
                          setSelectedSubmissionReview(null);
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right"
                        dir="rtl"
                      >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1A1A24]/80 backdrop-blur-xl z-10">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">تقرير أداء وتصحيح الأخطاء</h3>
                            <p className="text-xs text-gray-400 font-bold mt-1">{selectedQuizReview.title}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedQuizReview(null);
                              setSelectedSubmissionReview(null);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D3D] text-gray-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                          {/* Top Card Summary */}
                          <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-around items-center gap-6">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 font-bold mb-1">النتيجة الإجمالية</p>
                              <div className={`text-4xl font-black ${selectedSubmissionReview.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                {selectedSubmissionReview.score}%
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full mt-2 inline-block ${
                                selectedSubmissionReview.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {selectedSubmissionReview.score >= 50 ? 'اجتياز ممتاز' : 'لم تجتاز الاختبار'}
                              </span>
                            </div>
                            <div className="text-center border-r border-gray-100 dark:border-[#2D2D3D] pr-6 w-full sm:w-auto">
                              <p className="text-xs text-gray-400 font-bold mb-1">الإجابات الصحيحة</p>
                              <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {selectedSubmissionReview.correctAnswers} / {selectedSubmissionReview.totalQuestions}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 font-bold">من إجمالي الأسئلة المتاحة</p>
                            </div>
                          </div>

                          <h4 className="font-black text-base text-gray-900 dark:text-white mb-4">تفاصيل الأسئلة والتصحيح:</h4>
                          <div className="space-y-6">
                            {selectedQuizReview.questions?.map((q: any, idx: number) => {
                              const studentAns = selectedSubmissionReview.answers?.[q.id];
                              const isCorrect = studentAns !== undefined && studentAns === q.correctOptionIndex;
                              return (
                                <div key={q.id} className={`p-5 rounded-2xl border ${
                                  isCorrect 
                                    ? 'bg-green-50/20 dark:bg-green-950/10 border-green-200/40' 
                                    : 'bg-red-50/20 dark:bg-red-950/10 border-red-200/40'
                                } space-y-4`}>
                                  <div className="flex items-start gap-3">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white leading-relaxed">{q.text}</p>
                                  </div>

                                  {/* Options */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 pr-9">
                                    {q.options.map((opt: string, oIdx: number) => {
                                      const isSelectedByStudent = studentAns === oIdx;
                                      const isCorrectOption = q.correctOptionIndex === oIdx;
                                      return (
                                        <div key={oIdx} className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                                          isCorrectOption 
                                            ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' 
                                            : isSelectedByStudent 
                                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                                              : 'bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-transparent text-gray-600 dark:text-gray-400'
                                        }`}>
                                          <span>{opt}</span>
                                          {isCorrectOption && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                                          {!isCorrectOption && isSelectedByStudent && <X className="w-4 h-4 text-red-500 shrink-0" />}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Explanation block */}
                                  {q.explanation && (
                                    <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border-r-4 border-[#00B4D8] dark:border-[#D4AF37] p-3.5 rounded-xl pr-4 mt-2">
                                      <p className="text-xs font-black text-[#0077B6] dark:text-[#D4AF37] mb-1">💡 التفسير والشرح المبسط لتصحيح الخطأ:</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedQuizReview(null);
                              setSelectedSubmissionReview(null);
                            }}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3D3D52] text-gray-700 dark:text-white rounded-xl text-xs font-black transition-colors"
                          >
                            إغلاق التقرير
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Comprehensive Exam Builder for Teachers */}
                <ComprehensiveExamBuilder
                  isOpen={isCreatingExam}
                  onClose={() => {
                    setIsCreatingExam(false);
                    setEditingExamId(null);
                  }}
                  db={db}
                  userData={userData}
                  coursesList={coursesList}
                  editingExamId={editingExamId}
                  existingExamData={editingExamId ? quizzesList.find(q => q.id === editingExamId) : undefined}
                  onSaveSuccess={(examData) => {
                    setQuizzesList(prev => {
                      const filtered = prev.filter(q => q.id !== examData.id);
                      return [examData, ...filtered];
                    });
                    setIsCreatingExam(false);
                    setEditingExamId(null);
                  }}
                />

                {/* Student Exam Taking Interface */}
                {activeTakingExam && (
                  <StudentExamTaking
                    exam={activeTakingExam}
                    isOpen={!!activeTakingExam}
                    onClose={() => setActiveTakingExam(null)}
                    db={db}
                    userData={userData}
                    onSubmissionSuccess={(submissionData) => {
                      setSubmissionsList(prev => {
                        const filtered = prev.filter(s => s.id !== submissionData.id);
                        return [submissionData, ...filtered];
                      });
                      setStarsReloadTrigger(prev => prev + 1);
                      setActiveTakingExam(null);
                    }}
                  />
                )}
              </motion.div>
            )}

            {activeTab === "faq" && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FAQSection />
              </motion.div>
            )}

            {activeTab === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <InteractiveSchedule db={db} userData={userData} coursesList={coursesList} />
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QuickNotes db={db} userData={userData} />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ProfileSection userData={userData} onUpdateUserData={(newData) => setUserData(newData)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      
    </div>
  );
}
