'use client';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { MainPage } from '@/components/main-page';
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
        <div id="main-content" className="container mx-auto flex flex-col items-center px-4 py-16 sm:py-24 bg-card rounded-lg my-8">
            <h2 className="text-3xl font-bold text-center mb-4">Welcome to the future of learning.</h2>
            <p className="text-muted-foreground text-lg text-center max-w-3xl mx-auto mb-12">
                ExamBridge uses advanced search and AI to find the best materials across the web, tailored to your specific goals.
            </p>
            <MainPage 
              openAccordionValue={openAccordion} 
              onAccordionValueChange={setOpenAccordion} 
            />
        </div>
      </main>
    </div>
  );
}
