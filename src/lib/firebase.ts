
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(db, { synchronizeTabs: true })
          .catch((err) => {
              if (err.code == 'failed-precondition') {
                  // This can happen if you have multiple tabs open.
                  console.warn("Firebase persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.");
              } else if (err.code == 'unimplemented') {
                  // The current browser does not support all of the features required to enable persistence.
                  console.warn("Firebase persistence failed: Browser does not support this feature.");
              }
          });
    }

  } catch (e) {
    console.error('Could not initialize Firebase. Please check your .env file.', e);
  }
} else {
  console.warn("Firebase configuration is missing. Please add your credentials to the .env file.");
}

export { app, auth, db, storage };
