import { Storage } from '@google-cloud/storage';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

// Assuming the default bucket name from the config
const bucketName = firebaseConfig.storageBucket;

const storage = new Storage(); // Requires Google Application Default Credentials or service account

async function configureCors() {
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      maxAgeSeconds: 3600,
      method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      origin: ['*'],
      responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
    },
  ]);

  console.log(`Bucket ${bucketName} was updated with a CORS config to allow requests from any origin.`);
}

configureCors().catch(console.error);
