
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
        setUser(user);
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
          setUsername(user.displayName);
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
    const oldPhotoURL = currentUser.photoURL;
  
    const authUpdates: { displayName?: string; photoURL?: string | null } = {};
    const dbUpdates: { username?: string; photoURL?: string | null } = {};
  
    // Determine the final photo URL
    let finalPhotoURL: string | null = oldPhotoURL;
    if (photoFile) {
      // New file uploaded
      if (!storage) throw new Error("Firebase Storage is not configured.");
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      finalPhotoURL = await getDownloadURL(storageRef);
    } else if (newPhotoUrlInput !== oldPhotoURL) {
      // Default avatar selected or photo removed
      finalPhotoURL = newPhotoUrlInput;
    }
  
    // Check for changes and prepare update objects
    if (displayName && displayName !== currentUser.displayName) {
      authUpdates.displayName = displayName;
      dbUpdates.username = displayName;
    }
    if (finalPhotoURL !== oldPhotoURL) {
      authUpdates.photoURL = finalPhotoURL;
      dbUpdates.photoURL = finalPhotoURL;
    }
  
    // Execute updates if there are any changes
    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(currentUser, authUpdates);
    }
    if (Object.keys(dbUpdates).length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, dbUpdates);
    }
  
    // If photo was removed (set to null), delete it from storage
    if (finalPhotoURL === null && oldPhotoURL) {
      if (!storage) throw new Error("Firebase Storage is not configured.");
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      try {
        await deleteObject(storageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error("Failed to delete profile picture from storage:", error);
        }
      }
    }
    
    // Manually update local username state if it changed
    if (dbUpdates.username) {
      setUsername(dbUpdates.username);
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
