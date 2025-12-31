'use client';
import { Header } from '@/components/header';
import { MainPage } from '@/components/main-page';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <MainPage />
      </main>
    </div>
  );
}
