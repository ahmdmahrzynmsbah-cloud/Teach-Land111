#!/bin/bash
sed -i 's|import firebaseConfig from '"'../../firebase-applet-config.json'"';||' src/lib/firebase.ts
sed -i 's|export const app = initializeApp(firebaseConfig);|const firebaseConfig = {\n  apiKey: "AIzaSyA_CNc0I6__SHRAFCmEP_llclnUIwiJc2k",\n  authDomain: "teachland-e69ee.firebaseapp.com",\n  projectId: "teachland-e69ee",\n  storageBucket: "teachland-e69ee.firebasestorage.app",\n  messagingSenderId: "1011126564456",\n  appId: "1:1011126564456:web:1ca33bef938ddc5eed2ddd",\n  measurementId: "G-G3YEJ3QLSH"\n};\nexport const app = initializeApp(firebaseConfig);|' src/lib/firebase.ts
sed -i 's|const targetDbId = '"'ai-studio-5bdbde7f-27e7-40ca-b1d4-0ccc432a8fc8'"';||' src/lib/firebase.ts
sed -i 's|export const db = getFirestore(app, targetDbId);|export const db = getFirestore(app);|' src/lib/firebase.ts
