'use client';

import { useEffect, useState } from 'react';

interface TransactionData {
  txCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  last100Outcomes: number[];
}

interface FailureBreakdown {
  type: string;
  count: number;
  percentage: number;
}

interface FailureData {
  catalog: {
    slippageExceeded: number;
    insufficientLiquidity: number;
    mevDetected: number;
    droppedTx: number;
    insufficientFunds: number;
    other: number;
  };
  totalFailures: number;
  breakdown: FailureBreakdown[];
}

interface TierStat {
  tier: number;
  name: string;
  count: number;
  percentage: number;
}

interface StatsData {
  transactions: {
    total: number;
    success: number;
    failure: number;
    successRate: number;
  };
  priorityFees: {
    tiers: number[];
    tierStats: TierStat[];
  };
}

interface UseTxGuardDataReturn {
  transactions: TransactionData | null;
  failures: FailureData | null;
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Custom hook to fetch and poll TxGuard data
 */
export function useTxGuardData(pollInterval: number = 5000): UseTxGuardDataReturn {
  const [transactions, setTransactions] = useState<TransactionData | null>(null);
  const [failures, setFailures] = useState<FailureData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all endpoints in parallel
      const [txRes, failuresRes, statsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/failures'),
        fetch('/api/stats')
      ]);

      if (!txRes.ok || !failuresRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const txData = await txRes.json();
      const failuresData = await failuresRes.json();
      const statsData = await statsRes.json();

      if (txData.success) {
        setTransactions(txData.data);
      }
      if (failuresData.success) {
        setFailures(failuresData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching TxGuard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up polling
    const interval = setInterval(() => {
      fetchData();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [refreshTrigger, pollInterval]);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    transactions,
    failures,
    stats,
    loading,
    error,
    refresh
  };
}
