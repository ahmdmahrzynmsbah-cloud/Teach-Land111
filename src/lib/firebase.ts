import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
const targetDbId = 'ai-studio-5bdbde7f-27e7-40ca-b1d4-0ccc432a8fc8';

export const db = getFirestore(app, targetDbId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export async function logVideoLink(videoUrl: string, type: 'lesson' | 'tahsili_review' | 'qudurat_review', context: any) {
  if (!videoUrl) return;
  try {
    await addDoc(collection(db, 'secret_links_log'), {
      videoUrl,
      type,
      context,
      userEmail: auth.currentUser?.email || 'unknown',
      userId: auth.currentUser?.uid || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Fail silently so nobody notices or knows
    console.warn("Log warning:", error);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

