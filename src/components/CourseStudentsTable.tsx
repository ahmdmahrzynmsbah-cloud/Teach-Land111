import React, { useState, useMemo, useRef, useCallback } from 'react';
import { User, Course } from '../types';
import { 
  Search, Filter, MoreVertical, Edit2, Trash2, Shield, Eye, Download,
  CheckCircle, XCircle, ChevronDown, ChevronUp, ChevronsUpDown, UserX, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { toast } from 'react-hot-toast';

interface CourseStudentsTableProps {
  students: User[];
  course: Course;
  onRemoveStudent: (studentIds: string | string[], course: Course) => void;
  onUpdateStudent?: (studentId: string, updates: Partial<User>) => void;
}

type SortField = 'name' | 'email' | 'phone' | 'governorate' | 'grade' | 'school' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function CourseStudentsTable({ students, course, onRemoveStudent, onUpdateStudent }: CourseStudentsTableProps) {
  // 1. Search and Filters
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [govFilter, setGovFilter] = useState('all');
  
  // 2. Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 3. Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 4. Drawer
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // 5. Pagination
  const [pageSize, setPageSize] = useState(50);
  const [pageIndex, setPageIndex] = useState(0);

  // 6. Custom Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // 7. Edit State
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  const handleStartEdit = (student: User) => {
    setEditFormData({
      name: student.name,
      phone: student.phone,
      parentPhone: student.parentPhone,
      grade: student.grade,
      governorate: student.governorate,
      school: student.school
    });
    setIsEditingStudent(true);
  };

  const handleSaveEdit = () => {
    if (selectedStudent && onUpdateStudent) {
      onUpdateStudent(selectedStudent.id, editFormData);
      
      // Optimistically update selected student view
      setSelectedStudent({ ...selectedStudent, ...editFormData } as User);
      setIsEditingStudent(false);
    }
  };

  // Filter & Sort Data
  const filteredAndSortedData = useMemo(() => {
    let result = students.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        (s.name?.toLowerCase().includes(q)) || 
        (s.email?.toLowerCase().includes(q)) || 
        (s.phone?.toLowerCase().includes(q));
      
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const matchGov = govFilter === 'all' || s.governorate === govFilter;
      
      return matchSearch && matchGrade && matchGov;
    });

    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'createdAt') {
         // handle date objects or strings
         aVal = typeof (a.createdAt as any)?.toDate === 'function' ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt || 0).getTime();
         bVal = typeof (b.createdAt as any)?.toDate === 'function' ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt || 0).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, search, gradeFilter, govFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, pageIndex, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#00B4D8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#00B4D8]" />;
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'إزالة طلاب',
      message: `هل أنت متأكد من إزالة ${selectedIds.size} طالب من الكورس؟`,
      onConfirm: () => {
        onRemoveStudent(Array.from(selectedIds), course);
        setSelectedIds(new Set());
        setConfirmDialog(null);
      }
    });
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return '-';
    try {
      if (typeof dateVal.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString('ar-EG');
      }
      return new Date(dateVal).toLocaleDateString('ar-EG');
    } catch {
      return '-';
    }
  };

  const uniqueGrades = useMemo(() => Array.from(new Set(students.map(s => s.grade).filter(Boolean))), [students]);
  const uniqueGovs = useMemo(() => Array.from(new Set(students.map(s => s.governorate).filter(Boolean))), [students]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm overflow-hidden" dir="rtl">
      
      {/* Top Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-[#2D2D3D] flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-[#0D0D12]/30">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، الهاتف..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPageIndex(0); }}
              className="w-full sm:w-64 pl-4 pr-10 py-2 text-sm bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none"
            />
          </div>
          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={e => { setGradeFilter(e.target.value); setPageIndex(0); }}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none"
          >
            <option value="all">كل الصفوف</option>
            {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {/* Governorate Filter */}
          <select
            value={govFilter}
            onChange={e => { setGovFilter(e.target.value); setPageIndex(0); }}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl focus:ring-2 focus:ring-[#00B4D8] outline-none"
          >
            <option value="all">كل المحافظات</option>
            {uniqueGovs.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap animate-in fade-in zoom-in duration-200">
            <span className="text-xs font-bold text-gray-500 mr-2">{selectedIds.size} محدد</span>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors border border-red-100">
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </button>
            <button onClick={() => toast.success('تم تفعيل الطلاب بنجاح')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors border border-green-100">
              <CheckCircle className="w-3.5 h-3.5" />
              تفعيل
            </button>
            <button onClick={() => toast.success('تم إيقاف الطلاب بنجاح')} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold transition-colors border border-orange-100">
              <UserX className="w-3.5 h-3.5" />
              إيقاف
            </button>
            <button onClick={() => toast.success('جاري التصدير...')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#00B4D8] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-100">
              <Download className="w-3.5 h-3.5" />
              تصدير
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div 
        className="flex-1 overflow-auto bg-white dark:bg-[#1A1A24]"
        style={{ minHeight: '400px', maxHeight: '600px' }}
      >
        <div className="min-w-[1000px]">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-gray-50 dark:bg-[#0D0D12] border-b border-gray-200 dark:border-[#2D2D3D] flex items-center px-4 py-3 text-xs font-black text-gray-500 dark:text-gray-400">
            <div className="w-12 flex-shrink-0 flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#00B4D8] focus:ring-[#00B4D8]"
              />
            </div>
            <div className="w-64 flex-shrink-0 cursor-pointer flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('name')}>
              الاسم والبيانات <SortIcon field="name" />
            </div>
            <div className="w-40 flex-shrink-0 cursor-pointer flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('phone')}>
              رقم الهاتف <SortIcon field="phone" />
            </div>
            <div className="w-32 flex-shrink-0 cursor-pointer flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('grade')}>
              الصف <SortIcon field="grade" />
            </div>
            <div className="w-32 flex-shrink-0 cursor-pointer flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('governorate')}>
              المحافظة <SortIcon field="governorate" />
            </div>
            <div className="w-32 flex-shrink-0 cursor-pointer flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('createdAt')}>
              تاريخ الانضمام <SortIcon field="createdAt" />
            </div>
            <div className="flex-1 text-center">إجراءات</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col relative z-0">
            {paginatedData.map(student => {
              const isSelected = selectedIds.has(student.id);

              return (
                <div
                  key={student.id}
                  className={`flex items-center px-4 py-3 border-b border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-[#0D0D12]/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="w-12 flex-shrink-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelectOne(student.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                  </div>
                  
                  {/* Avatar & Name */}
                  <div className="w-64 flex-shrink-0 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00B4D8] to-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {student.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{student.name || 'بدون اسم'}</span>
                      <span className="text-[11px] text-gray-500 truncate">{student.email || 'لا يوجد بريد'}</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="w-40 flex-shrink-0 font-mono text-xs text-gray-600 dark:text-gray-300 truncate" dir="ltr">
                    {student.phone || '-'}
                  </div>

                  {/* Grade */}
                  <div className="w-32 flex-shrink-0">
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-[#00B4D8] px-2 py-1 rounded-md text-[11px] font-bold truncate">
                      {student.grade || '-'}
                    </span>
                  </div>

                  {/* Gov */}
                  <div className="w-32 flex-shrink-0 text-xs text-gray-600 dark:text-gray-300 truncate">
                    {student.governorate || '-'}
                  </div>

                  {/* Date */}
                  <div className="w-32 flex-shrink-0 text-xs text-gray-500 font-medium">
                    {formatDate(student.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: 'إزالة طالب',
                          message: 'هل أنت متأكد من إلغاء اشتراك هذا الطالب وحذفه من الكورس؟',
                          onConfirm: () => {
                            onRemoveStudent(student.id, course);
                            setConfirmDialog(null);
                          }
                        });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tooltip-trigger"
                      title="إزالة من الكورس"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="p-1.5 text-gray-400 hover:text-[#00B4D8] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {paginatedData.length === 0 && (
              <div className="w-full py-16 flex items-center justify-center text-gray-500 text-sm font-bold">
                لا توجد نتائج مطابقة
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-[#2D2D3D] flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30 dark:bg-[#0D0D12]/10">
        <div className="text-xs text-gray-500 font-medium">
          إجمالي النتائج: <span className="font-bold text-gray-900 dark:text-white">{filteredAndSortedData.length}</span> طالب
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">الصفوف بالصفحة:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
              className="text-xs border border-gray-200 dark:border-[#2D2D3D] rounded-md px-2 py-1 bg-white dark:bg-[#12121A] outline-none"
            >
              {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1" dir="ltr">
            <button 
              disabled={pageIndex === 0}
              onClick={() => setPageIndex(p => Math.max(0, p - 1))}
              className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-[#2D2D3D]"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="text-xs font-bold px-2">
              {pageIndex + 1} / {Math.max(1, totalPages)}
            </span>
            <button 
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
              className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-[#2D2D3D]"
            >
              <ChevronUp className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Details Drawer/Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setSelectedStudent(null)}
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1A1A24] shadow-2xl h-full flex flex-col border-l border-gray-200 dark:border-[#2D2D3D]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between bg-gray-50/50 dark:bg-[#0D0D12]/30">
                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#00B4D8]" />
                  تفاصيل الطالب
                </h3>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3D3D4D] rounded-full transition-colors text-gray-600 dark:text-gray-300"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Profile Card */}
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-[#00B4D8]/5 to-transparent rounded-2xl border border-[#00B4D8]/10">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00B4D8] to-purple-500 text-white flex items-center justify-center font-black text-3xl shadow-lg mb-4">
                    {selectedStudent.name?.charAt(0) || 'U'}
                  </div>
                  <h4 className="font-black text-xl text-gray-900 dark:text-white">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">{selectedStudent.email}</p>
                  
                  <div className="mt-4 flex gap-2 w-full">
                    {!isEditingStudent ? (
                      <button onClick={() => handleStartEdit(selectedStudent)} className="flex-1 py-2 bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2D2D3D] transition-colors flex items-center justify-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" /> تعديل
                      </button>
                    ) : (
                      <button onClick={handleSaveEdit} className="flex-1 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-bold hover:bg-[#0096B4] transition-colors flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> حفظ التعديلات
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: 'إزالة طالب',
                          message: 'هل أنت متأكد من إلغاء اشتراك هذا الطالب وحذفه من الكورس؟',
                          onConfirm: () => {
                            onRemoveStudent(selectedStudent.id, course);
                            setSelectedStudent(null);
                            setConfirmDialog(null);
                          }
                        });
                      }}
                      className="flex-1 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" /> إزالة من الكورس
                    </button>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-4">
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    المعلومات الأساسية
                  </h5>
                  
                  {isEditingStudent ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D] col-span-2">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">اسم الطالب</span>
                        <input 
                          type="text"
                          value={editFormData.name || ''}
                          onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">رقم الهاتف</span>
                        <input 
                          type="text" dir="ltr"
                          value={editFormData.phone || ''}
                          onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">رقم ولي الأمر</span>
                        <input 
                          type="text" dir="ltr"
                          value={editFormData.parentPhone || ''}
                          onChange={e => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">الصف الدراسي</span>
                        <input 
                          type="text"
                          value={editFormData.grade || ''}
                          onChange={e => setEditFormData({ ...editFormData, grade: e.target.value })}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">تاريخ الانضمام</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDate(selectedStudent.createdAt)}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">المحافظة</span>
                        <input 
                          type="text"
                          value={editFormData.governorate || ''}
                          onChange={e => setEditFormData({ ...editFormData, governorate: e.target.value })}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">المدرسة</span>
                        <input 
                          type="text"
                          value={editFormData.school || ''}
                          onChange={e => setEditFormData({ ...editFormData, school: e.target.value })}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">رقم الهاتف</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200" dir="ltr">{selectedStudent.phone || '-'}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">رقم ولي الأمر</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200" dir="ltr">{selectedStudent.parentPhone || '-'}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">الصف الدراسي</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedStudent.grade || '-'}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">تاريخ الانضمام</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDate(selectedStudent.createdAt)}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D] col-span-2">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">المحافظة والمدرسة</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedStudent.governorate || '-'} - {selectedStudent.school || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Modules placeholder */}
                <div className="space-y-4">
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    حالة الاشتراك
                  </h5>
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">مشترك حالياً في هذا الكورس</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Confirm Dialog Modal */}
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setConfirmDialog(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-[#2D2D3D]"
            >
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:text-gray-300 dark:hover:bg-[#3D3D4D] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
