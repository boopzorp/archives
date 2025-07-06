
import Image from 'next/image';
import { MoreHorizontal, Trash2, Folder, Star, Eye } from "lucide-react";

import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Link } from "@/lib/types";

interface LinkCardProps {
  link: Link;
  onDelete: (id: string) => void;
}

function getDomain(url: string) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch (e) {
        return '';
    }
}

export default function LinkCard({ link, onDelete }: LinkCardProps) {
  const openLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const domain = getDomain(link.url);

  return (
    <Card className="flex flex-col h-full group overflow-hidden bg-card border rounded-lg hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-video w-full overflow-hidden cursor-pointer bg-muted" onClick={openLink}>
            <Image
                src={link.imageUrl || `https://placehold.co/600x400.png`}
                alt={link.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="abstract background"
            />
        </div>
        <CardContent className="p-4 flex-grow">
            <CardTitle className="text-base font-medium leading-tight line-clamp-2 mb-1 cursor-pointer" onClick={openLink}>
                {link.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">{domain}</p>
        </CardContent>
      
      <CardFooter className="p-2 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Folder className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Star className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Eye className="h-4 w-4" />
            </Button>
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDelete(link.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
