import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, AlertTriangle, FileText, Phone, Building2, X, Award, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DeveloperOwnershipModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [isPenaltyOpen, setIsPenaltyOpen] = useState(true);

  useEffect(() => {
    let ctrlBuffer: string[] = [];
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || !e.key) return;
      // Ignore modifier key presses themselves (Control, Alt, Shift, Meta)
      if (['control', 'shift', 'alt', 'meta'].includes(e.key.toLowerCase())) {
        return;
      }

      const key = e.key.toLowerCase();

      // Must be typed while Ctrl or Cmd (Meta) is active
      if (e.ctrlKey || e.metaKey) {
        if (key === 'x' || key === '7') {
          ctrlBuffer.push(key);
          clearTimeout(timer);
          timer = setTimeout(() => {
            ctrlBuffer = [];
          }, 2000);

          // Check if sequence strictly ends with ['x', 'x', '7']
          const len = ctrlBuffer.length;
          if (
            len >= 3 &&
            ctrlBuffer[len - 3] === 'x' &&
            ctrlBuffer[len - 2] === 'x' &&
            ctrlBuffer[len - 1] === '7'
          ) {
            setIsOpen(true);
            ctrlBuffer = [];
          }
        } else {
          // Any other key pressed while holding Ctrl resets the sequence
          ctrlBuffer = [];
        }
      } else {
        // Typing without Ctrl resets the sequence immediately
        ctrlBuffer = [];
      }
    };

    // Global custom event trigger
    const handleCustomEvent = () => setIsOpen(true);
    window.addEventListener('open-dev-modal', handleCustomEvent);
    window.addEventListener('keydown', handleKeyDown);

    // Emergency console method
    (window as any).openFoxTechPortal = () => setIsOpen(true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-dev-modal', handleCustomEvent);
      clearTimeout(timer);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'FOXTECH2007') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsAuthenticated(false);
    setPassword('');
    setError(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-sans text-right" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#0D0E15] text-white rounded-3xl border border-gray-800/90 shadow-[0_0_80px_rgba(0,180,216,0.2)] overflow-hidden"
        >
          {/* Header Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-30 cursor-pointer border border-white/5"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          {!isAuthenticated ? (
            /* --- PASSWORD VERIFICATION STEP --- */
            <div className="p-8 md:p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-[#00B4D8]/20 to-[#D4AF37]/20 border border-[#00B4D8]/30 flex items-center justify-center text-[#00B4D8]">
                <Lock className="w-8 h-8" />
              </div>

              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20 mb-3 inline-block">
                Fox Tech Security Portal
              </span>

              <h2 className="text-2xl font-black text-white mb-2">
                لوحة التحكم وتوثيق المطور
              </h2>
              <p className="text-xs text-gray-400 font-medium mb-6 leading-relaxed">
                هذه المنطقة مخصصة لإثبات المالك والمطور الأساسي للمنصة. يرجى إدخال مفتاح الوصول الفائق.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الفائقة..."
                    className="w-full pr-11 pl-4 py-3.5 rounded-xl bg-white/5 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-[#00B4D8] text-sm text-center font-mono tracking-widest transition-all"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>كلمة المرور غير صحيحة - تم تسجيل المحاولة!</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096C7] hover:to-[#005F73] text-white font-extrabold text-sm shadow-lg shadow-[#00B4D8]/20 transition-all cursor-pointer"
                >
                  التحقق والوصول للوثيقة
                </button>
              </form>
            </div>
          ) : (
            /* --- MASTER OFFICIAL CERTIFICATE DASHBOARD --- */
            <div className="p-5 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              
              {/* Header Title & Stamp */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#00B4D8] to-[#D4AF37] p-[2px] shrink-0">
                    <div className="w-full h-full bg-[#0D0E15] rounded-[14px] flex items-center justify-center text-[#00B4D8]">
                      <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                        Fox Tech Software Solutions
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        المالك الفعلي للمنصة
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      وثيقة إثبات الملكية الفكرية وتسليم النظام المبرمج
                    </p>
                  </div>
                </div>

                {/* Company Phone */}
                <a
                  href="https://wa.me/201034859313"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-gray-800 hover:border-[#00B4D8] text-gray-200 hover:text-white transition-all text-xs font-bold flex items-center gap-2 shrink-0"
                >
                  <Phone className="w-4 h-4 text-[#00B4D8]" />
                  <span>هاتف الشركة:</span>
                  <span dir="ltr" className="font-mono text-[#00B4D8] text-xs">01034859313</span>
                </a>
              </div>

              {/* Founders / Managing Directors Section */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-gray-800/80">
                <div className="text-xs font-black text-[#D4AF37] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>مؤسسو ومديرو الشركة المعتمَدون (Founders & Managing Directors)</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] flex items-center justify-center font-black text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Ahmed Maher Zain</div>
                      <div className="text-[11px] text-gray-400 font-bold">أحمد ماهر زين - Co-Founder & CEO</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-black text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Anas Abdelaziz Abdelfattah</div>
                      <div className="text-[11px] text-gray-400 font-bold">أنس عبد العزيز عبد الفتاح - Co-Founder & CTO</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handover & Contract Summary */}
              <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4 sm:p-5 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00B4D8]" />
                    <span>بيانات العقد والتسليم الموثق</span>
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    مكتمل ومسدد بالكامل ✓
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/30 border border-gray-800/60">
                    <div className="text-gray-400 font-medium mb-1">العميل المستلم:</div>
                    <div className="font-black text-white text-sm">الأستاذ / ياسر</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-gray-800/60">
                    <div className="text-gray-400 font-medium mb-1">رقم هاتف العميل:</div>
                    <div dir="ltr" className="font-black text-white text-sm font-mono text-right">01070555634</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-gray-800/60">
                    <div className="text-gray-400 font-medium mb-1">تاريخ التسليم الرسمي:</div>
                    <div className="font-black text-[#00B4D8] text-sm font-mono">22 / 07 / 2026</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-gray-800/60 sm:col-span-2 lg:col-span-3">
                    <div className="text-gray-400 font-medium mb-1">قيمة العقد المسددة:</div>
                    <div className="font-black text-[#D4AF37] text-base">
                      7,000 جنيه مصري <span className="text-xs text-gray-400 font-normal">(سبعة آلاف جنيه مصري)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intellectual Property & Penalty Clause Accordion (حقوق الملكية والعقوبات) */}
              <div className="rounded-2xl bg-red-500/5 border border-red-500/20 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsPenaltyOpen(!isPenaltyOpen)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer hover:bg-red-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-red-400 font-black text-xs sm:text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>تنبيه حقوق الملكية الفكرية والعقوبات القانونية</span>
                  </div>
                  <div className="p-1 rounded-lg bg-red-500/10 text-red-400">
                    {isPenaltyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isPenaltyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 space-y-3 border-t border-red-500/10">
                        <p className="text-xs text-gray-300 leading-relaxed font-medium mt-3">
                          تُعتبر جميع الأكواد البرمجية، والمكونات الهندسية، والتصاميم التفاعلية الخاصة بـ <strong className="text-white font-black">منصة Teachland</strong> ملكية فكرية حصرية ومحفوظة لشركة <strong className="text-[#00B4D8] font-black">Fox Tech</strong>.
                        </p>

                        <div className="p-4 rounded-xl bg-black/50 border border-red-500/30 text-xs text-red-200 space-y-2.5 font-bold">
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 shrink-0">⚠️</span>
                            <span><strong>حظر الادعاء والتضليل:</strong> يُمنع منعاً باتاً على أي شخص أو جهة مستلمة ادعاء تطوير أو برمجة المنصة أو نسبة جهد البرمجة لنفسه أمام العملاء أو أطراف خارجية.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 shrink-0">⚖️</span>
                            <span><strong>عقوبة المخالفة:</strong> في حال ثبوت الانتهاك أو التضليل، يحق لشركة Fox Tech إلغاء الترخيص الفني فوراً، وتجميد الخدمات البرمجية للمنصة، والملاحقة القضائية طبقاً لقانون حماية الملكية الفكرية رقم 82 لسنة 2002 وجرائم تقنية المعلومات.</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Seal & Verification Signature */}
              <div className="pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-400 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>الرمز البرمجي موثق ومحمى بصمة Fox Tech الرقمية 2026</span>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
                >
                  إغلاق اللوحة
                </button>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

