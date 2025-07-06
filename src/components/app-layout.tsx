'use client';

import {
  ArrowDownUp, BarChart2, ChevronDown, ChevronRight, Folder as FolderIcon, MessageSquare, Plus, Search, Star,
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { Input } from './ui/input';

export function AppLayout({ children }: { children: React.ReactNode }) {
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
                    <Input placeholder="Search" className="pl-9 h-9" />
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
                      <SidebarMenuButton isActive={true}><FolderIcon /><span>All</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton><FolderIcon /><span>Restaurants To Try</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton><FolderIcon /><span>New Couch For Living Room</span></SidebarMenuButton>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton><FolderIcon /><span>Long Reads</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton><Plus /><span>New folder</span></SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className='flex items-center justify-between'>
                  <span>Auto Tags</span>
                  <ChevronDown className="h-4 w-4" />
              </SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Sports</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Hobbies & Leisure</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Food & Drink</span></SidebarMenuButton>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Home & Garden</span></SidebarMenuButton>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Books & Literature</span></SidebarMenuButton>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>News</span></SidebarMenuButton>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Computers & Electronics</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton><ChevronRight /><span>Science</span></SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
