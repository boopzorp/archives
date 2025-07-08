
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

const signupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(20, { message: "Username must be less than 20 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isFirebaseReady = !!auth && !!db;
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fromExtension = searchParams.get('from') === 'extension';
    if (!authLoading && user && !fromExtension) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router, searchParams]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    if (!isFirebaseReady) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: data.username,
      });

      await setDoc(doc(db, "users", user.uid), {
        username: data.username,
        email: data.email,
        createdAt: new Date().toISOString(),
        links: [],
        folders: [],
        tags: [],
      });
      
      if (searchParams.get('from') === 'extension') {
          window.close();
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.code === 'auth/email-already-in-use' 
          ? "This email is already in use. Please log in."
          : (error.message || "An unexpected error occurred. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (user && searchParams.get('from') !== 'extension')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
                <LinkIcon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">archives</span>
            </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Start organizing your digital world today.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isFirebaseReady && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Firebase Not Configured</AlertTitle>
                <AlertDescription>
                  Please add your Firebase credentials to the <code>.env</code> file to enable sign up.
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="yourusername" {...field} disabled={!isFirebaseReady || isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} disabled={!isFirebaseReady || isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseReady || isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading || !isFirebaseReady}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    }>
      <SignupPageContent />
    </Suspense>
  )
}
