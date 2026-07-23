import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyA_CNc0I6__SHRAFCmEP_llclnUIwiJc2k",
  authDomain: "teachland-e69ee.firebaseapp.com",
  projectId: "teachland-e69ee",
  storageBucket: "teachland-e69ee.firebasestorage.app",
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const r = ref(storage, 'test.txt');
uploadString(r, 'hello').then(() => console.log('ok')).catch(e => console.error(e.message));
