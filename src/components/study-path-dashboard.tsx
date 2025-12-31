'use client';

import { ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import type { StudyPathModule } from '@/ai/flows/analyze-syllabus-and-match-resources';

interface StudyPathDashboardProps {
  studyPath: StudyPathModule[];
  onReset: () => void;
}

export function StudyPathDashboard({ studyPath, onReset }: StudyPathDashboardProps) {
  return (
    <div className="w-full animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Custom Study Path</h2>
            <p className="text-muted-foreground mt-1">AI-curated free resources, just for you.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
            {/* 
            TODO: Add a "Save to Dashboard" button here, visible only to logged-in users.
            This button should trigger a server action to save the studyPath to Firestore.
            */}
            <Button variant="outline" onClick={onReset}><RefreshCw className="mr-2 h-4 w-4" /> Start Over</Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {studyPath.map((module, index) => (
          <Card key={index} className="flex flex-col transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-primary/30 border-border hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5"/>
                </span>
                <span>{module.topic}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>{module.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href={module.link} target="_blank" rel="noopener noreferrer">
                  Go to Resource <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
