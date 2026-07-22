import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, 'ai-studio-5bdbde7f-27e7-40ca-b1d4-0ccc432a8fc8');

async function test() {
  console.log('Testing connection to DB: ai-studio-5bdbde7f-27e7-40ca-b1d4-0ccc432a8fc8');
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('Success, docs count:', snap.size);
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
test();
