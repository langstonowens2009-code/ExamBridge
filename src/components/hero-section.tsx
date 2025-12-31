'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function HeroSection() {
    const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

    const handleScroll = () => {
        const element = document.getElementById('main-content');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white">
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 p-4 max-w-4xl mx-auto animate-in fade-in-50 duration-700">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-300">
                    Master Your Exams. Powered by AI.
                </h1>
                <p className="mt-4 text-lg md:text-xl text-white/80">
                    Custom study plans for SAT, ACT, and AP success.
                </p>
                <Button 
                    size="lg" 
                    className="mt-8 bg-primary/80 text-primary-foreground hover:bg-primary transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30 hover:shadow-primary/50"
                    onClick={handleScroll}
                >
                    Start Your Journey
                </Button>
            </div>
        </section>
    );
}
