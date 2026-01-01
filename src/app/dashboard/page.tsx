
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getStudyPlansAction } from '@/app/actions';
import { seedResourcesAction } from '@/app/actions/seedResources';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BookOpen, PlusCircle, Rocket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPlans() {
      if (user) {
        try {
          // Pass the user's UID directly to the server action
          const result = await getStudyPlansAction(user.uid);
          if (result.success) {
            // Parse the ISO string date back to a Date object
            const parsedPlans = result.data.map((plan: any) => ({
              ...plan,
              createdAt: new Date(plan.createdAt),
            }));
            setPlans(parsedPlans);
          } else {
            setError(result.error || 'Failed to fetch study plans.');
          }
        } catch (e) {
          setError('An error occurred while fetching your plans.');
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        // If user is not logged in and auth is not loading, stop loading.
        setLoading(false);
      }
    }
    fetchPlans();
  }, [user, authLoading]);

  const handleResourceSync = async () => {
    setIsSyncing(true);
    const result = await seedResourcesAction();
    if (result.success) {
        toast({
            title: 'Sync Complete!',
            description: `Resources synced successfully! ${result.count} records are now live.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Sync Failed',
            description: result.error || 'An unknown error occurred during sync.',
        });
    }
    setIsSyncing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Study Plans</h1>
          <Button asChild>
            <Link href="/">Create New Plan</Link>
          </Button>
        </div>

        {error && <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">{error}</div>}

        {/* Temporary Admin Section */}
        <Card className="mb-8 bg-secondary border-primary/20">
            <CardHeader>
                <CardTitle>Admin Control</CardTitle>
                <CardDescription>Temporary controls for database management.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleResourceSync} disabled={isSyncing} className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg p-6">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Rocket className="mr-2 h-4 w-4"/>}
                    {isSyncing ? 'Syncing...' : '🚀 Initial Database Sync'}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                    Click here to upload the contents of <code>src/lib/resourcesData.json</code> to the 'resources' collection in Firestore.
                </p>
            </CardContent>
        </Card>


        {plans.length === 0 && !error ? (
          <div className="text-center py-20 bg-card rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Saved Plans Yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              You haven't created any study plans. Get started by creating your first one!
            </p>
            <Button asChild className="mt-6">
                <Link href="/"><PlusCircle className="mr-2 h-4 w-4"/>Create New Plan</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <span>{plan.examType}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                   <CardDescription>
                    Created {formatDistanceToNow(plan.createdAt, { addSuffix: true })}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.modules?.reduce((acc: number, week: any) => acc + week.modules.length, 0) || 0} total modules
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
