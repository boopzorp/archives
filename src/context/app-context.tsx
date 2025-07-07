'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc, DocumentReference, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import type { Link, Folder, Tag, GroupByOption, SortByOption } from '@/lib/types';

type ActiveFilter = {
  type: 'all' | 'folder' | 'tag' | 'favorites' | 'graph' | 'notes';
  value: string | null;
};

interface AppContextState {
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  links: Link[];
  folders: Folder[];
  tags: Tag[];
  addLink: (newLink: Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  updateLink: (id: string, updates: Partial<Omit<Link, 'id'>>) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id'>>) => Promise<void>;
  renameTag: (oldName: string, newName: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
  updateTag: (name: string, updates: Partial<Omit<Tag, 'name'>>) => Promise<void>;
  activeFilter: ActiveFilter;
  setActiveFilter: (filter: ActiveFilter) => void;
  groupBy: GroupByOption;
  setGroupBy: (option: GroupByOption) => void;
  sortBy: SortByOption;
  setSortBy: (option: SortByOption) => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [links, setLinks] = useState<Link[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ type: 'all', value: null });
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [sortBy, setSortBy] = useState<SortByOption>('newest');

  useEffect(() => {
    if (!user || !db) {
      setLinks([]);
      setFolders([]);
      setTags([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLinks(data.links || []);
        setFolders(data.folders || []);
        
        const allTagNamesInLinks = new Set<string>();
        (data.links || []).forEach((link: Link) => {
          link.tags?.forEach(tag => allTagNamesInLinks.add(tag));
        });

        const currentTags = data.tags || [];
        const tagMap = new Map(currentTags.map((t: Tag) => [t.name, t]));
        
        allTagNamesInLinks.forEach(name => {
          if (!tagMap.has(name)) {
            tagMap.set(name, { name, color: undefined });
          }
        });

        const newTags: Tag[] = [];
        tagMap.forEach((tag, name) => {
          if (allTagNamesInLinks.has(name)) {
            newTags.push(tag);
          }
        });

        const sortedTags = newTags.sort((a, b) => a.name.localeCompare(b.name));
        setTags(sortedTags);

        // If tag list changed, update it in firestore
        if(JSON.stringify(sortedTags) !== JSON.stringify(currentTags)) {
          updateDoc(userDocRef, { tags: sortedTags });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getDocRef = (): DocumentReference<DocumentData> | null => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  };
  
  const addLink = async (newLinkData: Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const linkWithMeta: Link = {
      ...newLinkData,
      id: new Date().toISOString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      isFavorite: false,
      folderId: null,
    };
    await updateDoc(docRef, { links: arrayUnion(linkWithMeta) });
  };

  const deleteLink = async (id: string) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      const currentLinks = docSnap.data().links || [];
      const linkToDelete = currentLinks.find((l: Link) => l.id === id);
      if(linkToDelete) {
        await updateDoc(docRef, { links: arrayRemove(linkToDelete) });
      }
    }
  };

  const updateLink = async (id: string, updates: Partial<Omit<Link, 'id'>>) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const docSnap = await getDoc(docRef);
     if(docSnap.exists()){
      const currentLinks = docSnap.data().links || [];
      const newLinks = currentLinks.map((link: Link) => 
        link.id === id ? { ...link, ...updates } : link
      );
      await updateDoc(docRef, { links: newLinks });
    }
  };
  
  const addFolder = async (name: string) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const newFolder: Folder = {
      id: new Date().toISOString() + Math.random().toString(36).substr(2, 9),
      name,
    };
    await updateDoc(docRef, { folders: arrayUnion(newFolder) });
  };
  
  const deleteFolder = async (id: string) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      const currentFolders = docSnap.data().folders || [];
      const folderToDelete = currentFolders.find((f: Folder) => f.id === id);
      if (folderToDelete) {
         await updateDoc(docRef, { folders: arrayRemove(folderToDelete) });
      }

      // Unassign links from the deleted folder
      const currentLinks = docSnap.data().links || [];
      const newLinks = currentLinks.map((link: Link) =>
        link.folderId === id ? { ...link, folderId: null } : link
      );
      await updateDoc(docRef, { links: newLinks });
    }

    if (activeFilter.type === 'folder' && activeFilter.value === id) {
      setActiveFilter({ type: 'all', value: null });
    }
  };

  const updateFolder = async (id: string, updates: Partial<Omit<Folder, 'id'>>) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      const currentFolders = docSnap.data().folders || [];
      const newFolders = currentFolders.map((folder: Folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      );
      await updateDoc(docRef, { folders: newFolders });
    }
  };
  
  const renameTag = async (oldName: string, newName: string) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
        const currentTags = docSnap.data().tags || [];
        if (currentTags.some((t: Tag) => t.name === newName)) {
            console.error(`Tag "${newName}" already exists.`);
            return;
        }

        const newTags = currentTags.map((tag: Tag) => (tag.name === oldName ? { ...tag, name: newName } : tag));
        const currentLinks = docSnap.data().links || [];
        const newLinks = currentLinks.map((link: Link) => ({
            ...link,
            tags: link.tags.map(t => (t === oldName ? newName : t)),
        }));
        await updateDoc(docRef, { tags: newTags, links: newLinks });
    }
  
    if (activeFilter.type === 'tag' && activeFilter.value === oldName) {
      setActiveFilter({ type: 'tag', value: newName });
    }
  };

  const deleteTag = async (name: string) => {
    const docRef = getDocRef();
    if (!docRef) throw new Error("User not authenticated or database not configured.");
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
        const currentTags = docSnap.data().tags || [];
        const tagToDelete = currentTags.find((t: Tag) => t.name === name);
        if(tagToDelete) {
            await updateDoc(docRef, { tags: arrayRemove(tagToDelete) });
        }
        
        const currentLinks = docSnap.data().links || [];
        const newLinks = currentLinks.map((link: Link) => ({
            ...link,
            tags: link.tags.filter(t => t !== name),
        }));
        await updateDoc(docRef, { links: newLinks });
    }
    
    if (activeFilter.type === 'tag' && activeFilter.value === name) {
      setActiveFilter({ type: 'all', value: null });
    }
  };
  
  const updateTag = async (name: string, updates: Partial<Omit<Tag, 'name'>>) => {
     const docRef = getDocRef();
     if (!docRef) throw new Error("User not authenticated or database not configured.");
     const docSnap = await getDoc(docRef);
     if(docSnap.exists()){
        const currentTags = docSnap.data().tags || [];
        const newTags = currentTags.map((tag: Tag) => (tag.name === name ? { ...tag, ...updates } : tag));
        await updateDoc(docRef, { tags: newTags });
     }
  };

  const value = {
    loading,
    searchTerm,
    setSearchTerm,
    links,
    folders,
    tags,
    addLink,
    deleteLink,
    updateLink,
    addFolder,
    deleteFolder,
    updateFolder,
    renameTag,
    deleteTag,
    updateTag,
    activeFilter,
    setActiveFilter,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
