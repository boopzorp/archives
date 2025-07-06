'use client';
import React, { useState } from 'react';
import {
  ArrowDown, ArrowDownAZ, ArrowUp, ArrowUpAZ, BarChart2, ChevronDown, Folder as FolderIcon, MessageSquare, Plus, Search, Star, Tag, MoreHorizontal,
} from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuAction, SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { useAppContext } from '@/context/app-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';
import type { Folder, Tag as TagType, GroupByOption, SortByOption } from '@/lib/types';

const paletteColors = [
  '#fca5a5', '#fdba74', '#fde047', '#bef264', '#86efac', '#67e8f9', 
  '#a5b4fc', '#d8b4fe', '#f9a8d4', '#fda4af', '#fb923c', '#facc15',
  '#a3e635', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'
];


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { 
    searchTerm, setSearchTerm, 
    folders, addFolder, updateFolder, deleteFolder,
    tags, renameTag, updateTag, deleteTag,
    activeFilter, setActiveFilter,
    groupBy, setGroupBy,
    sortBy, setSortBy,
  } = useAppContext();
  
  // Folder states
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [renamedFolderName, setRenamedFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // Tag states
  const [tagToRename, setTagToRename] = useState<TagType | null>(null);
  const [renamedTagName, setRenamedTagName] = useState('');
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);


  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsFolderDialogOpen(false);
    }
  };
  
  const handleOpenRenameDialog = (item: Folder | TagType, type: 'folder' | 'tag') => {
    if (type === 'folder') {
      setFolderToRename(item as Folder);
      setRenamedFolderName(item.name);
    } else {
      setTagToRename(item as TagType);
      setRenamedTagName(item.name);
    }
  };

  const handleRenameItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderToRename && renamedFolderName.trim()) {
      updateFolder(folderToRename.id, { name: renamedFolderName.trim() });
      setFolderToRename(null);
      setRenamedFolderName('');
    } else if (tagToRename && renamedTagName.trim()) {
      renameTag(tagToRename.name, renamedTagName.trim());
      setTagToRename(null);
      setRenamedTagName('');
    }
  };

  const handleOpenDeleteAlert = (item: Folder | TagType, type: 'folder' | 'tag') => {
    if (type === 'folder') {
      setFolderToDelete(item as Folder);
    } else {
      setTagToDelete(item as TagType);
    }
  };

  const handleDeleteItem = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
      setFolderToDelete(null);
    } else if (tagToDelete) {
      deleteTag(tagToDelete.name);
      setTagToDelete(null);
    }
  };

  const handleSetItemColor = (id: string, color: string, type: 'folder' | 'tag') => {
    if (type === 'folder') {
      updateFolder(id, { color });
    } else {
      updateTag(id, { color });
    }
  };
  
  const handleGroupByChange = (value: string) => {
    setGroupBy(value as GroupByOption);
  }

  const getGroupByLabel = () => {
    const capitalized = groupBy.charAt(0).toUpperCase() + groupBy.slice(1);
    return `Group by ${capitalized}`;
  }

  const handleSortByChange = (value: string) => {
    setSortBy(value as SortByOption);
  }

  const sortOptions: { [key in SortByOption]: { label: string; icon: React.ElementType } } = {
    'newest': { label: 'Newest first', icon: ArrowDown },
    'oldest': { label: 'Oldest first', icon: ArrowUp },
    'title-asc': { label: 'Title (A-Z)', icon: ArrowDownAZ },
    'title-desc': { label: 'Title (Z-A)', icon: ArrowUpAZ },
  };

  const currentSortOption = sortOptions[sortBy];
  const CurrentSortIcon = currentSortOption.icon;

  return (
    <SidebarProvider>
        <Sidebar collapsible="icon" className="bg-card border-r">
          <SidebarHeader className='p-4 flex items-center justify-between group-data-[state=collapsed]:justify-center'>
            <h1 className="text-2xl font-bold text-primary tracking-tighter group-data-[state=collapsed]:hidden">Archives</h1>
            <SidebarTrigger className="hidden md:flex" />
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton tooltip={`Sort by ${currentSortOption.label}`}>
                        <CurrentSortIcon />
                        <span>Sort by {currentSortOption.label}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortByChange}>
                        {Object.entries(sortOptions).map(([value, { label }]) => (
                          <DropdownMenuRadioItem key={value} value={value}>
                            {label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton tooltip={getGroupByLabel()}>
                        <FolderIcon /><span>{getGroupByLabel()}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Group By</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={groupBy} onValueChange={handleGroupByChange}>
                        <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="day">Day</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="month">Month</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="year">Year</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <SidebarMenuButton 
                      tooltip="Notes"
                      isActive={activeFilter.type === 'notes'}
                      onClick={() => setActiveFilter({ type: 'notes', value: null })}
                    >
                      <MessageSquare /><span>Notes</span>
                    </SidebarMenuButton>
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
                          <DropdownMenuItem onSelect={() => handleOpenRenameDialog(folder, 'folder')}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <div className="p-2 grid grid-cols-6 gap-2">
                                {paletteColors.map(color => (
                                  <button
                                    key={color}
                                    className="w-5 h-5 rounded-full border"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleSetItemColor(folder.id, color, 'folder')}
                                  />
                                ))}
                                <button
                                  className="w-5 h-5 rounded-full border bg-muted"
                                  onClick={() => handleSetItemColor(folder.id, '', 'folder')}
                                />
                              </div>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleOpenDeleteAlert(folder, 'folder')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
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
                    <SidebarMenuItem key={tag.name}>
                      <SidebarMenuButton
                        isActive={activeFilter.type === 'tag' && activeFilter.value === tag.name}
                        onClick={() => setActiveFilter({ type: 'tag', value: tag.name })}
                      >
                         <Tag style={{ color: tag.color }} /><span>{tag.name}</span>
                      </SidebarMenuButton>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction><MoreHorizontal /></SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                          <DropdownMenuItem onSelect={() => handleOpenRenameDialog(tag, 'tag')}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                               <div className="p-2 grid grid-cols-6 gap-2">
                                {paletteColors.map(color => (
                                  <button
                                    key={color}
                                    className="w-5 h-5 rounded-full border"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleSetItemColor(tag.name, color, 'tag')}
                                  />
                                ))}
                                <button
                                  className="w-5 h-5 rounded-full border bg-muted"
                                  onClick={() => handleSetItemColor(tag.name, '', 'tag')}
                                />
                              </div>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleOpenDeleteAlert(tag, 'tag')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          {children}

          <Dialog open={!!folderToRename || !!tagToRename} onOpenChange={(open) => { if (!open) { setFolderToRename(null); setTagToRename(null); } }}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleRenameItem}>
                <DialogHeader>
                  <DialogTitle>Rename {folderToRename ? 'Folder' : 'Tag'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rename-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="rename-name"
                      value={folderToRename ? renamedFolderName : renamedTagName}
                      onChange={(e) => folderToRename ? setRenamedFolderName(e.target.value) : setRenamedTagName(e.target.value)}
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

          <AlertDialog open={!!folderToDelete || !!tagToDelete} onOpenChange={(open) => { if (!open) { setFolderToDelete(null); setTagToDelete(null); } }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {folderToDelete 
                    ? `This will permanently delete the "${folderToDelete?.name}" folder. Any links inside will not be deleted but will be moved out of the folder. This action cannot be undone.`
                    : `This will permanently delete the "${tagToDelete?.name}" tag from all links. This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </SidebarInset>
    </SidebarProvider>
  );
}
