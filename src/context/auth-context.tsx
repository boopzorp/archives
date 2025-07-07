
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoFile?: File; photoURL?: string | null }) => Promise<void>;
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
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Also fetch the username from Firestore for display
        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || currentUser.displayName);
          } else {
             setUsername(currentUser.displayName);
          }
        } else {
          setUsername(currentUser.displayName);
        }
      } else {
        setUser(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this only runs once and prevents re-renders.

  const updateUserProfile = async (updates: { displayName?: string; photoFile?: File; photoURL?: string | null }) => {
    if (!auth?.currentUser || !db || !storage) {
      throw new Error("Authentication or storage service is not properly configured.");
    }
  
    const { currentUser } = auth;
    const { displayName, photoFile, photoURL: newPhotoUrlInput } = updates;
  
    const authUpdates: { displayName?: string; photoURL?: string | null } = {};
    const dbUpdates: { username?: string; photoURL?: string | null } = {};
  
    let finalPhotoURL: string | null = currentUser.photoURL;
    
    // 1. Handle photo upload/removal first
    if (photoFile) {
      // Case A: New file is uploaded
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      finalPhotoURL = await getDownloadURL(storageRef);
    } else if (newPhotoUrlInput !== undefined && newPhotoUrlInput !== currentUser.photoURL) {
      // Case B: Photo is removed (null) or set to a default avatar (data URI)
      finalPhotoURL = newPhotoUrlInput;

      // If there was a custom photo before (i.e., not a data URI), delete it from storage
      if (currentUser.photoURL && currentUser.photoURL.includes('firebasestorage.googleapis.com')) {
        const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        try {
          await deleteObject(storageRef);
        } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
            console.error("Failed to delete old profile picture, but continuing update:", error);
          }
        }
      }
    }

    // 2. Determine if updates are needed
    if (displayName && displayName !== currentUser.displayName) {
      authUpdates.displayName = displayName;
      dbUpdates.username = displayName;
    }
    if (finalPhotoURL !== currentUser.photoURL) {
      authUpdates.photoURL = finalPhotoURL;
      dbUpdates.photoURL = finalPhotoURL;
    }
  
    // 3. Apply updates to Firebase Auth and Firestore if there are changes
    const updatePromises: Promise<any>[] = [];

    if (Object.keys(authUpdates).length > 0) {
      updatePromises.push(updateProfile(currentUser, authUpdates));
    }
    if (Object.keys(dbUpdates).length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      updatePromises.push(updateDoc(userDocRef, dbUpdates));
    }
    
    // Wait for all updates to complete
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
    
    // No manual state updates here.
    // The onAuthStateChanged listener will automatically receive the update and re-render the context.
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
