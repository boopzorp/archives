
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, updateProfile, Unsubscribe } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoFile?: File | null; photoURL?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const updateUserProfile = async (updates: { displayName?: string; photoFile?: File | null; photoURL?: string | null }) => {
  const currentUser = auth?.currentUser;
  if (!auth || !currentUser || !db || !storage) {
    throw new Error("Authentication, database, or storage service is not properly configured.");
  }

  const { displayName, photoFile, photoURL: newPhotoUrlInput } = updates;
  const userDocRef = doc(db, 'users', currentUser.uid);
  const oldPhotoURL = currentUser.photoURL;
  let finalPhotoURL: string | null = oldPhotoURL;

  // Step 1: Handle photo upload if a new file is provided
  if (photoFile) {
    const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
    await uploadBytes(storageRef, photoFile);
    finalPhotoURL = await getDownloadURL(storageRef);
  } else if (newPhotoUrlInput !== oldPhotoURL) {
    // This handles selecting a default avatar or removing the photo by setting URL to null
    finalPhotoURL = newPhotoUrlInput;
  }

  // Step 2: Prepare updates for Auth and Firestore
  const authUpdates: { displayName?: string; photoURL?: string | null } = {};
  const dbUpdates: { username?: string; photoURL?: string | null } = {};

  if (displayName && displayName !== currentUser.displayName) {
    authUpdates.displayName = displayName;
    dbUpdates.username = displayName;
  }
  // Use hasOwnProperty because finalPhotoURL could be null, which is a valid update
  if (finalPhotoURL !== oldPhotoURL) {
    authUpdates.photoURL = finalPhotoURL;
    dbUpdates.photoURL = finalPhotoURL;
  }

  // Step 3: Apply updates to Firebase Auth and Firestore if there are any changes
  if (Object.keys(authUpdates).length > 0) {
    await updateProfile(currentUser, authUpdates);
  }
  if (Object.keys(dbUpdates).length > 0) {
    await updateDoc(userDocRef, dbUpdates);
  }

  // Step 4: Delete old photo from storage if it was replaced or removed
  // and it was a file we stored (not a default avatar or null).
  if (oldPhotoURL && oldPhotoURL !== finalPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
    const oldStorageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
    try {
      await deleteObject(oldStorageRef);
    } catch (error: any) {
      // It's okay if the object doesn't exist, log other errors.
      if (error.code !== 'storage/object-not-found') {
        console.error("Failed to delete old profile picture:", error);
      }
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUsername(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeFirestore: Unsubscribe | undefined;
    if (user) {
      if (!db) {
        setUsername(user.displayName);
        setLoading(false);
        return;
      }
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || user.displayName);
        } else {
          setDoc(userDocRef, { 
            username: user.displayName, 
            email: user.email, 
            createdAt: new Date().toISOString() 
          }).catch(console.error);
          setUsername(user.displayName);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error with Firestore snapshot:", error);
        setUsername(user.displayName);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [user]);

  const signOut = async () => {
    if (!auth) {
      router.push('/login');
      return;
    }
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const value = { user, username, loading, signOut, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
