import { MoreHorizontal, Trash2, Folder, Star, Pencil } from "lucide-react";

import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";

import type { Link } from "@/lib/types";
import { cn, getBrandName } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
}

export default function LinkCard({ link, onEdit }: LinkCardProps) {
  const { folders, tags: managedTags, updateLink, deleteLink } = useAppContext();
  const { toast } = useToast();

  const openLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };
  
  const onDelete = async () => {
    try {
      await deleteLink(link.id);
    } catch (error) {
      console.error("Failed to delete link:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete link",
        description: "Could not connect to the database. Please ensure Firestore is enabled.",
      });
    }
  };
  
  const onToggleFavorite = async () => {
    try {
      await updateLink(link.id, { isFavorite: !link.isFavorite });
    } catch (error) {
      console.error("Failed to update favorite status:", error);
      toast({
        variant: "destructive",
        title: "Failed to update link",
        description: "Could not connect to the database. Please ensure Firestore is enabled.",
      });
    }
  };

  const onAssignFolder = async (folderId: string | null) => {
    try {
      await updateLink(link.id, { folderId });
    } catch (error) {
      console.error("Failed to assign folder:", error);
      toast({
        variant: "destructive",
        title: "Failed to move link",
        description: "Could not connect to the database. Please ensure Firestore is enabled.",
      });
    }
  };
  
  const onEditClick = () => onEdit(link);

  const brandName = getBrandName(link.url);
  
  const tagColorMap = useMemo(() => 
    new Map(managedTags.map(t => [t.name, t.color]))
  , [managedTags]);
  
  return (
    <Card className="flex flex-col h-full group overflow-hidden bg-card border rounded-lg hover:shadow-lg transition-shadow duration-300">
      {link.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden cursor-pointer bg-muted" onClick={openLink}>
            <img
                src={link.imageUrl}
                alt={link.title}
                className="absolute h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="abstract background"
            />
        </div>
      )}
      <CardContent className="p-4 flex-grow">
          <CardTitle className="text-base font-medium leading-tight line-clamp-2 mb-1 cursor-pointer" onClick={openLink}>
              {link.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground truncate">{brandName}</p>
            {link.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{link.description}</p>
          )}
          {link.tags && link.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {link.tags.slice(0, 3).map(tag => {
                const color = tagColorMap.get(tag);
                return (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="font-normal"
                    style={color ? { backgroundColor: color, color: 'hsl(var(--secondary-foreground))' } : {}}
                  >
                    {tag}
                  </Badge>
                )
              })}
            </div>
          )}
      </CardContent>
      
      <CardFooter className="p-2 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Folder className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={link.folderId ?? 'none'}
                  onValueChange={(value) => onAssignFolder(value === 'none' ? null : value)}
                >
                  <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                  {folders.map((folder) => (
                    <DropdownMenuRadioItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onToggleFavorite}>
                <Star className={cn("h-4 w-4", link.isFavorite && "fill-current text-yellow-400")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onEditClick}>
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
