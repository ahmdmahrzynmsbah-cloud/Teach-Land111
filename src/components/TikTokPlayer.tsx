import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function TikTokPlayer({ videoUrl }: { videoUrl: string }) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const resolveUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to parse locally first to avoid unnecessary fetch if it's already a full url
        if (videoUrl.includes('/video/') || videoUrl.includes('/photo/') || videoUrl.includes('/v/')) {
          const match = videoUrl.match(/\/(?:video|photo|v)\/(\d+)/);
          if (match && match[1]) {
            if (active) {
              setEmbedUrl(`https://www.tiktok.com/embed/v2/${match[1]}`);
              setLoading(false);
            }
            return;
          }
        }

        // If not full url, ask the server to resolve the redirect
        const res = await fetch(`/api/resolve-tiktok?url=${encodeURIComponent(videoUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.videoId && active) {
            setEmbedUrl(`https://www.tiktok.com/embed/v2/${data.videoId}`);
          } else if (active) {
            setError('Could not resolve video');
          }
        } else if (active) {
          setError('Could not resolve video');
        }
      } catch (err) {
        console.error("TikTok resolution error:", err);
        if (active) setError('Error connecting to video');
      } finally {
        if (active) setLoading(false);
      }
    };

    resolveUrl();
    return () => {
      active = false;
    };
  }, [videoUrl]);

  // TikTok official brand SVG Icon
  const TikTokIcon = () => (
    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.97 1.2 2.37 1.99 3.84 2.27.01 1.47-.02 2.94-.03 4.41-.88-.04-1.75-.24-2.57-.59-.87-.37-1.66-.91-2.31-1.6-.02 3.41.02 6.82-.01 10.23-.05 1.41-.42 2.81-1.09 4.04-.71 1.34-1.81 2.45-3.15 3.16-1.32.72-2.82 1.07-4.32 1.02-1.62-.03-3.23-.48-4.61-1.34C1.94 21.6 1 20.08.52 18.36c-.52-1.84-.34-3.83.49-5.54.77-1.6 2.1-2.9 3.73-3.59 1.15-.51 2.4-.71 3.65-.62.01 1.47-.01 2.93-.01 4.4-.82-.07-1.66.07-2.4.45-.69.34-1.26.89-1.63 1.56-.4.71-.5 1.55-.28 2.34.22.82.74 1.53 1.44 1.99.73.49 1.62.67 2.48.51.85-.14 1.61-.63 2.08-1.37.38-.59.54-1.29.5-1.99.02-5.41-.02-10.82.01-16.23.11-.07.23-.13.35-.19z"/>
    </svg>
  );

  if (loading) {
    return (
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#0D0D12] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#fe2c55] mb-4" />
        <span className="text-sm font-black tracking-wide text-gray-300">جاري تحميل مقطع تيك توك...</span>
      </div>
    );
  }

  if (error || !embedUrl) {
    const match = videoUrl.match(/\/(?:video|photo|v)\/(\d+)/);
    const fallbackUrl = match && match[1]
      ? `https://www.tiktok.com/embed/v2/${match[1]}` 
      : videoUrl;

    const isShortUrl = !videoUrl.includes('/video/') && !videoUrl.includes('/photo/') && !videoUrl.includes('/v/') && !videoUrl.includes('/embed/');

    return (
      <div className="absolute inset-0 w-full h-full bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center text-white">
        {isShortUrl ? (
          <div className="max-w-md space-y-4 px-4" dir="rtl">
            <div className="w-16 h-16 mx-auto bg-[#fe2c55]/10 rounded-full flex items-center justify-center text-[#fe2c55] border border-[#fe2c55]/20 animate-pulse">
              <TikTokIcon />
            </div>
            <h3 className="text-lg font-black text-white">رابط تيك توك مختصر</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-bold">
              يتطلب تشغيل هذا المقطع فتحه في تيك توك مباشرة أو إلغاء حظر ملفات الارتباط الخارجية في متصفحك.
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#fe2c55] hover:bg-[#e11d48] text-white font-black text-xs md:text-sm px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
            >
              <TikTokIcon />
              <span>اضغط هنا لمشاهدة الفيديو مباشرة 🔗</span>
            </a>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full relative bg-black">
            <iframe
              src={fallbackUrl}
              className="absolute inset-0 w-full h-full border-0 z-10"
              title="TikTok Video Fallback"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
            {/* Elegant Floating Action Button */}
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-[#fe2c55] hover:bg-[#e11d48] text-white font-black text-xs md:text-sm px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 hover:shadow-[#fe2c55]/30 hover:shadow-xl"
              title="فتح في تطبيق تيك توك مباشرة"
            >
              <TikTokIcon />
              <span>فتح في تيك توك ↗</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full relative bg-black">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0 z-10"
        title="TikTok Video"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      />
      {/* Elegant Floating Action Button */}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-[#fe2c55] hover:bg-[#e11d48] text-white font-black text-xs md:text-sm px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 hover:shadow-[#fe2c55]/30 hover:shadow-xl"
        title="فتح في تطبيق تيك توك مباشرة"
      >
        <TikTokIcon />
        <span>فتح في تيك توك ↗</span>
      </a>
    </div>
  );
}
