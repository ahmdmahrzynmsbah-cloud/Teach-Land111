import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // This might not work if no default credentials, let's just check if we can initialize
    storageBucket: "teachland-e69ee.firebasestorage.app"
  });
}
console.log("initialized");
