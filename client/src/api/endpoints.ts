import { TxGuardClient, TxGuardStats, PriorityFeeAnalysis } from '../src/index';

/**
 * API endpoints for TxGuard client
 * Provides REST-like interface for frontend consumption
 */
export class TxGuardAPI {
  private client: TxGuardClient;

  constructor(client: TxGuardClient) {
    this.client = client;
  }

  /**
   * Get transaction statistics endpoint
   * GET /api/transactions
   */
  async getTransactions(): Promise<{
    success: boolean;
    data?: TxGuardStats;
    error?: string;
  }> {
    try {
      const stats = await this.client.getStats();
      
      if (!stats) {
        return {
          success: false,
          error: 'No transaction data available'
        };
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get failure catalog endpoint
   * GET /api/failures
   */
  async getFailures(): Promise<{
    success: boolean;
    data?: {
      failures: any;
      totalFailures: number;
      failureBreakdown: Array<{
        type: string;
        count: number;
        percentage: number;
      }>;
    };
    error?: string;
  }> {
    try {
      const stats = await this.client.getStats();
      
      if (!stats) {
        return {
          success: false,
          error: 'No failure data available'
        };
      }

      const failures = stats.failures;
      const totalFailures = Object.values(failures).reduce((sum, count) => sum + count, 0);
      
      const failureBreakdown = [
        { type: 'Slippage Exceeded', count: failures.slippageExceeded, percentage: 0 },
        { type: 'Insufficient Liquidity', count: failures.insufficientLiquidity, percentage: 0 },
        { type: 'MEV Detected', count: failures.mevDetected, percentage: 0 },
        { type: 'Dropped Transaction', count: failures.droppedTx, percentage: 0 },
        { type: 'Insufficient Funds', count: failures.insufficientFunds, percentage: 0 },
        { type: 'Other', count: failures.other, percentage: 0 }
      ].map(item => ({
        ...item,
        percentage: totalFailures > 0 ? (item.count / totalFailures) * 100 : 0
      }));

      return {
        success: true,
        data: {
          failures,
          totalFailures,
          failureBreakdown
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get priority fee statistics endpoint
   * GET /api/stats
   */
  async getStats(): Promise<{
    success: boolean;
    data?: {
      priorityFees: any;
      analysis: PriorityFeeAnalysis | undefined;
      recommendations: {
        tier: number | undefined;
        fee: number | undefined;
        reasoning: string;
      };
    };
    error?: string;
  }> {
    try {
      const stats = await this.client.getStats();
      
      if (!stats) {
        return {
          success: false,
          error: 'No priority fee data available'
        };
      }

      const analysis = this.client.analyzePriorityFees(stats);
      const recommendedTier = this.client.getRecommendedPriorityTier();
      
      let reasoning = '';
      if (stats.successRate < 70) {
        reasoning = 'Low success rate - consider higher priority fees';
      } else if (stats.successRate > 95) {
        reasoning = 'High success rate - current fees are optimal';
      } else {
        reasoning = 'Moderate success rate - consider optimizing fees';
      }

      return {
        success: true,
        data: {
          priorityFees: stats.priorityFees,
          analysis,
          recommendations: {
            tier: recommendedTier,
            fee: recommendedTier !== undefined ? 
              this.client.analyzer.getRecommendedFeeForTier(recommendedTier) : undefined,
            reasoning
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive dashboard data
   * GET /api/dashboard
   */
  async getDashboard(): Promise<{
    success: boolean;
    data?: {
      stats: TxGuardStats;
      analysis: PriorityFeeAnalysis | undefined;
      sanctumStatus: any;
      recommendations: any;
      charts: {
        successRate: Array<{ time: string; rate: number }>;
        failureBreakdown: Array<{ type: string; count: number }>;
        priorityTiers: Array<{ tier: string; count: number; effectiveness: number }>;
      };
    };
    error?: string;
  }> {
    try {
      const report = await this.client.getAnalysisReport();
      
      if (!report.stats) {
        return {
          success: false,
          error: 'No dashboard data available'
        };
      }

      // Generate chart data
      const charts = {
        successRate: this.generateSuccessRateChart(report.stats),
        failureBreakdown: this.generateFailureBreakdownChart(report.stats),
        priorityTiers: this.generatePriorityTiersChart(report.priorityAnalysis)
      };

      return {
        success: true,
        data: {
          stats: report.stats,
          analysis: report.priorityAnalysis,
          sanctumStatus: report.sanctumStatus,
          recommendations: report.recommendations,
          charts
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Classify error endpoint
   * POST /api/classify-error
   */
  async classifyError(errorLog: string): Promise<{
    success: boolean;
    data?: {
      type: string;
      confidence: number;
      description: string;
    };
    error?: string;
  }> {
    try {
      const classification = this.client.classifyFailure(errorLog);
      
      return {
        success: true,
        data: {
          type: this.client.classifier.getFailureTypeName(classification.type),
          confidence: classification.confidence,
          description: this.client.classifier.getFailureTypeDescription(classification.type)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate success rate chart data
   */
  private generateSuccessRateChart(stats: TxGuardStats): Array<{ time: string; rate: number }> {
    // Generate mock time series data based on current stats
    const now = new Date();
    const data = [];
    
    for (let i = 9; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // Every minute
      const rate = stats.successRate + (Math.random() - 0.5) * 10; // Add some variation
      
      data.push({
        time: time.toISOString(),
        rate: Math.max(0, Math.min(100, rate))
      });
    }
    
    return data;
  }

  /**
   * Generate failure breakdown chart data
   */
  private generateFailureBreakdownChart(stats: TxGuardStats): Array<{ type: string; count: number }> {
    const failures = stats.failures;
    
    return [
      { type: 'Slippage', count: failures.slippageExceeded },
      { type: 'Liquidity', count: failures.insufficientLiquidity },
      { type: 'MEV', count: failures.mevDetected },
      { type: 'Dropped', count: failures.droppedTx },
      { type: 'Funds', count: failures.insufficientFunds },
      { type: 'Other', count: failures.other }
    ].filter(item => item.count > 0);
  }

  /**
   * Generate priority tiers chart data
   */
  private generatePriorityTiersChart(analysis: PriorityFeeAnalysis | undefined): Array<{ tier: string; count: number; effectiveness: number }> {
    if (!analysis) {
      return [];
    }

    const tierNames = ['Free', 'Low', 'Medium', 'High', 'Premium'];
    
    return Object.entries(analysis.tierEffectiveness).map(([tier, effectiveness]) => ({
      tier: tierNames[parseInt(tier)],
      count: 0, // This would come from actual tier usage data
      effectiveness
    }));
  }
}
