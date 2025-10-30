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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Account does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program PDAs not initialized. Run `anchor test` in program/ to initialize.',
          data: { catalog: { slippageExceeded:0, insufficientLiquidity:0, mevDetected:0, droppedTx:0, insufficientFunds:0, other:0 }, totalFailures: 0, breakdown: [] }
        },
        { status: 503 }
      );
    }
    console.error('Error fetching failures:', error);
    return NextResponse.json(
      { 
        success: false,
        error: msg
      },
      { status: 500 }
    );
  }
}
