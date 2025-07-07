
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      setLoading(true);
      if (user) {
        setUser(user);
        setUsername(user.displayName); // Start with the most immediate info

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || user.displayName);
          }
        } catch (error) {
          console.error("Could not fetch user profile from Firestore, using fallback.", error);
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
    if (!auth?.currentUser || !db) return;
    
    const { currentUser } = auth;
    const { displayName, photoFile, photoURL } = updates;
    
    const profileAuthUpdates: { displayName?: string; photoURL?: string } = {};
    const profileDbUpdates: { username?: string; photoURL?: string } = {};
    
    if (displayName && displayName !== currentUser.displayName) {
      profileAuthUpdates.displayName = displayName;
      profileDbUpdates.username = displayName;
    }
    
    let newPhotoURL: string | null = currentUser.photoURL;
    
    if (photoFile) {
      if (!storage) {
        throw new Error("Firebase Storage is not configured. Please enable it in your Firebase project console.");
      }
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      newPhotoURL = await getDownloadURL(storageRef);
    } else if (photoURL !== undefined) {
      newPhotoURL = photoURL;
    }
    
    if (newPhotoURL !== currentUser.photoURL) {
      profileAuthUpdates.photoURL = newPhotoURL as string;
      profileDbUpdates.photoURL = newPhotoURL as string;
    }
    
    if (Object.keys(profileAuthUpdates).length > 0) {
      await updateProfile(currentUser, profileAuthUpdates);
    }
    
    if (Object.keys(profileDbUpdates).length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, profileDbUpdates);
    }
    // The onAuthStateChanged listener will automatically pick up the changes.
    // Manually setting state here can cause race conditions.
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
