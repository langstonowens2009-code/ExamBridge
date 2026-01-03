'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getStudyPlanByIdAction } from '@/app/actions'; // Ensure this action exists
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, ArrowLeft } from 'lucide-react';

export default function PlanDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      if (user && id) {
        // You'll need a server action to fetch a single plan by ID
        const result = await getStudyPlanByIdAction(id as string);
        if (result.success) setPlan(result.data);
        setLoading(false);
      }
    }
    fetchPlan();
  }, [id, user]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">{plan?.request?.examType} Path</h1>
        <p className="text-muted-foreground mb-8">Follow your personalized schedule to master every domain.</p>

        <div className="space-y-12">
          {plan?.response?.studyPlan?.map((week: any, index: number) => (
            <section key={index}>
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" /> {week.week}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {week.modules.map((module: any, mIdx: number) => (
                  <Card key={mIdx} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{module.topic}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                      <Button asChild className="w-full">
                        {/* This link points to your internal study practice room */}
                        <a href={module.link}>Practice This Domain</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}