import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { 
  Play, CheckCircle2, TrendingUp, Sparkles, BookOpen, Clock, 
  BarChart3, Zap, Shield, Target, Smartphone, Laptop 
} from 'lucide-react';

const AnimatedCounter = ({ value, label, suffix = "" }: { value: number, label: string, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 backdrop-blur-sm">
      <div className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
        {count}{suffix}
      </div>
      <div className="text-sm font-bold text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
};

export default function PremiumFeaturesSection() {
  const features = [
    {
      icon: <Play className="w-6 h-6 text-[#D4AF37]" />,
      title: "تعلم مصغر وذكي",
      desc: "دروس مقسمة لوحدات صغيرة لزيادة التركيز وتسهيل الفهم.",
    },
    {
      icon: <Target className="w-6 h-6 text-[#D4AF37]" />,
      title: "اختبارات تفاعلية",
      desc: "تقييم مستمر بعد كل درس لضمان استيعابك الكامل للمفاهيم.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-[#D4AF37]" />,
      title: "تحليلات متقدمة",
      desc: "تتبع دقيق لأدائك مع تقارير مخصصة توضح نقاط القوة والضعف.",
    },
    {
      icon: <Zap className="w-6 h-6 text-[#D4AF37]" />,
      title: "مسارات مخصصة",
      desc: "خوارزميات ذكية تكيف المحتوى حسب سرعتك وأسلوبك في التعلم.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#D4AF37]" />,
      title: "تجربة سلسة",
      desc: "تعلم في أي وقت ومن أي مكان عبر تطبيق مصمم بعناية فائقة.",
    },
    {
      icon: <Shield className="w-6 h-6 text-[#D4AF37]" />,
      title: "بيئة آمنة وموثوقة",
      desc: "محتوى معتمد ومراجع من قبل نخبة من أفضل المعلمين والخبراء.",
    }
  ];

  const journeySteps = [
    { title: "التقييم المبدئي", desc: "نحلل مستواك الحالي لنرسم لك المسار الأنسب." },
    { title: "رحلة التعلم", desc: "تدرس المفاهيم خطوة بخطوة مع تدريبات مستمرة." },
    { title: "المراجعة الذكية", desc: "نركز على نقاط ضعفك لضمان إتقانك لكل درس." },
    { title: "التفوق النهائي", desc: "تكون مستعداً تماماً لاجتياز الامتحانات بثقة." }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 lg:py-28 relative overflow-hidden bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white dir-rtl border-t border-gray-100 dark:border-white/5" dir="rtl">
      {/* Background Gradients & Shapes */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#00B4D8]/5 dark:bg-white/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-white/5 border border-[#D4AF37]/20 dark:border-white/10 mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">مستقبل التعليم الرقمي</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight tracking-tight text-gray-900 dark:text-white">
              منصة تعليمية <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] dark:from-[#D4AF37] dark:via-[#FACC15] dark:to-[#D4AF37]">بمعايير عالمية</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
              تجربة تعليمية متكاملة مصممة بذكاء لتناسب احتياجات كل طالب، مع أدوات تحليل وتتبع تضمن التفوق المستمر.
            </p>
          </motion.div>
        </div>

        {/* 6 Premium Feature Cards */}
        <div className="mb-32">
           <div className="text-center mb-16">
             <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4">كل ما تحتاجه للنجاح</h3>
           </div>
           
           <motion.div 
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, margin: "-50px" }}
             variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {}
             }}
             className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
           >
              {features.map((feature, i) => (
                 <motion.div
                    key={i}
                    variants={{
                       hidden: { opacity: 0, y: 30 },
                       visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                    }}
                    className="group relative p-8 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl dark:hover:shadow-none transition-all duration-500 overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 dark:group-hover:from-[#D4AF37]/10 group-hover:to-transparent transition-colors duration-500 pointer-events-none"></div>
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] dark:group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:border-[#D4AF37]/30">
                       {feature.icon}
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#B8860B] dark:group-hover:text-[#D4AF37] transition-colors">{feature.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{feature.desc}</p>
                 </motion.div>
              ))}
           </motion.div>
        </div>

        {/* Animated Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-32 relative z-20">
           <AnimatedCounter value={50} suffix="K+" label="طالب نشط" />
           <AnimatedCounter value={98} suffix="%" label="نسبة النجاح" />
           <AnimatedCounter value={120} suffix="+" label="دورة تدريبية" />
           <AnimatedCounter value={4} suffix=".9" label="تقييم المنصة" />
        </div>

        {/* Interactive Timeline Journey */}
        <div className="max-w-4xl mx-auto">
           <div className="text-center mb-16">
             <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4">رحلة الطالب نحو التفوق</h3>
           </div>
           
           <div className="relative border-r-2 border-gray-200 dark:border-white/10 pr-8 md:pr-0 md:border-r-0">
              {/* Desktop Center Line */}
              <div className="hidden md:block absolute top-0 bottom-0 right-1/2 translate-x-px w-0.5 bg-gradient-to-b from-transparent via-gray-200 dark:via-white/10 to-transparent"></div>
              
              <div className="space-y-12 md:space-y-24">
                 {journeySteps.map((step, i) => (
                    <motion.div 
                       key={i}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: "-50px" }}
                       transition={{ duration: 0.6, delay: i * 0.15 }}
                       className={`relative flex flex-col md:flex-row gap-8 items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                    >
                       <div className="md:w-1/2 w-full text-right md:px-12 relative">
                          <div className="md:hidden absolute top-1/2 -right-[41px] -translate-y-1/2 w-4 h-4 rounded-full bg-[#D4AF37] ring-4 ring-white dark:ring-[#111]"></div>
                          <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#D4AF37] ring-8 ring-white dark:ring-[#0A0A0A] ${i % 2 === 0 ? '-left-[9px]' : '-right-[9px]'}`}></div>
                          
                          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/50 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl dark:hover:shadow-none transition-all duration-300">
                             <div className="text-[#B8860B] dark:text-[#D4AF37] font-black text-xl mb-2">٠{i + 1}</div>
                             <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h4>
                             <p className="text-gray-500 dark:text-gray-400 text-sm">{step.desc}</p>
                          </div>
                       </div>
                       <div className="md:w-1/2 hidden md:block"></div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </section>
  );
}
