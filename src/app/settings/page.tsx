'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getUserSettings, setUserSettings } from '@/services/user-settings-service';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const settingsFormSchema = z.object({
  defaultWorkHours: z.coerce.number().min(1, 'Must be at least 1 hour').max(10, 'Cannot be more than 10 hours'),
  defaultStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  defaultEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      defaultWorkHours: 7,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchSettings = async () => {
        try {
          const settings = await getUserSettings(user.uid);
          form.reset(settings);
        } catch (error) {
          console.error('Failed to fetch user settings', error);
          toast({
            title: 'Error',
            description: 'Could not load your settings.',
            variant: 'destructive',
          });
        } finally {
          setPageLoading(false);
        }
      };
      fetchSettings();
    }
  }, [user, form, toast]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setUserSettings(user.uid, data);
      toast({
        title: 'Settings Saved',
        description: 'Your new settings have been applied.',
      });
    } catch (error) {
      console.error('Failed to save user settings', error);
      toast({
        title: 'Error',
        description: 'Could not save your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
        <div className="bg-muted min-h-screen p-4 sm:p-8">
            <div className="max-w-xl mx-auto">
                <Skeleton className="h-10 w-32 mb-8" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-full max-w-sm mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                             <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="bg-muted min-h-screen p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracker
          </Link>
        </Button>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>
                  Manage your personal application settings here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="defaultWorkHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default daily work hours</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground pt-1">
                        Used for Sick Leave, PTO, and Bank Holiday entries.
                      </p>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                   <FormField
                      control={form.control}
                      name="defaultStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default start time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                           <FormDescription>
                            Used for new time entries.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="defaultEndTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default end time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                           <FormDescription>
                            Used for new time entries.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
