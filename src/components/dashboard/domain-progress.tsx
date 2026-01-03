'use client';

import { Progress } from '@/components/ui/progress';

interface DomainData {
  name: string;
  accuracy: number;
}

interface DomainProgressProps {
  domains: DomainData[];
}

export function DomainProgress({ domains }: DomainProgressProps) {
  return (
    <div className="space-y-6">
      {domains.map((domain) => (
        <div key={domain.name}>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">{domain.name}</p>
            <p className="text-sm text-muted-foreground">{domain.accuracy}%</p>
          </div>
          <Progress value={domain.accuracy} className="h-2" />
        </div>
      ))}
    </div>
  );
}
