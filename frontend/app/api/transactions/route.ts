import { NextRequest, NextResponse } from 'next/server';
import { getTransactionRegistry, calculateSuccessRate } from '@/lib/anchor-client';

/**
 * GET /api/transactions
 * Returns transaction registry data from on-chain PDA
 */
export async function GET(request: NextRequest) {
  try {
    const registry = await getTransactionRegistry();
    const successRate = calculateSuccessRate(registry);

    return NextResponse.json({
      success: true,
      data: {
        txCount: registry.txCount,
        successCount: registry.successCount,
        failureCount: registry.failureCount,
        successRate: successRate,
        last100Outcomes: registry.last100Outcomes,
        cursor: registry.cursor
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      },
      { status: 500 }
    );
  }
}
