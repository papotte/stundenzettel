'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import ExportPreview from '@/components/export-preview';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function ExportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

   useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }
  
  return (
    <div className="bg-muted min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Button asChild variant="outline" className="mb-4 print:hidden">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracker
          </Link>
        </Button>
        <ExportPreview />
      </div>
    </div>
  );
}
