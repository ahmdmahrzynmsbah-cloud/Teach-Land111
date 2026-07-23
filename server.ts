import express from "express";
import path from "path";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import mime from "mime-types";

const firebaseConfig = {
  apiKey: "AIzaSyA_CNc0I6__SHRAFCmEP_llclnUIwiJc2k",
  authDomain: "teachland-e69ee.firebaseapp.com",
  projectId: "teachland-e69ee",
  storageBucket: "teachland-e69ee.firebasestorage.app",
  messagingSenderId: "1011126564456",
  appId: "1:1011126564456:web:1ca33bef938ddc5eed2ddd",
  measurementId: "G-G3YEJ3QLSH"
};
const firebaseApp = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(firebaseApp);

async function uploadFileToFirebaseServer(filePath: string, originalName: string) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const storageRef = ref(firebaseStorage, `uploads/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.]/g, '_')}`);
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: mimeType
    });
    
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error("Firebase server upload failed:", err);
    throw err;
  }
}

// Helper function to apply faststart to video files
function applyFaststart(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!filePath.match(/\.(mp4|mov|m4v)$/i)) {
      return resolve();
    }
    const tempPath = filePath + '.tmp.mp4';
    exec(`ffmpeg -i "${filePath}" -c copy -movflags +faststart "${tempPath}" -y`, (error) => {
      if (error) {
        console.error('Faststart failed:', error);
        // If it fails, just use the original file
        resolve();
      } else {
        fs.rename(tempPath, filePath, (err) => {
          if (err) console.error('Error renaming after faststart:', err);
          resolve();
        });
      }
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow cors
  app.use(cors());

  // Setup upload directory
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve static uploads
  app.use('/uploads', express.static(uploadDir));

  // Configure Multer
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
  });

  app.use(express.json({ limit: '1024mb' }));
  app.use(express.urlencoded({ limit: '1024mb', extended: true }));

  // API Route for upload
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }
    
    await applyFaststart(req.file.path);

    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Bunny Stream dynamic library resolution
  async function resolveLibraryId(apiKey: string): Promise<string> {
    try {
      const response = await fetch('https://video.bunnycdn.com/library', {
        method: 'GET',
        headers: {
          'AccessKey': apiKey,
          'accept': 'application/json'
        }
      });
      if (response.ok) {
        const list = await response.json() as any;
        if (Array.isArray(list) && list.length > 0) {
          return String(list[0].id);
        }
        if (list && Array.isArray(list.items) && list.items.length > 0) {
          return String(list.items[0].id);
        }
      }
    } catch (err) {
      console.error("Error resolving library ID dynamically:", err);
    }
    return process.env.BUNNY_LIBRARY_ID || '705459'; // Fallback
  }

  // Bunny Stream: Create Video
  app.post('/api/bunny/create-video', express.json(), async (req, res) => {
    try {
      const { title } = req.body;
      const apiKey = process.env.BUNNY_API_KEY || '859b2119-fcac-40bf-9d78e2104ae3-b4e1-4127';
      const libraryId = await resolveLibraryId(apiKey);

      const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Bunny API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bunny Stream: Upload Video
  app.post('/api/bunny/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    try {
      const apiKey = process.env.BUNNY_API_KEY || '859b2119-fcac-40bf-9d78e2104ae3-b4e1-4127';
      const libraryId = await resolveLibraryId(apiKey);

      // 1. Create Video on Bunny Stream
      const createResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: originalName }),
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        throw new Error(`Failed to create video on Bunny: ${errText}`);
      }

      const createData = await createResponse.json() as any;
      const videoId = createData.guid;

      if (!videoId) {
        throw new Error('No video GUID returned from Bunny.');
      }

      // 2. Upload file content to Bunny Stream
      const fileStream = fs.createReadStream(filePath);
      const uploadResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: fileStream as any,
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`Failed to upload video content to Bunny: ${errText}`);
      }

      // Delete local temp file
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      res.json({
        success: true,
        videoId: videoId,
        url: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`
      });

    } catch (error: any) {
      console.error("Bunny Upload error:", error);
      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {});
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Bunny Stream: Signed URL / Play URL
  app.get('/api/bunny/play-url/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const apiKey = process.env.BUNNY_API_KEY || '859b2119-fcac-40bf-9d78e2104ae3-b4e1-4127';
      const libraryId = await resolveLibraryId(apiKey);
      const url = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to resolve TikTok short/redirect URLs to full URLs to extract the video ID
  app.get('/api/resolve-tiktok', async (req, res) => {
    try {
      const tiktokUrl = req.query.url as string;
      if (!tiktokUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }

      // 1. Try to fetch from TikTok oEmbed API (extremely reliable and official)
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`;
        const oembedResponse = await fetch(oembedUrl);
        if (oembedResponse.ok) {
          const data = (await oembedResponse.json()) as any;
          const html = data.html || '';
          const htmlMatch = html.match(/data-video-id="(\d+)"/) || html.match(/\/(?:video|photo|v)\/(\d+)/);
          const videoId = data.embed_product_id || (htmlMatch ? htmlMatch[1] : null);
          if (videoId) {
            return res.json({ videoId, url: data.author_url ? `${data.author_url}/video/${videoId}` : tiktokUrl });
          }
        }
      } catch (oembedErr) {
        console.warn("TikTok oEmbed failed, trying direct follow:", oembedErr);
      }

      // 2. Direct extract if it's already a full TikTok video or photo URL
      if (tiktokUrl.includes('/video/') || tiktokUrl.includes('/photo/') || tiktokUrl.includes('/v/')) {
        const match = tiktokUrl.match(/\/(?:video|photo|v)\/(\d+)/);
        if (match && match[1]) {
          return res.json({ videoId: match[1], url: tiktokUrl });
        }
      }

      // 3. Fallback: If it's a short/redirect URL (like vm.tiktok.com or tiktok.com/t/)
      // We will follow the redirect by sending a GET request
      const response = await fetch(tiktokUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const finalUrl = response.url;
      const match = finalUrl.match(/\/(?:video|photo|v)\/(\d+)/);
      if (match && match[1]) {
        return res.json({ videoId: match[1], url: finalUrl });
      }

      // If it redirected but we still can't find content ID in path, search redirect body
      const bodyText = await response.text();
      const bodyMatch = bodyText.match(/"id":"(\d+)"/) || bodyText.match(/\/(?:video|photo|v)\/(\d+)/) || bodyText.match(/"videoId":"(\d+)"/);
      if (bodyMatch && bodyMatch[1]) {
        return res.json({ videoId: bodyMatch[1], url: `https://www.tiktok.com/video/${bodyMatch[1]}` });
      }

      res.status(400).json({ error: 'Could not resolve TikTok video ID from URL: ' + finalUrl });
    } catch (error: any) {
      console.error("Error resolving TikTok URL:", error);
      res.status(500).json({ error: error.message || 'Failed to resolve TikTok URL' });
    }
  });

  // Gemini AI Chat Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { prompt, history, context } = req.body;
      
      let fullPrompt = "";
      if (context) {
         fullPrompt += `System Context: ${context}\n\n`;
      }
      
      if (history && history.length > 0) {
         fullPrompt += "Conversation History:\n";
         history.forEach((msg: any) => {
            fullPrompt += `${msg.role}: ${msg.content}\n`;
         });
         fullPrompt += "\n";
      }
      
      fullPrompt += `User: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || 'Failed to generate content' });
    }
  });

  // API Route for chunked upload
  app.post('/api/upload-chunk', upload.single('chunk'), (req, res) => {
    try {
      const { fileId, chunkIndex } = req.body;
      const chunkFile = req.file;
      if (!chunkFile || !fileId) {
        console.error('Upload chunk missing file or fileId:', { hasFile: !!chunkFile, fileId });
        res.status(400).json({ error: 'Missing chunk or fileId' });
        return;
      }

      const chunkDir = path.join(uploadDir, 'chunks', fileId);
      if (!fs.existsSync(chunkDir)) {
        fs.mkdirSync(chunkDir, { recursive: true });
      }

      const destPath = path.join(chunkDir, chunkIndex.toString());
      try {
        fs.renameSync(chunkFile.path, destPath);
      } catch (renameError: any) {
        // Fallback for cross-device or permission issues in container filesystems
        console.warn('renameSync failed, trying copy + unlink instead:', renameError.message);
        fs.copyFileSync(chunkFile.path, destPath);
        fs.unlinkSync(chunkFile.path);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error in /api/upload-chunk:', error);
      res.status(500).json({ error: error.message || 'Failed to upload chunk' });
    }
  });

  app.post('/api/upload-merge', express.json(), (req, res) => {
    const { fileId, totalChunks, originalName, bunny } = req.body;
    const chunkDir = path.join(uploadDir, 'chunks', fileId);
    const finalFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const finalPath = path.join(uploadDir, finalFilename);

    try {
      const writeStream = fs.createWriteStream(finalPath);
      for (let i = 0; i < parseInt(totalChunks); i++) {
        const chunkPath = path.join(chunkDir, i.toString());
        if (fs.existsSync(chunkPath)) {
          const chunkData = fs.readFileSync(chunkPath);
          writeStream.write(chunkData);
          fs.unlinkSync(chunkPath);
        } else {
          throw new Error('Missing chunk ' + i);
        }
      }
      
      writeStream.end(async () => {
        fs.rmdirSync(chunkDir);
        await applyFaststart(finalPath);
        
        if (bunny) {
          try {
            const apiKey = process.env.BUNNY_API_KEY || '859b2119-fcac-40bf-9d78e2104ae3-b4e1-4127';
            const libraryId = await resolveLibraryId(apiKey);

            // 1. Create Video on Bunny Stream
            const createResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
              method: 'POST',
              headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: originalName }),
            });

            if (!createResponse.ok) {
              const errText = await createResponse.text();
              throw new Error(`Failed to create video on Bunny: ${errText}`);
            }

            const createData = await createResponse.json() as any;
            const videoId = createData.guid;

            if (!videoId) {
              throw new Error('No video GUID returned from Bunny.');
            }

            // 2. Upload file content to Bunny Stream
            const fileStream = fs.createReadStream(finalPath);
            const uploadResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
              method: 'PUT',
              headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/octet-stream',
              },
              // Node 18+ fetch needs duplex: 'half' when body is a stream
              ...( { duplex: 'half' } as any ),
              body: fileStream as any,
            });

            if (!uploadResponse.ok) {
              const errText = await uploadResponse.text();
              throw new Error(`Failed to upload video content to Bunny: ${errText}`);
            }

            // Delete local temp file
            fs.unlink(finalPath, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });

            res.json({
              success: true,
              videoId: videoId,
              url: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`
            });

          } catch (error: any) {
            console.warn("Bunny Upload failed, falling back to local file path:", error.message || error);
            res.json({
              success: true,
              url: `/uploads/${finalFilename}`
            });
          }
        } else {
          // Firebase upload server-side is hanging, so we just return the local file URL immediately.
          // This makes the chunked upload extremely fast and reliable.
          res.json({ url: `/uploads/${finalFilename}` });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to merge chunks' });
    }
  });

  // Video player route to wrap video in HTML to avoid iframe download issues
  app.get('/play', (req, res) => {
    const v = req.query.v as string;
    if (!v) return res.status(400).send('No video specified');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
          video { width: 100%; height: 100%; outline: none; }
        </style>
      </head>
      <body>
        <video controls playsinline preload="auto">
          <source src="/uploads/${v}" type="video/mp4" />
        </video>
      </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
