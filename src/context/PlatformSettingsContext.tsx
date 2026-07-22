import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlatformSettings } from '../types';

export const defaultSettings: PlatformSettings = {
  platformName: 'Teachland',
  logoChar: 'T',
  heroTitle: 'مدرستك كلها في جيبك',
  heroSubtitle: 'شرح مبسط في فيديوهات قصيرة، اختبارات ذكية، ومنافسات مع أصحابك. كل المواد اللي محتاجها من مكان واحد، وفي أي وقت.',
  showGradesSection: true,
  showSubjectsSection: true,
  showFeaturesSection: true,
  showFaqSection: true,
  gradesTitle: 'الصفوف الدراسية المتاحة',
  gradesSubtitle: 'اختر صفك الدراسي المعتمد وابدأ رحلة تميزك الأكاديمي مع أقوى شرح تفاعلي ونخبة من عمالقة التدريس.',
  featuresBadge: 'مستقبل التعليم الرقمي',
  featuresTitle: 'منصة تعليمية بمعايير عالمية',
  featuresSubtitle: 'تجربة تعليمية متكاملة مصممة بذكاء لتناسب احتياجات كل طالب، مع أدوات تحليل وتتبع تضمن التفوق المستمر.',
  featuresListTitle: 'كل ما تحتاجه للنجاح',
  featuresList: [
    { id: '1', iconName: 'Play', title: 'تعلم مصغر وذكي', desc: 'دروس مقسمة لوحدات صغيرة لزيادة التركيز وتسهيل الفهم.' },
    { id: '2', iconName: 'Target', title: 'اختبارات تفاعلية', desc: 'تقييم مستمر بعد كل درس لضمان استيعابك الكامل للمفاهيم.' },
    { id: '3', iconName: 'BarChart3', title: 'تحليلات متقدمة', desc: 'تتبع دقيق لأدائك مع تقارير مخصصة توضح نقاط القوة والضعف.' },
    { id: '4', iconName: 'Zap', title: 'مسارات مخصصة', desc: 'خوارزميات ذكية تكيف المحتوى حسب سرعتك وأسلوبك في التعلم.' },
    { id: '5', iconName: 'Smartphone', title: 'تجربة سلسة', desc: 'تعلم في أي وقت ومن أي مكان عبر تطبيق مصمم بعناية فائقة.' },
    { id: '6', iconName: 'Shield', title: 'بيئة آمنة وموثوقة', desc: 'محتوى معتمد ومراجع من قبل نخبة من أفضل المعلمين والخبراء.' }
  ],
  journeyTitle: 'رحلة الطالب نحو التفوق',
  journeySteps: [
    { id: '1', title: 'التقييم المبدئي', desc: 'نحلل مستواك الحالي لنرسم لك المسار الأنسب.' },
    { id: '2', title: 'رحلة التعلم', desc: 'تدرس المفاهيم خطوة بخطوة مع تدريبات مستمرة.' },
    { id: '3', title: 'المراجعة الذكية', desc: 'نركز على نقاط ضعفك لضمان إتقانك لكل درس.' },
    { id: '4', title: 'التفوق النهائي', desc: 'تكون مستعداً تماماً لاجتياز الامتحانات بثقة.' }
  ],
  statsCounters: [
    { id: '1', value: 50, suffix: 'K+', label: 'طالب نشط' },
    { id: '2', value: 98, suffix: '%', label: 'نسبة النجاح' },
    { id: '3', value: 120, suffix: '+', label: 'دورة تدريبية' },
    { id: '4', value: 4, suffix: '.9', label: 'تقييم المنصة' }
  ],
  subjectsTitle: 'استكشف المواد الدراسية',
  subjectsSubtitle: 'نخبة من أفضل المعلمين يقدمون لك شرحاً وافياً ومبسطاً لكل المواد الدراسية بمختلف المراحل.',
  faqTitle: 'الأسئلة الشائعة',
  faqSubtitle: 'إجابات على كل استفساراتك حول المنصة',
  vodafoneCashNumber: '',
  isVodafoneCashEnabled: true,
  instapayHandle: '',
  isInstapayEnabled: true,
  bankAccountDetails: '',
  isBankAccountEnabled: true,
  customPaymentMethods: [],
  subjects: [
    { id: 'math', title: 'الرياضيات', iconName: 'Calculator', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
    { id: 'physics', title: 'الفيزياء', iconName: 'Zap', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400' },
    { id: 'chemistry', title: 'الكيمياء', iconName: 'FlaskConical', color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
    { id: 'biology', title: 'الأحياء', iconName: 'Dna', color: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' },
    { id: 'arabic', title: 'اللغة العربية', iconName: 'Languages', color: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
    { id: 'english', title: 'اللغة الإنجليزية', iconName: 'BookOpenText', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
    { id: 'history', title: 'التاريخ', iconName: 'Scroll', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
    { id: 'geography', title: 'الجغرافيا', iconName: 'Globe', color: 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' }
  ],
  customFaqs: [
    {
      id: '1',
      q: 'هل تسجيل الدخول وإنشاء الحساب في المنصة مجاني؟',
      a: 'نعم، التسجيل في المنصة مجاني تماماً ويمكنك استكشاف الواجهة وتجربة بعض الدروس المجانية، ولفتح الكورسات والمواد كاملة يمكنك الاشتراك في الباقات المتاحة.'
    },
    {
      id: '2',
      q: 'إزاي أقدر أشترك في الباقات أو أشحن المحفظة؟',
      a: 'نوفر عدة طرق سهلة ومريحة تشمل: الدفع الإلكتروني (فودافون كاش، إنستا باي، التحويل البنكي)، أو شحن رصيد المحفظة باستخدام كروت الشحن وأكواد التفعيل.'
    },
    {
      id: '3',
      q: 'هل يمكنني مشاهدة الدروس أو تحميل المذكرات؟',
      a: 'يمكنك مشاهدة جميع دروسك أونلاين بجودة عالية وبدون تقطيع، كما يمكنك تحميل جميع المذكرات والملخصات بصيغة PDF لمذاكرتها ومراجعتها في أي وقت.'
    },
    {
      id: '4',
      q: 'ماذا أفعل إذا واجهت أي مشكلة تقنية أو استفسار؟',
      a: 'يمكنك التواصل مباشرة مع فريق الدعم الفني المباشر عبر زر الواتساب أو صفحة الدعم الفني المتاحة بالمنصة وسنكون سعيدين بتقديم المساعدة الفورية لك.'
    }
  ],
  contactPhone: '+20 100 123 4567',
  floatingWhatsappNumber: '201001234567',
  isFloatingWhatsappEnabled: true,
  contactEmail: 'support@tafawwoq-edu.com',
  contactAddress: 'جمهورية مصر العربية، القاهرة، مدينة نصر.',
  socialLinks: {
    facebook: '#',
    twitter: '#',
    youtube: '#',
    instagram: '#'
  },
  logoUrl: '',
  quduratVideoUrl: '',
  tahsiliVideoUrl: '',
  quduratVideoProvider: 'youtube',
  tahsiliVideoProvider: 'youtube',
  quduratVideoTitle: 'الفيديو التعريفي لمسار القدرات 🎯',
  tahsiliVideoTitle: 'الفيديو التعريفي لمسار التحصيلي 🚀',
  quduratVideoPoster: '',
  tahsiliVideoPoster: '',
  heroVideoUrl: '',
  heroVideoProvider: 'youtube',
  heroVideoTitle: 'الفيديو التعريفي لمنصة Teachland 🚀',
  heroVideoPoster: '',
  privacyPolicyText: `مرحباً بك في سياسة الخصوصية الخاصة بالمنصة. خصوصيتك وأمان بياناتك هي أهم أولوياتنا.

١. البيانات التي نقوم بجمعها:
نقوم بجمع البيانات الأساسية اللازمة لإنشاء حسابك الدراسي وتشمل: الاسم الكامل، رقم الهاتف، البريد الإلكتروني، والمستوى الدراسي.

٢. كيف نستخدم بياناتك ونحميها؟
تُستخدم البيانات فقط لتقديم تجربة تعليمية مخصصة، ومتابعة تقدمك في المواد، جميع البيانات مشفرة بالكامل عبر خوادم مأمنة ومحمية ببروتوكولات حماية متطورة.

٣. سرية المعلومات والجهات الخارجية:
نلتزم التزاماً تاماً بعدم بيع أو مشاركة أو تأجير أي من بياناتك الشخصية لأي جهة تجارية أو إعلانية خارجية.

٤. أمان العمليات والمدفوعات:
تتم جميع العمليات المالية وشحن المحافظ عبر قنوات معتمدة وتخضع لأقصى معايير الأمان الرقمي.`,
  termsConditionsText: `باستخدامك للمنصة، فإنك توافق على الالتزام الكامل بالشروط والأحكام التالية المبرمة لضمان بيئة تعليمية عادلة ومثمرة لجميع الطلاب.

١. شروط الاستخدام والحسابات:
المنصة مخصصة للاستخدام الشخصي فقط. يحق لكل طالب تسجيل حساب واحد فقط. يمنع منعاً باتاً مشاركة بيانات تسجيل الدخول مع أي شخص آخر.

٢. المحتوى التعليمي والاشتراكات:
توفر المنصة محتوى مجاني وآخر مدفوع. بمجرد إتمام الشراء، يصبح المحتوى متاحاً للطالب طوال فترة العام الدراسي.

٣. قواعد السلوك العام والتعليقات:
يُمنع منعاً باتاً نشر أي تعليقات مسيئة أو غير لائقة في أقسام الأسئلة والتعليقات تحت المحاضرات.

٤. النزاهة في الاختبارات:
تحتفظ إدارة المنصة بالحق في مراجعة تقدم الطلاب الحاصلين على المراكز الأولى لضمان عدم وجود تلاعب أو غش.`,
  intellectualPropertyText: `الملكية الفكرية للمنصة محمية بموجب القوانين النافذة لحماية حقوق المؤلف والملكية الفكرية.

١. حقوق المؤلف الحصرية للمواد العلمية:
جميع المحاضرات المرئية، الفيديوهات التوضيحية، بنوك الأسئلة، الاختبارات، والمذكرات الرقمية هي ملكية فكرية حصرية للمنصة والمدرسين.

٢. الحظر القانوني وعقوبة تسريب المحتوى:
يُحظر تماماً وبشكل قاطع: تسجيل شاشة المحاضرات، إعادة رفع مقاطع الفيديو، أو طبع وتوزيع المذكرات خارج إطار الاستخدام الشخصي.

٣. العلامة المائية الرقمية المدمجة:
تستخدم المنصة تقنيات مائية رقمية متطورة تدمج اسم الطالب ورقم هاتفه وبيانات حسابه لتعقب وتحديد أي شخص يقوم بتسريب المحتوى.

٤. الملاحقة القانونية الصارمة:
سيتم ملاحقة أي محاولة للتعدي على حقوق الملكية الفكرية قضائياً وجنائياً بالتنسيق مع الجهات المختصة.`
};

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  loading: boolean;
  updateSettings: (newSettings: PlatformSettings) => Promise<void>;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  updateSettings: async () => {},
});

export const usePlatformSettings = () => useContext(PlatformSettingsContext);

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'platform_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...docSnap.data() } as PlatformSettings);
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching platform settings:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateSettings = async (newSettings: PlatformSettings) => {
    // Optimistic update
    setSettings(newSettings);
    try {
      await setDoc(doc(db, 'platform_settings', 'config'), newSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      // Revert if error? Maybe just toast it.
      throw error;
    }
  };

  return (
    <PlatformSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};
