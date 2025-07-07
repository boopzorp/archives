
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
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // The user object from onAuthStateChanged is the most up-to-date
        setUser(user);
        
        // Fetch the username from Firestore as it's the source of truth for that
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || user.displayName);
          } else {
             setUsername(user.displayName);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setUsername(user.displayName); // Fallback to auth display name on error
        }
        
      } else {
        setUser(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (updates: { displayName?: string; photoFile?: File; photoURL?: string | null }) => {
    if (!auth?.currentUser || !db) {
      throw new Error("Authentication service is not properly configured.");
    }

    const { currentUser } = auth;
    const { displayName, photoFile, photoURL: newPhotoUrlInput } = updates;

    const authUpdates: { displayName?: string | null; photoURL?: string | null } = {};
    const dbUpdates: { username?: string; photoURL?: string | null } = {};

    // 1. Handle Display Name Update
    if (displayName && displayName !== username) {
      authUpdates.displayName = displayName;
      dbUpdates.username = displayName;
    }

    // 2. Handle Photo Update
    let newPhotoURL: string | null | undefined = newPhotoUrlInput;

    // A new file takes precedence.
    if (photoFile) {
      if (!storage) throw new Error("Firebase Storage is not configured.");
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      newPhotoURL = await getDownloadURL(storageRef);
    }
    
    // Check if the final URL (from upload or selection) is different
    if (newPhotoURL !== undefined && newPhotoURL !== currentUser.photoURL) {
      authUpdates.photoURL = newPhotoURL;
      dbUpdates.photoURL = newPhotoURL;

      // If we are removing a picture that was stored, delete the old file.
      if (newPhotoURL === null && currentUser.photoURL?.includes('firebasestorage')) {
        if (!storage) throw new Error("Firebase Storage is not configured.");
        const oldStorageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        try {
          await deleteObject(oldStorageRef);
        } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
            console.error("Failed to delete old profile picture:", error);
            // Non-fatal, so we don't re-throw. The profile URL will still be updated.
          }
        }
      }
    }

    // 3. Apply updates sequentially if there are any changes
    if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
    }

    if (Object.keys(dbUpdates).length > 0) {
        const userDocRef = doc(db, 'users', currentUser.uid);
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
