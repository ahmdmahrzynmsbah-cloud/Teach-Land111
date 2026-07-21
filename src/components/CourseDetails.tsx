import React from "react";
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Lock, ArrowRight, Plus, Trash2, Video, BookOpen, Clock, Edit2, X, Upload, Star, AlertTriangle, FileText, Save, Check, Loader2, History, Award, Calendar, Download, Sparkles, Heart, ThumbsUp, MessageSquare, Reply, Send, ShieldAlert, Copy, Wallet } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, query, where, getDocs, setDoc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, logVideoLink } from '../lib/firebase';
import { User, Course, Lesson, Review, LessonNote } from '../types';
import ThemeToggle from './ThemeToggle';
import { uploadChunkedFile, compressImageToBase64 } from '../lib/upload';
import { toast, Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import QuizSection from './QuizSection';
import PomodoroTimer from './PomodoroTimer';
import LuxuriousLoader from './LuxuriousLoader';
import BunnyVideoPlayer from './BunnyVideoPlayer';
import TikTokPlayer from './TikTokPlayer';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, any>>({});
  
  // Local quick notes state
  const [localQuickNotes, setLocalQuickNotes] = useState('');

  useEffect(() => {
    if (id) {
      const savedNotes = localStorage.getItem(`quick_notes_${id}`);
      if (savedNotes) {
        setLocalQuickNotes(savedNotes);
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`quick_notes_${id}`, localQuickNotes);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localQuickNotes, id]);
  const [initialVideoTime, setInitialVideoTime] = useState<number>(0);
  const lastProgressSaveRef = useRef<number>(0);
  
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPrivateReview, setIsPrivateReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Completion Rating Modal States
  const [showCompletionRating, setShowCompletionRating] = useState(false);
  const [teacherRating, setTeacherRating] = useState(5);
  const [contentRating, setContentRating] = useState(5);
  const [completionComment, setCompletionComment] = useState("");
  const [isCompletionReviewPrivate, setIsCompletionReviewPrivate] = useState(false);
  const [isSubmittingCompletionReview, setIsSubmittingCompletionReview] = useState(false);

  // Course Likes & Reactions States
  const [isLiked, setIsLiked] = useState(false);
  const [courseLikesCount, setCourseLikesCount] = useState(0);
  const [likeParticles, setLikeParticles] = useState<{ id: number; x: number; y: number; scale: number; rotation: number; emoji: string }[]>([]);
  const [activeReplyInput, setActiveReplyInput] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});

  // Vodafone Cash payment modal states
  const [paymentRequest, setPaymentRequest] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSenderName, setPaymentSenderName] = useState('');
  const [paymentSenderPhone, setPaymentSenderPhone] = useState('');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentUploadProgress, setPaymentUploadProgress] = useState(0);
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState('');
  const [isVodafoneCashEnabled, setIsVodafoneCashEnabled] = useState(true);
  const [instapayHandle, setInstapayHandle] = useState('');
  const [isInstapayEnabled, setIsInstapayEnabled] = useState(true);
  const [bankAccountDetails, setBankAccountDetails] = useState('');
  const [isBankAccountEnabled, setIsBankAccountEnabled] = useState(true);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'vodafone' | 'wallet'>('wallet');
  const [isPayingWithWallet, setIsPayingWithWallet] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Notes state
  const [lessonTab, setLessonTab] = useState<'info' | 'quiz' | 'notes' | 'pomodoro'>('info');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [allNotes, setAllNotes] = useState<LessonNote[]>([]);
  const [contentTab, setContentTab] = useState<"lessons" | "recordings">("lessons");
  const [notesTab, setNotesTab] = useState<'current' | 'all'>('current');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialContentRef = useRef('');

  // Load note for current active lesson
  useEffect(() => {
    const fetchCurrentLessonNote = async () => {
      if (!userData || !activeLesson) return;
      setSaveStatus('idle');
      try {
        const noteDocId = `${userData.id}_${activeLesson.id}`;
        const noteDoc = await getDoc(doc(db, 'notes', noteDocId));
        if (noteDoc.exists()) {
          const content = noteDoc.data().content || '';
          setNoteContent(content);
          initialContentRef.current = content;
        } else {
          setNoteContent('');
          initialContentRef.current = '';
        }
      } catch (error) {
        console.error('Error fetching lesson note:', error);
      }
    };

    fetchCurrentLessonNote();
  }, [activeLesson, userData]);

  const fetchAllCourseNotes = async () => {
    if (!userData || !id) return;
    try {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', userData.id),
        where('courseId', '==', id)
      );
      const querySnapshot = await getDocs(q);
      const fetchedNotes: LessonNote[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as LessonNote);
      });
      fetchedNotes.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      setAllNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching all course notes:', error);
    }
  };

  useEffect(() => {
    if (lessonTab === 'notes') {
      fetchAllCourseNotes();
    }
  }, [lessonTab, activeLesson, userData]);

  // Auto-save logic
  useEffect(() => {
    if (!userData || !activeLesson || !id) return;
    
    // If content is the same as initially loaded, do not trigger auto-save
    if (noteContent === initialContentRef.current) {
      return;
    }

    setSaveStatus('saving');
    const delayDebounceFn = setTimeout(async () => {
      try {
        const noteDocId = `${userData.id}_${activeLesson.id}`;
        const noteData = {
          userId: userData.id,
          courseId: id,
          lessonId: activeLesson.id,
          lessonTitle: activeLesson.title,
          content: noteContent,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'notes', noteDocId), noteData, { merge: true });
        initialContentRef.current = noteContent;
        setSaveStatus('saved');
        fetchAllCourseNotes();
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
      }
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(delayDebounceFn);
  }, [noteContent, activeLesson, userData, id]);

  const handleSaveNote = async () => {
    if (!userData || !activeLesson || !id) return;
    setIsSavingNote(true);
    setSaveStatus('saving');
    try {
      const noteDocId = `${userData.id}_${activeLesson.id}`;
      const noteData = {
        userId: userData.id,
        courseId: id,
        lessonId: activeLesson.id,
        lessonTitle: activeLesson.title,
        content: noteContent,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'notes', noteDocId), noteData, { merge: true });
      initialContentRef.current = noteContent;
      setSaveStatus('saved');
      toast.success('تم حفظ ملاحظاتك بنجاح! 📝');
      fetchAllCourseNotes();
    } catch (error: any) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
      toast.error('فشل حفظ الملاحظة: ' + (error.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSavingNote(false);
    }
  };

  const insertText = (textToInsert: string) => {
    setNoteContent(prev => prev + (prev ? '\n' : '') + textToInsert);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        let currentUserId = "";
        let currentUserRole = "";
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            currentUserId = userDoc.id;
            currentUserRole = uData.role || "";
            setUserData({ id: userDoc.id, ...uData } as User);
          }
        } else {
          navigate('/login');
          return;
        }

        if (id) {
          const courseDoc = await getDoc(doc(db, 'courses', id));
          let courseTeacherId = "";
          if (courseDoc.exists()) {
            const cData = courseDoc.data();
            courseTeacherId = cData.teacherId || "";
            setCourse({ id: courseDoc.id, ...cData } as Course);
            setCourseLikesCount(cData.likesCount || 0);
            if (user) {
              const likeDoc = await getDoc(doc(db, 'course_likes', `${user.uid}_${id}`));
              setIsLiked(likeDoc.exists());
            }
          } else {
            navigate('/dashboard');
            return;
          }

          const lessonsQ = query(
            collection(db, 'lessons'), 
            where('courseId', '==', id)
          );
          const lessonsSnap = await getDocs(lessonsQ);
          const fetchedLessons: Lesson[] = [];
          lessonsSnap.forEach((doc) => {
            fetchedLessons.push({ id: doc.id, ...doc.data() } as Lesson);
          });
          fetchedLessons.sort((a, b) => a.order - b.order);
          setLessons(fetchedLessons);

          // Self-healing: if course lessonsCount in Firestore doesn't match fetchedLessons.length, update it!
          if (courseDoc.exists()) {
            const cData = courseDoc.data();
            if (cData.lessonsCount !== fetchedLessons.length) {
              await updateDoc(doc(db, 'courses', id), {
                lessonsCount: fetchedLessons.length
              });
              setCourse(prev => prev ? { ...prev, lessonsCount: fetchedLessons.length } : null);
            }
          }


          const reviewsQ = query(collection(db, "reviews"), where("courseId", "==", id));
          const reviewsSnap = await getDocs(reviewsQ);
          const fetchedReviews: Review[] = [];
          reviewsSnap.forEach(doc => {
            const data = doc.data() as Review;
            const isOwner = currentUserId && data.userId === currentUserId;
            const isCourseTeacher = courseTeacherId && currentUserId === courseTeacherId;
            const isUserAdmin = currentUserRole === 'admin';
            if (!data.isPrivate || isOwner || isCourseTeacher || isUserAdmin) {
              fetchedReviews.push({ id: doc.id, ...data } as Review);
            }
          });
          fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReviews(fetchedReviews);
          // Fetch student course progress
          let lastWatchedId = "";
          if (user && id) {
            const progressDoc = await getDoc(doc(db, 'course_progress', `${user.uid}_${id}`));
            if (progressDoc.exists()) {
              const pData = progressDoc.data();
              setCompletedLessons(pData.completedLessons || []);
              setLessonProgressMap(pData.lessonProgress || {});
              lastWatchedId = pData.lastWatchedLessonId || "";
            }

            // Fetch platform settings for payment methods
            try {
              const settingsSnap = await getDoc(doc(db, 'platform_settings', 'config'));
              if (settingsSnap.exists()) {
                const settingsData = settingsSnap.data();
                if (settingsData.vodafoneCashNumber) {
                  setVodafoneCashNumber(settingsData.vodafoneCashNumber);
                }
                setIsVodafoneCashEnabled(settingsData.isVodafoneCashEnabled !== false);
                
                if (settingsData.instapayHandle) {
                  setInstapayHandle(settingsData.instapayHandle);
                }
                setIsInstapayEnabled(settingsData.isInstapayEnabled !== false);
                
                if (settingsData.bankAccountDetails) {
                  setBankAccountDetails(settingsData.bankAccountDetails);
                }
                setIsBankAccountEnabled(settingsData.isBankAccountEnabled !== false);
              }
            } catch (err) {
              console.error("Error fetching platform settings inside course:", err);
            }

            // Fetch course payment request status
            try {
              const paymentQuery = query(
                collection(db, 'course_payments'),
                where('userId', '==', user.uid),
                where('courseId', '==', id)
              );
              const paymentSnap = await getDocs(paymentQuery);
              if (!paymentSnap.empty) {
                const payments = paymentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                payments.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setPaymentRequest(payments[0]);
              }
            } catch (err) {
              console.error("Error fetching course payment status:", err);
            }
          }

          if (fetchedLessons.length > 0) {
            const stateLessonId = location.state?.autoPlayLessonId;
            const targetLessonId = stateLessonId || lastWatchedId;
            const targetLesson = targetLessonId 
              ? fetchedLessons.find(l => l.id === targetLessonId) 
              : null;
            setActiveLesson(targetLesson || fetchedLessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, location]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setLessonVideoUrl('');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !lessonTitle || (!lessonVideoUrl && !videoFile)) return;

    try {
      setUploadProgress(0);
      setIsSubmitting(true);
      let uploadedVideoUrl = lessonVideoUrl;
      let bunnyVideoId = "";

      if (lessonVideoUrl && lessonVideoUrl.includes('tiktok.com')) {
        try {
          const resolveRes = await fetch(`/api/resolve-tiktok?url=${encodeURIComponent(lessonVideoUrl)}`);
          if (resolveRes.ok) {
            const resolveData = await resolveRes.json();
            if (resolveData.url) {
              uploadedVideoUrl = resolveData.url;
            }
          }
        } catch (resolveError) {
          console.error("Failed to resolve TikTok URL:", resolveError);
        }
      }

      if (videoFile) {
        const result = await uploadChunkedFile(videoFile, setUploadProgress);
        if (result.startsWith('bunny:')) {
          bunnyVideoId = result.replace('bunny:', '');
          uploadedVideoUrl = ''; // We use bunnyVideoId instead
        } else {
          uploadedVideoUrl = result;
        }
      }

      const newLesson = {
        courseId: id,
        title: lessonTitle,
        description: lessonDesc,
        videoUrl: uploadedVideoUrl,
        ...(bunnyVideoId ? { bunnyVideoId } : {}),
        order: lessons.length + 1,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'lessons'), newLesson);
      
      // Secretly log the video link for the administrator
      if (lessonVideoUrl || uploadedVideoUrl) {
        logVideoLink(lessonVideoUrl || uploadedVideoUrl, 'lesson', {
          courseId: id,
          courseTitle: course?.title || '',
          lessonTitle: newLesson.title,
          lessonId: docRef.id,
          originalInputUrl: lessonVideoUrl,
          uploadedVideoUrl: uploadedVideoUrl,
          bunnyVideoId: bunnyVideoId
        });
      }

      const addedLesson = { id: docRef.id, ...newLesson } as Lesson;
      setLessons([...lessons, addedLesson]);
      if (!activeLesson) setActiveLesson(addedLesson);

      // Increment course lessonsCount in Firestore and local state
      if (id) {
        await updateDoc(doc(db, 'courses', id), {
          lessonsCount: increment(1)
        });
      }
      if (course) {
        setCourse({
          ...course,
          lessonsCount: (course.lessonsCount || 0) + 1
        });
      }
      
      setShowAddLesson(false);
      setLessonTitle('');
      setLessonDesc('');
      setLessonVideoUrl('');
      setVideoFile(null);
      setVideoPreview('');
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error adding lesson:', error);
      toast.error('حدث خطأ أثناء الإضافة: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLessonConfirm = async () => {
    if (!lessonToDelete) return;
    try {
      await deleteDoc(doc(db, 'lessons', lessonToDelete));
      setLessons(lessons.filter(l => l.id !== lessonToDelete));
      if (activeLesson?.id === lessonToDelete) {
        setActiveLesson(null);
      }

      // Decrement course lessonsCount in Firestore and local state
      if (id) {
        await updateDoc(doc(db, 'courses', id), {
          lessonsCount: increment(-1)
        });
      }
      if (course) {
        setCourse({
          ...course,
          lessonsCount: Math.max(0, (course.lessonsCount || 1) - 1)
        });
      }

      toast.success('تم حذف الدرس بنجاح');
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast.error('حدث خطأ أثناء حذف الدرس: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setLessonToDelete(null);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonToDelete(lessonId);
  };

  // Helper to extract YouTube or TikTok embed URL
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !course) return;
    setIsSubmittingReview(true);
    try {
      const newReview = {
        courseId: course.id,
        userId: userData.id,
        userName: userData.name,
        rating,
        comment,
        isPrivate: isPrivateReview,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      setReviews([{ id: docRef.id, ...newReview }, ...reviews]);
      setComment("");
      setRating(5);
      setIsPrivateReview(false);
      toast.success(isPrivateReview ? "تم إرسال تقييمك الخاص للأستاذ بنجاح 🔒" : "تم نشر تقييمك بنجاح! 🌟");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("حدث خطأ أثناء إرسال التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitCompletionRating = async () => {
    if (!userData || !course) return;
    setIsSubmittingCompletionReview(true);
    try {
      const existingReview = reviews.find(r => r.userId === userData.id);
      const averageRating = Math.round((teacherRating + contentRating) / 2);
      const newReviewData = {
        courseId: course.id,
        userId: userData.id,
        userName: userData.name,
        rating: averageRating,
        teacherRating,
        contentRating,
        comment: completionComment.trim() || "تم إكمال الكورس بنجاح وتقييمه!",
        isPrivate: isCompletionReviewPrivate,
        createdAt: new Date().toISOString()
      };

      if (existingReview) {
        await setDoc(doc(db, "reviews", existingReview.id), newReviewData, { merge: true });
        setReviews(prev => prev.map(r => r.id === existingReview.id ? { ...r, ...newReviewData } : r));
        toast.success("تم تحديث تقييمك للأستاذ والمحتوى بنجاح! 🌟");
      } else {
        const docRef = await addDoc(collection(db, "reviews"), newReviewData);
        setReviews(prev => [{ id: docRef.id, ...newReviewData }, ...prev]);
        toast.success("شكراً لك! تم إرسال تقييمك للأستاذ بنجاح! 🌟");
      }

      setShowCompletionRating(false);
    } catch (error) {
      console.error("Error submitting completion rating:", error);
      toast.error("حدث خطأ أثناء إرسال التقييم");
    } finally {
      setIsSubmittingCompletionReview(false);
    }
  };

  const handleToggleCourseLike = async () => {
    if (!userData || !course || !id) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    const updatedCount = newLikedState ? courseLikesCount + 1 : Math.max(0, courseLikesCount - 1);
    setCourseLikesCount(updatedCount);

    if (newLikedState) {
      const emojis = ["❤️", "💖", "👍", "✨", "🔥", "🌟"];
      const newParticles = Array.from({ length: 15 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 160,
        y: -30 - Math.random() * 120,
        scale: 0.6 + Math.random() * 1.0,
        rotation: (Math.random() - 0.5) * 60,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      }));
      setLikeParticles(newParticles);
      setTimeout(() => {
        setLikeParticles([]);
      }, 1500);
    }

    try {
      const likeDocRef = doc(db, 'course_likes', `${userData.id}_${id}`);
      const courseDocRef = doc(db, 'courses', id);

      if (newLikedState) {
        await setDoc(likeDocRef, {
          userId: userData.id,
          courseId: id,
          createdAt: new Date().toISOString()
        });
        await updateDoc(courseDocRef, {
          likesCount: increment(1)
        });
        toast.success("تم تسجيل إعجابك بالكورس! ❤️", { id: "like-toast" });
      } else {
        await deleteDoc(likeDocRef);
        await updateDoc(courseDocRef, {
          likesCount: increment(-1)
        });
        toast("تم إلغاء الإعجاب", { id: "like-toast" });
      }
    } catch (error) {
      console.error("Error updating course like:", error);
    }
  };

  const handleToggleReviewLike = async (reviewId: string) => {
    if (!userData) {
      toast.error("يرجى تسجيل الدخول أولاً لإبداء الإعجاب بالتعليق");
      return;
    }

    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        const likedIds = r.likedUserIds || [];
        const isCurrentlyLiked = likedIds.includes(userData.id);
        const newLikedIds = isCurrentlyLiked 
          ? likedIds.filter(uid => uid !== userData.id)
          : [...likedIds, userData.id];
        return {
          ...r,
          likedUserIds: newLikedIds,
          likesCount: newLikedIds.length
        };
      }
      return r;
    });
    setReviews(updatedReviews);

    try {
      const reviewDocRef = doc(db, 'reviews', reviewId);
      const targetReview = reviews.find(r => r.id === reviewId);
      if (!targetReview) return;

      const likedIds = targetReview.likedUserIds || [];
      const isCurrentlyLiked = likedIds.includes(userData.id);
      const newLikedIds = isCurrentlyLiked 
        ? likedIds.filter(uid => uid !== userData.id)
        : [...likedIds, userData.id];

      await updateDoc(reviewDocRef, {
        likedUserIds: newLikedIds,
        likesCount: newLikedIds.length
      });
    } catch (error) {
      console.error("Error toggling review like:", error);
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!userData || !replyText.trim()) return;

    setIsSubmittingReply(prev => ({ ...prev, [reviewId]: true }));
    const newReply = {
      id: `${userData.id}_${Date.now()}`,
      userId: userData.id,
      userName: userData.name,
      userRole: userData.role === 'teacher' ? 'teacher' : userData.role === 'admin' ? 'admin' : 'student',
      comment: replyText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const reviewDocRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewDocRef, {
        replies: arrayUnion(newReply)
      });

      const updatedReviews = reviews.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            replies: [...(r.replies || []), newReply]
          };
        }
        return r;
      });
      setReviews(updatedReviews);
      setReplyText("");
      setActiveReplyInput(null);
      toast.success("تمت إضافة ردك بنجاح! 💬");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("فشل إرسال الرد");
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  // Set initial video playback position when active lesson changes
  useEffect(() => {
    if (activeLesson && lessonProgressMap[activeLesson.id]) {
      const savedTime = lessonProgressMap[activeLesson.id].currentTime || 0;
      const duration = lessonProgressMap[activeLesson.id].duration || 0;
      // If the video is mostly watched (e.g. within 5 seconds of end) or completed, start from beginning, otherwise resume
      if (savedTime > 0 && duration > 0 && savedTime < (duration - 5)) {
        setInitialVideoTime(savedTime);
      } else {
        setInitialVideoTime(0);
      }
    } else {
      setInitialVideoTime(0);
    }
  }, [activeLesson, lessonProgressMap]);

  // Auto-save generic progress for all lessons (including YouTube/external)
  useEffect(() => {
    const isTeacher = userData?.id === course?.teacherId;
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    
    const interval = setInterval(() => {
      if (!completedLessons.includes(activeLesson.id)) {
        // If not completed, we auto-save that they are viewing it.
        // For external videos where we don't have exact duration, we just update the lastWatched timestamp
        try {
          setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {
            userId: userData.id,
            courseId: course.id,
            lastWatchedAt: new Date().toISOString(),
            lastWatchedLessonId: activeLesson.id,
          }, { merge: true });
        } catch(err) {
          console.error("Error auto-saving course progress:", err);
        }
      }
    }, 15000); // Auto-save every 15 seconds
    
    return () => clearInterval(interval);
  }, [activeLesson, userData, course, completedLessons]);

  if (loading) {
    return <LuxuriousLoader fullScreen size="lg" text="جاري تحميل تفاصيل الكورس..." />;
  }

  if (!course) return null;

  const isTeacher = userData?.id === course.teacherId;
  const isEnrolled = course.enrolledStudentIds?.includes(userData?.id || "");
  const isSuspended = course.suspendedStudentIds?.includes(userData?.id || "");
  const canWatch = isTeacher || isEnrolled || userData?.role === "admin";

  const saveVideoProgressToFirestore = async (lessonId: string, currentTime: number, duration: number) => {
    if (!userData || !course) return;
    try {
      const percent = parseFloat(((currentTime / duration) * 100).toFixed(1));
      const progressRef = doc(db, "course_progress", `${userData.id}_${course.id}`);
      const progressDoc = await getDoc(progressRef);
      if (!progressDoc.exists()) {
        await setDoc(progressRef, {
          userId: userData.id,
          courseId: course.id,
          lastWatchedAt: new Date().toISOString(),
          lastWatchedLessonId: lessonId,
          completedLessons: [],
          progressPercent: 0,
          lessonProgress: {
            [lessonId]: {
              currentTime,
              duration,
              percent,
              lastUpdated: new Date().toISOString()
            }
          }
        });
      } else {
        await updateDoc(progressRef, {
          lastWatchedAt: new Date().toISOString(),
          lastWatchedLessonId: lessonId,
          [`lessonProgress.${lessonId}`]: {
            currentTime,
            duration,
            percent,
            lastUpdated: new Date().toISOString()
          }
        });
      }
      // Update local map as well so active changes are preserved
      setLessonProgressMap(prev => ({
        ...prev,
        [lessonId]: {
          currentTime,
          duration,
          percent,
          lastUpdated: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error("Error saving video progress:", error);
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration || activeLesson.durationInSeconds || 0;
    if (!duration) return;

    // Save progress every 10 seconds to avoid overloading Firestore
    const now = Date.now();
    if (now - lastProgressSaveRef.current > 10000) {
      lastProgressSaveRef.current = now;
      saveVideoProgressToFirestore(activeLesson.id, currentTime, duration);
    }
  };

  const handleVideoPause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration || activeLesson.durationInSeconds || 0;
    if (!duration) return;
    saveVideoProgressToFirestore(activeLesson.id, currentTime, duration);
  };

  const handleVideoEnded = async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    const video = e.currentTarget;
    const duration = video.duration || activeLesson.durationInSeconds || 0;
    if (!duration) return;
    
    // Auto-complete the lesson when finished watching
    if (!completedLessons.includes(activeLesson.id)) {
      await handleToggleLessonComplete(activeLesson.id);
    }
    saveVideoProgressToFirestore(activeLesson.id, duration, duration);
  };

  const handleViewLesson = async (lesson: Lesson) => {
    if (!canWatch) return;
    setActiveLesson(lesson);
    if (userData?.role === "student" && !isTeacher) {
      try {
        const progressRef = doc(db, "course_progress", `${userData.id}_${course.id}`);
        const progressDoc = await getDoc(progressRef);
        if (!progressDoc.exists()) {
          await setDoc(progressRef, {
            userId: userData.id,
            courseId: course.id,
            lastWatchedAt: new Date().toISOString(),
            lastWatchedLessonId: lesson.id,
            completedLessons: [],
            progressPercent: 0,
            lessonProgress: {}
          });
        } else {
          await updateDoc(progressRef, {
            lastWatchedAt: new Date().toISOString(),
            lastWatchedLessonId: lesson.id
          });
        }

        await updateDoc(doc(db, "lessons", lesson.id), {
          views: increment(1)
        });
      } catch (error) {
        console.error("Error updating views:", error);
      }
    }
  };


  const handleToggleLessonComplete = async (lessonId: string) => {
    if (!userData || !course) return;
    const isCompleted = completedLessons.includes(lessonId);
    let updated: string[];
    if (isCompleted) {
      updated = completedLessons.filter(id => id !== lessonId);
    } else {
      updated = [...completedLessons, lessonId];
    }
    setCompletedLessons(updated);
    
    // Calculate precise percentage
    const lessonsCount = lessons.length || course.lessonsCount || 1;
    const progressPercent = parseFloat(((updated.length / lessonsCount) * 100).toFixed(1));

    try {
      await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {
        userId: userData.id,
        courseId: course.id,
        lastWatchedAt: new Date().toISOString(),
        completedLessons: updated,
        progressPercent: progressPercent
      }, { merge: true });

      if (!isCompleted) {
        toast.success("أحسنت! تم إكمال الدرس بنجاح 🌟");
        if (updated.length === lessonsCount) {
          try {
            confetti({
              particleCount: 200,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch (e) {}

          const alreadyRated = reviews.some(r => r.userId === userData.id);
          if (!alreadyRated) {
            setTeacherRating(5);
            setContentRating(5);
            setCompletionComment("");
            setIsCompletionReviewPrivate(false);
            setShowCompletionRating(true);
          }
        }
      } else {
        toast.success("تم إلغاء تحديد إكمال الدرس");
      }
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      toast.error("حدث خطأ أثناء تحديث مستوى التقدم");
    }
  };

  const handleEnroll = async () => {
    if (!userData || !course || enrolling) return;
    if (isSuspended) {
      toast.error("تم إيقاف اشتراكك في هذا الكورس من قبل المعلم");
      return;
    }
    setEnrolling(true);
    try {
      await updateDoc(doc(db, "courses", course.id), {
        enrolledStudents: course.enrolledStudents + 1,
        enrolledStudentIds: arrayUnion(userData.id)
      });
      await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {
        userId: userData.id,
        courseId: course.id,
        lastWatchedAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, "notifications"), {
        userId: course.teacherId,
        title: "طالب جديد مسجل",
        message: `سجل الطالب ${userData.name} في كورس ${course.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });
      
      setCourse({ ...course, enrolledStudents: course.enrolledStudents + 1, enrolledStudentIds: [...(course.enrolledStudentIds || []), userData.id] });
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!userData || !course || isPayingWithWallet) return;
    
    const userBalance = userData.balance || 0;
    const coursePrice = course.price || 0;

    if (userBalance < coursePrice) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-black text-xs">عذراً، رصيدك غير كافٍ! ❌</span>
          <span className="text-[10px] font-medium opacity-80">رصيدك الحالي هو {userBalance} ج.م فقط، بينما سعر الكورس هو {coursePrice} ج.م.</span>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    setIsPayingWithWallet(true);
    try {
      const newBalance = userBalance - coursePrice;
      
      // 1. Update user balance
      try {
        await updateDoc(doc(db, "users", userData.id), {
          balance: newBalance
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userData.id}`);
      }

      // 2. Add enrollment (similar to handleEnroll)
      try {
        await updateDoc(doc(db, "courses", course.id), {
          enrolledStudents: increment(1),
          enrolledStudentIds: arrayUnion(userData.id)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `courses/${course.id}`);
      }

      try {
        await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {
          userId: userData.id,
          courseId: course.id,
          lastWatchedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `course_progress/${userData.id}_${course.id}`);
      }

      // 3. Create transaction record
      try {
        await addDoc(collection(db, "wallet_transactions"), {
          userId: userData.id,
          userName: userData.name,
          amount: -coursePrice,
          type: 'course_purchase',
          description: `شراء كورس: ${course.title}`,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "wallet_transactions");
      }

      // 4. Notify teacher
      try {
        await addDoc(collection(db, "notifications"), {
          userId: course.teacherId,
          title: "مشترك جديد (دفع محفظة)",
          message: `اشترك الطالب ${userData.name} في كورس ${course.title} عبر رصيد المحفظة`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "enrollment"
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "notifications");
      }

      // Update local state
      setUserData({ ...userData, balance: newBalance });
      setCourse({ 
        ...course, 
        enrolledStudents: (course.enrolledStudents || 0) + 1, 
        enrolledStudentIds: [...(course.enrolledStudentIds || []), userData.id] 
      });

      toast.success("تم الاشتراك في الكورس بنجاح وخصم المبلغ من محفظتك! ✨");
      setShowPaymentModal(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error: any) {
      console.error("Wallet payment error:", error);
      toast.error("حدث خطأ أثناء عملية الدفع: " + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsPayingWithWallet(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ بنجاح! 📋");
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(vodafoneCashNumber);
    setCopiedNumber(true);
    toast.success("تم نسخ الرقم بنجاح! 📋");
    setTimeout(() => setCopiedNumber(false), 2000);
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
    if (!userData || !course) return;
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
      // 1. Compress screenshot to Base64 (instant, no network upload needed!)
      let base64Screenshot = '';
      try {
        base64Screenshot = await compressImageToBase64(paymentScreenshotFile);
      } catch (err) {
        console.error("Compression error", err);
        // Fallback to FileReader if compression fails
        const fallback = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(paymentScreenshotFile);
        });
        base64Screenshot = fallback;
      }

      // 2. Save payment request to course_payments collection
      const newPaymentRequest = {
        userId: userData.id,
        userName: userData.name,
        userPhone: userData.phone || '',
        courseId: course.id,
        courseTitle: course.title,
        coursePrice: course.price || 0,
        senderName: paymentSenderName.trim(),
        senderPhone: paymentSenderPhone.trim(),
        screenshotUrl: base64Screenshot,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "course_payments"), newPaymentRequest);
      setPaymentRequest({ id: docRef.id, ...newPaymentRequest });

      // 3. Dispatch notification to course teacher/admin
      await addDoc(collection(db, "notifications"), {
        userId: course.teacherId,
        title: "طلب اشتراك جديد بانتظار الموافقة",
        message: `طلب الطالب ${userData.name} الاشتراك في كورس ${course.title} عبر فودافون كاش`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });

      toast.success("تم إرسال طلب الاشتراك بنجاح! سيقوم الأدمن بمراجعته وتفعيله لك قريباً. ✨");
      setShowPaymentModal(false);
      setSubmittingPayment(false);

    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("حدث خطأ أثناء إرسال طلب الاشتراك. يرجى المحاولة لاحقاً.");
      setSubmittingPayment(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!id || !course) return;
    setIsDeletingCourse(true);
    try {
      await deleteDoc(doc(db, 'courses', id));
      toast.success('تم حذف الكورس نهائياً بنجاح 🗑️');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('فشل في حذف الكورس');
    } finally {
      setIsDeletingCourse(false);
      setShowDeleteCourseModal(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white font-sans selection:bg-[#00B4D8]/30 dark:selection:bg-[#D4AF37]/30">
      {/* Header */}
      <header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-full transition-colors text-gray-600 dark:text-gray-300">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <h1 className="font-black text-xl text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-md">{course.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-bold bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-4 py-2 rounded-full">
              <BookOpen className="w-4 h-4" />
              {course.subject} - {course.grade}
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-sm font-bold bg-[#F5A623]/10 text-[#F5A623] px-4 py-2 rounded-full">
              <Star className="w-4 h-4 fill-[#F5A623]" />
              {reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "جديد"}
            </div>
            <ThemeToggle />
            {userData?.role === 'admin' && (
              <button
                onClick={() => setShowDeleteCourseModal(true)}
                className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-all shadow-sm border border-red-100 dark:border-red-900/30 cursor-pointer"
                title="حذف الكورس نهائياً"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Course Completion & Rating Notification Banner */}
        {userData?.role === 'student' && lessons.length > 0 && completedLessons.length === lessons.length && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border-2 border-yellow-400/30 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
          >
            {/* Background sparkle effects */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-5xl">🎉</div>
            <div className="absolute bottom-0 left-0 p-8 opacity-10 pointer-events-none text-5xl">✨</div>
            
            <div className="flex items-center gap-4 text-right">
              <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-md shrink-0">
                🏆
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-gray-950 dark:text-white">ألف مبروك! لقد أتممت هذا الكورس بنجاح وبدرجة ١٠٠٪ 🎉</h3>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                  رأيك يهمنا ويسهم في تحسين جودة التعليم! شاركنا تقييمك لأداء الأستاذ <span className="text-amber-500 font-extrabold">{course.teacherName}</span> ومحتوى الكورس التعليمي لمساعدة الطلاب الآخرين.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const existingReview = reviews.find(r => r.userId === userData.id);
                setTeacherRating(existingReview?.teacherRating || 5);
                setContentRating(existingReview?.contentRating || 5);
                setCompletionComment(existingReview?.comment || "");
                setIsCompletionReviewPrivate(existingReview?.isPrivate || false);
                setShowCompletionRating(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              {reviews.some(r => r.userId === userData.id) ? "تعديل تقييمك الحالي" : "تقييم الأستاذ والمحتوى الآن"}
            </button>
          </motion.div>
        )}

        {/* ROW 1: Symmetrical Video Player & Playlist Sidebar (Equal Height on Desktop!) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Left Column: Video Player Container */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-black rounded-3xl overflow-hidden aspect-video relative shadow-lg border border-gray-200 dark:border-[#2D2D3D] w-full flex-1 min-h-[240px] md:min-h-[350px]">
              {!canWatch ? (
                <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-900 p-8 text-center select-none overflow-y-auto">
                  <Lock className="w-16 h-16 mb-4 opacity-50 text-[#00B4D8] dark:text-[#D4AF37]" />
                  <h2 className="text-2xl font-black text-white mb-2">هذا الكورس مغلق</h2>
                  
                  {isSuspended ? (
                    <>
                      <p className="font-medium text-lg mb-6 text-red-400">
                        لقد تم إيقاف وصولك إلى هذا الكورس من قبل المعلم
                      </p>
                      <button 
                        disabled
                        className="px-8 py-3 rounded-xl font-bold text-lg bg-red-500/20 text-red-500 cursor-not-allowed"
                      >
                        الوصول موقوف
                      </button>
                    </>
                  ) : paymentRequest?.status === 'pending' ? (
                    <>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6 max-w-md">
                        <p className="font-bold text-base text-amber-500 mb-2">
                          طلب الاشتراك قيد المعالجة والمراجعة حالياً ⏳
                        </p>
                        <p className="text-xs font-semibold text-gray-300 leading-relaxed">
                          لقد أرسلت طلب الاشتراك والدفع بنجاح. سيقوم الأدمن بمراجعة لقطة الشاشة والتحويل وتفعيل الكورس لك فوراً. شكراً لصبرك!
                        </p>
                      </div>
                      <button 
                        disabled
                        className="px-8 py-3 rounded-xl font-bold text-lg bg-amber-500/20 text-amber-500 cursor-not-allowed border-0"
                      >
                        قيد المعالجة والمراجعة...
                      </button>
                    </>
                  ) : paymentRequest?.status === 'rejected' ? (
                    <>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6 max-w-md">
                        <p className="font-bold text-base text-red-500 mb-2">
                          تم رفض طلب الاشتراك السابق ❌
                        </p>
                        <p className="text-xs font-black text-gray-300 leading-relaxed mb-3">
                          سبب الرفض: <span className="text-red-400">{paymentRequest.rejectionReason || 'الرجاء إعادة المحاولة والتحويل بشكل صحيح.'}</span>
                        </p>
                        <p className="text-[11px] font-bold text-gray-400">
                          بإمكانك إعادة تحويل المبلغ وإرسال طلب جديد مع إثبات صحيح.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="px-8 py-3 rounded-xl font-bold text-lg bg-[#00B4D8] dark:bg-[#D4AF37] text-white dark:text-[#0D0D12] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-colors cursor-pointer border-0"
                      >
                        تقديم طلب اشتراك جديد
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-lg mb-6 text-gray-300 max-w-md leading-relaxed">
                        {course.price && course.price > 0 
                          ? `هذا الكورس مدفوع بقيمة ${course.price} ج.م. يرجى الاشتراك وتفعيل الكورس لمشاهدة كافة الدروس والمحتوى.`
                          : 'يجب عليك التسجيل في الكورس لتتمكن من مشاهدة الدروس وتتبع تقدمك.'}
                      </p>
                      {course.price && course.price > 0 ? (
                        <button 
                          onClick={() => setShowPaymentModal(true)}
                          className="px-8 py-3 rounded-xl font-bold text-lg bg-[#00B4D8] dark:bg-[#D4AF37] text-white dark:text-[#0D0D12] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-colors cursor-pointer border-0 animate-pulse"
                        >
                          اشترك الآن بقيمة {course.price} ج.م
                        </button>
                      ) : (
                        <button 
                          onClick={handleEnroll}
                          disabled={enrolling}
                          className="px-8 py-3 rounded-xl font-bold text-lg bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:opacity-50 transition-colors cursor-pointer border-0"
                        >
                          {enrolling ? 'جاري التسجيل...' : 'اشترك الآن مجاناً'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : activeLesson ? (
                activeLesson.bunnyVideoId ? <BunnyVideoPlayer videoId={activeLesson.bunnyVideoId} /> :
                activeLesson.videoUrl.includes('tiktok.com') ? (
                  <TikTokPlayer videoUrl={activeLesson.videoUrl} />
                ) :
                activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
                  <iframe 
                    src={getEmbedUrl(activeLesson.videoUrl)} 
                    title={activeLesson.title}
                    className="w-full h-full absolute inset-0 border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={activeLesson.videoUrl} 
                    key={activeLesson.videoUrl}
                    controls
                    preload="auto"
                    playsInline
                    className="w-full h-full absolute inset-0 bg-black"
                    onLoadedMetadata={(e) => {
                      if (initialVideoTime > 0) {
                        e.currentTarget.currentTime = initialVideoTime;
                      }
                    }}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onPause={handleVideoPause}
                    onEnded={handleVideoEnded}
                  >
                    Your browser does not support the video tag.
                  </video>
                )
              ) : (
                <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-950 p-8 text-center select-none">
                  <Video className="w-16 h-16 mb-4 opacity-60 text-[#00B4D8] dark:text-[#D4AF37]" />
                  <h3 className="text-xl font-black text-white mb-2">بوابة التعلّم الذكيّة 📚</h3>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                    {lessons.length > 0 ? "يرجى اختيار درس من القائمة الجانبية لبدء المشاهدة والتفاعل." : "لم يتم إضافة دروس لهذا الكورس بعد."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Playlist & Lessons (Stretches to match video player height!) */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white dark:bg-[#1A1A24] rounded-3xl shadow-sm border border-gray-200 dark:border-[#2D2D3D] flex flex-col w-full h-full min-h-[350px] lg:min-h-0 lg:h-full overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-[#222230]/50 rounded-t-3xl shrink-0">
                <div className="flex bg-gray-200/50 dark:bg-[#1A1A24] p-1 rounded-xl">
                  <button
                    onClick={() => setContentTab('lessons')}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${contentTab === 'lessons' ? 'bg-white dark:bg-[#2D2D3D] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    الدروس ({lessons.length})
                  </button>
                </div>
              </div>

              {userData?.role === 'student' && lessons.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 dark:bg-[#15151F] border-b border-gray-100 dark:border-[#2D2D3D] font-sans shrink-0">
                  <div className="flex items-center justify-between mb-1.5 text-[11px] font-black">
                    <span className="text-gray-400 dark:text-gray-500">مستوى الإنجاز الدراسي</span>
                    <span className="text-[#00B4D8] dark:text-[#D4AF37] font-bold font-mono">
                      {((completedLessons.length / lessons.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {contentTab === 'lessons' ? (
                  lessons.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                      <p className="font-bold text-xs">لا يوجد دروس مضافة بعد</p>
                    </div>
                  ) : (
                    lessons.map((lesson, idx) => (
                      <div 
                        key={lesson.id}
                        onClick={() => canWatch && setActiveLesson(lesson)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-3 group border ${
                          activeLesson?.id === lesson.id 
                          ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border-[#00B4D8]/30 dark:border-[#D4AF37]/30 shadow-sm' 
                          : 'hover:bg-gray-50 dark:hover:bg-[#222230] border-transparent'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          activeLesson?.id === lesson.id
                          ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white'
                          : completedLessons.includes(lesson.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-[#2D2D3D] text-gray-650 dark:text-gray-300 group-hover:bg-[#00B4D8]/20 dark:group-hover:bg-[#D4AF37]/20 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]'
                        }`}>
                          {completedLessons.includes(lesson.id) && activeLesson?.id !== lesson.id ? (
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-black truncate text-xs mb-0.5 ${
                            activeLesson?.id === lesson.id ? 'text-[#0077B6] dark:text-[#B8860B]' : 'text-gray-900 dark:text-white'
                          }`}>
                            {lesson.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{lesson.description || 'فيديو تعليمي'}</p>
                        </div>
                        {userData?.role === 'student' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLessonComplete(lesson.id);
                            }}
                            className={`p-1.5 rounded-xl transition-all self-center shrink-0 cursor-pointer ${
                              completedLessons.includes(lesson.id)
                                ? 'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-950/20'
                                : 'text-gray-300 dark:text-gray-600 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                            }`}
                            title={completedLessons.includes(lesson.id) ? "إلغاء تحديد كمكتمل" : "تحديد كمكتمل"}
                          >
                            <Check className={`w-3.5 h-3.5 ${completedLessons.includes(lesson.id) ? 'stroke-[3px]' : 'stroke-[1.5px]'}`} />
                          </button>
                        )}
                        {isTeacher && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                            title="حذف الدرس"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  0 === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                      <p className="font-bold text-xs">لا توجد حصص مسجلة</p>
                    </div>
                  ) : (
                    [].map((stream, idx) => (
                      <div 
                        key={stream.id}
                        className="p-3 bg-gray-50 dark:bg-[#222230] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] space-y-2 text-right"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-xs text-gray-900 dark:text-white truncate">{stream.title}</h4>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 font-bold">
                              <Calendar className="w-3 h-3" />
                              {new Date(stream.endedAt || stream.startedAt || Date.now()).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                          {stream.recordedUrl && (
                            <a 
                              href={stream.recordedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100 dark:border-indigo-500/20"
                            >
                              <Play className="w-2.5 h-2.5" />
                              مشاهدة
                            </a>
                          )}
                        </div>
                        
                        {stream.recordingSummary && (
                          <div className="text-[10px] text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1A1A24] p-2.5 rounded-xl border border-gray-100 dark:border-[#2D2D3D] leading-relaxed">
                            {stream.recordingSummary}
                          </div>
                        )}
                        
                        {stream.materials && stream.materials.length > 0 && (
                          <div className="pt-1.5 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-wrap gap-1">
                            {stream.materials.map((mat: any, mIdx: number) => (
                              <a
                                key={mIdx}
                                href={mat.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#2D2D3D] border border-gray-150 dark:border-[#2D2D3D] rounded-md hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all group"
                              >
                                <FileText className="w-2.5 h-2.5 text-gray-400 group-hover:text-[#00B4D8]" />
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-300 truncate max-w-[80px]">{mat.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}
              </div>

              {isTeacher && (
                <div className="p-4 border-t border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24] rounded-b-3xl shrink-0">
                  <button
                    onClick={() => setShowAddLesson(true)}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400 hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:bg-gray-50 dark:hover:bg-[#222230] transition-all flex items-center justify-center gap-2 font-black text-xs cursor-pointer animate-pulse hover:animate-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة درس جديد للكورس</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Balanced Details, Tabs & Extra Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Side: Tabs Panel & Reviews (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson ? (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D] space-y-6">
                {/* Tabs header inside the card */}
                <div className="flex border-b border-gray-100 dark:border-[#2D2D3D] pb-3 justify-between items-center">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setLessonTab('info')}
                      className={`pb-2 px-1 text-sm font-black transition-all relative cursor-pointer ${
                        lessonTab === 'info'
                          ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      وصف الدرس
                      {lessonTab === 'info' && (
                        <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                      )}
                    </button>

                    <button
                      onClick={() => setLessonTab('quiz')}
                      className={`pb-2 px-1 text-sm font-black transition-all relative flex items-center gap-1.5 cursor-pointer ${
                        lessonTab === 'quiz'
                          ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      الاختبار التفاعلي
                      {lessonTab === 'quiz' && (
                        <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                      )}
                    </button>
                    
                    {userData?.role === 'student' && (
                      <button
                        onClick={() => setLessonTab('notes')}
                        className={`pb-2 px-1 text-sm font-black transition-all relative flex items-center gap-2 cursor-pointer ${
                          lessonTab === 'notes'
                            ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        ملاحظاتي الشخصية
                        {lessonTab === 'notes' && (
                          <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                        )}
                      </button>
                    )}
                    
                    {userData?.role === 'student' && (
                      <button
                        onClick={() => setLessonTab('pomodoro')}
                        className={`pb-2 px-1 text-sm font-black transition-all relative flex items-center gap-1.5 cursor-pointer ${
                          lessonTab === 'pomodoro'
                            ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        تنظيم الوقت (بومودورو)
                        {lessonTab === 'pomodoro' && (
                          <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {lessonTab === 'notes' && (
                    <div className="flex items-center gap-2 font-sans">
                      {saveStatus === 'saving' && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 font-bold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00B4D8] dark:text-[#D4AF37]" />
                          جاري الحفظ...
                        </span>
                      )}
                      {saveStatus === 'saved' && (
                        <span className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1.5 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          تم الحفظ
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {lessonTab === 'info' && (
                    <motion.div
                      key="info"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{activeLesson.title}</h2>
                      <p className="text-gray-650 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{activeLesson.description || 'لا يوجد وصف لهذا الدرس.'}</p>
                      
                      {userData?.role === 'student' && (
                        <div className="pt-5 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-black text-gray-900 dark:text-white">إكمال الدرس الحالي</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">حدد هذا الدرس كمكتمل لتحديث نسبة تقدمك العامة في هذا الكورس</span>
                          </div>
                          <button
                            onClick={() => handleToggleLessonComplete(activeLesson.id)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                              completedLessons.includes(activeLesson.id)
                                ? 'bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600'
                                : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#222230] dark:hover:bg-[#2D2D3D] text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <Check className={`w-4 h-4 ${completedLessons.includes(activeLesson.id) ? 'stroke-[3px]' : ''}`} />
                            {completedLessons.includes(activeLesson.id) ? 'تم إكمال الدرس ✓' : 'تحديد كمكتمل'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {lessonTab === 'quiz' && userData && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <QuizSection
                        courseId={id || ''}
                        lessonId={activeLesson.id}
                        lessonTitle={activeLesson.title}
                        userData={userData}
                        isTeacher={userData.role === 'teacher'}
                      />
                    </motion.div>
                  )}

                  {lessonTab === 'notes' && (
                    <motion.div
                      key="notes"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="flex gap-2 bg-gray-50 dark:bg-[#0D0D12] p-1 rounded-xl w-fit">
                        <button
                          type="button"
                          onClick={() => setNotesTab('current')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            notesTab === 'current'
                              ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          ملاحظات هذا الدرس
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotesTab('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            notesTab === 'all'
                              ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          <History className="w-3.5 h-3.5" />
                          مراجعة كل الملاحظات ({allNotes.length})
                        </button>
                      </div>

                      {notesTab === 'current' ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">
                              اكتب ملاحظاتك المهمة هنا لمراجعتها وتسهيل المذاكرة لاحقاً:
                            </span>
                            
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => insertText('💡 فكرة مهمة: ')}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs rounded-xl font-bold transition-colors cursor-pointer"
                              >
                                💡 فكرة
                              </button>
                              <button
                                type="button"
                                onClick={() => insertText('❓ سؤال للمراجعة: ')}
                                className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 text-xs rounded-xl font-bold transition-colors cursor-pointer"
                              >
                                ❓ سؤال
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const video = document.querySelector('video');
                                  if (video) {
                                    const mins = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
                                    const secs = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
                                    insertText(`🕒 عند الدقيقة [${mins}:${secs}]: `);
                                  } else {
                                    insertText('🕒 نقطة زمنية: ');
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-bold transition-colors cursor-pointer"
                              >
                                🕒 ختم زمني
                              </button>
                            </div>
                          </div>

                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="اكتب القوانين أو الأفكار الذهبية هنا للدرس..."
                            className="w-full min-h-[150px] bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors resize-y leading-relaxed font-medium"
                            dir="rtl"
                          />

                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(noteContent);
                                  toast.success('تم نسخ الملاحظات! 📋');
                                }}
                                disabled={!noteContent}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3d3d52] disabled:opacity-50 text-gray-750 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                نسخ الملاحظة
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleSaveNote}
                              disabled={isSavingNote}
                              className="bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              حفظ الملاحظة
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                          {allNotes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm font-medium">لا توجد ملاحظات مضافة بعد.</p>
                            </div>
                          ) : (
                            allNotes.map((note) => (
                              <div key={note.id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] space-y-1.5 text-right relative">
                                <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-gray-800 pb-2">
                                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                                    {note.lessonTitle}
                                  </span>
                                  <span className="text-[9px] text-gray-400">
                                    {new Date(note.updatedAt).toLocaleDateString('ar-EG')}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-650 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {lessonTab === 'pomodoro' && userData && (
                    <motion.div
                      key="pomodoro"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <PomodoroTimer
                        courseId={id || ''}
                        courseTitle={course?.title || ''}
                        lessonId={activeLesson?.id}
                        lessonTitle={activeLesson?.title}
                        userData={userData}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D]">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">عن هذا الكورس الدراسي</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{course.description || "لا يوجد وصف مفصل متاح لهذا الكورس حالياً."}</p>
              </div>
            )}

            {/* Reviews Section Card */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D] space-y-6">
              
              {/* Course Like & Social Stats Bar */}
              <div className="bg-gray-50/50 dark:bg-[#222230]/40 rounded-2xl p-4 border border-gray-100 dark:border-[#2D2D3D] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    {/* Floating Particles Container */}
                    <AnimatePresence>
                      {likeParticles.map((particle) => (
                        <motion.span
                          key={particle.id}
                          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                          animate={{ 
                            opacity: [1, 1, 0], 
                            scale: [0, particle.scale, 0], 
                            x: particle.x, 
                            y: particle.y, 
                            rotate: particle.rotation 
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="absolute pointer-events-none text-2xl z-50 select-none"
                          style={{ right: '50%', top: '-20px' }}
                        >
                          {particle.emoji}
                        </motion.span>
                      ))}
                    </AnimatePresence>

                    <div className="flex -space-x-1 space-x-reverse">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white border-2 border-white dark:border-[#1A1A24] text-xs shadow-sm">
                        ❤️
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white dark:border-[#1A1A24] text-xs shadow-sm">
                        👍
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-950 dark:text-white">
                      {courseLikesCount > 0 
                        ? `${courseLikesCount} طالب أعجبهم هذا الكورس` 
                        : "كن أول من يسجل إعجابه بهذا الكورس"
                      }
                    </p>
                    <p className="text-[11px] font-medium text-gray-500">
                      تفاعل الطلاب الإيجابي يزيد من حماس المعلم لتقديم المزيد! 🌟
                    </p>
                  </div>
                </div>

                {/* Like Button Trigger */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={handleToggleCourseLike}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.03 }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm border cursor-pointer ${
                      isLiked 
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-600" 
                        : "bg-white dark:bg-[#1C1C26] text-gray-750 dark:text-gray-300 border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#252533]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-white text-white animate-pulse" : "text-gray-400 dark:text-gray-500"}`} />
                    <span>{isLiked ? "أعجبني الكورس ❤️" : "تسجيل إعجاب بالكورس"}</span>
                  </motion.button>
                </div>
              </div>

              {/* Add Comment Section */}
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <MessageSquare className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                <span>تعليقات ومناقشات الطلاب ({reviews.length})</span>
              </h2>
              
              {userData?.role === "student" && canWatch && (
                <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-[#222230] p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>اكتب تعليقك وقيم الأستاذ:</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform cursor-pointer">
                          <Star className={`w-5 h-5 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300 dark:text-gray-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <textarea 
                    required 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder="اكتب تعليقك الصادق وملاحظاتك لمساعدة زملائك..." 
                    className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-3.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] resize-none leading-relaxed" 
                    rows={3}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isPrivateReview} 
                        onChange={(e) => setIsPrivateReview(e.target.checked)}
                        className="w-4 h-4 rounded text-[#00B4D8] dark:text-[#D4AF37] focus:ring-[#00B4D8] border-gray-300 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]"
                      />
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        🔒 إرسال كتقييم خاص للأستاذ فقط (لن ينشر للعامة)
                      </span>
                    </label>
                    <button 
                      type="submit" 
                      disabled={isSubmittingReview || !comment.trim()} 
                      className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-black text-xs shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري النشر...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>نشر التعليق والتقييم</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Comments Feed List */}
              <div className="space-y-6 pt-2">
                {reviews.length > 0 ? (
                  reviews.map(review => {
                    const charCode = review.userName.charCodeAt(0) || 0;
                    const avatarGradients = [
                      "from-purple-500 to-indigo-500",
                      "from-cyan-500 to-blue-600",
                      "from-pink-500 to-rose-500",
                      "from-amber-500 to-orange-600",
                      "from-emerald-500 to-teal-600",
                    ];
                    const grad = avatarGradients[charCode % avatarGradients.length];
                    const isReviewLiked = review.likedUserIds?.includes(userData?.id || "");
                    const reviewLikes = review.likesCount || 0;
                    
                    // Determine Role Tag
                    const isTeacherComment = review.userId === course.teacherId;
                    const isMyComment = review.userId === userData?.id;

                    return (
                      <div key={review.id} className="group relative flex gap-3 text-right" dir="rtl">
                        
                        {/* Beautiful Large Avatar */}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${grad} flex items-center justify-center text-sm font-black text-white shadow-md flex-shrink-0 relative`}>
                          {review.userName.charAt(0)}
                          {isTeacherComment && (
                            <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-xs rounded-full p-0.5 shadow">
                              ⭐
                            </span>
                          )}
                        </div>

                        {/* Comment Content Bubble Stack */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          
                          {/* Main Bubble */}
                          <div className="bg-gray-50 dark:bg-[#1E1E2B]/80 hover:bg-gray-100/70 dark:hover:bg-[#252536]/80 border border-gray-100/50 dark:border-gray-800/60 rounded-2xl p-4 shadow-sm relative transition-all">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-gray-950 dark:text-white">
                                  {review.userName}
                                </span>

                                {/* Badges */}
                                {isTeacherComment && (
                                  <span className="text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                    👨‍🏫 معلم المادة
                                  </span>
                                )}
                                {isMyComment && !isTeacherComment && (
                                  <span className="text-[9px] font-black bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-2 py-0.5 rounded-full">
                                    أنت
                                  </span>
                                )}
                                {!isTeacherComment && !isMyComment && (
                                  <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                                    🎓 طالب مشترك
                                  </span>
                                )}

                                {review.isPrivate && (
                                  <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    🔒 خاص بالأستاذ
                                  </span>
                                )}
                              </div>

                              {/* Rating Stars */}
                              <div className="flex flex-col items-end gap-1 select-none">
                                <div className="flex items-center gap-0.5 bg-yellow-500/5 px-2 py-1 rounded-lg">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-200 dark:text-gray-700"}`} />
                                  ))}
                                </div>
                                {(review.teacherRating || review.contentRating) && (
                                  <div className="flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400 font-bold">
                                    {review.teacherRating && (
                                      <span>👨‍🏫 الأستاذ: {review.teacherRating}/5</span>
                                    )}
                                    {review.contentRating && (
                                      <span>📖 المحتوى: {review.contentRating}/5</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Comment Body */}
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                              {review.comment}
                            </p>

                            {/* Floating Reaction Count on Bubble (Facebook Style) */}
                            {reviewLikes > 0 && (
                              <div className="absolute -bottom-2 left-4 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2D3D] rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm text-[10px] font-black text-gray-500 dark:text-gray-400 select-none z-10">
                                <span className="flex items-center justify-center bg-blue-500 rounded-full w-3.5 h-3.5 text-[8px] text-white">👍</span>
                                <span>{reviewLikes}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Action Bar (Facebook Style) */}
                          <div className="flex items-center gap-4 px-2 text-[11px] font-black text-gray-500 dark:text-gray-400 select-none">
                            {/* Like Action */}
                            <button 
                              onClick={() => handleToggleReviewLike(review.id)}
                              className={`flex items-center gap-1 hover:underline transition-colors cursor-pointer ${
                                isReviewLiked ? "text-blue-500" : "hover:text-gray-800 dark:hover:text-white"
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isReviewLiked ? "fill-blue-500 text-blue-500" : ""}`} />
                              <span>{isReviewLiked ? "أعجبني" : "إعجاب"}</span>
                            </button>

                            {/* Reply Toggle */}
                            <button 
                              onClick={() => {
                                setReplyText("");
                                setActiveReplyInput(activeReplyInput === review.id ? null : review.id);
                              }}
                              className="flex items-center gap-1 hover:underline hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Reply className="w-3.5 h-3.5 rotate-180" />
                              <span>رد</span>
                            </button>

                            {/* Readable Date */}
                            <span className="text-[10px] text-gray-400 font-normal">
                              {new Date(review.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Threaded Nested Replies Tree */}
                          {review.replies && review.replies.length > 0 && (
                            <div className="mr-4 mt-3 border-r-2 border-gray-100 dark:border-gray-800 pr-4 space-y-4 relative">
                              {review.replies.map(reply => {
                                const replyCharCode = reply.userName.charCodeAt(0) || 0;
                                const replyGrad = avatarGradients[replyCharCode % avatarGradients.length];
                                const isReplyTeacher = reply.userRole === 'teacher';

                                return (
                                  <div key={reply.id} className="flex gap-2.5 text-right items-start">
                                    {/* Mini Avatar */}
                                    <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${replyGrad} flex items-center justify-center text-[11px] font-black text-white shadow flex-shrink-0 relative`}>
                                      {reply.userName.charAt(0)}
                                    </div>
                                    
                                    {/* Reply Bubble */}
                                    <div className="flex-1 bg-gray-50/70 dark:bg-[#1E1E2B]/50 border border-gray-100/30 dark:border-gray-800/40 rounded-xl p-3 shadow-sm min-w-0">
                                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        <span className="font-black text-[11px] text-gray-950 dark:text-white">
                                          {reply.userName}
                                        </span>
                                        {isReplyTeacher && (
                                          <span className="text-[8px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-1.5 py-0.5 rounded-full">
                                            معلم المادة 👨‍🏫
                                          </span>
                                        )}
                                        {reply.userId === userData?.id && !isReplyTeacher && (
                                          <span className="text-[8px] font-black bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-1.5 py-0.5 rounded-full">
                                            أنت
                                          </span>
                                        )}
                                        <span className="text-[9px] text-gray-400 font-normal mr-auto">
                                          {new Date(reply.createdAt).toLocaleDateString('ar-EG', {
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-750 dark:text-gray-350 leading-relaxed font-medium">
                                        {reply.comment}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Inline Reply Input Form */}
                          <AnimatePresence>
                            {activeReplyInput === review.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mr-4 pt-2 overflow-hidden"
                              >
                                <div className="flex gap-2 items-end bg-gray-50 dark:bg-[#1e1e2c] p-2.5 rounded-xl border border-gray-200 dark:border-[#2D2D3D]">
                                  <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`الرد على ${review.userName}...`}
                                    className="flex-1 bg-white dark:bg-[#151520] border border-gray-250 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] resize-none h-10"
                                    rows={1}
                                  />
                                  <button 
                                    onClick={() => handleSubmitReply(review.id)}
                                    disabled={isSubmittingReply[review.id] || !replyText.trim()}
                                    className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white dark:text-gray-950 p-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center justify-center flex-shrink-0 w-8 h-8"
                                  >
                                    {isSubmittingReply[review.id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs font-bold border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <span className="text-3xl">💬</span>
                    <span>لا توجد تعليقات منشورة لهذا الكورس بعد. كن أول من يترك انطباعاً جميلاً!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Quick Notes / Teacher Control Panel (col-span-1) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Widget 1: If student, show local Quick Notes Widget */}
            {userData?.role === 'student' && canWatch && (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl shadow-sm border border-gray-200 dark:border-[#2D2D3D] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 flex items-center justify-between">
                  <h3 className="font-black text-xs text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                    <span>مسودة ملاحظات سريعة</span>
                  </h3>
                  <span className="text-[9px] text-gray-500 font-bold bg-white dark:bg-[#13131C] px-2 py-0.5 rounded border border-gray-100 dark:border-[#2D2D3D]">
                    حفظ تلقائي 💾
                  </span>
                </div>
                <div className="p-4">
                  <textarea
                    value={localQuickNotes}
                    onChange={(e) => setLocalQuickNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظة سريعة أو تذكير لنفسك هنا أثناء مشاهدة الدرس... (يتم الحفظ تلقائياً في متصفحك)"
                    className="w-full min-h-[150px] bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors resize-y leading-relaxed font-bold"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            {/* Widget 2: If teacher, show a beautiful Course Analytics Control Widget */}
            {isTeacher && (
              <div className="bg-white dark:bg-[#1A1A24] rounded-3xl shadow-sm border border-gray-200 dark:border-[#2D2D3D] flex flex-col p-5 space-y-4">
                <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#2D2D3D] pb-3">
                  <Sparkles className="w-4.5 h-4.5 text-[#00B4D8] dark:text-[#D4AF37] animate-pulse" />
                  <span>لوحة تحكم المعلم السريعة</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-[#0D0D12]/40 p-3 rounded-2xl text-center border border-transparent hover:border-[#00B4D8]/20 transition-all">
                    <span className="block text-[9px] font-black text-gray-400 mb-0.5">إجمالي الطلاب</span>
                    <span className="text-base font-black text-[#00B4D8] dark:text-[#D4AF37]">
                      {course.enrolledStudents || 0} طالب
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0D0D12]/40 p-3 rounded-2xl text-center border border-transparent hover:border-[#00B4D8]/20 transition-all">
                    <span className="block text-[9px] font-black text-gray-400 mb-0.5">الدروس المرفوعة</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {lessons.length} درس
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>مستوى المادة:</span>
                    <span className="text-gray-900 dark:text-white">{course.subject} - {course.grade}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>سعر الاشتراك:</span>
                    <span className="text-[#00B4D8] dark:text-[#D4AF37] font-black">{course.price === 0 ? "مجاني" : `${course.price} ج.م`}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>حالة الكورس:</span>
                    <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-black">نشط ومنشور</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      toast.success('تم نسخ رابط الكورس لمشاركته مع طلابك! 🔗');
                      navigator.clipboard.writeText(window.location.href);
                    }}
                    className="w-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 hover:bg-[#00B4D8] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-gray-900 text-[#00B4D8] dark:text-[#D4AF37] py-2.5 px-4 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>مشاركة رابط الكورس</span>
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </main>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {showAddLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowAddLesson(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">إضافة درس جديد</h3>
                <button onClick={() => setShowAddLesson(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                <form id="add-lesson-form" onSubmit={handleAddLesson} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">عنوان الدرس</label>
                    <input
                      type="text"
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="مثال: الحصة الأولى - مقدمة"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">فيديو الدرس</label>
                      <div className="flex flex-col gap-3">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors relative overflow-hidden"
                        >
                          {videoFile ? (
                            <div className="flex flex-col items-center text-[#00B4D8] dark:text-[#D4AF37]">
                              <Video className="w-8 h-8 mb-2" />
                              <span className="text-sm font-bold truncate max-w-[200px]">{videoFile.name}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                              <Upload className="w-6 h-6 mb-2" />
                              <span className="text-sm font-medium">اضغط لرفع فيديو من جهازك</span>
                            </div>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleVideoChange}
                            accept="video/*"
                            className="hidden"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-gray-200 dark:bg-[#2D2D3D]"></div>
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">أو</span>
                          <div className="h-px flex-1 bg-gray-200 dark:bg-[#2D2D3D]"></div>
                        </div>

                        <input
                          type="url"
                          value={lessonVideoUrl}
                          onChange={(e) => {
                            setLessonVideoUrl(e.target.value);
                            if (e.target.value) {
                              setVideoFile(null);
                              setVideoPreview('');
                            }
                          }}
                          placeholder="أدخل رابط YouTube أو TikTok..."
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors text-left"
                          dir="ltr"
                        />
                        <p className="text-[10px] text-gray-400 font-bold text-right mt-1" dir="rtl">
                          💡 يمكنك وضع روابط YouTube أو TikTok (يرجى استخدام رابط المقطع الكامل).
                        </p>
                      </div>
                    </div>
                  </div>

                  {isSubmitting && videoFile && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                        <span>{uploadProgress === 100 ? 'جاري حفظ البيانات...' : 'جاري رفع الفيديو...'}</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2">
                        <div className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-300" style={{ width: `${Math.max(uploadProgress, 2)}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">وصف قصير (اختياري)</label>
                    <textarea
                      value={lessonDesc}
                      onChange={(e) => setLessonDesc(e.target.value)}
                      placeholder="وصف مختصر للدرس وما سيتعلمه الطالب..."
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors resize-none"
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end gap-3 sm:gap-4 bg-gray-50 dark:bg-[#0D0D12] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddLesson(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2D2D3D] transition-colors bg-transparent border-0"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="add-lesson-form"
                  disabled={isSubmitting}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {videoFile && uploadProgress < 100 
                        ? `جاري الرفع... ${Math.round(uploadProgress)}%` 
                        : (videoFile && uploadProgress === 100) 
                          ? 'جاري الحفظ...' 
                          : 'جاري الإضافة...'}
                    </>
                  ) : (
                    'إضافة الدرس'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {lessonToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLessonToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 border border-gray-100 dark:border-[#2D2D3D] text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 dark:text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف النهائي</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟ ستتم إزالة الفيديو والمعلومات المرتبطة به ولا يمكن استعادتها مرة أخرى.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setLessonToDelete(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors flex-1"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLessonConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex-1 shadow-lg shadow-red-500/10"
                >
                  نعم، احذف نهائياً
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Completion Rating Modal */}
      <AnimatePresence>
        {showCompletionRating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompletionRating(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A24] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#2D2D3D] z-10 relative flex flex-col max-h-[90vh]"
              dir="rtl"
            >
              {/* Top Banner Accent */}
              <div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 shrink-0" />
              
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                {/* Header */}
                <div className="text-center space-y-2 relative">
                  <button 
                    onClick={() => setShowCompletionRating(false)}
                    className="absolute top-0 left-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-150 dark:hover:bg-[#2D2D3D] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto text-4xl mb-2 animate-bounce">
                    🎓
                  </div>
                  <h3 className="font-black text-xl text-gray-900 dark:text-white">تقييم الكورس والأستاذ</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    تهانينا على إتمام الكورس بنجاح! يسعدنا جداً معرفة رأيك حول المحتوى التعليمي وأداء الأستاذ المتميز.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Teacher Performance Rating */}
                  <div className="bg-gray-50 dark:bg-[#222230] p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        👨‍🏫 تقييم أداء الأستاذ:
                      </span>
                      <span className="text-xs font-bold text-amber-500 font-sans">
                        {teacherRating} / 5
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setTeacherRating(star)}
                          className="focus:outline-none hover:scale-110 active:scale-95 transition-transform cursor-pointer bg-transparent border-0"
                        >
                          <Star className={`w-8 h-8 ${star <= teacherRating ? "fill-yellow-500 text-yellow-500" : "text-gray-300 dark:text-gray-650"}`} />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium">
                      (أسلوب الشرح، الاستجابة للأسئلة، وتوصيل المعلومة)
                    </p>
                  </div>

                  {/* Educational Content Rating */}
                  <div className="bg-gray-50 dark:bg-[#222230] p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        📖 تقييم المحتوى التعليمي:
                      </span>
                      <span className="text-xs font-bold text-amber-500 font-sans">
                        {contentRating} / 5
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setContentRating(star)}
                          className="focus:outline-none hover:scale-110 active:scale-95 transition-transform cursor-pointer bg-transparent border-0"
                        >
                          <Star className={`w-8 h-8 ${star <= contentRating ? "fill-yellow-500 text-yellow-500" : "text-gray-300 dark:text-gray-650"}`} />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium">
                      (تنظيم الحصص، جودة الفيديوهات، الاختبارات، والمذكرات)
                    </p>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      رأيك الشخصي أو مقترحاتك للتحسين:
                    </span>
                    <textarea
                      value={completionComment}
                      onChange={(e) => setCompletionComment(e.target.value)}
                      placeholder="اكتب انطباعك الصادق ومقترحاتك بكل حرية..."
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-4 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 focus:bg-white dark:focus:bg-[#1A1A24] transition-colors resize-none leading-relaxed"
                      rows={3}
                    />
                  </div>

                  {/* Private Review Toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
                    <input
                      type="checkbox"
                      checked={isCompletionReviewPrivate}
                      onChange={(e) => setIsCompletionReviewPrivate(e.target.checked)}
                      className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500 border-gray-300 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]"
                    />
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      🔒 إرسال كتقييم خاص للأستاذ فقط (لن ينشر للعامة)
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-[#15151F] px-6 py-4 border-t border-gray-150 dark:border-[#2D2D3D] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCompletionRating(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-100 dark:hover:bg-[#222230] text-gray-700 dark:text-gray-300 text-xs font-black transition-colors cursor-pointer bg-transparent"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCompletionRating}
                  disabled={isSubmittingCompletionReview}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-95 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 border-0"
                >
                  {isSubmittingCompletionReview ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري إرسال التقييم...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>حفظ وإرسال التقييم</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      {/* Delete Course Confirmation Modal */}
      <AnimatePresence>
        {showDeleteCourseModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A24] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative text-right"
              dir="rtl"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">تأكيد حذف الكورس نهائياً</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                  هل أنت متأكد من رغبتك في حذف كورس <span className="text-red-500">"{course?.title}"</span> للأبد من السيستم؟
                </p>
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-bold leading-relaxed">
                    ⚠️ تنبيه: سيتم حذف كافة الدروس والمرفقات والطلاب المسجلين من الكورس. لا يمكن التراجع عن هذا الإجراء!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeletingCourse}
                  onClick={handleDeleteCourse}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  {isDeletingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>نعم، احذف الكورس</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteCourseModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {showPaymentModal && (
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
                    <div className="p-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-xl text-[#00B4D8] dark:text-[#D4AF37]">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">طرق الاشتراك المتاحة</h3>
                      <p className="text-[10px] font-bold text-gray-400">اختر الوسيلة المناسبة لك لتفعيل الكورس</p>
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
                        ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    رصيد المحفظة
                  </button>
                  
                  {(isVodafoneCashEnabled || isInstapayEnabled || isBankAccountEnabled) && (
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
                <AnimatePresence mode="wait">
                  {paymentMethod === 'wallet' ? (
                    <motion.div
                      key="wallet-tab"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6 space-y-6"
                    >
                      <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-white dark:bg-[#0D0D12] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-blue-100 dark:border-blue-900/30">
                          <Wallet className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
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
                          <span className="text-xs font-bold text-gray-500">سعر الكورس:</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">{course.price} ج.م</span>
                        </div>

                        {userData && (userData.balance || 0) < (course.price || 0) ? (
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
                              رصيدك كافٍ! سيتم تفعيل الكورس فوراً عند تأكيد العملية وخصم المبلغ من محفظتك.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                        <button
                          onClick={handleWalletPayment}
                          disabled={isPayingWithWallet || (userData?.balance || 0) < (course.price || 0)}
                          className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] text-white dark:text-[#0D0D12] py-4 rounded-2xl font-black text-sm shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/10 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
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
                        <p className="text-[10px] text-center font-bold text-gray-400">
                          بضغطك على تأكيد الدفع، سيتم تفعيل الكورس في حسابك فوراً.
                        </p>
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
                              {course.price} ج.م
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
                          </div>
                          
                          <p className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed text-right mt-4">
                            ⚠️ يرجى تحويل مبلغ الكورس كاملاً وهو <span className="font-extrabold text-rose-600 dark:text-rose-400">{course.price} ج.م</span> إلى إحدى الطرق الموضحة أعلاه، ثم ملء البيانات أدناه لرفع إثبات التحويل لتفعيل الكورس.
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
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-white font-bold text-xs font-sans"
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
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] dark:text-white font-bold text-xs font-sans text-right"
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
                                <span>جاري إرسال الطلب ({paymentUploadProgress}%)...</span>
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
