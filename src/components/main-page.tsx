'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, Link as LinkIcon, Type, Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CATEGORIES, AP_CLASSES } from '@/lib/constants';
import { generateStudyPathAction } from '@/app/actions';
import type { StudyPathModule } from '@/ai/schemas/study-path';
import { StudyPathDashboard } from './study-path-dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const formSchema = z.discriminatedUnion('inputType', [
  z.object({
    inputType: z.literal('url'),
    originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
    examType: z.string().min(1, { message: 'Please select an exam type.' }),
  }),
  z.object({
    inputType: z.literal('text'),
    syllabusText: z.string().min(20, 'Syllabus text must be at least 20 characters.'),
    examType: z.string().min(1, { message: 'Please select an exam type.' }),
  }),
]);


export function MainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [studyPath, setStudyPath] = useState<StudyPathModule[] | null>(null);
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [showApSearch, setShowApSearch] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: 'url',
      originalUrl: '',
      examType: '',
    },
  });

  const handleSwitchChange = (checked: boolean) => {
    const newInputType = checked ? 'text' : 'url';
    setInputType(newInputType);
    form.setValue('inputType', newInputType);
    if (newInputType === 'url') {
      form.reset({ ...form.getValues(), inputType: 'url', syllabusText: undefined });
    } else {
      form.reset({ ...form.getValues(), inputType: 'text', originalUrl: '' });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setStudyPath(null);

    const idToken = await user?.getIdToken();
    const result = await generateStudyPathAction(values, idToken);

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

  const handleExamTypeChange = (value: string) => {
    form.setValue('examType', value);
    if (value === 'AP Classes') {
      setShowApSearch(true);
    } else {
      setShowApSearch(false);
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
            Paste a link to any paid study resource or paste the syllabus text directly. Our AI will build you a personalized, free learning path.
        </p>

        <Card className="w-full mt-8 shadow-2xl bg-card/70 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex items-center justify-center space-x-3 pb-4">
                            <LinkIcon className="h-4 w-4" />
                            <Label htmlFor="input-type-switch">Use URL</Label>
                            <Switch id="input-type-switch" checked={inputType === 'text'} onCheckedChange={handleSwitchChange} />
                            <Label htmlFor="input-type-switch">Use Text</Label>
                             <Type className="h-4 w-4" />
                        </div>

                        {inputType === 'url' ? (
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
                        ) : (
                          <FormField
                              control={form.control}
                              name="syllabusText"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">Syllabus Text</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Paste your syllabus here... e.g.&#10;Unit 1: Algebra Basics&#10;Unit 2: Geometry Fundamentals&#10;Unit 3: Advanced Calculus"
                                      className="min-h-[150px] text-base"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className={cn("md:col-span-3", showApSearch && "md:col-span-1")}>
                                <FormField
                                    control={form.control}
                                    name="examType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="sr-only">Exam Category</FormLabel>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <FormControl>
                                              <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                  "w-full justify-between h-12 text-base",
                                                  !field.value && "text-muted-foreground"
                                                )}
                                              >
                                                {field.value
                                                  ? EXAM_CATEGORIES.find(
                                                      (exam) => exam === field.value
                                                    )
                                                  : "Select Exam Type"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                              </Button>
                                            </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-full p-0">
                                            <Command>
                                              <CommandInput placeholder="Search exam type..." />
                                              <CommandEmpty>No exam type found.</CommandEmpty>
                                              <CommandGroup>
                                                {EXAM_CATEGORIES.map((exam) => (
                                                  <CommandItem
                                                    value={exam}
                                                    key={exam}
                                                    onSelect={() => {
                                                      handleExamTypeChange(exam);
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        exam === field.value
                                                          ? "opacity-100"
                                                          : "opacity-0"
                                                      )}
                                                    />
                                                    {exam}
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                />
                            </div>
                            {showApSearch && (
                              <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="examType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="sr-only">AP Class</FormLabel>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <FormControl>
                                              <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                  "w-full justify-between h-12 text-base",
                                                  !field.value && "text-muted-foreground"
                                                )}
                                              >
                                                {field.value && field.value !== 'AP Classes'
                                                  ? field.value
                                                  : "Select AP Class"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                              </Button>
                                            </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-full p-0">
                                            <Command>
                                              <CommandInput placeholder="Search AP Class..." />
                                              <CommandEmpty>No AP class found.</CommandEmpty>
                                              <CommandGroup>
                                                {AP_CLASSES.map((apClass) => (
                                                  <CommandItem
                                                    value={apClass}
                                                    key={apClass}
                                                    onSelect={() => {
                                                      form.setValue('examType', apClass);
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        apClass === field.value
                                                          ? "opacity-100"
                                                          : "opacity-0"
                                                      )}
                                                    />
                                                    {apClass}
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                />
                              </div>
                            )}
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
