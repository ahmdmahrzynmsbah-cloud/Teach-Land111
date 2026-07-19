import React, { useState, useEffect } from 'react';

export default function BunnyVideoPlayer({ videoId }: { videoId: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    fetch(`/api/bunny/play-url/${videoId}`)
      .then(res => res.json())
      .then(data => setUrl(data.url))
      .catch(err => console.error(err));
  }, [videoId]);

  if (!url) return <div className="w-full h-full flex items-center justify-center text-white">Loading...</div>;

  return (
    <iframe 
      src={url}
      loading="lazy"
      style={{border: 'none', position: 'absolute', top: 0, height: '100%', width: '100%'}}
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
      allowFullScreen
    />
  );
}
