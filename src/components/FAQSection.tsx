import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

const defaultFaqs = [
  {
    question: "كيف يمكنني الوصول إلى الكورسات التي اشتركت بها؟",
    answer: "يمكنك الوصول إلى الكورسات التي اشتركت بها من خلال قسم 'موادي' في القائمة الجانبية أو السفلية. ستجد هناك جميع الكورسات الخاصة بك."
  },
  {
    question: "لماذا لا يعمل الفيديو أو يظهر شاشة سوداء؟",
    answer: "تأكد من استقرار اتصالك بالإنترنت. إذا استمرت المشكلة، جرب تحديث الصفحة أو استخدام متصفح مختلف. بعض الفيديوهات قد تتطلب بضع ثوانٍ للتحميل في البداية."
  },
  {
    question: "كيف يمكنني تغيير كلمة المرور أو تحديث بياناتي؟",
    answer: "يمكنك تحديث بياناتك الشخصية وتغيير كلمة المرور من خلال الانتقال إلى صفحة الإعدادات عبر الضغط على صورتك الشخصية في أعلى الشاشة واختيار 'الملف الشخصي'."
  },
  {
    question: "ماذا أفعل إذا واجهت مشكلة في الدفع؟",
    answer: "إذا واجهت أي مشكلة أثناء عملية الدفع أو شحن الرصيد، يرجى التواصل مع فريق الدعم الفني وتزويدهم برقم العملية المرجعي للمساعدة الفورية."
  },
  {
    question: "هل يمكنني مشاهدة الدروس أوفلاين (بدون إنترنت)؟",
    answer: "في الوقت الحالي، مشاهدة الدروس تتطلب اتصالاً بالإنترنت لحماية المحتوى وضمان جودة المشاهدة، ولكننا نعمل على توفير خيارات إضافية في المستقبل."
  }
];

export default function FAQSection() {
  const { settings } = usePlatformSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const activeFaqs = (settings.customFaqs && settings.customFaqs.length > 0)
    ? settings.customFaqs.map(f => ({ question: f.q, answer: f.a }))
    : defaultFaqs;

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{settings.faqTitle || 'الأسئلة الشائعة'}</h2>
        <p className="text-gray-600 dark:text-gray-400">{settings.faqSubtitle || 'إجابات سريعة للأسئلة الأكثر شيوعاً لمساعدتك في استخدام المنصة.'}</p>
      </div>

      <div className="space-y-4">
        {activeFaqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] overflow-hidden"
          >
            <button
              onClick={() => toggleOpen(index)}
              className="w-full text-right px-6 py-4 flex items-center justify-between focus:outline-none hover:bg-gray-50 dark:hover:bg-[#222230] transition-colors"
            >
              <span className="font-bold text-gray-900 dark:text-white text-lg">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37] shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100 dark:border-[#2D2D3D] bg-gray-50 dark:bg-[#222230]/30 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-12 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl p-6 text-center border border-[#00B4D8]/20 dark:border-[#D4AF37]/20">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لم تجد إجابة لسؤالك؟</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">فريق الدعم الفني متاح دائمًا لمساعدتك في أي وقت.</p>
        <button className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-colors shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20">
          تواصل مع الدعم الفني
        </button>
      </div>
    </div>
  );
}
