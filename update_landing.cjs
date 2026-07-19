const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Replace hero title
code = code.replace(
  /<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-\[1\.2\] sm:leading-\[1\.1\] mb-4 sm:mb-6 text-gray-900 dark:text-white">([\s\S]*?)<\/h1>/g,
  '<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.2] sm:leading-[1.1] mb-4 sm:mb-6 text-gray-900 dark:text-white">{settings.heroTitle}</h1>'
);

// Replace hero subtitle
code = code.replace(
  /<p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg leading-relaxed font-medium">\s*شرح مبسط في فيديوهات قصيرة، اختبارات ذكية، ومنافسات مع أصحابك\. كل المواد اللي محتاجها من مكان واحد، وفي أي وقت\.\s*<\/p>/g,
  '<p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg leading-relaxed font-medium">{settings.heroSubtitle}</p>'
);

// Add conditionals for sections
code = code.replace(
  /<section id="grades" className="py-16 sm:py-24 relative">/g,
  '{settings.showGradesSection && (\n      <section id="grades" className="py-16 sm:py-24 relative">'
);
code = code.replace(
  /<\/section>\s*{\/\* Premium Subjects Section \*\/}/g,
  '</section>\n      )}\n\n      {/* Premium Subjects Section */}'
);

code = code.replace(
  /<section id="subjects" className="py-16 sm:py-24 relative bg-gray-50 dark:bg-\[#0D0D12\]">/g,
  '{settings.showSubjectsSection && (\n      <section id="subjects" className="py-16 sm:py-24 relative bg-gray-50 dark:bg-[#0D0D12]">'
);
code = code.replace(
  /<\/section>\s*{\/\* Premium Features Section \*\/}/g,
  '</section>\n      )}\n\n      {/* Premium Features Section */}'
);

code = code.replace(
  /<PremiumFeaturesSection \/>/g,
  '{settings.showFeaturesSection && <PremiumFeaturesSection />}'
);

code = code.replace(
  /<section className="py-16 sm:py-24 relative bg-white dark:bg-\[#1A1A24\] border-t border-gray-100 dark:border-\[#2D2D3D\]">/g,
  '{settings.showFaqSection && (\n      <section className="py-16 sm:py-24 relative bg-white dark:bg-[#1A1A24] border-t border-gray-100 dark:border-[#2D2D3D]">'
);
code = code.replace(
  /<\/section>\s*{\/\* Ultra-Premium Footer \*\/}/g,
  '</section>\n      )}\n\n      {/* Ultra-Premium Footer */}'
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
