import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const querySnapshot = await getDocs(collection(db, "lessons"));
  for (const docSnapshot of querySnapshot.docs) {
    const data = docSnapshot.data();
    if (data.videoUrl && data.videoUrl.startsWith('/play?v=')) {
      const newUrl = data.videoUrl.replace('/play?v=', '/uploads/');
      await updateDoc(doc(db, "lessons", docSnapshot.id), { videoUrl: newUrl });
      console.log(`Updated ${docSnapshot.id} to ${newUrl}`);
    }
  }
  console.log("Done");
}
run();
