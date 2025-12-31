'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { Loader2, Link as LinkIcon, Type, Check, ChevronsUpDown, Calendar as CalendarIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CATEGORIES, AP_CLASSES } from '@/lib/constants';
import { generateStudyPathAction } from '@/app/actions';
import type { WeeklyStudyPath } from '@/ai/schemas/study-path';
import { StudyPathDashboard } from './study-path-dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const formSchema = z.discriminatedUnion('inputType', [
  z.object({
    inputType: z.literal('url'),
    originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
    examType: z.string().min(1, { message: 'Please select an exam type.' }),
    testDate: z.date().optional(),
    customInstructions: z.string().optional(),
  }),
  z.object({
    inputType: z.literal('text'),
    syllabusText: z.string().min(20, 'Syllabus text must be at least 20 characters.'),
    examType: z.string().min(1, { message: 'Please select an exam type.' }),
    testDate: z.date().optional(),
    customInstructions: z.string().optional(),
  }),
]);

interface MainPageProps {
  openAccordionValue: string;
  onAccordionValueChange: (value: string) => void;
}

export function MainPage({ openAccordionValue, onAccordionValueChange }: MainPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [studyPath, setStudyPath] = useState<WeeklyStudyPath[] | null>(null);
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [showApSearch, setShowApSearch] = useState(false);
  const [isExamTypeSelected, setIsExamTypeSelected] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: 'url',
      originalUrl: '',
      examType: '',
      customInstructions: '',
    },
  });

  const handleSwitchChange = (checked: boolean) => {
    const newInputType = checked ? 'text' : 'url';
    setInputType(newInputType);
    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      inputType: newInputType,
      originalUrl: newInputType === 'text' ? '' : currentValues.originalUrl,
      syllabusText: newInputType === 'url' ? undefined : currentValues.syllabusText,
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setStudyPath(null);

    const idToken = user ? await user.getIdToken() : undefined;
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
      setIsExamTypeSelected(false); // Don't finalize selection yet, wait for specific AP class
    } else {
      setShowApSearch(false);
      setIsExamTypeSelected(true);
    }
  }
  
  const handleApClassSelect = (value: string) => {
    form.setValue('examType', value);
    setIsExamTypeSelected(true);
  }

  const resetExamSelection = () => {
    form.setValue('examType', '');
    setIsExamTypeSelected(false);
    setShowApSearch(false);
  }

  if (studyPath) {
    return <StudyPathDashboard studyPath={studyPath} onReset={() => setStudyPath(null)} />;
  }
  
  const isButtonDisabled = isLoading || !isExamTypeSelected;
  const selectedExamType = form.watch('examType');

  return (
    <div className="w-full max-w-4xl flex flex-col items-center text-center animate-in fade-in-50 duration-500">
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={openAccordionValue}
          onValueChange={onAccordionValueChange}
        >
            <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg shadow-primary/30 hover:shadow-primary/40 rounded-md px-6 hover:no-underline">
                     {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> AI Analyzing Syllabus...</>
                    ) : (
                        <>Generate Free Study Path</>
                    )}
                </AccordionTrigger>
                <AccordionContent>
                    <Card className="w-full mt-4 shadow-sm bg-white border border-emerald-100 rounded-lg">
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
                                                <FormDescription>
                                                    Enter the URL of a paid study resource, and we'll find free alternatives.
                                                </FormDescription>
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
                                                placeholder="Paste your syllabus here... e.g.
Unit 1: Algebra Basics
Unit 2: Geometry Fundamentals
Unit 3: Advanced Calculus"
                                                className="min-h-[150px] text-base"
                                                {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    )}

                                    <div className="flex flex-col items-center space-y-4">
                                       {isExamTypeSelected ? (
                                            <div className="w-full md:w-1/2 flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                                                <span className="text-muted-foreground text-sm">Selected:</span>
                                                <Badge variant="secondary">{selectedExamType}</Badge>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetExamSelection}>
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Change exam type</span>
                                                </Button>
                                            </div>
                                       ) : (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="examType"
                                                    render={({ field }) => (
                                                        <FormItem className="w-full md:w-1/2">
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
                                                                                ) || (AP_CLASSES.includes(field.value) ? 'AP Classes' : 'Select Exam Type')
                                                                                : "Select Exam Type"}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                    <Command>
                                                                        
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
                                                {showApSearch && (
                                                    <FormField
                                                        control={form.control}
                                                        name="examType"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full md:w-1/2">
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
                                                                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                                                                        <Command>
                                                                            <CommandInput placeholder="Search AP Class..." />
                                                                            <CommandEmpty>No AP class found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {AP_CLASSES.map((apClass) => (
                                                                                    <CommandItem
                                                                                        value={apClass}
                                                                                        key={apClass}
                                                                                        onSelect={() => {
                                                                                            handleApClassSelect(apClass);
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
                                                )}
                                            </>
                                       )}
                                    </div>
                                    
                                    <FormField
                                        control={form.control}
                                        name="testDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col items-center">
                                            <FormLabel className="mb-2 text-left w-full font-semibold">When is your test date? (Optional)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal h-12 text-base",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="center">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                    date < new Date(new Date().setDate(new Date().getDate() - 1))
                                                    }
                                                    initialFocus
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="customInstructions"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="font-semibold">Custom Instructions (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                placeholder="e.g., 'Focus only on the Math section' or 'Find harder practice questions for Organic Chemistry'"
                                                className="min-h-[100px]"
                                                {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="leading-relaxed">
                                                Tell the AI your specific goals or what to focus on.
                                            </FormDescription>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl shadow-primary/30" disabled={isButtonDisabled}>
                                        {isLoading ? 'Submitting...' : 'Submit'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
