'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { Loader2, Check, ChevronsUpDown, Calendar as CalendarIcon, X, PlusCircle, Trash2 } from 'lucide-react';

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
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EXAM_CATEGORIES, AP_CLASSES } from '@/lib/constants';
import syllabusData from '@/lib/syllabusData.json';
import { generateAndSaveStudyPlan } from '@/app/actions/generate-plan';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from './ui/checkbox';
import { v4 as uuidv4 } from 'uuid';

// Zod schema for a single topic
const topicSchema = z.object({
  topic: z.string().min(1, 'Topic name is required.'),
  difficulty: z.enum(['Easy', 'Hard']),
});

// Main form schema
const formSchema = z.object({
  examType: z.string().min(1, 'Please select an exam type.'),
  testDate: z.date({ required_error: 'Test date is required.' }),
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
  const [showApClasses, setShowApClasses] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examType: '',
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

    const result = await generateAndSaveStudyPlan({
        userId: user.uid,
        testId: uuidv4(), // Generate a unique ID for the test plan
        testName: values.examType,
        testDate: values.testDate,
        availableStudyDays: values.availableStudyDays,
        topics: values.topics,
    });

    setIsLoading(false);

    if (result.success && result.planId) {
      toast({
        title: "Plan Generated!",
        description: "Your new study plan is ready. Redirecting you to the dashboard...",
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error || 'Failed to generate study path. Please try again.',
      });
    }
  }

  const handleExamTypeChange = (value: string, closePopover: () => void) => {
    if (value === 'AP Classes') {
        setShowApClasses(true);
    } else {
        form.setValue('examType', value);
        setShowApClasses(false);
        closePopover();
    }
  }
  
  const handleApClassSelect = (value: string, closePopover: () => void) => {
    form.setValue('examType', value);
    setShowApClasses(false);
    closePopover();
  }

  const resetExamSelection = () => {
    form.setValue('examType', '');
    form.reset({ ...form.getValues(), topics: [] }); // Reset topics when exam type changes
    setShowApClasses(false);
  }

  const isButtonDisabled = isLoading;
  const examOptions = showApClasses ? AP_CLASSES : EXAM_CATEGORIES;

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
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Your Adaptive Plan...</>
                    ) : (
                        <>Create My Study Plan</>
                    )}
                </AccordionTrigger>
                <AccordionContent>
                    <Card className="w-full mt-4 shadow-sm bg-card border-primary/20 rounded-lg">
                        <CardContent className="p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                   
                                    {/* Exam Type Selection */}
                                    <div className="flex flex-col items-center space-y-4">
                                       {selectedExamType ? (
                                            <div className="w-full md:w-2/3 flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                                                <span className="text-muted-foreground text-sm">Selected Exam:</span>
                                                <Badge variant="secondary" className="text-base">{selectedExamType}</Badge>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetExamSelection}>
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Change exam type</span>
                                                </Button>
                                            </div>
                                       ) : (
                                            <FormField
                                                control={form.control}
                                                name="examType"
                                                render={({ field }) => (
                                                    <FormItem className="w-full md:w-2/3">
                                                        <FormLabel className="font-semibold text-lg mb-2 block text-left">1. Select Your Exam</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "w-full justify-between h-12 text-base bg-[#F9FAFB]",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {showApClasses ? "Select AP Class" : "Select Exam Type"}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                <Command>
                                                                    <CommandInput placeholder={showApClasses ? "Search AP Class..." : "Search Exam..."} />
                                                                    <CommandEmpty>No results found.</CommandEmpty>
                                                                    <CommandList>
                                                                        <ScrollArea className="h-72">
                                                                            <CommandGroup>
                                                                                {examOptions.map((exam) => (
                                                                                    <CommandItem
                                                                                        value={exam}
                                                                                        key={exam}
                                                                                        onSelect={(currentValue) => {
                                                                                            const popoverTrigger = document.querySelector('[aria-controls^="radix-popover-content-"][data-state="open"]');
                                                                                            if(showApClasses) {
                                                                                                handleApClassSelect(currentValue, () => popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true })))
                                                                                            } else {
                                                                                                handleExamTypeChange(currentValue, () => popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true })))
                                                                                            }
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
                                                                        </ScrollArea>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                       )}
                                    </div>
                                    
                                    {selectedExamType && (
                                        <>
                                        <div className="grid md:grid-cols-2 gap-8 items-start">
                                            {/* Left Column: Date and Days */}
                                            <div className="space-y-8">
                                                <FormField
                                                    control={form.control}
                                                    name="testDate"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col items-start">
                                                        <FormLabel className="mb-2 w-full font-semibold text-lg text-left">2. When is your test?</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal h-12 text-base bg-[#F9FAFB]",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                                >
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate()))} initialFocus />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="availableStudyDays"
                                                    render={() => (
                                                        <FormItem>
                                                            <div className="mb-4">
                                                                <FormLabel className="font-semibold text-lg text-left w-full block">3. Your study days?</FormLabel>
                                                            </div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {DAYS_OF_WEEK.map((day) => (
                                                                <FormField
                                                                    key={day}
                                                                    control={form.control}
                                                                    name="availableStudyDays"
                                                                    render={({ field }) => {
                                                                        return (
                                                                        <FormItem key={day} className="flex flex-row items-start space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(day)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                            ? field.onChange([...field.value, day])
                                                                                            : field.onChange( field.value?.filter( (value) => value !== day ) )
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">{day.substring(0,3)}</FormLabel>
                                                                        </FormItem>
                                                                        )
                                                                    }}
                                                                />
                                                            ))}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            {/* Right Column: Topics */}
                                            <div>
                                                <FormLabel className="font-semibold text-lg text-left w-full mb-2 block">4. What topics do you want to study?</FormLabel>
                                                <Card className="bg-muted/50 p-4 space-y-4">
                                                    {fields.map((field, index) => (
                                                        <div key={field.id} className="flex items-center gap-2 bg-background p-2 rounded-md">
                                                            <Controller
                                                                name={`topics.${index}.topic`}
                                                                control={form.control}
                                                                render={({ field: controllerField }) => (
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                                                {controllerField.value || "Select a Topic"}
                                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                            <Command>
                                                                                <CommandInput placeholder="Search topic..." />
                                                                                <CommandEmpty>No topic found.</CommandEmpty>
                                                                                <CommandList>
                                                                                    <ScrollArea className="h-72">
                                                                                    {syllabusTopics.map((group) => (
                                                                                        <CommandGroup key={group.section} heading={group.section}>
                                                                                            {group.topics.map((topic) => (
                                                                                                <CommandItem
                                                                                                    key={topic}
                                                                                                    onSelect={() => {
                                                                                                        form.setValue(`topics.${index}.topic`, topic);
                                                                                                        const popoverTrigger = document.querySelector(`[aria-controls^="radix-popover-content-"][data-state="open"]`);
                                                                                                        popoverTrigger?.dispatchEvent(new Event('click', { bubbles: true }))
                                                                                                    }}
                                                                                                    >
                                                                                                    <Check className={cn("mr-2 h-4 w-4", topic === controllerField.value ? "opacity-100" : "opacity-0")} />
                                                                                                    {topic}
                                                                                                </CommandItem>
                                                                                            ))}
                                                                                        </CommandGroup>
                                                                                    ))}
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
                                                                defaultValue="Easy"
                                                                render={({ field: controllerField }) => (
                                                                    <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                                                                        <SelectTrigger className="w-[120px]">
                                                                            <SelectValue placeholder="Difficulty" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Easy">Easy</SelectItem>
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
                                                    <Button type="button" variant="outline" className="w-full" onClick={() => append({ topic: '', difficulty: 'Easy' })}>
                                                        <PlusCircle className="mr-2 h-4 w-4"/> Add Topic
                                                    </Button>
                                                </Card>
                                                <FormMessage>{form.formState.errors.topics?.message || form.formState.errors.topics?.root?.message}</FormMessage>
                                            </div>
                                        </div>
                                        </>
                                    )}


                                    <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl shadow-primary/30" disabled={isButtonDisabled}>
                                        {isLoading ? 'Generating Plan...' : 'Generate My Plan'}
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
