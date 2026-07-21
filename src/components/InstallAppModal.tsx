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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#12121A] rounded-[2rem] border border-gray-150 dark:border-[#2D2D3D] shadow-2xl overflow-hidden z-10"
          dir="rtl"
          id="install-app-modal-panel"
        >
          {/* Header Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-[#00B4D8]/10 to-transparent dark:from-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 left-5 w-9 h-9 rounded-full bg-gray-50 dark:bg-[#1A1A24] text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center transition-all border border-gray-100 dark:border-[#222230] hover:scale-105"
            id="install-modal-close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content Body */}
          <div className="p-6 sm:p-8 space-y-6 pt-10">
            {/* Platform Branding */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 border border-white/10 select-none">
                {settings.logoChar || 'T'}
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00B4D8]/10 text-[#0077B6] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]">
                  <Sparkles className="w-3 h-3" /> متاح الآن مجاناً
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  تثبيت تطبيق منصة {settings.platformName || 'Teachland'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  احصل على وصول فوري ومباشر لدروسك ومراجعاتك من الشاشة الرئيسية بدون إعلانات أو قيود!
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
                          <button
                            onClick={triggerNativeInstall}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            id="btn-trigger-desktop-install"
                          >
                            <Download className="w-4 h-4" />
                            <span>تثبيت لسطح المكتب الآن 💻</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                            لتنزيل المنصة على حاسوبك الشخصي:
                          </p>
                          <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] border border-gray-150 dark:border-[#20202C] rounded-2xl space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
                              <Chrome className="w-4 h-4 text-blue-500" />
                              <span>من خلال متصفح Chrome أو Edge:</span>
                            </div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                              اضغط على أيقونة التنزيل <span className="font-mono font-black text-[#00B4D8] dark:text-[#D4AF37]">⊕</span> أو <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Install App</span> في شريط العنوان بالأعلى لتثبيت التطبيق بضغطة واحدة.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Benefits List */}
                <div className="pt-2 border-t border-gray-100 dark:border-[#20202C] space-y-2.5">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">مميزات تطبيق الموبايل والكمبيوتر:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>تصفح بدون شريط عنوان</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>تحميل فوري وتلقائي</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>إشعارات الحصص والدروس</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>تأمين وحماية كاملة للبث</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1C1C28] dark:hover:bg-[#252538] text-gray-700 dark:text-gray-200 text-xs font-black transition-all cursor-pointer text-center"
                    id="btn-close-and-browse"
                  >
                    حسناً، تصفح المنصة الآن
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
