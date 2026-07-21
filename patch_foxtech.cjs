const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const oldComponent = `const _0x1a2b = () => {
  const [b, setB] = useState('');
  useEffect(() => {
    setB(atob('Rm94IFRlY2g='));
    const t = setInterval(() => {
      const el = document.getElementById('_sys_brand');
      if (!el || !el.innerHTML.includes(atob('Rm94IFRlY2g='))) {
        document.body.innerHTML = '';
      }
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div id="_sys_brand" className="flex items-center gap-1">
      <span>{decodeURIComponent('%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D9%88%D8%AA%D8%B7%D9%88%D9%8A%D8%B1%20%D8%A8%D9%83%D9%84%20%D8%AD%D8%A8%20%E2%9D%A4%EF%B8%8F%20%D8%A8%D9%88%D8%A7%D8%B3%D8%B7%D8%A9')}</span>
      <a 
        href={atob('aHR0cHM6Ly93YS5tZS8yMDEwMzQ4NTkzMTM=')} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-1 text-[#00B4D8] dark:text-[#D4AF37] hover:text-[#0077B6] dark:hover:text-[#B8860B] hover:underline font-extrabold transition-all duration-200"
      >
        <span>{b}</span>
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
      </a>
    </div>
  );
};`;

const newComponent = `const _0x1a2b = () => {
  return (
    <div id="_sys_brand" className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-[#1A1A24] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm">
      <div className="flex flex-col items-center md:items-start text-center md:text-right">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">تصميم وتطوير بكل حب ❤️ بواسطة</span>
        <span className="text-lg font-black bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent">
          Fox Tech
        </span>
      </div>
      
      <div className="hidden md:block w-px h-10 bg-gray-200 dark:bg-[#2D2D3D] mx-2"></div>

      <div className="flex items-center gap-3">
        {/* WhatsApp */}
        <a 
          href="https://wa.me/201034859313" 
          target="_blank" 
          rel="noopener noreferrer" 
          title="تواصل معنا عبر واتساب"
          className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white dark:hover:bg-green-500 transition-all duration-300 hover:scale-110 shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
        </a>
        
        {/* Telegram */}
        <a 
          href="https://t.me/FoxTech_1" 
          target="_blank" 
          rel="noopener noreferrer"
          title="قناتنا على تليجرام"
          className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 transition-all duration-300 hover:scale-110 shadow-sm"
        >
          <Send className="w-5 h-5" />
        </a>
        
        {/* TikTok */}
        <a 
          href="https://www.tiktok.com/@fox.tech_1" 
          target="_blank" 
          rel="noopener noreferrer"
          title="حسابنا على تيك توك"
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 hover:scale-110 shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
        </a>
        
        {/* Facebook */}
        <a 
          href="https://www.facebook.com/share/195WhiV182/" 
          target="_blank" 
          rel="noopener noreferrer"
          title="صفحتنا على فيسبوك"
          className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all duration-300 hover:scale-110 shadow-sm"
        >
          <LucideIcons.Facebook className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};`;

code = code.replace(oldComponent, newComponent);
fs.writeFileSync('src/components/LandingPage.tsx', code);
