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
  contactPhone: '+20 100 123 4567',
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
  heroVideoUrl: '',
  heroVideoProvider: 'youtube',
  heroVideoTitle: 'الفيديو التعريفي لمنصة Teachland 🚀'
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
        setSettings(docSnap.data() as PlatformSettings);
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
