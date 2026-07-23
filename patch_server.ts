import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
`        } else {
          res.json({ url: \`/uploads/\${finalFilename}\` });
        }`,
`        } else {
          try {
            console.log("Attempting Firebase Storage upload from server...");
            const firebaseUrl = await uploadFileToFirebaseServer(finalPath, originalName);
            
            // Delete local temp file
            fs.unlink(finalPath, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
            
            res.json({ url: firebaseUrl });
          } catch (fbErr: any) {
            console.warn("Firebase Storage upload failed, falling back to local file path:", fbErr.message || fbErr);
            res.json({ url: \`/uploads/\${finalFilename}\` });
          }
        }`
);

fs.writeFileSync('server.ts', content);
console.log('patched server.ts');
