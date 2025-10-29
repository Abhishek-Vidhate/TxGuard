import { NextRequest, NextResponse } from 'next/server';
import { getFailureCatalog } from '@/lib/anchor-client';

/**
 * GET /api/failures
 * Returns failure catalog data from on-chain PDA
 */
export async function GET(request: NextRequest) {
  try {
    const catalog = await getFailureCatalog();

    // Calculate total failures
    const totalFailures = Object.values(catalog).reduce((sum, count) => sum + count, 0);

    // Create breakdown with percentages
    const breakdown = [
      { type: 'Slippage Exceeded', count: catalog.slippageExceeded, percentage: 0 },
      { type: 'Insufficient Liquidity', count: catalog.insufficientLiquidity, percentage: 0 },
      { type: 'MEV Detected', count: catalog.mevDetected, percentage: 0 },
      { type: 'Dropped Transaction', count: catalog.droppedTx, percentage: 0 },
      { type: 'Insufficient Funds', count: catalog.insufficientFunds, percentage: 0 },
      { type: 'Other', count: catalog.other, percentage: 0 }
    ].map(item => ({
      ...item,
      percentage: totalFailures > 0 ? (item.count / totalFailures) * 100 : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        catalog,
        totalFailures,
        breakdown
      }
    });
  } catch (error) {
    console.error('Error fetching failures:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch failures'
      },
      { status: 500 }
    );
  }
}
