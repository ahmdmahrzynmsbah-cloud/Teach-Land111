import fs from 'fs';
const content = fs.readFileSync('src/lib/upload.ts', 'utf8');

const updated = content.replace(
`      uploadTask.on(
        'state_changed',
        (snapshot) => {
          hasMadeProgress = true;
          clearTimeout(timeoutTimer);
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.min(progress, 99));
          }
        },`,
`      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.bytesTransferred > 0) {
            hasMadeProgress = true;
            clearTimeout(timeoutTimer);
          }
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.min(progress, 99));
          }
        },`);

fs.writeFileSync('src/lib/upload.ts', updated);
console.log('patched');
