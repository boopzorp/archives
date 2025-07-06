
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Link, Folder, Tag } from '@/lib/types';

type ActiveFilter = {
  type: 'all' | 'folder' | 'tag' | 'favorites' | 'graph';
  value: string | null;
};

interface AppContextState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  links: Link[];
  folders: Folder[];
  tags: Tag[];
  addLink: (newLink: Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>) => void;
  deleteLink: (id: string) => void;
  updateLink: (id: string, updates: Partial<Omit<Link, 'id'>>) => void;
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id'>>) => void;
  renameTag: (oldName: string, newName: string) => void;
  deleteTag: (name: string) => void;
  updateTag: (name: string, updates: Partial<Omit<Tag, 'name'>>) => void;
  activeFilter: ActiveFilter;
  setActiveFilter: (filter: ActiveFilter) => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [links, setLinks] = useState<Link[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ type: 'all', value: null });

  useEffect(() => {
    setIsClient(true);
    try {
      const storedLinks = localStorage.getItem('linksort_links');
      if (storedLinks) setLinks(JSON.parse(storedLinks));
      
      const storedFolders = localStorage.getItem('linksort_folders');
      if (storedFolders) setFolders(JSON.parse(storedFolders));

      const storedTags = localStorage.getItem('linksort_tags');
      if (storedTags) setTags(JSON.parse(storedTags));
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('linksort_links', JSON.stringify(links));
      } catch (error) {
        console.error("Failed to save links to localStorage", error);
      }
    }
  }, [links, isClient]);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('linksort_folders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save folders to localStorage", error);
      }
    }
  }, [folders, isClient]);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('linksort_tags', JSON.stringify(tags));
      } catch (error) {
        console.error("Failed to save tags to localStorage", error);
      }
    }
  }, [tags, isClient]);
  
  useEffect(() => {
    if (isClient) {
      // Get all unique tag names from links
      const allTagNamesInLinks = new Set<string>();
      links.forEach(link => {
        link.tags?.forEach(tag => allTagNamesInLinks.add(tag));
      });

      // Reconcile the managed tags state
      setTags(prevTags => {
        const tagMap = new Map(prevTags.map(t => [t.name, t]));
        
        // Add any new tags found in links
        allTagNamesInLinks.forEach(name => {
          if (!tagMap.has(name)) {
            tagMap.set(name, { name, color: undefined });
          }
        });

        // Create a new array, filtering out tags that are no longer in any link
        const newTags: Tag[] = [];
        tagMap.forEach((tag, name) => {
          if (allTagNamesInLinks.has(name)) {
            newTags.push(tag);
          }
        });

        // Only update state if there's a change in length or content
        if (newTags.length !== prevTags.length || !newTags.every((v, i) => v === prevTags[i])) {
            return newTags.sort((a, b) => a.name.localeCompare(b.name));
        }
        return prevTags;
      });
    }
  }, [links, isClient]);


  const addLink = (newLink: Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>) => {
    const linkWithMeta: Link = {
      ...newLink,
      id: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isFavorite: false,
      folderId: null,
    };
    setLinks(prevLinks => [linkWithMeta, ...prevLinks]);
  };

  const deleteLink = (id: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== id));
  };

  const updateLink = (id: string, updates: Partial<Omit<Link, 'id'>>) => {
    setLinks(prevLinks => 
      prevLinks.map(link => 
        link.id === id ? { ...link, ...updates } : link
      )
    );
  };
  
  const addFolder = (name: string) => {
    const newFolder: Folder = {
      id: new Date().toISOString(),
      name,
    };
    setFolders(prevFolders => [...prevFolders, newFolder]);
  };
  
  const deleteFolder = (id: string) => {
    setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
    setLinks(prevLinks =>
      prevLinks.map(link =>
        link.folderId === id ? { ...link, folderId: null } : link
      )
    );
    if (activeFilter.type === 'folder' && activeFilter.value === id) {
      setActiveFilter({ type: 'all', value: null });
    }
  };

  const updateFolder = (id: string, updates: Partial<Omit<Folder, 'id'>>) => {
    setFolders(prevFolders =>
      prevFolders.map(folder =>
        folder.id === id ? { ...folder, ...updates } : folder
      )
    );
  };
  
  const renameTag = (oldName: string, newName: string) => {
    if (tags.some(t => t.name === newName)) {
      console.error(`Tag "${newName}" already exists.`);
      // In a real app, you'd show a toast notification here.
      return;
    }
    setTags(prevTags =>
      prevTags.map(tag => (tag.name === oldName ? { ...tag, name: newName } : tag))
    );
    setLinks(prevLinks =>
      prevLinks.map(link => ({
        ...link,
        tags: link.tags.map(t => (t === oldName ? newName : t)),
      }))
    );
    if (activeFilter.type === 'tag' && activeFilter.value === oldName) {
      setActiveFilter({ type: 'tag', value: newName });
    }
  };

  const deleteTag = (name: string) => {
    setTags(prevTags => prevTags.filter(tag => tag.name !== name));
    setLinks(prevLinks =>
      prevLinks.map(link => ({
        ...link,
        tags: link.tags.filter(t => t !== name),
      }))
    );
    if (activeFilter.type === 'tag' && activeFilter.value === name) {
      setActiveFilter({ type: 'all', value: null });
    }
  };
  
  const updateTag = (name: string, updates: Partial<Omit<Tag, 'name'>>) => {
    setTags(prevTags =>
      prevTags.map(tag => (tag.name === name ? { ...tag, ...updates } : tag))
    );
  };

  const value = {
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
