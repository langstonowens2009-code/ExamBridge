'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface HeroSectionProps {
    onStartJourney: () => void;
}

export function HeroSection({ onStartJourney }: HeroSectionProps) {
    const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

    return (
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-foreground">
            {heroImage && (
                 <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent" />
            <div className="relative z-10 p-4 max-w-4xl mx-auto animate-in fade-in-50 duration-700">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-primary-foreground">
                    Master Your Exams. Powered by AI.
                </h1>
                <p className="mt-4 text-lg md:text-xl text-foreground/80">
                    Custom study plans for SAT, ACT, and AP success.
                </p>
                <Button 
                    size="lg" 
                    className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30 hover:shadow-primary/50"
                    onClick={onStartJourney}
                >
                    Start Your Journey
                </Button>
            </div>
        </section>
    );
}
