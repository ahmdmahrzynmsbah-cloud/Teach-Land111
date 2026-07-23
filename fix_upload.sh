#!/bin/bash
cat << 'INNER_EOF' > /tmp/server_upload.ts
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import mime from 'mime-types'; // need to install this

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
INNER_EOF
