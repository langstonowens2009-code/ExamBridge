'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

interface PerformanceHeaderProps {
  examType: string;
}

export function PerformanceHeader({ examType }: PerformanceHeaderProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2024, 0, 20),
    to: new Date(),
  });

  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold">Your {examType} Performance Dashboard</h1>
        <p className="text-muted-foreground">Analyze your strengths and weaknesses.</p>
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <Button asChild variant="outline">
          <Link href="/dashboard/mock-exams">
            <FileText className="mr-2 h-4 w-4" />
            Mock Exams
          </Link>
        </Button>
      </div>
    </div>
  );
}
