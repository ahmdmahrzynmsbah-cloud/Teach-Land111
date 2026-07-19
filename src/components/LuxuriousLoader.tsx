import { motion } from 'motion/react';

interface LuxuriousLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LuxuriousLoader({ fullScreen = false, size = 'md', text }: LuxuriousLoaderProps) {
  const containerClasses = fullScreen
    ? "min-h-screen w-full bg-gray-50 dark:bg-[#0D0D12] flex flex-col items-center justify-center p-4 relative overflow-hidden"
    : "flex flex-col items-center justify-center p-6 relative";

  const sizeMap = {
    sm: { 
      ring: "w-8 h-8",
      border: "border-2",
      font: "text-[11px]", 
      textMargin: "mt-3" 
    },
    md: { 
      ring: "w-12 h-12",
      border: "border-[3px]",
      font: "text-xs", 
      textMargin: "mt-4" 
    },
    lg: { 
      ring: "w-16 h-16",
      border: "border-[3px]",
      font: "text-sm", 
      textMargin: "mt-5" 
    },
  };

  const selectedSize = sizeMap[size];

  return (
    <div className={containerClasses}>
      {/* Decorative background gradients for full screen luxurious feel */}
      {fullScreen && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#0077B6]/5 dark:bg-[#B8860B]/5 blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative flex items-center justify-center">
        {/* Glow behind the spinner */}
        <div className={`absolute ${selectedSize.ring} bg-gradient-to-tr from-[#00B4D8]/20 to-[#0077B6]/20 dark:from-[#D4AF37]/20 dark:to-[#B8860B]/20 rounded-full blur-xl animate-pulse scale-150`} />
        
        {/* Simple Elegant Ring Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className={`${selectedSize.ring} relative z-10`}
        >
          {/* Background Track */}
          <div className={`absolute inset-0 rounded-full ${selectedSize.border} border-gray-200/60 dark:border-gray-800/60`} />
          
          {/* Spinning Indicator */}
          <div className={`absolute inset-0 rounded-full ${selectedSize.border} border-transparent border-t-[#00B4D8] dark:border-t-[#D4AF37] border-r-[#00B4D8] dark:border-r-[#D4AF37]`} />
        </motion.div>
      </div>

      {/* Elegant Pulsing/Fading Loading Text */}
      {(text || fullScreen) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${selectedSize.textMargin} flex flex-col items-center gap-1.5 z-10`}
        >
          <span className={`${selectedSize.font} font-black text-gray-800 dark:text-gray-100 flex items-center gap-2`}>
            {text || "جاري تحميل Teachland..."}
            {/* Elegant Dots Animation */}
            <span className="flex gap-0.5">
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1 h-1 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.25 }} className="w-1 h-1 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.5 }} className="w-1 h-1 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
            </span>
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-wider">يرجى الانتظار لحظة</span>
        </motion.div>
      )}
    </div>
  );
}
