import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, 'ai-studio-5bdbde7f-27e7-40ca-b1d4-0ccc432a8fc8');

async function test() {
  console.log('Testing write to chat_messages in ai-studio db...');
  try {
    const docRef = await addDoc(collection(db, 'chat_messages'), {
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log('Success writing, doc id:', docRef.id);
  } catch (e) {
    console.error('Error writing:', e.message);
  }
  process.exit(0);
}
test();
