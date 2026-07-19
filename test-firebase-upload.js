import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

async function test() {
  await signInAnonymously(auth);
  const user = auth.currentUser;
  console.log("Logged in anonymously:", user.uid);

  const fileBlob = new Blob(["test content"], { type: "text/plain" });
  const storageRef = ref(storage, `uploads/lessons/${user.uid}/test.txt`);
  
  const uploadTask = uploadBytesResumable(storageRef, fileBlob);
  uploadTask.on('state_changed', 
    (snapshot) => {
      console.log("Progress:", (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    },
    (error) => {
      console.error("Upload failed:", error);
      process.exit(1);
    },
    () => {
      console.log("Upload complete!");
      process.exit(0);
    }
  );
}
test();
