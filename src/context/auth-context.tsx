
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

  const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);

  const photoHasChanged = photoFile || newPhotoUrlInput !== oldPhotoURL;

  if (photoHasChanged) {
    try {
      if (photoFile) {
        // Case 1: A new file was uploaded, overwriting the old one.
        await uploadBytes(storageRef, photoFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      } else if (newPhotoUrlInput && newPhotoUrlInput.startsWith('data:image/')) {
        // Case 2: A default avatar (data URI) was selected. Upload it to storage, overwriting.
        const response = await fetch(newPhotoUrlInput);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob, { contentType: blob.type });
        finalPhotoURL = await getDownloadURL(storageRef);
      } else if (newPhotoUrlInput === null) {
        // Case 3: The photo was removed.
        finalPhotoURL = null;
        // If there was an old photo stored in Firebase Storage, delete it.
        if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
          await deleteObject(storageRef);
        }
      } else {
         // Fallback for any other case
        finalPhotoURL = newPhotoUrlInput;
      }
    } catch (error: any) {
      if (error.code === 'storage/unauthorized') {
        throw new Error("Permission denied. Please check your Firebase Storage security rules to allow uploads for authenticated users.");
      }
      // Re-throw other storage errors
      throw error;
    }
  }

  const authUpdates: { displayName?: string; photoURL?: string | null } = {};
  const dbUpdates: { username?: string; photoURL?: string | null } = {};

  if (displayName && displayName !== currentUser.displayName) {
    authUpdates.displayName = displayName;
    dbUpdates.username = displayName;
  }
  
  if (finalPhotoURL !== oldPhotoURL) {
    authUpdates.photoURL = finalPhotoURL;
    dbUpdates.photoURL = finalPhotoURL;
  }

  if (Object.keys(authUpdates).length > 0) {
    await updateProfile(currentUser, authUpdates);
  }
  if (Object.keys(dbUpdates).length > 0) {
    await updateDoc(userDocRef, dbUpdates);
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
