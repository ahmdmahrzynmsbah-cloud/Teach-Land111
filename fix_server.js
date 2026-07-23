import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`        } else {
          try {
            const firebaseUrl = await uploadFileToFirebaseServer(finalPath, originalName);
            
            fs.unlink(finalPath, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
            
            res.json({ url: firebaseUrl });
          } catch (fbErr) {
            console.error("Firebase Storage upload failed:", fbErr);
            res.status(500).json({ error: 'Failed to upload file.' });
          }
        }`,
`        } else {
          res.json({ url: \`/uploads/\${finalFilename}\` });
        }`
);

code = code.replace(
`          } catch (error: any) {
            console.warn("Bunny Upload failed, falling back to Firebase Storage:", error.message || error);
            // Fallback to Firebase Storage
            const firebaseUrl = await uploadFileToFirebaseServer(finalPath, originalName);
            
            // Delete local temp file
            fs.unlink(finalPath, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
            
            res.json({
              success: true,
              url: firebaseUrl
            });
          }`,
`          } catch (error: any) {
            console.warn("Bunny Upload failed, falling back to local file path:", error.message || error);
            res.json({
              success: true,
              url: \`/uploads/\${finalFilename}\`
            });
          }`
);

code = code.replace(
`    try {
      // Upload to Firebase Storage instead of keeping local
      const firebaseUrl = await uploadFileToFirebaseServer(req.file.path, req.file.originalname);
      
      // Cleanup local file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      res.json({ url: firebaseUrl });
    } catch (err: any) {
      console.error("Upload route error:", err);
      res.status(500).json({ error: 'Failed to upload file to storage.' });
    }`,
`    // Return the URL to the uploaded file
    const fileUrl = \`/uploads/\${req.file.filename}\`;
    res.json({ url: fileUrl });`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts');
