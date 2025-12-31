'use client';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { MainPage } from '@/components/main-page';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <div id="main-content" className="container mx-auto flex flex-col items-center px-4 py-16 sm:py-24">
            <h2 className="text-3xl font-bold text-center mb-4">Welcome to the future of learning.</h2>
            <p className="text-muted-foreground text-lg text-center max-w-3xl mx-auto mb-12">
                ExamBridge uses advanced search and AI to find the best materials across the web, tailored to your specific goals.
            </p>
            <MainPage />
        </div>
      </main>
    </div>
  );
}
