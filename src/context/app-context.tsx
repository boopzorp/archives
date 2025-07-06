
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');

  const value = {
    searchTerm,
    setSearchTerm,
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
