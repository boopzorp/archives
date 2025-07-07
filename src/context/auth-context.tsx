
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
    if (!user) {
      setLoading(false);
      return;
    }
    if (!db) {
      setUsername(user.displayName);
      setLoading(false);
      return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
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
    return () => unsubscribeFirestore();
  }, [user]);

  const updateUserProfile = async (updates: { displayName?: string; photoFile?: File | null; photoURL?: string | null }) => {
    if (!auth?.currentUser || !db || !storage) {
      throw new Error("Authentication, database, or storage service is not properly configured.");
    }

    const { currentUser } = auth;
    const { displayName, photoFile, photoURL: newPhotoUrlInput } = updates;
    const userDocRef = doc(db, 'users', currentUser.uid);

    let finalPhotoURL = currentUser.photoURL;

    // Determine if photo was uploaded, removed, or changed to a default avatar
    if (photoFile) {
        // New file uploaded
        const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        finalPhotoURL = await getDownloadURL(storageRef);
    } else if (newPhotoUrlInput !== currentUser.photoURL) {
        // URL has changed (either to null for removal, or a new default avatar)
        finalPhotoURL = newPhotoUrlInput;
        // If the old photo was in storage, delete it
        if (currentUser.photoURL && currentUser.photoURL.includes('firebasestorage.googleapis.com')) {
            const oldStorageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
            try {
                await deleteObject(oldStorageRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error("Failed to delete old profile picture:", error);
                }
            }
        }
    }

    // Prepare updates for Auth and Firestore
    const authUpdates: { displayName?: string; photoURL?: string | null } = {};
    const dbUpdates: { username?: string; photoURL?: string | null } = {};

    if (displayName && displayName !== currentUser.displayName) {
        authUpdates.displayName = displayName;
        dbUpdates.username = displayName;
    }
    if (finalPhotoURL !== currentUser.photoURL) {
        authUpdates.photoURL = finalPhotoURL;
        dbUpdates.photoURL = finalPhotoURL;
    }

    // Sequentially apply updates if there are any changes
    if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
    }
    if (Object.keys(dbUpdates).length > 0) {
        await updateDoc(userDocRef, dbUpdates);
    }
  };

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
