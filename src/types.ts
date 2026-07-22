export interface CustomPaymentMethod {
  id: string;
  name: string;
  details: string;
  isEnabled: boolean;
}

export interface PlatformSettings {
  platformName: string;
  logoChar: string;
  logoUrl?: string;
  heroTitle: string;
  heroSubtitle: string;
  showGradesSection: boolean;
  showSubjectsSection: boolean;
  showFeaturesSection: boolean;
  showFaqSection: boolean;
  gradesTitle: string;
  gradesSubtitle: string;
  subjectsTitle: string;
  subjectsSubtitle: string;
  faqTitle: string;
  faqSubtitle: string;
  vodafoneCashNumber: string;
  isVodafoneCashEnabled?: boolean;
  instapayHandle?: string;
  isInstapayEnabled?: boolean;
  bankAccountDetails?: string;
  isBankAccountEnabled?: boolean;
  customPaymentMethods?: CustomPaymentMethod[];
  subjects?: { id: string; title: string; iconName: string; color: string }[];
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    whatsapp?: string;
  };
  quduratVideoUrl?: string;
  tahsiliVideoUrl?: string;
  quduratVideoProvider?: 'bunny' | 'tiktok' | 'youtube' | 'direct';
  tahsiliVideoProvider?: 'bunny' | 'tiktok' | 'youtube' | 'direct';
  quduratVideoTitle?: string;
  tahsiliVideoTitle?: string;
  quduratVideoPoster?: string;
  tahsiliVideoPoster?: string;
  heroVideoUrl?: string;
  heroVideoProvider?: 'bunny' | 'tiktok' | 'youtube' | 'direct';
  heroVideoTitle?: string;
  heroVideoPoster?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  email?: string;
  governorate?: string;
  school?: string;
  grade?: string;
  parentPhone?: string;
  subject?: string;
  nationalId?: string;
  dateOfBirth?: string;
  teachingGrades?: string[];
  studentPhone?: string;
  balance?: number;
  createdAt?: string;
  branch?: 'science' | 'math' | 'arts' | 'scientific' | 'literary';
  educationSystem?: 'general' | 'azhar';
  isSpecialRegistration?: boolean;
  status?: string;
  registrationType?: string;
  isApproved?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  price: number;
  teacherId: string;
  teacherName: string;
  imageUrl: string;
  createdAt: string;
  views?: number;
  enrolledStudents: number;
  enrolledStudentIds?: string[];
  suspendedStudentIds?: string[];
  lessonsCount: number;
  isActive?: boolean;
  status?: 'published' | 'draft' | 'under_review';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  contentType?: 'video_course' | 'pdf_book' | 'exam';
  bunnyVideoId?: string;
  order: number;
  createdAt: string;
  views?: number;
  durationInSeconds?: number;
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  isUnlocked: boolean;
  videoUrl?: string;
}

export interface Code {
  id: string;
  code: string;
  isActive: boolean;
  assignedTo?: string;
  expiresAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  views?: number;
  type: 'enrollment' | 'system';
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  teacherRating?: number;
  contentRating?: number;
  comment: string;
  createdAt: string;
  isPrivate?: boolean;
  likesCount?: number;
  likedUserIds?: string[];
  replies?: {
    id: string;
    userId: string;
    userName: string;
    userRole?: string;
    comment: string;
    createdAt: string;
  }[];
}

export interface LessonNote {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  content: string;
  updatedAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType; // Optional for backward compatibility, defaults to 'multiple_choice'
  options: string[]; // Can be empty for essay
  correctOptionIndex: number; // For multiple_choice and true_false
  correctAnswer?: string; // For essay (teacher reference)
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number; // in minutes (0 or undefined for no limit)
  createdBy: string;
  createdAt: string;
  isHidden?: boolean;
}

export interface QuizSubmission {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  courseId: string;
  lessonId: string;
  score: number; // percentage or points
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  submittedAt: string;
  passed: boolean;
  infractionsCount?: number;
  cheatedViolation?: boolean;
}

export interface QuickNote {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  focusMinutes: number;
  createdAt: string;
}

export interface TahsiliReview {
  contentType?: 'video_course' | 'pdf_book' | 'exam';
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  promoImage?: string;
  subject: string;
  grade: string;
  teacherName: string;
  teacherId: string;
  videoUrl: string;
  bunnyVideoId?: string;
  pdfUrl?: string;
  examId?: string;
  price: number;
  discountPrice?: number;
  lessonsCount: number;
  duration: string;
  status: 'published' | 'draft' | 'hidden';
  isFeatured?: boolean;
  enrolledStudentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuduratReview {
  contentType?: 'video_course' | 'pdf_book' | 'exam';
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  promoImage?: string;
  subject: string;
  grade: string;
  teacherName: string;
  teacherId: string;
  videoUrl: string;
  bunnyVideoId?: string;
  pdfUrl?: string;
  examId?: string;
  price: number;
  discountPrice?: number;
  lessonsCount: number;
  duration: string;
  status: 'published' | 'draft' | 'hidden';
  isFeatured?: boolean;
  enrolledStudentIds?: string[];
  createdAt: string;
  updatedAt: string;
}


