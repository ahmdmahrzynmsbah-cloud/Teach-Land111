import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Sparkles, Monitor, Smartphone, AppWindow } from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import InstallAppModal from './InstallAppModal';

export default function InstallPromptBanner() {
  const { settings } = usePlatformSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Check if PWA is already installed or running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Check if the user previously dismissed the banner
    const dismissed = localStorage.getItem('teachland_pwa_banner_dismissed') === 'true';
    setIsDismissed(dismissed);

    // 3. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If we got the native prompt event, make sure the banner is shown
      if (!isStandalone && !dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Fallback: If after 4 seconds we haven't fired beforeinstallprompt, 
    // but the app is NOT installed and NOT dismissed, we still want to show 
    // our beautiful banner on desktops/laptops to guide them to install!
    const timer = setTimeout(() => {
      if (!isStandalone && !dismissed) {
        setShowBanner(true);
      }
    }, 4000);

    // 5. Track display mode changes (e.g. if they install it)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowBanner(false);
      }
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger the browser's native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else {
      // If native prompt is not available (Safari, Firefox, Chrome on some devices), 
      // open our beautiful modal containing simple, clear instructions!
      setIsModalOpen(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
    localStorage.setItem('teachland_pwa_banner_dismissed', 'true');
  };

  // If already installed, dismissed, or banner is not ready to show, return null
  if (isInstalled || isDismissed || !showBanner) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 100, scale: 0.9, rotateX: 15 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 120,
            duration: 0.6
          }}
          className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-[99] rounded-3xl p-0.5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-default"
          dir="rtl"
          id="pwa-install-banner-root"
        >
          {/* Animated Magic Gradient Border Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00B4D8] via-[#00E5FF] to-[#0077B6] dark:from-[#D4AF37] dark:via-[#FFEAA7] dark:to-[#B8860B] opacity-80 animate-gradient-xy" />

          {/* Frosted Glass Body */}
          <div className="relative bg-white/90 dark:bg-[#0F0F16]/95 backdrop-blur-2xl rounded-[1.35rem] p-6 space-y-5 overflow-hidden">
            {/* Ambient Back Glow */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#0077B6]/15 dark:bg-[#B8860B]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex gap-4 relative z-10">
              {/* Ultra High-end Animated Icon */}
              <motion.div 
                animate={{ 
                  y: [0, -6, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0077B6] via-[#00B4D8] to-[#00E5FF] dark:from-[#B8860B] dark:via-[#D4AF37] dark:to-[#FFEAA7] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/25 border border-white/20"
              >
                <AppWindow className="w-7 h-7" />
              </motion.div>

              {/* Title, Badge & Description */}
              <div className="flex-1 space-y-1.5 pr-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm animate-pulse">
                    <Sparkles className="w-2.5 h-2.5" />
                    تنزيل رسمي سريع
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
                </div>
                
                <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  تثبيت منصة {settings.platformName || 'Teachland'}
                </h4>
                
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                  احصل على وصول مستقل فائق السرعة وبث مباشر للدروس والمراجعات بنقرة واحدة!
                </p>
              </div>

              {/* Close Button with premium feedback */}
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all self-start p-1.5 rounded-xl hover:bg-gray-150 dark:hover:bg-white/10 hover:scale-110 active:scale-95 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-white/5"
                title="إغلاق التنبيه"
                id="btn-dismiss-pwa-banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Premium Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-[#2D2D3D] to-transparent" />

            {/* Action Buttons */}
            <div className="flex gap-2.5 relative z-10">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0077B6] via-[#00B4D8] to-[#0077B6] dark:from-[#B8860B] dark:via-[#D4AF37] dark:to-[#B8860B] bg-[length:200%_auto] hover:bg-right text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/15 transition-all duration-300 cursor-pointer border border-white/10"
                id="btn-confirm-pwa-install"
              >
                <Download className="w-4.5 h-4.5 animate-bounce" />
                <span>تثبيت التطبيق الآن</span>
              </motion.button>

              <button
                onClick={handleDismiss}
                className="px-4 py-3 text-xs font-black text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-[#151522] dark:hover:bg-[#1C1C2D] border border-gray-150 dark:border-[#20202F] rounded-2xl transition-all cursor-pointer"
                id="btn-ignore-pwa-install"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Guide Instruction Modal */}
      <InstallAppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
