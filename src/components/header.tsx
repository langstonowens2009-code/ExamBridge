'use client';

import Link from 'next/link';
import { GraduationCap, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/10 bg-gray-200/30 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">ExamBridge</span>
      </Link>
      <nav className="ml-auto flex gap-2 items-center">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : user ? (
          <>
            <Button variant="ghost" className="text-foreground hover:text-foreground/90" asChild>
                <Link href="/dashboard">Dashboard</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || ''} />
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button variant="ghost" className="text-primary hover:text-primary/90" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="hover:scale-105 transition-transform bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
