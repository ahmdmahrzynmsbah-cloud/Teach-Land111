import fs from 'fs';

let content = fs.readFileSync('src/lib/upload.ts', 'utf8');

// Remove the early return for PDF/non-videos in uploadChunkedFile
content = content.replace(
`  // If it's a PDF or non-video document or bunny is false, use direct fast upload
  if (!useBunny || !isVideo) {
    return await uploadFileToFirebase(file, onProgress, options);
  }`,
`  // We will use chunked upload for ALL files (videos, PDFs, images) for maximum reliability
  // if (!useBunny || !isVideo) {
  //   return await uploadFileToFirebase(file, onProgress, options);
  // }`
);

// In uploadChunkedFile, if useBunny is false, we still do chunked upload and it returns data.url
// Let's make sure uploadFileToFirebase ALSO just calls uploadChunkedFile so we don't have duplicated logic
content = content.replace(
`export async function uploadFileToFirebase(
  originalFile: File,
  onProgress: (progress: number) => void = () => {},
  options?: UploadOptions
): Promise<string> {`,
`export async function uploadFileToFirebase(
  originalFile: File,
  onProgress: (progress: number) => void = () => {},
  options?: UploadOptions
): Promise<string> {
  // Delegate all uploads to the highly reliable chunked upload system
  return await uploadChunkedFile(originalFile, onProgress, { ...options, bunny: false });
}

async function uploadFileToFirebase_OLD(
  originalFile: File,
  onProgress: (progress: number) => void = () => {},
  options?: UploadOptions
): Promise<string> {`
);

fs.writeFileSync('src/lib/upload.ts', content);
console.log('patched upload.ts');
