import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface CleanYoutubePlayerProps {
  videoUrl: string;
  title?: string;
}

// Global script loader helper to avoid multiple injections
let sdkLoaded = false;
let sdkCallbacks: Array<() => void> = [];

const loadYoutubeSDK = (callback: () => void) => {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  sdkCallbacks.push(callback);

  if (document.getElementById('youtube-iframe-api-script')) {
    return;
  }

  const tag = document.createElement('script');
  tag.id = 'youtube-iframe-api-script';
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    sdkLoaded = true;
    sdkCallbacks.forEach(cb => cb());
    sdkCallbacks = [];
  };
};

const extractYoutubeId = (url: string) => {
  if (!url) return '';
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  } catch {
    return '';
  }
};

export default function CleanYoutubePlayer({ videoUrl, title }: CleanYoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = extractYoutubeId(videoUrl);

  // Initialize Player
  useEffect(() => {
    if (!videoId) {
      setError('رابط غير صالح');
      setIsLoading(false);
      return;
    }

    const uniqueId = `yt-player-${Math.random().toString(36).substr(2, 9)}`;
    if (playerElementRef.current) {
      playerElementRef.current.id = uniqueId;
    }

    const initPlayer = () => {
      try {
        playerRef.current = new window.YT.Player(uniqueId, {
          videoId: videoId,
          playerVars: {
            controls: 0,          // Hide YouTube default controls completely
            modestbranding: 1,    // Minimize branding
            rel: 0,               // No related videos from other channels
            iv_load_policy: 3,    // Hide annotations
            disablekb: 1,         // Disable keyboard controls
            fs: 0,                // Disable default fullscreen
            playsinline: 1,       // Inline play on iOS
            showinfo: 0,          // Deprecated but good to include
            wmode: 'transparent'
          },
          events: {
            onReady: (event: any) => {
              setIsLoading(false);
              setDuration(event.target.getDuration());
              event.target.setVolume(volume);
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: PLAYING (1), PAUSED (2), ENDED (0), BUFFERING (3)
              const state = event.data;
              if (state === 1) {
                setIsPlaying(true);
                startProgressTracker();
              } else if (state === 2) {
                setIsPlaying(false);
                stopProgressTracker();
              } else if (state === 0) {
                setIsPlaying(false);
                stopProgressTracker();
                setCurrentTime(0);
                playerRef.current?.seekTo(0);
              } else if (state === 3) {
                // Buffering
              }
            },
            onError: (err: any) => {
              console.error('YouTube Player Error:', err);
              setError('عذراً، حدث خطأ في تشغيل الفيديو');
              setIsLoading(false);
            }
          }
        });
      } catch (e) {
        console.error('Player initialization failed:', e);
        setError('تعذر تحميل مشغل الفيديو');
        setIsLoading(false);
      }
    };

    loadYoutubeSDK(initPlayer);

    return () => {
      stopProgressTracker();
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore destruction errors
        }
      }
    };
  }, [videoId]);

  // Track progress when video is playing
  const startProgressTracker = () => {
    stopProgressTracker();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 250);
  };

  const stopProgressTracker = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // Change Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  // Seek Timeline
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (playerRef.current) {
      playerRef.current.seekTo(val, true);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen to fullscreen changes (e.g. Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Time Formatter
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full bg-black overflow-hidden group flex items-center justify-center select-none"
      id="clean-video-player-root"
    >
      {/* 1. YouTube Player Container (With pointer-events-none to block standard hover/click cards) */}
      <div className="absolute inset-0 w-full h-[120%] -top-[10%] pointer-events-none overflow-hidden scale-[1.01]">
        <div ref={playerElementRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* 2. Seamless Interceptor Overlay (Plays/pauses video on click) */}
      <div 
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full cursor-pointer z-10"
      />

      {/* 3. Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0A0A10] flex flex-col items-center justify-center gap-3 z-30 animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-[#00B4D8] dark:text-[#D4AF37]" />
          <span className="text-xs font-black text-gray-400">جاري تهيئة البث الآمن...</span>
        </div>
      )}

      {/* 4. Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-[#0A0A10] flex flex-col items-center justify-center gap-3 p-4 text-center z-30">
          <span className="text-red-500 font-black text-sm">{error}</span>
          <span className="text-xs text-gray-400 font-bold">يرجى التحقق من الرابط في لوحة التحكم</span>
        </div>
      )}

      {/* 5. Center Big Pulsing Play Button (When Paused) */}
      {!isPlaying && !isLoading && !error && (
        <button
          onClick={togglePlay}
          className="absolute w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-20 animate-bounce-slow"
          id="custom-center-play-button"
        >
          <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white translate-x-0.5" />
        </button>
      )}

      {/* 6. Customized Branded Badge (Hides the YouTube Watermark perfectly) */}
      {!isLoading && !error && (
        <div 
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5 pointer-events-none z-20"
          id="custom-branded-badge"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37] animate-pulse" />
          <span className="text-[10px] font-black text-white tracking-wider">TEACHLAND STREAM</span>
        </div>
      )}

      {/* 7. Fully Custom Premium Controller Bar */}
      {!isLoading && !error && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-3 transition-all duration-300 z-20 ${
            isHovered || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          id="custom-player-control-bar"
        >
          {/* Custom Progress Scrubber / Timeline */}
          <div className="flex items-center gap-2 group/timeline">
            <span className="text-[10px] font-black text-gray-300 font-mono w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-gray-600/50 rounded-lg appearance-none cursor-pointer accent-[#00B4D8] dark:accent-[#D4AF37] hover:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, ${isMuted ? '#6B7280' : '#00B4D8'} 0%, ${isMuted ? '#6B7280' : '#00B4D8'} ${(currentTime / (duration || 1)) * 100}%, rgba(156, 163, 175, 0.3) ${(currentTime / (duration || 1)) * 100}%, rgba(156, 163, 175, 0.3) 100%)`
              }}
            />
            <span className="text-[10px] font-black text-gray-300 font-mono w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Left/Right Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                id="bar-play-pause-btn"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />}
              </button>

              {/* Mute / Unmute */}
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                id="bar-mute-unmute-btn"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>

              {/* Volume Slider */}
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-gray-600/50 rounded-lg appearance-none cursor-pointer accent-[#00B4D8] dark:accent-[#D4AF37]"
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${isMuted ? 0 : volume}%, rgba(156, 163, 175, 0.3) ${isMuted ? 0 : volume}%, rgba(156, 163, 175, 0.3) 100%)`
                }}
              />
            </div>

            {/* Right Controls: Brand Title & Fullscreen */}
            <div className="flex items-center gap-3">
              {title && (
                <span className="hidden sm:inline-block text-[10px] font-black text-gray-400 max-w-[200px] truncate">
                  {title}
                </span>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                id="bar-fullscreen-btn"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
