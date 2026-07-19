import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center justify-center transition-all hover:ring-2 hover:ring-[#00B4D8]/50 dark:hover:ring-[#D4AF37]/50"
      title={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4 md:w-5 md:h-5 text-[#F5A623]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
