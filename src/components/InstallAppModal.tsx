import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Smartphone, Laptop, Sparkles, Check, 
  Share, PlusSquare, ArrowRight, Chrome, Apple, MonitorPlay 
} from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { settings } = usePlatformSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [activeStep, setActiveStep] = useState(0);

  // Detect environment and listen to beforeinstallprompt
  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Detect device type
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 3. Listen for browser install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Track display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const triggerNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 140 }}
          className="relative w-full max-w-lg bg-white/95 dark:bg-[#0F0F16]/98 backdrop-blur-2xl rounded-[2.5rem] p-0.5 overflow-hidden z-10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-transparent"
          dir="rtl"
          id="install-app-modal-panel"
        >
          {/* Outer Gold/Cyan Neon Border Stroke */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00B4D8]/30 via-transparent to-[#0077B6]/30 dark:from-[#D4AF37]/30 dark:via-transparent dark:to-[#B8860B]/30 pointer-events-none rounded-[2.5rem]" />

          <div className="relative bg-white dark:bg-[#0F0F16] rounded-[2.4rem] p-6 sm:p-9 space-y-6 overflow-hidden">
            {/* Header Ambient Radial Light Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-[#00B4D8]/15 to-transparent dark:from-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 left-6 w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-[#151522] dark:hover:bg-[#1C1C2D] text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all border border-gray-100 dark:border-white/5 hover:scale-110 active:scale-95 cursor-pointer"
              id="install-modal-close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Platform Branding */}
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <motion.div 
                animate={{ 
                  scale: [1, 1.04, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-18 h-18 rounded-[1.5rem] bg-gradient-to-tr from-[#0077B6] via-[#00B4D8] to-[#00E5FF] dark:from-[#B8860B] dark:via-[#D4AF37] dark:to-[#FFEAA7] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/20 select-none"
              >
                {settings.logoChar || 'T'}
              </motion.div>
              
              <div className="space-y-1.5 max-w-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-[#00B4D8]/10 text-[#0077B6] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} /> 
                  نسخة الويب الرسمية الفخمة
                </span>
                
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  تثبيت تطبيق {settings.platformName || 'Teachland'}
                </h3>
                
                <p className="text-xs sm:text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                  قم بتنزيل المنصة الآن لتجربة تصفح غامرة، تحميل فوري للمواد، مراجعات خالية من القيود وتصفح مستقل كامل!
                </p>
              </div>
            </div>

            {/* If app is already installed */}
            {isInstalled ? (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400">التطبيق مثبت بالفعل!</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                    أنت تقوم بتشغيل {settings.platformName || 'Teachland'} من تطبيق الويب التقدمي المعتمد. استمتع بتجربة فائقة السرعة!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Device Type Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-150 dark:border-[#20202C]">
                  <button
                    onClick={() => setDeviceType('ios')}
                    className={`py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deviceType === 'ios'
                        ? 'bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-[#2D2D3D]'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>آيفون / آيباد</span>
                  </button>
                  <button
                    onClick={() => setDeviceType('android')}
                    className={`py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deviceType === 'android'
                        ? 'bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-[#2D2D3D]'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>أندرويد</span>
                  </button>
                  <button
                    onClick={() => setDeviceType('desktop')}
                    className={`py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deviceType === 'desktop'
                        ? 'bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-[#2D2D3D]'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>كمبيوتر / متصفح</span>
                  </button>
                </div>

                {/* Step Content */}
                <div className="min-h-[140px] flex flex-col justify-center">
                  {/* iOS Safari Guide */}
                  {deviceType === 'ios' && (
                    <div className="space-y-3.5 animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          1
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                          افتح الرابط في متصفح <span className="font-black text-[#00B4D8] dark:text-[#D4AF37]">Safari</span> الرئيسي لجهاز الآيفون الخاص بك.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          2
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed flex flex-wrap items-center gap-1">
                          اضغط على زر المشاركة السفلي
                          <Share className="w-4 h-4 text-blue-500 mx-1 inline-block" />
                          الموجود في قائمة سفاري بالأسفل.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          3
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed flex flex-wrap items-center gap-1">
                          قم بالتمرير للأسفل قليلاً واضغط على
                          <span className="font-black text-gray-950 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <PlusSquare className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                            إضافة إلى الصفحة الرئيسية
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Android Chrome Guide */}
                  {deviceType === 'android' && (
                    <div className="space-y-4 animate-fadeIn">
                      {deferredPrompt ? (
                        <div className="text-center p-3 space-y-3">
                          <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400">
                            جهاز الأندرويد الخاص بك يدعم التثبيت بنقرة واحدة! اضغط بالأسفل لبدء التنزيل فوراً.
                          </p>
                          <button
                            onClick={triggerNativeInstall}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            id="btn-trigger-android-install"
                          >
                            <Download className="w-4 h-4" />
                            <span>تثبيت التطبيق فوراً 📲</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              1
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed flex flex-wrap items-center gap-1">
                              اضغط على النقاط الثلاثة
                              <span className="font-mono font-black text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded leading-none">⋮</span>
                              في الزاوية العلوية لمتصفح Chrome.
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              2
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                              اختر <span className="font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-950 dark:text-white">تثبيت التطبيق</span> أو <span className="font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-950 dark:text-white">إضافة إلى الشاشة الرئيسية</span>.
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              3
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                              سيظهر التطبيق كأيقونة مستقلة على هاتفك لسهولة الاستخدام!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Desktop / Browser Guide */}
                  {deviceType === 'desktop' && (
                    <div className="space-y-4 animate-fadeIn">
                      {deferredPrompt ? (
                        <div className="text-center p-3 space-y-3">
                          <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400">
                            جهاز الكمبيوتر الخاص بك يدعم تثبيت منصة {settings.platformName} كتطبيق مستقل لسطح المكتب!
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={triggerNativeInstall}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00B4D8] via-[#0077B6] to-[#00B4D8] text-white font-black text-sm px-6 py-4 rounded-2xl shadow-xl shadow-[#00B4D8]/20 transition-all cursor-pointer border border-white/10"
                            id="btn-trigger-desktop-install"
                          >
                            <Download className="w-5 h-5 animate-bounce" />
                            <span>تثبيت لسطح المكتب بضغطة واحدة 💻</span>
                          </motion.button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300 leading-relaxed">
                            لتنزيل المنصة على حاسوبك الشخصي كبرنامج مستقل:
                          </p>
                          <div className="p-5 bg-gray-50/50 dark:bg-[#12121E]/60 border border-gray-150 dark:border-[#2D2D3F]/80 rounded-[1.5rem] space-y-3 relative overflow-hidden backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-xl pointer-events-none" />
                            <div className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300">
                              <Chrome className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                              <span>من خلال شريط العنوان بالأعلى في متصفحك:</span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                              اضغط على أيقونة التثبيت <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-mono font-black mx-1">⊕</span> أو زر <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-white">Install App</span> في شريط العنوان بالأعلى لتثبيت التطبيق على جهازك فوراً.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Benefits List (Bento-style Grid) */}
                <div className="pt-4 border-t border-gray-100 dark:border-[#20202C] space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">مميزات تطبيق الموبايل والكمبيوتر المعتمد:</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-gray-50/40 dark:bg-[#131320]/40 rounded-2xl border border-gray-100/50 dark:border-[#202030]/50 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-[#151525] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">بدون شريط عنوان</span>
                    </div>
                    <div className="p-3 bg-gray-50/40 dark:bg-[#131320]/40 rounded-2xl border border-gray-100/50 dark:border-[#202030]/50 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-[#151525] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">تحميل فوري وتلقائي</span>
                    </div>
                    <div className="p-3 bg-gray-50/40 dark:bg-[#131320]/40 rounded-2xl border border-gray-100/50 dark:border-[#202030]/50 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-[#151525] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">إشعارات تفاعلية للبث</span>
                    </div>
                    <div className="p-3 bg-gray-50/40 dark:bg-[#131320]/40 rounded-2xl border border-gray-100/50 dark:border-[#202030]/50 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-[#151525] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">حماية كاملة للبث</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-[#171725] dark:hover:bg-[#202032] text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-xs font-black border border-gray-150 dark:border-[#252538] transition-all cursor-pointer text-center"
                    id="btn-close-and-browse"
                  >
                    حسناً، تصفح المنصة الآن
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
