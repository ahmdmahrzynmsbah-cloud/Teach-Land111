import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyA_CNc0I6__SHRAFCmEP_llclnUIwiJc2k",
  projectId: "teachland-e69ee",
  storageBucket: "teachland-e69ee.appspot.com",
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const r = ref(storage, 'test.txt');
uploadString(r, 'hello').then(() => console.log('ok')).catch(e => { console.error(e); console.log(e.customData) });
