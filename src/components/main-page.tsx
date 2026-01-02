'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { Loader2, Check, ChevronsUpDown, Calendar as CalendarIcon, X, PlusCircle, Trash2, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CATEGORIES, AP_CLASSES } from '@/lib/constants';
import syllabusData from '@/lib/syllabusData.json';
import { generateAndSaveStudyPlanAction } from '@/app/actions';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { StudyPathDashboard } from './study-path-dashboard';
import type { WeeklyStudyPath } from '@/ai/schemas/study-path';

// Zod schema for a single topic
const topicSchema = z.object({
  topic: z.string().min(1, 'Topic name is required.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], { required_error: 'Please select a difficulty.' }),
});

// Main form schema
const formSchema = z.object({
  examType: z.string().min(1, 'Please select an exam type.'),
  testDate: z.date({ required_error: 'Test date is required.' }),
  minutesPerDay: z.coerce.number().min(10, 'Must be at least 10 minutes').max(300, 'Cannot exceed 300 minutes'),
  availableStudyDays: z.array(z.string()).min(1, 'Please select at least one study day.'),
  topics: z.array(topicSchema).min(1, 'Please add at least one topic.'),
});

type SyllabusData = {
    [key: string]: {
        name: string;
        description: string;
        sections: {
            name: string;
            units: { topic: string; subtopics?: string[] }[];
        }[];
    };
};

type GroupedSyllabusTopic = {
    section: string;
    topics: string[];
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


interface MainPageProps {
  openAccordionValue: string;
  onAccordionValueChange: (value: string) => void;
}

export function MainPage({ openAccordionValue, onAccordionValueChange }: MainPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<WeeklyStudyPath[] | null>(null);
  const [showApClasses, setShowApClasses] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examType: '',
      minutesPerDay: 60,
      availableStudyDays: [],
      topics: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'topics'
  });

  const selectedExamType = form.watch('examType');

  const getSyllabusTopics = (): GroupedSyllabusTopic[] => {
    const data = syllabusData as SyllabusData;
    if (!selectedExamType || !data[selectedExamType as keyof SyllabusData]) return [];
    
    return data[selectedExamType as keyof SyllabusData].sections.map(section => ({
        section: section.name,
        topics: section.units.flatMap(unit => unit.subtopics ? unit.subtopics : unit.topic)
    }));
  };
  
  const syllabusTopics = getSyllabusTopics();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "You must be logged in to create a study plan.",
        });
        return;
    }
    
    setIsLoading(true);
    setGeneratedPlan(null);

    const result = await generateAndSaveStudyPlanAction({
        userId: user.uid,
        ...values,
    });

    setIsLoading(false);

    if (result.success && result.data) {
      toast({
        title: "Plan Generated!",
        description: "Your personalized study plan is ready below.",
      });
      setGeneratedPlan(result.data);
      onAccordionValueChange(''); // Collapse the form
    } else {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error || 'Failed to generate study plan. Please try again.',
      });
    }
  }

  const handleExamTypeChange = (value: string) => {
    form.setValue('examType', value);
    if (value === 'AP Classes') {
      setShowApClasses(true);
    } else {
      setShowApClasses(false);
    }
  };
  
  const handleApClassSelect = (value: string) => {
    form.setValue('examType', value);
    setShowApClasses(false);
  };

  const handleReset = () => {
    setGeneratedPlan(null);
    form.reset({
      examType: '',
      minutesPerDay: 60,
      availableStudyDays: [],
      topics: [],
    });
    onAccordionValueChange('item-1');
  };

  const isButtonDisabled = isLoading || !form.formState.isValid;
  const examOptions = showApClasses ? AP_CLASSES : EXAM_CATEGORIES;

  if (generatedPlan) {
    return <StudyPathDashboard studyPath={generatedPlan} onReset={handleReset} />;
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center text-center animate-in fade-in-50 duration-500">
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={openAccordionValue}
          onValueChange={onAccordionValueChange}
        >
            <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="w-full h-14 text-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg shadow-primary/30 hover:shadow-primary/40 rounded-xl px-6 hover:no-underline">
                     {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Your Adaptive Plan...</>
                    ) : (
                        <><BookOpen className="mr-2 h-5 w-5" />Create My Study Plan</>
                    )}
                </AccordionTrigger>
                <AccordionContent>
                    <div className="w-full mt-4 bg-transparent border-none">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Column 1: Basics & Schedule */}
                                    <div className="space-y-6">
                                        <Card className="shadow-sm border-border/50 rounded-xl">
                                            <CardHeader>
                                                <CardTitle>1. The Basics</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="examType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Exam Type</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-12 text-base bg-[#F9FAFB]", !field.value && "text-muted-foreground")}>
                                                                            {field.value || "Select Exam Type"}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                    <Command>
                                                                        <CommandInput placeholder="Search exam..."/>
                                                                        <CommandEmpty>No exam found.</CommandEmpty>
                                                                        <CommandList>
                                                                          <CommandGroup>
                                                                            {EXAM_CATEGORIES.map((exam) => (
                                                                              <CommandItem
                                                                                value={exam}
                                                                                key={exam}
                                                                                onSelect={() => {
                                                                                  handleExamTypeChange(exam);
                                                                                  const popoverTrigger = document.querySelector('[aria-controls^="radix-popover-content-"][data-state="open"]');
                                                                                  popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true }))
                                                                                }}
                                                                              >
                                                                                <Check className={cn("mr-2 h-4 w-4", exam === field.value ? "opacity-100" : "opacity-0")}/>
                                                                                {exam}
                                                                              </CommandItem>
                                                                            ))}
                                                                          </CommandGroup>
                                                                          {showApClasses && (
                                                                            <CommandGroup heading="AP Classes">
                                                                              {AP_CLASSES.map((apClass) => (
                                                                                <CommandItem
                                                                                  value={apClass}
                                                                                  key={apClass}
                                                                                  onSelect={() => {
                                                                                    handleApClassSelect(apClass);
                                                                                    const popoverTrigger = document.querySelector('[aria-controls^="radix-popover-content-"][data-state="open"]');
                                                                                    popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true }))
                                                                                  }}
                                                                                >
                                                                                  <Check className={cn("mr-2 h-4 w-4", apClass === field.value ? "opacity-100" : "opacity-0")}/>
                                                                                  {apClass}
                                                                                </CommandItem>
                                                                              ))}
                                                                            </CommandGroup>
                                                                          )}
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="testDate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Test Date</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal h-12 text-base bg-[#F9FAFB]", !field.value && "text-muted-foreground")}>
                                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate()))} initialFocus />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormDescription>When is your big day?</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm border-border/50 rounded-xl">
                                            <CardHeader>
                                                <CardTitle>2. Your Schedule</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                 <FormField
                                                    control={form.control}
                                                    name="availableStudyDays"
                                                    render={() => (
                                                        <FormItem>
                                                            <FormLabel>Weekly Study Days</FormLabel>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                            {DAYS_OF_WEEK.map((day) => (
                                                                <FormField
                                                                    key={day}
                                                                    control={form.control}
                                                                    name="availableStudyDays"
                                                                    render={({ field }) => (
                                                                        <FormItem key={day} className="flex flex-row items-center space-x-2 space-y-0 p-2 rounded-md hover:bg-muted transition-colors">
                                                                            <FormControl>
                                                                                <Checkbox checked={field.value?.includes(day)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked ? field.onChange([...field.value, day]) : field.onChange(field.value?.filter((value) => value !== day))
                                                                                    }}/>
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">{day}</FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            ))}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                 <FormField
                                                    control={form.control}
                                                    name="minutesPerDay"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Minutes per day</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="e.g., 60" {...field} className="h-12 text-base bg-[#F9FAFB]"/>
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    {/* Column 2: Content */}
                                    <div>
                                        <Card className="shadow-sm border-border/50 rounded-xl h-full">
                                          <CardHeader>
                                            <CardTitle>3. The Content</CardTitle>
                                            <FormDescription>What would you like to practice?</FormDescription>
                                          </CardHeader>
                                          <CardContent>
                                                {fields.map((field, index) => (
                                                    <div key={field.id} className="flex items-center gap-2 bg-muted p-2 rounded-lg mb-2">
                                                        <Controller
                                                            name={`topics.${index}.topic`}
                                                            control={form.control}
                                                            render={({ field: controllerField }) => (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant="outline" className="w-full justify-between font-normal flex-1 truncate bg-background">
                                                                            <span className="truncate">{controllerField.value || "Select a Topic"}</span>
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{minWidth: '400px'}}>
                                                                        <Command>
                                                                            <CommandInput placeholder="Search topic..." />
                                                                            <CommandEmpty>No topic found.</CommandEmpty>
                                                                            <CommandList>
                                                                                <ScrollArea className="h-72">
                                                                                {selectedExamType === 'SAT' ? (
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        {syllabusTopics.map((group) => (
                                                                                            <CommandGroup key={group.section} heading={group.section}>
                                                                                                {group.topics.map((topic) => (
                                                                                                    <CommandItem
                                                                                                        key={topic}
                                                                                                        onSelect={() => {
                                                                                                            form.setValue(`topics.${index}.topic`, topic);
                                                                                                            const popoverTrigger = document.querySelector(`[aria-controls^="radix-popover-content-"][data-state="open"]`);
                                                                                                            popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true }))
                                                                                                        }}>
                                                                                                        <Check className={cn("mr-2 h-4 w-4", topic === controllerField.value ? "opacity-100" : "opacity-0")} />
                                                                                                        {topic}
                                                                                                    </CommandItem>
                                                                                                ))}
                                                                                            </CommandGroup>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    syllabusTopics.map((group) => (
                                                                                        <CommandGroup key={group.section} heading={group.section}>
                                                                                            {group.topics.map((topic) => (
                                                                                                <CommandItem
                                                                                                    key={topic}
                                                                                                    onSelect={() => {
                                                                                                        form.setValue(`topics.${index}.topic`, topic);
                                                                                                        const popoverTrigger = document.querySelector(`[aria-controls^="radix-popover-content-"][data-state="open"]`);
                                                                                                        popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true }))
                                                                                                    }}>
                                                                                                    <Check className={cn("mr-2 h-4 w-4", topic === controllerField.value ? "opacity-100" : "opacity-0")} />
                                                                                                    {topic}
                                                                                                </CommandItem>
                                                                                            ))}
                                                                                        </CommandGroup>
                                                                                    ))
                                                                                )}
                                                                                </ScrollArea>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        />
                                                        
                                                        <Controller
                                                            name={`topics.${index}.difficulty`}
                                                            control={form.control}
                                                            render={({ field: controllerField }) => (
                                                                <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                                                                    <SelectTrigger className="w-[150px] bg-background">
                                                                        <SelectValue placeholder="Select difficulty" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Easy">Easy</SelectItem>
                                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                                        <SelectItem value="Hard">Hard</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />

                                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" className="w-full mt-2" onClick={() => append({ topic: '' } as any)}>
                                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Topic
                                                </Button>
                                            <FormMessage className="mt-2">{form.formState.errors.topics?.message || form.formState.errors.topics?.root?.message}</FormMessage>
                                          </CardContent>
                                        </Card>
                                    </div>
                               </div>

                                <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl shadow-primary/30" disabled={isButtonDisabled}>
                                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Generate My Plan'}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
