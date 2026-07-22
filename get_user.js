import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, 'ai-studio-5bdbde7f-27e7-40ca-b1d4-0ccc432a8fc8');

async function test() {
  const snap = await getDocs(collection(db, 'users'));
  snap.forEach(doc => console.log(doc.data()));
  process.exit(0);
}
test();
