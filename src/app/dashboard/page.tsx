'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BarChart, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getUserPerformance } from '@/app/actions/user-stats';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (user?.uid) {
        try {
          const result = await getUserPerformance(user.uid);
          if (result.success) {
            setStats(result.data);
          } else {
            setError(result.error || 'Failed to load performance.');
          }
        } catch (e) {
          setError('An error occurred while fetching your data.');
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Syncing your performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-sans">Performance Dashboard</h1>
          <p className="text-muted-foreground">Tailored insights for {user?.displayName || 'Student'}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-md my-6">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {!stats ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
            <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No Data Recorded</h2>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
              Your personalized metrics will appear here once you complete your first AI study session or mock exam.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/study">Start Studying <ChevronRight className="ml-2 h-4 w-4"/></Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 text-sans">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Current Mastery</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.masteryLevel || 'Evaluating...'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Based on practice session accuracy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 text-sans">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Syllabus Progress</CardTitle>
                  <BarChart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(((stats.completedModules || 0) / (stats.totalModules || 1)) * 100)}%
                  </div>
                  <Progress value={((stats.completedModules || 0) / (stats.totalModules || 1)) * 100} className="mt-3 h-2" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sans">Areas for Improvement</CardTitle>
                <CardDescription>Based on your practice results.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stats.weakTopics && stats.weakTopics.length > 0 ? (
                    stats.weakTopics.map((topic: string, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{topic}</span>
                          <span className="text-destructive font-semibold text-xs uppercase">Review Recommended</span>
                        </div>
                        {/* Simplified Progress bar without invalid indicatorColor prop */}
                        <Progress value={45} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      Great job! No critical weak topics identified yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}