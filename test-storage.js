import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const storage = getStorage(app);
const r = ref(storage, 'test.txt');
uploadString(r, 'hello').then(() => console.log('ok')).catch(e => console.error(e.message));
