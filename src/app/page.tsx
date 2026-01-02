'use client';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { MainPage } from '@/components/main-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, CalendarClock, BookCheck } from 'lucide-react';
import { useState } from 'react';

export const maxDuration = 60; // Wait up to 60 seconds for server actions

export default function Home() {
  const [openAccordion, setOpenAccordion] = useState<string>('');

  const handleOpenAccordion = () => {
    setOpenAccordion('item-1');
     const element = document.getElementById('main-content');
    if (element) {
        // A slight delay ensures the scroll happens after the state update has started rendering
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection onStartJourney={handleOpenAccordion} />
        <div id="main-content" className="container mx-auto flex flex-col items-center px-4 py-16 sm:py-24 bg-background rounded-lg my-8">
            <h2 className="text-3xl font-bold text-center mb-4 text-[#064E3B]">Welcome to the future of learning.</h2>
            <p className="text-muted-foreground text-lg text-center max-w-3xl mx-auto mb-12">
                ExamBridge uses Gemini AI to curate top educational resources into a personalized study roadmap built for your specific goals.
            </p>
            <MainPage 
              openAccordionValue={openAccordion} 
              onAccordionValueChange={setOpenAccordion} 
            />
        </div>
        
        <section id="about" className="py-16 sm:py-24 bg-muted/50">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">The Technology Behind ExamBridge</h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                            <CardTitle>Intelligence by Gemini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">ExamBridge uses Google's latest Gemini 1.5 Flash model to analyze your specific exam date and topic list.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <CalendarClock className="h-8 w-8 text-primary" />
                            <CardTitle>Dynamic Planning</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Unlike static schedules, our AI calculates study priority based on the difficulty levels you provide, ensuring you spend time where it matters most.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <BookCheck className="h-8 w-8 text-primary" />
                            <CardTitle>Curated Expertise</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">The AI acts as a digital counselor, pulling from its vast knowledge of trusted educational frameworks like the College Board and Khan Academy to suggest the best free resources available.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
