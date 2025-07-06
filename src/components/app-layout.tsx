'use client';
import React, { useState } from 'react';
import {
  ArrowDownUp, BarChart2, ChevronDown, Folder as FolderIcon, MessageSquare, Plus, Search, Star, Tag,
} from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { useAppContext } from '@/context/app-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { searchTerm, setSearchTerm, folders, addFolder, tags, activeFilter, setActiveFilter } = useAppContext();
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsFolderDialogOpen(false);
    }
  };

  return (
    <SidebarProvider>
        <Sidebar collapsible="icon" className="bg-card border-r">
          <SidebarHeader className='p-4'>
            <h1 className="text-2xl font-bold text-primary tracking-tighter">Linksort</h1>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search" 
                      className="pl-9 h-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sort by newest first"><ArrowDownUp /><span>Sort by newest first</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Group by none"><FolderIcon /><span>Group by none</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Favorites"><Star /><span>Favorites</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Notes"><MessageSquare /><span>Notes</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Graph"><BarChart2 /><span>Graph</span></SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className='flex items-center justify-between'>
                  <span>Folders</span>
                  <ChevronDown className="h-4 w-4" />
              </SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeFilter.type === 'all'}
                        onClick={() => setActiveFilter({ type: 'all', value: null })}
                      >
                        <FolderIcon /><span>All</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  {folders.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton 
                        isActive={activeFilter.type === 'folder' && activeFilter.value === folder.id}
                        onClick={() => setActiveFilter({ type: 'folder', value: folder.id })}
                      >
                        <FolderIcon /><span>{folder.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton className="w-full justify-start"><Plus /><span>New folder</span></SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleAddFolder}>
                          <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                Name
                              </Label>
                              <Input
                                id="name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Create Folder</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>
                  <span>Tags</span>
              </SidebarGroupLabel>
              <SidebarMenu>
                  {tags.map((tag) => (
                    <SidebarMenuItem key={tag}>
                      <SidebarMenuButton
                        isActive={activeFilter.type === 'tag' && activeFilter.value === tag}
                        onClick={() => setActiveFilter({ type: 'tag', value: tag })}
                      >
                        <Tag /><span>{tag}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
