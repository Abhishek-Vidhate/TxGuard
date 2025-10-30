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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Account does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program PDAs not initialized. Run `anchor test` in program/ to initialize.',
          data: { txCount: 0, successCount: 0, failureCount: 0, last100Outcomes: [], cursor: 0 }
        },
        { status: 503 }
      );
    }
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: msg
      },
      { status: 500 }
    );
  }
}
