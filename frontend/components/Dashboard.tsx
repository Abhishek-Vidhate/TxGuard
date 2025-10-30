'use client';

import { useTxGuardData } from '@/hooks/useTxGuardData';
import { SuccessRateChart } from '@/components/SuccessRateChart';
import { FailureBreakdown } from '@/components/FailureBreakdown';
import { PriorityFeeMatrix } from '@/components/PriorityFeeMatrix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Main Dashboard component
 * Displays TxGuard transaction monitoring data
 */
export default function Dashboard() {
  const { transactions, failures, stats, loading, error, refresh } = useTxGuardData(5000);

  if (loading && !transactions) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Don't block the entire dashboard when there's an error; show a banner and keep any cached data visible

  return (
    <div className="container mx-auto p-6 space-y-6">
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Connection issue</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <button onClick={refresh} className="underline text-sm">Retry</button>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TxGuard Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Transaction Health Monitor & Delivery Optimizer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/features">
            <Button variant="outline" size="sm">
              Features
            </Button>
          </Link>
          <Badge variant={stats?.transactions.successRate && stats.transactions.successRate > 70 ? 'default' : 'destructive'}>
            {stats?.transactions.successRate ? `${stats.transactions.successRate.toFixed(1)}%` : '0%'} Success Rate
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.transactions.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Successful</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.transactions.success}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.transactions.failure}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.transactions.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {transactions && (
          <SuccessRateChart data={transactions.last100Outcomes} />
        )}
        
        {failures && <FailureBreakdown catalog={failures.catalog} />}
      </div>

      {/* Priority Fee Matrix */}
      {stats && <PriorityFeeMatrix tiers={stats.priorityFees.tiers} />}

      {/* Footer Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Local Validator</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Program ID</span>
              <span className="text-sm font-mono">FxYDzyGPggf...Whp1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
