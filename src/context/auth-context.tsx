
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, updateProfile, Unsubscribe } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
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

    let unsubscribeFirestore: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Clean up previous Firestore listener if user changes
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (currentUser) {
        setUser(currentUser);
        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          // Use onSnapshot for offline resilience and real-time updates
          unsubscribeFirestore = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                setUsername(docSnap.data().username || currentUser.displayName);
              } else {
                setUsername(currentUser.displayName);
              }
              setLoading(false);
            },
            (error) => {
              console.error("Error with Firestore snapshot:", error);
              setUsername(currentUser.displayName); // Fallback on error
              setLoading(false);
            }
          );
        } else {
          // Fallback if db is not configured
          setUsername(currentUser.displayName);
          setLoading(false);
        }
      } else {
        // User is signed out
        setUser(null);
        setUsername(null);
        setLoading(false);
      }
    });

    // Cleanup function for the main effect
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const updateUserProfile = async (updates: { displayName?: string; photoFile?: File; photoURL?: string | null }) => {
    if (!auth?.currentUser || !db) {
      throw new Error("Authentication or database service is not properly configured.");
    }
  
    const { currentUser } = auth;
    const { displayName, photoFile, photoURL: newPhotoUrlInput } = updates;
    
    let finalPhotoURL: string | null | undefined = undefined;

    // Handle photo upload/removal
    if (photoFile) {
      if (!storage) throw new Error("Storage is not configured.");
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      finalPhotoURL = await getDownloadURL(storageRef);
    } else if (newPhotoUrlInput !== undefined) {
      finalPhotoURL = newPhotoUrlInput;
      // If there was a custom photo before (i.e., not a data URI), delete it from storage
      if (currentUser.photoURL && currentUser.photoURL.includes('firebasestorage.googleapis.com')) {
         if (!storage) throw new Error("Storage is not configured.");
         const oldStorageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
         try {
          await deleteObject(oldStorageRef);
         } catch (error: any) {
           if (error.code !== 'storage/object-not-found') {
            console.error("Failed to delete old profile picture, but continuing update:", error);
           }
         }
      }
    }
    
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    const dbUpdates: { username?: string; photoURL?: string | null } = {};

    if (displayName && displayName !== currentUser.displayName) {
      authUpdates.displayName = displayName;
      dbUpdates.username = displayName;
    }
    if (finalPhotoURL !== undefined && finalPhotoURL !== currentUser.photoURL) {
      authUpdates.photoURL = finalPhotoURL;
      dbUpdates.photoURL = finalPhotoURL;
    }
  
    // Apply updates to Firebase Auth and Firestore if there are changes
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
