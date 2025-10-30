import { NextRequest, NextResponse } from 'next/server';
import { getPriorityFeeStats, getTransactionRegistry } from '@/lib/anchor-client';

/**
 * GET /api/stats
 * Returns combined statistics including priority fee analytics
 */
export async function GET(request: NextRequest) {
  try {
    const registry = await getTransactionRegistry();
    const priorityFees = await getPriorityFeeStats();

    // Calculate tier statistics
    const tierNames = ['Free', 'Low', 'Medium', 'High', 'Premium'];
    const tierStats = priorityFees.tiers.map((count, index) => ({
      tier: index,
      name: tierNames[index],
      count: count,
      percentage: priorityFees.tiers.reduce((sum, c) => sum + c, 0) > 0
        ? (count / priorityFees.tiers.reduce((sum, c) => sum + c, 0)) * 100
        : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: {
          total: registry.txCount,
          success: registry.successCount,
          failure: registry.failureCount,
          successRate: registry.txCount > 0 
            ? (registry.successCount / registry.txCount) * 100 
            : 0
        },
        priorityFees: {
          tiers: priorityFees.tiers,
          tierStats
        }
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Account does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program PDAs not initialized. Run `anchor test` in program/ to initialize.',
          data: {
            transactions: { total: 0, success: 0, failure: 0, successRate: 0 },
            priorityFees: { tiers: [0,0,0,0,0], tierStats: [] }
          }
        },
        { status: 503 }
      );
    }
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: msg
      },
      { status: 500 }
    );
  }
}
