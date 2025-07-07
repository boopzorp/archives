
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
        // Set user immediately to reduce perceived loading time
        setUser(user);
        setUsername(user.displayName);
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Use username from DB if it exists, otherwise fallback to auth display name
            setUsername(data.username || user.displayName);
          } else {
             // This case might happen on first signup if DB write is slow
             console.log("User document doesn't exist yet, using displayName from auth.");
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
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
    
    const profileAuthUpdates: { displayName?: string; photoURL?: string | null } = {};
    const profileDbUpdates: { username?: string; photoURL?: string | null } = {};
    
    if (displayName && displayName !== username) {
      profileAuthUpdates.displayName = displayName;
      profileDbUpdates.username = displayName;
    }
    
    let finalPhotoURL: string | null = currentUser.photoURL;
    
    if (photoFile) {
      if (!storage) {
        throw new Error("Firebase Storage is not configured. Please enable it in your Firebase project console.");
      }
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      finalPhotoURL = await getDownloadURL(storageRef);
    } else if (photoURL !== undefined) {
      finalPhotoURL = photoURL;
      
      // If we are removing the photo (setting URL to null) and there was a storage-backed picture before, delete it.
      if (finalPhotoURL === null && currentUser.photoURL?.includes('firebasestorage')) {
         if (!storage) {
          throw new Error("Firebase Storage is not configured.");
        }
        const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        try {
            await deleteObject(storageRef);
        } catch(error: any) {
            // It's okay if the object doesn't exist, we can ignore that error.
            if (error.code !== 'storage/object-not-found') {
                console.error("Failed to delete profile picture from storage", error);
                // We don't re-throw here, as we can still update the profile URL in Auth/DB.
            }
        }
      }
    }
    
    if (finalPhotoURL !== currentUser.photoURL) {
      profileAuthUpdates.photoURL = finalPhotoURL;
      profileDbUpdates.photoURL = finalPhotoURL;
    }
    
    if (Object.keys(profileAuthUpdates).length > 0) {
      await updateProfile(currentUser, profileAuthUpdates);
    }
    
    if (Object.keys(profileDbUpdates).length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, profileDbUpdates);
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
