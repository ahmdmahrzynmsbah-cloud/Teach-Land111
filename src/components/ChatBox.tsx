import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageSquare, 
  Users, 
  GraduationCap, 
  Award, 
  Shield, 
  Search, 
  CheckCheck, 
  Trash2, 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  User as UserIcon, 
  BookOpen, 
  Bell, 
  Filter, 
  Reply, 
  Check, 
  Megaphone,
  Radio,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  orderBy, 
  getDocs,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, Course, ChatMessage } from '../types';
import toast from 'react-hot-toast';

interface ChatBoxProps {
  userData: User | null;
  linkedStudent?: User | null;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ userData, linkedStudent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'sent' | 'broadcasts'>('incoming');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const isAdmin = userData?.role === 'admin' || (userData?.role as any) === 'sub_admin' || (userData?.role as any) === 'developer';
  const isTeacher = userData?.role === 'teacher';
  const isStudent = userData?.role === 'student';
  const isParent = userData?.role === 'parent';

  // Compose modal state
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  
  // Form values
  const [recipientType, setRecipientType] = useState<'all' | 'role_group' | 'course' | 'admin' | 'user' | 'teacher'>((isAdmin || isTeacher) ? 'user' : 'admin');
  const [targetRole, setTargetRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [targetCourseId, setTargetCourseId] = useState<string>('');
  const [targetCourseTitle, setTargetCourseTitle] = useState<string>('');
  const [targetTeacherId, setTargetTeacherId] = useState<string>('');
  const [targetTeacherName, setTargetTeacherName] = useState<string>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'teacher' | 'parent' | 'admin'>('all');
  const [userPickerSearch, setUserPickerSearch] = useState<string>('');
  const [msgTitle, setMsgTitle] = useState<string>('');
  const [msgContent, setMsgContent] = useState<string>('');

  // Loaded metadata for options
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [teachersList, setTeachersList] = useState<{ id: string; name: string }[]>([]);

  // Fetch real-time messages
  useEffect(() => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    // Fallback timer to prevent getting stuck on loading
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const messagesRef = collection(db, 'chat_messages');

    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      clearTimeout(safetyTimer);
      const loaded: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          ...data
        } as ChatMessage);
      });

      // Sort client-side descending by createdAt
      loaded.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setMessages(loaded);
      setLoading(false);
    }, (error) => {
      clearTimeout(safetyTimer);
      console.error("Error listening to chat_messages:", error);
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [userData?.id]);

  // Fetch metadata for user select boxes based on role
  useEffect(() => {
    if (!userData?.id) return;

    const fetchDropdownData = async () => {
      try {
        // Fetch courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesList: Course[] = [];
        coursesSnap.forEach(d => coursesList.push({ id: d.id, ...d.data() } as Course));

        // Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const uList: User[] = [];
        usersSnap.forEach(d => uList.push({ id: d.id, ...d.data() } as User));
        setAllUsers(uList);

        if (isAdmin) {
          setMyCourses(coursesList);
          // Default recipient type for admin: 'all' or 'user'
          setRecipientType('all');
        } else if (isTeacher) {
          const teacherCourses = coursesList.filter(c => c.teacherId === userData.id);
          setMyCourses(teacherCourses);
          setRecipientType('course');
          if (teacherCourses.length > 0) {
            setTargetCourseId(teacherCourses[0].id);
            setTargetCourseTitle(teacherCourses[0].title);
          }
        } else if (isStudent) {
          // Student enrolled courses
          const enrolledCourses = coursesList.filter(c => c.enrolledStudentIds?.includes(userData.id));
          setMyCourses(enrolledCourses);
          // Find unique teachers from enrolled courses
          const tMap = new Map<string, string>();
          enrolledCourses.forEach(c => {
            if (c.teacherId && c.teacherName) {
              tMap.set(c.teacherId, c.teacherName);
            }
          });
          const tList = Array.from(tMap.entries()).map(([id, name]) => ({ id, name }));
          setTeachersList(tList);
          setRecipientType('admin');
        } else if (isParent) {
          // Parent linked student courses
          const studentId = linkedStudent?.id || userData.id;
          const enrolledCourses = coursesList.filter(c => c.enrolledStudentIds?.includes(studentId));
          setMyCourses(enrolledCourses);
          const tMap = new Map<string, string>();
          enrolledCourses.forEach(c => {
            if (c.teacherId && c.teacherName) {
              tMap.set(c.teacherId, c.teacherName);
            }
          });
          const tList = Array.from(tMap.entries()).map(([id, name]) => ({ id, name }));
          setTeachersList(tList);
          setRecipientType('admin');
        }
      } catch (err) {
        console.error("Error loading dropdown data for chatbox:", err);
      }
    };

    fetchDropdownData();
  }, [userData?.id, userData?.role, linkedStudent?.id]);

  // Helper to get selectable users based on role, category filter, and search
  const getSelectableUsers = () => {
    let baseList: User[] = [];
    if (isAdmin) {
      baseList = allUsers.filter(u => u.id !== userData?.id);
    } else if (isTeacher) {
      baseList = allUsers.filter(u => u.id !== userData?.id && (u.role === 'student' || u.role === 'parent' || u.role === 'admin' || (u.role as any) === 'sub_admin'));
    } else if (isStudent || isParent) {
      baseList = allUsers.filter(u => u.id !== userData?.id && (u.role === 'teacher' || u.role === 'admin' || (u.role as any) === 'sub_admin'));
    } else {
      baseList = allUsers.filter(u => u.id !== userData?.id);
    }

    if (userRoleFilter !== 'all') {
      baseList = baseList.filter(u => {
        if (userRoleFilter === 'admin') return u.role === 'admin' || (u.role as any) === 'sub_admin' || (u.role as any) === 'developer';
        return u.role === userRoleFilter;
      });
    }

    if (userPickerSearch.trim() !== '') {
      const q = userPickerSearch.toLowerCase().trim();
      baseList = baseList.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    return baseList;
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const selectable = getSelectableUsers();
    const selectableIds = selectable.map(u => u.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      const combined = new Set([...selectedUserIds, ...selectableIds]);
      setSelectedUserIds(Array.from(combined));
    }
  };

  const isMessageVisibleForMe = (msg: ChatMessage) => {
    const isSender = msg.senderId === userData?.id;
    const isRecipientUser = msg.recipientType === 'user' && (
      msg.recipientId === userData?.id ||
      (msg.recipientIds && msg.recipientIds.includes(userData?.id || ''))
    );
    const isRecipientTeacher = msg.recipientType === 'teacher' && (
      msg.recipientId === userData?.id ||
      (msg.recipientIds && msg.recipientIds.includes(userData?.id || ''))
    );
    const isBroadcast = msg.recipientType === 'all';
    const isRoleGroup = msg.recipientType === 'role_group' && msg.targetRole === userData?.role;
    const isAdminTarget = msg.recipientType === 'admin' && isAdmin;
    
    // Course targeted message check
    let isCourseTarget = false;
    if (msg.recipientType === 'course' && msg.targetCourseId) {
      if (isTeacher) {
        isCourseTarget = myCourses.some(c => c.id === msg.targetCourseId);
      } else if (isStudent) {
        isCourseTarget = myCourses.some(c => c.id === msg.targetCourseId);
      } else if (isParent) {
        isCourseTarget = myCourses.some(c => c.id === msg.targetCourseId);
      } else if (isAdmin) {
        isCourseTarget = true;
      }
    }

    const isIncoming = isRecipientUser || isRecipientTeacher || isBroadcast || isRoleGroup || isAdminTarget || isCourseTarget;
    
    return { isSender, isIncoming };
  };

  // Filter messages for current user visibility
  const filteredMessages = messages.filter(msg => {
    const { isSender, isIncoming } = isMessageVisibleForMe(msg);
    const isVisible = isSender || isIncoming;
    
    if (!isVisible) return false;

    // Sub tab filtering
    if (activeSubTab === 'incoming') {
      if (isSender) return false; // Show incoming only
    } else if (activeSubTab === 'sent') {
      if (!isSender) return false; // Show sent only
    } else if (activeSubTab === 'broadcasts') {
      if (msg.recipientType !== 'all' && msg.recipientType !== 'role_group') return false;
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchContent = msg.content?.toLowerCase().includes(term);
      const matchTitle = msg.title?.toLowerCase().includes(term);
      const matchSender = msg.senderName?.toLowerCase().includes(term);
      const matchRecipient = msg.recipientName?.toLowerCase().includes(term);
      return matchContent || matchTitle || matchSender || matchRecipient;
    }

    return true;
  });

  // Unread count
  const unreadCount = messages.filter(msg => {
    const { isSender, isIncoming } = isMessageVisibleForMe(msg);
    if (isSender) return false; // Don't count sent messages
    if (!isIncoming) return false; // Don't count messages not targeted at this user
    
    const isRead = msg.readBy?.includes(userData?.id || '');
    return !isRead;
  }).length;

  // Handle Mark as Read
  const handleMarkAsRead = async (msgId: string) => {
    if (!userData?.id) return;
    try {
      const msgRef = doc(db, 'chat_messages', msgId);
      await updateDoc(msgRef, {
        readBy: arrayUnion(userData.id)
      });
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('هل أنت تأكد من حذف هذه الرسالة؟')) return;
    try {
      await deleteDoc(doc(db, 'chat_messages', msgId));
      toast.success('تم حذف الرسالة بنجاح');
    } catch (err) {
      console.error("Error deleting message:", err);
      handleFirestoreError(err, OperationType.DELETE, `chat_messages/${msgId}`);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // Quick Reply handler
  const handleQuickReply = (msg: ChatMessage) => {
    setIsComposeOpen(true);
    if (msg.senderRole === 'admin') {
      setRecipientType('admin');
    } else {
      setRecipientType('user');
      setSelectedUserIds([msg.senderId]);
      setRecipientId(msg.senderId);
      setRecipientName(msg.senderName);
    }
    setMsgTitle(`رد على: ${msg.title || 'رسالة'}`);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!userData?.id) {
      toast.error('خطأ: لم يتم العثور على بيانات المستخدم');
      return;
    }

    if (!msgContent.trim()) {
      toast.error('يرجى كتابة نص الرسالة أولاً');
      return;
    }

    if (recipientType === 'user' && selectedUserIds.length === 0) {
      toast.error('يرجى تحديد مستلم واحد على الأقل من القائمة');
      return;
    }

    if (recipientType === 'course' && !targetCourseId) {
      toast.error('يرجى اختيار الكورس المطلوب');
      return;
    }

    if (recipientType === 'teacher' && !targetTeacherId) {
      toast.error('يرجى اختيار المعلم المطلوب');
      return;
    }

    setSending(true);

    try {
      const newMsg: ChatMessage = {
        senderId: userData.id,
        senderName: userData.name || 'مستخدم',
        senderRole: userData.role,
        recipientType,
        title: msgTitle.trim() || '',
        content: msgContent.trim(),
        createdAt: new Date().toISOString(),
        readBy: [userData.id]
      };

      if (recipientType === 'role_group') {
        newMsg.targetRole = targetRole;
      } else if (recipientType === 'course') {
        newMsg.targetCourseId = targetCourseId;
        newMsg.targetCourseTitle = targetCourseTitle;
      } else if (recipientType === 'teacher') {
        newMsg.recipientId = targetTeacherId;
        newMsg.recipientIds = [targetTeacherId];
        newMsg.recipientName = targetTeacherName;
      } else if (recipientType === 'user') {
        const selectedUsers = allUsers.filter(u => selectedUserIds.includes(u.id));
        const names = selectedUsers.map(u => u.name || 'مستخدم');

        newMsg.recipientIds = selectedUserIds;
        newMsg.recipientNames = names;
        newMsg.recipientId = selectedUserIds[0];
        if (selectedUsers.length === 1) {
          newMsg.recipientName = names[0];
        } else {
          newMsg.recipientName = `${selectedUsers.length} مستخدمين (${names.slice(0, 2).join('، ')}${names.length > 2 ? '...' : ''})`;
        }
      } else if (recipientType === 'admin') {
        newMsg.recipientName = 'الإدارة العامة';
      }

      await addDoc(collection(db, 'chat_messages'), newMsg);

      toast.success('تم إرسال الرسالة بنجاح 🚀');
      setIsComposeOpen(false);
      setMsgTitle('');
      setMsgContent('');
      setSelectedUserIds([]);
      setUserPickerSearch('');
    } catch (err) {
      console.error("Error sending message:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
      } catch (e) {
        // ignore throw to allow toast to show
      }
      toast.error('فشل إرسال الرسالة، يرجى المحاولة لاحقاً');
    } finally {
      setSending(false);
    }
  };

  // Render role badge helper
  const renderRoleBadge = (role: string, name: string) => {
    switch (role) {
      case 'admin':
      case 'sub_admin':
      case 'developer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Shield className="w-3 h-3" />
            الإدارة ({name})
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Award className="w-3 h-3" />
            المعلم: {name}
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="w-3 h-3" />
            الطالب: {name}
          </span>
        );
      case 'parent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Users className="w-3 h-3" />
            ولي الأمر: {name}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
            {name}
          </span>
        );
    }
  };

  // Render target indicator badge
  const renderTargetBadge = (msg: ChatMessage) => {
    if (msg.recipientType === 'all') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
          <Megaphone className="w-3 h-3" />
          إعلان لجميع المستخدمين
        </span>
      );
    }
    if (msg.recipientType === 'role_group') {
      const roleText = msg.targetRole === 'student' ? 'جميع الطلاب' : msg.targetRole === 'teacher' ? 'جميع المعلمين' : 'جميع أولياء الأمور';
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
          <Users className="w-3 h-3" />
          موجه إلى: {roleText}
        </span>
      );
    }
    if (msg.recipientType === 'course') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800/40">
          <BookOpen className="w-3 h-3" />
          مجموعة كورس: {msg.targetCourseTitle || 'الكورس'}
        </span>
      );
    }
    if (msg.recipientType === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
          <Shield className="w-3 h-3" />
          موجه إلى: الإدارة العامة
        </span>
      );
    }
    if (msg.recipientType === 'user') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800/40">
          <UserIcon className="w-3 h-3" />
          موجه إلى: {msg.recipientName || 'مستخدم'}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#1A1A24] dark:to-[#222232] p-5 sm:p-6 rounded-2xl text-white shadow-md relative overflow-hidden border border-white/10 dark:border-[#2D2D3D]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 dark:bg-[#D4AF37]/15 backdrop-blur-md border border-white/20 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-white dark:text-[#D4AF37] shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  شات بوكس المنصة
                </h1>
                <span className="text-[11px] bg-white/20 dark:bg-[#D4AF37]/20 text-white dark:text-[#D4AF37] px-2.5 py-0.5 rounded-full border border-white/20 dark:border-[#D4AF37]/30 font-bold">
                  التواصل المباشر
                </span>
              </div>
              <p className="text-white/80 dark:text-gray-300 text-xs font-medium mt-1">
                مركز الرسائل والتنبيهات والإشعارات الفورية بين الإدارة، المعلمين، الطلاب وأولياء الأمور.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0 pt-2 sm:pt-0">
            <button
              onClick={() => setIsComposeOpen(true)}
              className="w-full sm:w-auto bg-white text-[#0077B6] dark:bg-[#D4AF37] dark:text-[#0D0D12] hover:bg-gray-100 dark:hover:bg-[#B8860B] px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              إرسال رسالة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
        {/* Navigation Tabs & Search bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#2D2D3D]">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            <button
              onClick={() => setActiveSubTab('incoming')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSubTab === 'incoming'
                  ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white shadow-md'
                  : 'bg-gray-100 dark:bg-[#252538] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              الرسائل الواردة
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('sent')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSubTab === 'sent'
                  ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white shadow-md'
                  : 'bg-gray-100 dark:bg-[#252538] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              الرسائل المرسلة
            </button>

            <button
              onClick={() => setActiveSubTab('broadcasts')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSubTab === 'broadcasts'
                  ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white shadow-md'
                  : 'bg-gray-100 dark:bg-[#252538] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              الإعلانات والتنبيهات العامة
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في نص الرسائل..."
              className="w-full pr-10 pl-4 py-2 rounded-2xl bg-gray-50 dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all"
            />
          </div>
        </div>

        {/* Messages List Container */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">جاري تحميل صندوق الرسائل...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] rounded-3xl p-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#252538] rounded-full flex items-center justify-center text-gray-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">لا توجد رسائل حالية</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 max-w-sm">
              لم تتلقَ أو ترسل أي رسائل في هذه الفئة حتى الآن. اضغط على زر "إرسال رسالة جديدة" للبدء.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredMessages.map((msg) => {
                const isRead = msg.readBy?.includes(userData?.id || '');
                const isSender = msg.senderId === userData?.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => {
                      if (!isRead && !isSender && msg.id) {
                        handleMarkAsRead(msg.id);
                      }
                    }}
                    className={`p-5 rounded-2xl border transition-all relative group ${
                      !isRead && !isSender
                        ? 'bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border-[#00B4D8]/30 dark:border-[#D4AF37]/30 shadow-sm'
                        : 'bg-white dark:bg-[#1F1F2C] border-gray-200 dark:border-[#2D2D3D]'
                    }`}
                  >
                    {/* Unread indicator ribbon */}
                    {!isRead && !isSender && (
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#00B4D8] dark:bg-[#D4AF37] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        جديدة
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Sender Info & Header */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {renderRoleBadge(msg.senderRole, msg.senderName)}
                          {renderTargetBadge(msg)}
                          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mr-auto">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>

                        {/* Message Title */}
                        {msg.title && (
                          <h4 className="text-base font-black text-gray-900 dark:text-white pt-1">
                            {msg.title}
                          </h4>
                        )}

                        {/* Message Content */}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap pt-1">
                          {msg.content}
                        </p>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-[#2D2D3D]">
                        
                        {/* Status (Read/Views) for Sender */}
                        {isSender && (
                          <div className="flex flex-col gap-1.5 items-end">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم الإرسال بنجاح</span>
                            </div>
                          </div>
                        )}

                        {!isSender && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickReply(msg);
                            }}
                            className="px-3 py-1.5 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#0D0D12] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            رد مباشر
                          </button>
                        )}

                        {(isSender || isAdmin) && msg.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id!);
                            }}
                            title="حذف الرسالة"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Close button */}
              <button
                onClick={() => setIsComposeOpen(false)}
                className="absolute top-5 left-5 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252538] rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                <div className="p-3 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] rounded-2xl">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">إرسال رسالة جديدة</h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    اختر الفئة المستهدفة واكتب نص الرسالة
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Recipient Type Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 block">
                    تحديد الجهة المستهدفة:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Options according to user role */}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRecipientType('all')}
                          className={`p-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                            recipientType === 'all'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                              : 'border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Megaphone className="w-4 h-4" />
                          إعلان للجميع
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecipientType('role_group')}
                          className={`p-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                            recipientType === 'role_group'
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          فئة كاملة
                        </button>
                      </>
                    )}

                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setRecipientType('course')}
                        className={`p-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                          recipientType === 'course'
                            ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        طلاب كورس معين
                      </button>
                    )}

                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => setRecipientType('admin')}
                        className={`p-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                          recipientType === 'admin'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        الإدارة العامة
                      </button>
                    )}

                    {(isStudent || isParent) && (
                      <button
                        type="button"
                        onClick={() => setRecipientType('teacher')}
                        className={`p-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                          recipientType === 'teacher'
                            ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        معلم المادة
                      </button>
                    )}

                    {(isAdmin || isTeacher) && (
                      <button
                        type="button"
                        onClick={() => setRecipientType('user')}
                        className={`p-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                          recipientType === 'user'
                            ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border-[#00B4D8] dark:border-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]'
                            : 'border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <UserIcon className="w-4 h-4" />
                        شخص محدد
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-selector conditional logic */}
                {recipientType === 'role_group' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">اختر الفئة:</label>
                    <select
                      value={targetRole}
                      onChange={(e: any) => setTargetRole(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="student">جميع الطلاب</option>
                      <option value="teacher">جميع المعلمين</option>
                      <option value="parent">جميع أولياء الأمور</option>
                    </select>
                  </div>
                )}

                {recipientType === 'course' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">اختر الكورس:</label>
                    <select
                      value={targetCourseId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setTargetCourseId(selectedId);
                        const found = myCourses.find(c => c.id === selectedId);
                        if (found) setTargetCourseTitle(found.title);
                      }}
                      className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white"
                    >
                      {myCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {recipientType === 'teacher' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">اختر المعلم:</label>
                    <select
                      value={targetTeacherId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setTargetTeacherId(selectedId);
                        const found = teachersList.find(t => t.id === selectedId);
                        if (found) setTargetTeacherName(found.name);
                      }}
                      className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="">-- اختر المعلم --</option>
                      {teachersList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {recipientType === 'user' && (
                  <div className="space-y-3 bg-gray-50/80 dark:bg-[#151520] p-4 rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                        حدد المستلمين (يمكن اختيار أكثر من شخص):
                      </label>
                      <span className="text-[11px] font-bold text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-2.5 py-1 rounded-full w-fit">
                        تم تحديد {selectedUserIds.length} مستخدم
                      </span>
                    </div>

                    {/* Role Filter Tabs */}
                    <div className="flex flex-wrap gap-1.5 border-b border-gray-200 dark:border-[#2D2D3D] pb-2">
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          userRoleFilter === 'all'
                            ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white'
                            : 'bg-white dark:bg-[#252538] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('student')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          userRoleFilter === 'student'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-[#252538] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                        }`}
                      >
                        الطلاب
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('teacher')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          userRoleFilter === 'teacher'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-[#252538] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                        }`}
                      >
                        المعلمون
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('parent')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          userRoleFilter === 'parent'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-[#252538] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                        }`}
                      >
                        أولياء الأمور
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('admin')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          userRoleFilter === 'admin'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white dark:bg-[#252538] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                        }`}
                      >
                        الإدارة
                      </button>
                    </div>

                    {/* Search & Select All Bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={userPickerSearch}
                          onChange={(e) => setUserPickerSearch(e.target.value)}
                          placeholder="ابحث بالاسم، الهاتف..."
                          className="w-full pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="px-3 py-2 bg-white dark:bg-[#252538] hover:bg-gray-100 dark:hover:bg-[#2D2D3D] border border-gray-200 dark:border-[#2D2D3D] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer"
                      >
                        {getSelectableUsers().length > 0 && getSelectableUsers().every(u => selectedUserIds.includes(u.id))
                          ? 'إلغاء تحديد المعروض'
                          : 'تحديد الكل المعروض'}
                      </button>
                    </div>

                    {/* Users Scrollable List */}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {getSelectableUsers().length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                          لا يوجد مستخدمين يطابقون خيارات البحث أو التصفية الحالية
                        </div>
                      ) : (
                        getSelectableUsers().map((u) => {
                          const isSelected = selectedUserIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleUserSelection(u.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border-[#00B4D8] dark:border-[#D4AF37] shadow-sm'
                                  : 'bg-white dark:bg-[#222232] border-gray-200 dark:border-[#2D2D3D] hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#00B4D8] dark:bg-[#D4AF37] border-transparent text-white'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A24]'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                                    {u.name || 'مستخدم بدون اسم'}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                    {u.phone ? `هاتف: ${u.phone}` : u.email || ''}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {renderRoleBadge(u.role, u.role === 'student' ? 'طالب' : u.role === 'teacher' ? 'معلم' : u.role === 'parent' ? 'ولي أمر' : 'إدارة')}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">عنوان الرسالة (اختياري):</label>
                  <input
                    type="text"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="مثال: تنبيه بخصوص موعد المحاضرة..."
                    className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">محتوى الرسالة *:</label>
                  <textarea
                    rows={4}
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="اكتب نص الرسالة هنا بالتفصيل..."
                    className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#252538] border border-gray-200 dark:border-[#2D2D3D] text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37]"
                    required
                  ></textarea>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="w-full py-3.5 bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-black text-sm rounded-2xl shadow-lg hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري إرسال الرسالة...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال الرسالة الآن
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ChatBox;
