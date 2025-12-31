'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getStudyPlansAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const result = await getStudyPlansAction(idToken);
          if (result.success) {
            setPlans(result.data);
          } else {
            setError(result.error || 'Failed to fetch study plans.');
          }
        } catch (e) {
          setError('An error occurred while fetching your plans.');
        } finally {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      fetchPlans();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Study Plans</h1>
        <Button asChild>
          <Link href="/">Create New Plan</Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border-dashed border-2">
          <h2 className="text-2xl font-semibold">No Saved Plans Yet</h2>
          <p className="text-muted-foreground mt-2">
            Create a new study plan to see it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span>{plan.examType}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(plan.createdAt.toDate(), { addSuffix: true })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.modules?.length || 0} modules
                </p>
                {/* We could add a button to view the plan details */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
