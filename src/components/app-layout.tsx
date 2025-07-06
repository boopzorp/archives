'use client';
import React, { useState } from 'react';
import {
  ArrowDownUp, BarChart2, ChevronDown, Folder as FolderIcon, MessageSquare, Plus, Search, Star, Tag, MoreHorizontal,
} from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuAction } from '@/components/ui/sidebar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { useAppContext } from '@/context/app-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';
import type { Folder } from '@/lib/types';

const folderColors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { searchTerm, setSearchTerm, folders, addFolder, tags, activeFilter, setActiveFilter, updateFolder, deleteFolder } = useAppContext();
  
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [renamedFolderName, setRenamedFolderName] = useState('');

  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsFolderDialogOpen(false);
    }
  };
  
  const handleOpenRenameDialog = (folder: Folder) => {
    setFolderToRename(folder);
    setRenamedFolderName(folder.name);
  };

  const handleRenameFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderToRename && renamedFolderName.trim()) {
      updateFolder(folderToRename.id, { name: renamedFolderName.trim() });
      setFolderToRename(null);
      setRenamedFolderName('');
    }
  };

  const handleOpenDeleteAlert = (folder: Folder) => {
    setFolderToDelete(folder);
  };

  const handleDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
      setFolderToDelete(null);
    }
  };

  const handleSetFolderColor = (folderId: string, color: string) => {
    updateFolder(folderId, { color });
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
                    <SidebarMenuButton 
                      tooltip="Favorites"
                      isActive={activeFilter.type === 'favorites'}
                      onClick={() => setActiveFilter({ type: 'favorites', value: null })}
                    >
                      <Star /><span>Favorites</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Notes"><MessageSquare /><span>Notes</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton 
                      tooltip="Graph"
                      isActive={activeFilter.type === 'graph'}
                      onClick={() => setActiveFilter({ type: 'graph', value: null })}
                    >
                      <BarChart2 /><span>Graph</span>
                    </SidebarMenuButton>
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
                        <FolderIcon style={{ color: folder.color }} /><span>{folder.name}</span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction><MoreHorizontal /></SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                          <DropdownMenuItem onSelect={() => handleOpenRenameDialog(folder)}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <div className="p-2 grid grid-cols-5 gap-2">
                                {folderColors.map(color => (
                                  <button
                                    key={color}
                                    className="w-5 h-5 rounded-full border"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleSetFolderColor(folder.id, color)}
                                  />
                                ))}
                                <button
                                  className="w-5 h-5 rounded-full border bg-muted"
                                  onClick={() => handleSetFolderColor(folder.id, '')}
                                />
                              </div>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleOpenDeleteAlert(folder)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <SidebarInset>
          {children}

          <Dialog open={!!folderToRename} onOpenChange={(open) => !open && setFolderToRename(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleRenameFolder}>
                <DialogHeader>
                  <DialogTitle>Rename Folder</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rename-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="rename-name"
                      value={renamedFolderName}
                      onChange={(e) => setRenamedFolderName(e.target.value)}
                      className="col-span-3"
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{folderToDelete?.name}" folder. Any links inside will not be deleted but will be moved out of the folder. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </SidebarInset>
    </SidebarProvider>
  );
}
