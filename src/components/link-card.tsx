import Image from "next/image";
import { Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { Link } from "@/lib/types";

interface LinkCardProps {
  link: Link;
  onDelete: (id: string) => void;
}

export default function LinkCard({ link, onDelete }: LinkCardProps) {
  const openLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="flex flex-col h-full group transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 border-border/80 hover:border-primary/50 overflow-hidden">
      <CardHeader className="flex-row gap-4 items-start pb-4 cursor-pointer" onClick={openLink}>
        {link.imageUrl && (
          <div className="relative w-12 h-12 shrink-0">
             <Image
              src={link.imageUrl}
              alt={`${link.title} favicon`}
              width={48}
              height={48}
              className="rounded-lg object-cover border"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1">
          <CardTitle className="text-lg font-headline leading-tight line-clamp-2">{link.title}</CardTitle>
          <CardDescription className="line-clamp-1 text-sm mt-1">{link.url}</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow cursor-pointer" onClick={openLink}>
        {link.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">{link.description}</p>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start gap-3 pt-4">
        {link.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {link.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal bg-primary/10 text-primary hover:bg-primary/20">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="w-full flex justify-end mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this link.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(link.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
