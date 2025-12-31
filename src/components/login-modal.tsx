'use client';

import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginModal() {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Log In</DialogTitle>
        <DialogDescription>
          Enter your email and password to access your account.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input id="email" type="email" placeholder="name@example.com" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" a className="text-right">
            Password
          </Label>
          <Input id="password" type="password" className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full">Log In</Button>
      </DialogFooter>
    </DialogContent>
  );
}
