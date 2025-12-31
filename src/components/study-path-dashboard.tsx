'use client';

import { ArrowRight, BookOpen, ExternalLink, File, MoreVertical, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WeeklyStudyPath } from '@/ai/schemas/study-path';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface StudyPathDashboardProps {
  studyPath: WeeklyStudyPath[];
  onReset: () => void;
}

export function StudyPathDashboard({ studyPath, onReset }: StudyPathDashboardProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };
  
  const handleSyncToNotion = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Sync to Notion functionality will be implemented in a future update.',
    });
  }

  return (
    <div className="w-full animate-in fade-in-50 duration-500 printable-area">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 no-print">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Custom Study Path</h2>
            <p className="text-muted-foreground mt-1">AI-curated free resources, just for you.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={onReset}><RefreshCw className="mr-2 h-4 w-4" /> Start Over</Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrint}>
                  <File className="mr-2 h-4 w-4" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSyncToNotion}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Save to Notion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      <Accordion type="multiple" defaultValue={studyPath.map(week => week.week)} className="w-full space-y-4">
        {studyPath.map((weeklyModule, index) => (
          <AccordionItem value={weeklyModule.week} key={index} className="border rounded-lg bg-card/50">
            <AccordionTrigger className="p-6 text-xl font-bold hover:no-underline">
                {weeklyModule.week}
            </AccordionTrigger>
            <AccordionContent className="p-6 pt-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {weeklyModule.modules.map((module, moduleIndex) => (
                        <Card key={moduleIndex} className="flex flex-col transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-primary/30 border-border hover:border-primary/50">
                            <CardHeader>
                            <CardTitle className="flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary no-print">
                                    <BookOpen className="h-5 w-5"/>
                                </span>
                                <span>{module.topic}</span>
                            </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                            <CardDescription>{module.description}</CardDescription>
                            </CardContent>
                            <CardFooter>
                            <Button asChild className="w-full no-print" variant="outline">
                                <Link href={module.link} target="_blank" rel="noopener noreferrer">
                                Go to Resource <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
