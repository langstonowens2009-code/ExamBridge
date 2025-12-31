import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LoginModal } from './login-modal';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">ExamBridge</span>
      </Link>
      <nav className="ml-auto flex gap-2">
        {/*
          TODO: Implement Firebase Authentication
          - Create /login and /signup pages
          - Wire up these buttons to navigate to those pages
          - Show user avatar and a "Logout" button when logged in
        */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Log In</Button>
          </DialogTrigger>
          <LoginModal />
        </Dialog>
        <Button>Sign Up</Button>
      </nav>
    </header>
  );
}
