'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BarChart, ChevronRight } from 'lucide-react';
import { Header } from '@/components/header';
import { PerformanceHeader } from '@/components/dashboard/performance-header';
import { DifficultyChart } from '@/components/dashboard/difficulty-chart';
import { DomainProgress } from '@/components/dashboard/domain-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPerformanceSummaryAction, PerformanceSummary } from '@/app/actions/get-performance-summary';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerformanceData() {
      if (user) {
        try {
          const result = await getPerformanceSummaryAction(user.uid);
          if (result.success) {
            setPerformanceData(result.data as PerformanceSummary);
          } else {
            setError(result.error || 'Failed to fetch performance data.');
          }
        } catch (e) {
          setError('An error occurred while fetching your performance data.');
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    fetchPerformanceData();
  }, [user, authLoading]);

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
    <div className="flex flex-col min-h-screen bg-secondary/40">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <PerformanceHeader examType={performanceData?.examType || 'SAT'} />

        {error && <div className="text-destructive p-4 bg-destructive/10 rounded-md my-8">{error}</div>}

        {!performanceData ? (
           <div className="text-center py-20 border-2 border-dashed rounded-lg bg-background">
            <BarChart className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Performance Data Yet</h2>
            <p className="mt-2 text-muted-foreground">Your scores will appear here once you submit a mock exam.</p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/mock-exam">Take a Mock Exam <ChevronRight className="ml-2 h-4 w-4"/></Link>
            </Button>
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Question Topics & Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <h3 className="font-semibold text-lg mb-4 text-center">Difficulty Breakdown</h3>
                  <DifficultyChart data={performanceData.difficulty} />
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg mb-4">Domain Performance</h3>
                  <DomainProgress domains={performanceData.domains} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
