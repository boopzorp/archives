
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Link, Folder } from '@/lib/types';

type ActiveFilter = {
  type: 'all' | 'folder' | 'tag' | 'favorites' | 'graph';
  value: string | null;
};

interface AppContextState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  links: Link[];
  folders: Folder[];
  tags: string[];
  addLink: (newLink: Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>) => void;
  deleteLink: (id: string) => void;
  updateLink: (id: string, updates: Partial<Omit<Link, 'id'>>) => void;
  addFolder: (name: string) => void;
  activeFilter: ActiveFilter;
  setActiveFilter: (filter: ActiveFilter) => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [links, setLinks] = useState<Link[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ type: 'all', value: null });

  useEffect(() => {
    setIsClient(true);
    try {
      const storedLinks = localStorage.getItem('linksort_links');
      if (storedLinks) {
        setLinks(JSON.parse(storedLinks));
      }
      const storedFolders = localStorage.getItem('linksort_folders');
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }
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
      const allTags = new Set<string>();
      links.forEach(link => {
        if (link.tags) {
            link.tags.forEach(tag => allTags.add(tag));
        }
      });
      setTags(Array.from(allTags).sort());
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
