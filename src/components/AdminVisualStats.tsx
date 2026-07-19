import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { CheckCircle2, Archive, GraduationCap, TrendingUp, Sparkles } from 'lucide-react';

interface AdminVisualStatsProps {
  users: any[];
  progressRecords: any[];
}

export default function AdminVisualStats({ users, progressRecords }: AdminVisualStatsProps) {
  // 1. Identify all students
  const students = useMemo(() => {
    return users.filter(u => u.role === 'student' || !u.role);
  }, [users]);

  const activeStudents = useMemo(() => {
    return students.filter(s => !s.isArchived);
  }, [students]);

  const archivedStudents = useMemo(() => {
    return students.filter(s => s.isArchived === true);
  }, [students]);

  // 2. Map student progress records
  const studentProgressMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    progressRecords.forEach((rec) => {
      if (rec.userId) {
        if (!map[rec.userId]) {
          map[rec.userId] = [];
        }
        const percent = typeof rec.progressPercent === 'number' 
          ? rec.progressPercent 
          : (Array.isArray(rec.completedLessons) && rec.lessonsCount 
              ? (rec.completedLessons.length / rec.lessonsCount) * 100 
              : 0);
        map[rec.userId].push(percent);
      }
    });

    const finalMap: Record<string, number> = {};
    Object.keys(map).forEach((uid) => {
      const arr = map[uid];
      if (arr.length > 0) {
        const sum = arr.reduce((sumVal, val) => sumVal + val, 0);
        finalMap[uid] = Math.round(sum / arr.length);
      } else {
        finalMap[uid] = 0;
      }
    });
    return finalMap;
  }, [progressRecords]);

  // 3. Compute overall average progress for all students (or active ones)
  const averageProgress = useMemo(() => {
    if (students.length === 0) return 0;
    const totalProgress = students.reduce((acc, student) => {
      const prog = studentProgressMap[student.id] || 0;
      return acc + prog;
    }, 0);
    return Math.round(totalProgress / students.length);
  }, [students, studentProgressMap]);

  // 4. Pie Chart Data (Active vs Archived)
  const pieData = useMemo(() => {
    return [
      { name: 'طلاب نشطون', value: activeStudents.length, color: '#00B4D8' },
      { name: 'طلاب مؤرشفون', value: archivedStudents.length, color: '#F59E0B' }
    ];
  }, [activeStudents, archivedStudents]);

  // 5. Bar Chart Data (Average Progress by Grade level)
  const gradeChartData = useMemo(() => {
    const gradesMap: Record<string, { totalProgress: number; count: number }> = {};
    
    students.forEach(student => {
      const grade = student.grade || 'غير محدد';
      const progress = studentProgressMap[student.id] || 0;
      
      if (!gradesMap[grade]) {
        gradesMap[grade] = { totalProgress: 0, count: 0 };
      }
      gradesMap[grade].totalProgress += progress;
      gradesMap[grade].count += 1;
    });

    return Object.keys(gradesMap)
      .map(gradeName => {
        const data = gradesMap[gradeName];
        return {
          name: gradeName,
          'متوسط التقدم (%)': Math.round(data.totalProgress / data.count),
          'عدد الطلاب': data.count
        };
      })
      .sort((a, b) => {
        // Sort nicely if possible, put 'غير محدد' at the end
        if (a.name === 'غير محدد') return 1;
        if (b.name === 'غير محدد') return -1;
        return a.name.localeCompare(b.name, 'ar');
      });
  }, [students, studentProgressMap]);

  // Avoid rendering empty or broken layouts if no students
  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] text-center">
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">لا يوجد بيانات كافية للطلاب لعرض الإحصائيات المرئية حالياً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Stats Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Card */}
        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-[#00B4D8] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block">الطلاب النشطين</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">{activeStudents.length} طالب</span>
            </div>
          </div>
          <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-[#00B4D8] py-1 px-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
            {students.length > 0 ? Math.round((activeStudents.length / students.length) * 100) : 0}%
          </span>
        </div>

        {/* Archived Card */}
        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center shrink-0">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block">الطلاب مؤرشفين</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">{archivedStudents.length} طالب</span>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-500 py-1 px-2.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
            {students.length > 0 ? Math.round((archivedStudents.length / students.length) * 100) : 0}%
          </span>
        </div>

        {/* Avg Progress Card */}
        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block">متوسط التقدم الدراسي</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">{averageProgress}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-black text-purple-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>شامل</span>
          </div>
        </div>
      </div>

      {/* Main Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie/Donut Chart: Student Status */}
        <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">حالة حسابات الطلاب</h3>
            <p className="text-xs font-bold text-gray-400 mt-1">توزيع الطلاب المسجلين بالمنصة بين نشطين ومؤرشفين</p>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    direction: 'rtl', 
                    borderRadius: '16px', 
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#1F2937' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{students.length}</span>
              <span className="text-[10px] font-bold text-gray-400">إجمالي الطلاب</span>
            </div>
          </div>

          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-[#2D2D3D]">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 justify-center">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">{item.name}</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{item.value} طالب</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Progress by Grade */}
        <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">متوسط التقدم الدراسي حسب الصفوف</h3>
            <p className="text-xs font-bold text-gray-400 mt-1">نسبة إنجاز الدروس والمناهج لكل صف دراسي بالمتوسط</p>
          </div>

          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gradeChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="opacity-40" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    direction: 'rtl', 
                    borderRadius: '16px', 
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 'bold'
                  }}
                  labelStyle={{ color: '#00B4D8', fontWeight: 'black', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="متوسط التقدم (%)" 
                  fill="#00B4D8" 
                  radius={[10, 10, 0, 0]} 
                  maxBarSize={45}
                >
                  {gradeChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'غير محدد' ? '#9CA3AF' : '#00B4D8'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
