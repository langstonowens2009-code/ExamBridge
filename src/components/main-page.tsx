'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CATEGORIES } from '@/lib/constants';
import { generateStudyPathAction } from '@/app/actions';
import type { StudyPathModule } from '@/ai/flows/analyze-syllabus-and-match-resources';
import { StudyPathDashboard } from './study-path-dashboard';

const formSchema = z.object({
  originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  examType: z.string().min(1, { message: 'Please select an exam type.' }),
});

export function MainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [studyPath, setStudyPath] = useState<StudyPathModule[] | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: '',
      examType: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setStudyPath(null);

    const result = await generateStudyPathAction(values);

    setIsLoading(false);

    if (result.success && result.data) {
      setStudyPath(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error || 'Failed to generate study path. Please try again.',
      });
    }
  }

  if (studyPath) {
    return <StudyPathDashboard studyPath={studyPath} onReset={() => setStudyPath(null)} />;
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center text-center animate-in fade-in-50 duration-500">
        <div className="bg-primary/10 p-3 rounded-full mb-4 ring-4 ring-primary/20">
            <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Bridge Your Knowledge Gap</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Paste a link to any paid study resource. Our AI will analyze its syllabus and build you a personalized, free learning path.
        </p>

        <Card className="w-full mt-8 shadow-2xl bg-card/70 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="originalUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Resource URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://www.paid-course.com" {...field} className="h-12 text-base" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="examType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Exam Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 text-base">
                                                    <SelectValue placeholder="Select Exam Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {EXAM_CATEGORIES.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> AI Analyzing Syllabus...</>
                            ) : (
                                <>Generate Free Study Path</>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
