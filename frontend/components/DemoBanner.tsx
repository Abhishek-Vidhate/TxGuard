'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function DemoBanner() {
  return (
    <Card className="mb-4 border-red-500/50 bg-red-950/20">
      <CardContent className="py-4">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-red-500 text-red-400">
              Note
            </Badge>
            <span className="font-semibold text-foreground">
              This is a demonstration website for the TxGuard visualization tool.
            </span>
          </div>
          <p className="text-muted-foreground">
            <strong>TxGuard</strong> is a devtool focused towards Solana program developers. For full capacity and use, clone TxGuard into your Solana program workspace and follow the usage instructions in the <code className="px-1 py-0.5 bg-muted rounded text-xs">README.md</code> of the GitHub repo.{' '}
            <Link href="/features" className="text-red-400 hover:text-red-300 underline font-medium">
              View Features
            </Link>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

