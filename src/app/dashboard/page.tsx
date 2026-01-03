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
          const result = await getStudyPlansAction(user.uid);
          if (result.success) {
            const parsedPlans = result.data.map((plan: any) => ({
              ...plan,
              createdAt: new Date(plan.createdAt.seconds * 1000),
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
        setLoading(false);
      }
    }
    fetchPlans();
  }, [user, authLoading]);

  const handleResourceSync = async () => {
    setIsSyncing(true);
    const result = await seedResourcesAction();
    if (result.success) {
      toast({ title: 'Sync Complete!', description: 'Resources are now live.' });
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

        {error && <div className="text-destructive p-4 bg-destructive/10 rounded-md mb-8">{error}</div>}

        <Card className="mb-8 bg-secondary/50 border-primary/20">
          <CardHeader>
            <CardTitle>Admin Control</CardTitle>
            <CardDescription>Database management tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleResourceSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Rocket className="mr-2 h-4 w-4"/>}
              Sync Database
            </Button>
          </CardContent>
        </Card>

        {plans.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Saved Plans Yet</h2>
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
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>{plan.request.examType}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>
                    Created {formatDistanceToNow(plan.createdAt, { addSuffix: true })}
                  </CardDescription>
                  <Button asChild className="w-full mt-4" variant="outline">
                    <Link href={`/dashboard/plan/${plan.id}`}>View Study Path</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}