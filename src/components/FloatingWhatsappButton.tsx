import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingWhatsappButton() {
  const { settings } = usePlatformSettings();

  if (!settings?.isFloatingWhatsappEnabled || !settings?.floatingWhatsappNumber) {
    return null;
  }

  const handleWhatsappClick = () => {
    const sanitizedNumber = settings.floatingWhatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${sanitizedNumber}`, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 25
        }}
        className="fixed bottom-8 left-8 z-[100] group"
      >
        <div className="relative flex items-center justify-center">
          {/* Subtle pulse using pure CSS for smooth, jitter-free animation */}
          <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" style={{ animationDuration: '2.5s' }} />

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWhatsappClick}
            className="relative p-3.5 sm:p-4 bg-gradient-to-tr from-[#1EBE5D] to-[#25D366] text-white rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.5)] transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/20"
            aria-label="تواصل معنا عبر واتساب"
          >
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-sm relative z-10" />
          </motion.button>

          {/* Tooltip */}
          <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-white dark:bg-[#1A1A24] text-gray-800 dark:text-gray-100 text-xs font-bold rounded-xl opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none whitespace-nowrap hidden sm:block shadow-lg border border-gray-100 dark:border-white/10 z-20">
            تواصل معنا
            {/* Tooltip Arrow */}
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-[#1A1A24] border-l border-b border-gray-100 dark:border-white/10 rotate-45 rounded-sm" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
