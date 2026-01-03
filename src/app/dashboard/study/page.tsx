'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateStudySessionAction } from '@/app/actions/generateStudySession';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookText, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Question {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface StudySessionData {
  notes: string;
  questions: Question[];
}

function StudySessionContent() {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  const exam = searchParams.get('exam');
  const time = searchParams.get('time');

  const [sessionData, setSessionData] = useState<StudySessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (topic && exam && time) {
      const fetchSession = async () => {
        setLoading(true);
        setError(null);
        const result = await generateStudySessionAction(topic, exam, time);
        if (result.success) {
          setSessionData(result.data);
          setUserAnswers(new Array(result.data.questions.length).fill(-1));
        } else {
          setError(result.error || 'Failed to generate study session.');
        }
        setLoading(false);
      };
      fetchSession();
    } else {
      setError('Missing required study parameters in URL.');
      setLoading(false);
    }
  }, [topic, exam, time]);

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Building Your Study Session...</h2>
        <p className="text-muted-foreground">The AI is preparing your notes and practice questions.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive bg-destructive/10 p-4 rounded-md text-center">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookText className="h-6 w-6 text-primary" />
            Mastery Notes: {topic}
          </CardTitle>
          <CardDescription>Key concepts and summaries curated by the AI tutor.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sessionData.notes }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Practice Questions
          </CardTitle>
          <CardDescription>Test your understanding of the material.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionData.questions.map((q, qIndex) => (
            <div key={qIndex} className="p-4 border rounded-lg">
              <p className="font-semibold mb-4">{qIndex + 1}. {q.q}</p>
              <RadioGroup
                value={userAnswers[qIndex]?.toString()}
                onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
                disabled={submitted}
              >
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center space-x-2">
                    <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                    <Label htmlFor={`q${qIndex}-o${oIndex}`} className={cn(
                      "font-normal",
                      submitted && (q.answer === oIndex ? 'text-green-600' : (userAnswers[qIndex] === oIndex ? 'text-red-600' : ''))
                    )}>
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {submitted && (
                <div className={cn("mt-4 p-3 rounded-md text-sm",
                  userAnswers[qIndex] === q.answer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                )}>
                  {userAnswers[qIndex] === q.answer ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <p><strong>Correct!</strong> {q.explanation}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <div>
                        <p><strong>Incorrect.</strong> The correct answer is: {q.options[q.answer]}</p>
                        <p>{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <Button onClick={handleSubmit} disabled={submitted || userAnswers.includes(-1)} className="w-full">
            Submit Answers
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudyPage() {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Study Room: <span className="text-primary">{topic}</span></h1>
        <p className="text-muted-foreground mb-8">Focus and master this specific domain.</p>
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
          <StudySessionContent />
        </Suspense>
      </main>
    </div>
  );
}
