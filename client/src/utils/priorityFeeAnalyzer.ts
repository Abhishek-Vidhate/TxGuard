import { 
  Connection, 
  PublicKey,
  Transaction,
  ComputeBudgetProgram 
} from '@solana/web3.js';
import { 
  PriorityFeeTier, 
  PriorityFeeAnalysis,
  TxGuardStats 
} from '../types';

/**
 * Priority fee analyzer for TxGuard
 * Implements simplified priority fee analysis based on Atlas priority fee estimator patterns
 * Analyzes transaction success rates by priority fee tier
 */
export class PriorityFeeAnalyzer {
  private connection: Connection;
  private programId: PublicKey;
  private historicalData: Map<PriorityFeeTier, number[]> = new Map();
  private tierThresholds: Map<PriorityFeeTier, number> = new Map();

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
    this.programId = programId;
    this.initializeTierThresholds();
  }

  /**
   * Initialize priority fee tier thresholds (in micro-lamports)
   * Based on common Solana priority fee ranges
   */
  private initializeTierThresholds(): void {
    this.tierThresholds.set(PriorityFeeTier.TIER_0, 0);      // Free tier
    this.tierThresholds.set(PriorityFeeTier.TIER_1, 1000);   // 1,000 micro-lamports
    this.tierThresholds.set(PriorityFeeTier.TIER_2, 5000);   // 5,000 micro-lamports
    this.tierThresholds.set(PriorityFeeTier.TIER_3, 10000);  // 10,000 micro-lamports
    this.tierThresholds.set(PriorityFeeTier.TIER_4, 50000);  // 50,000 micro-lamports
  }

  /**
   * Analyze priority fee effectiveness from TxGuard stats
   * @param stats - Current TxGuard statistics
   * @returns Priority fee analysis with recommendations
   */
  analyzeFromStats(stats: TxGuardStats): PriorityFeeAnalysis {
    const tierEffectiveness: Record<PriorityFeeTier, number> = {
      [PriorityFeeTier.TIER_0]: 0,
      [PriorityFeeTier.TIER_1]: 0,
      [PriorityFeeTier.TIER_2]: 0,
      [PriorityFeeTier.TIER_3]: 0,
      [PriorityFeeTier.TIER_4]: 0
    };

    // Calculate success rate for each tier
    const totalTxs = stats.registry.txCount;
    const tiers = stats.priorityFees.tiers;

    for (let i = 0; i < tiers.length; i++) {
      const tierTxs = tiers[i];
      if (tierTxs > 0) {
        // Estimate success rate based on tier usage and overall success rate
        // This is a simplified calculation - in production you'd track success per tier
        const estimatedSuccessRate = this.estimateTierSuccessRate(i, stats);
        tierEffectiveness[i as PriorityFeeTier] = estimatedSuccessRate;
      }
    }

    // Find the most effective tier
    const recommendedTier = this.findOptimalTier(tierEffectiveness);
    const averageFee = this.calculateAverageFee(tierEffectiveness);

    return {
      recommendedTier,
      tierEffectiveness,
      averageFee,
      lastAnalyzed: new Date()
    };
  }

  /**
   * Estimate success rate for a specific tier
   * This is a simplified implementation - in production you'd track actual success per tier
   */
  private estimateTierSuccessRate(tier: number, stats: TxGuardStats): number {
    const baseSuccessRate = stats.successRate / 100;
    
    // Apply tier-based multipliers (higher tiers generally have better success rates)
    const tierMultipliers = [0.7, 0.8, 0.9, 0.95, 0.98]; // Tier 0-4 multipliers
    
    if (tier >= 0 && tier < tierMultipliers.length) {
      return baseSuccessRate * tierMultipliers[tier] * 100;
    }
    
    return baseSuccessRate * 100;
  }

  /**
   * Find the optimal priority fee tier based on effectiveness
   */
  private findOptimalTier(effectiveness: Record<PriorityFeeTier, number>): PriorityFeeTier {
    let bestTier = PriorityFeeTier.TIER_2; // Default to middle tier
    let bestRate = 0;

    for (const [tier, rate] of Object.entries(effectiveness)) {
      if (rate > bestRate) {
        bestRate = rate;
        bestTier = parseInt(tier) as PriorityFeeTier;
      }
    }

    return bestTier;
  }

  /**
   * Calculate average priority fee across all tiers
   */
  private calculateAverageFee(effectiveness: Record<PriorityFeeTier, number>): number {
    let totalWeightedFee = 0;
    let totalWeight = 0;

    for (const [tier, rate] of Object.entries(effectiveness)) {
      const tierNum = parseInt(tier) as PriorityFeeTier;
      const threshold = this.tierThresholds.get(tierNum) || 0;
      const weight = rate / 100; // Convert percentage to weight

      totalWeightedFee += threshold * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedFee / totalWeight : 0;
  }

  /**
   * Get priority fee tier for a given micro-lamport amount
   */
  getTierForFee(feeInMicroLamports: number): PriorityFeeTier {
    if (feeInMicroLamports >= this.tierThresholds.get(PriorityFeeTier.TIER_4)!) {
      return PriorityFeeTier.TIER_4;
    } else if (feeInMicroLamports >= this.tierThresholds.get(PriorityFeeTier.TIER_3)!) {
      return PriorityFeeTier.TIER_3;
    } else if (feeInMicroLamports >= this.tierThresholds.get(PriorityFeeTier.TIER_2)!) {
      return PriorityFeeTier.TIER_2;
    } else if (feeInMicroLamports >= this.tierThresholds.get(PriorityFeeTier.TIER_1)!) {
      return PriorityFeeTier.TIER_1;
    } else {
      return PriorityFeeTier.TIER_0;
    }
  }

  /**
   * Get recommended priority fee amount for a tier
   */
  getRecommendedFeeForTier(tier: PriorityFeeTier): number {
    const threshold = this.tierThresholds.get(tier);
    if (!threshold) {
      return 0;
    }

    // Return a value slightly above the threshold for better success rate
    const multiplier = tier === PriorityFeeTier.TIER_0 ? 1 : 1.2;
    return Math.floor(threshold * multiplier);
  }

  /**
   * Analyze network conditions and suggest optimal tier
   * @param recentStats - Recent transaction statistics
   * @returns Suggested tier based on network conditions
   */
  suggestTierForNetworkConditions(recentStats: TxGuardStats): PriorityFeeTier {
    const successRate = recentStats.successRate;
    const totalTxs = recentStats.registry.txCount;

    // If we don't have enough data, suggest middle tier
    if (totalTxs < 10) {
      return PriorityFeeTier.TIER_2;
    }

    // Adjust tier based on success rate
    if (successRate < 50) {
      // Low success rate - suggest higher tier
      return PriorityFeeTier.TIER_4;
    } else if (successRate < 70) {
      return PriorityFeeTier.TIER_3;
    } else if (successRate < 85) {
      return PriorityFeeTier.TIER_2;
    } else if (successRate < 95) {
      return PriorityFeeTier.TIER_1;
    } else {
      // High success rate - can use lower tier
      return PriorityFeeTier.TIER_0;
    }
  }

  /**
   * Create priority fee instruction for a transaction
   * @param tier - Priority fee tier
   * @returns ComputeBudgetProgram instruction
   */
  createPriorityFeeInstruction(tier: PriorityFeeTier): any {
    const feeAmount = this.getRecommendedFeeForTier(tier);
    
    return ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: feeAmount
    });
  }

  /**
   * Analyze transaction and suggest optimal priority fee
   * @param transaction - Transaction to analyze
   * @param recentStats - Recent statistics for context
   * @returns Suggested priority fee configuration
   */
  analyzeTransaction(
    transaction: Transaction, 
    recentStats: TxGuardStats
  ): {
    suggestedTier: PriorityFeeTier;
    suggestedFee: number;
    reasoning: string;
  } {
    const suggestedTier = this.suggestTierForNetworkConditions(recentStats);
    const suggestedFee = this.getRecommendedFeeForTier(suggestedTier);
    
    let reasoning = '';
    if (recentStats.successRate < 70) {
      reasoning = 'Low success rate detected, suggesting higher priority fee';
    } else if (recentStats.successRate > 95) {
      reasoning = 'High success rate, suggesting lower priority fee to save costs';
    } else {
      reasoning = 'Balanced network conditions, suggesting moderate priority fee';
    }

    return {
      suggestedTier,
      suggestedFee,
      reasoning
    };
  }

  /**
   * Get tier effectiveness statistics
   */
  getTierStats(effectiveness: Record<PriorityFeeTier, number>): {
    tier: PriorityFeeTier;
    name: string;
    threshold: number;
    effectiveness: number;
    cost: string;
  }[] {
    const tierNames = ['Free', 'Low', 'Medium', 'High', 'Premium'];
    const tierCosts = ['Free', '$0.001', '$0.005', '$0.01', '$0.05'];

    return Object.entries(effectiveness).map(([tier, rate]) => {
      const tierNum = parseInt(tier) as PriorityFeeTier;
      return {
        tier: tierNum,
        name: tierNames[tierNum],
        threshold: this.tierThresholds.get(tierNum) || 0,
        effectiveness: rate,
        cost: tierCosts[tierNum]
      };
    });
  }

  /**
   * Update tier thresholds based on network conditions
   * @param newThresholds - New threshold values
   */
  updateTierThresholds(newThresholds: Map<PriorityFeeTier, number>): void {
    this.tierThresholds = new Map(newThresholds);
  }

  /**
   * Get current tier thresholds
   */
  getTierThresholds(): Map<PriorityFeeTier, number> {
    return new Map(this.tierThresholds);
  }

  /**
   * Calculate cost-benefit analysis for priority fees
   */
  calculateCostBenefit(
    effectiveness: Record<PriorityFeeTier, number>,
    baseSuccessRate: number
  ): {
    tier: PriorityFeeTier;
    improvement: number;
    costPerImprovement: number;
    recommendation: 'recommended' | 'good' | 'poor';
  }[] {
    return Object.entries(effectiveness).map(([tier, rate]) => {
      const tierNum = parseInt(tier) as PriorityFeeTier;
      const improvement = rate - baseSuccessRate;
      const cost = this.getRecommendedFeeForTier(tierNum);
      const costPerImprovement = improvement > 0 ? cost / improvement : Infinity;
      
      let recommendation: 'recommended' | 'good' | 'poor';
      if (improvement > 10 && costPerImprovement < 1000) {
        recommendation = 'recommended';
      } else if (improvement > 5) {
        recommendation = 'good';
      } else {
        recommendation = 'poor';
      }

      return {
        tier: tierNum,
        improvement,
        costPerImprovement,
        recommendation
      };
    });
  }
}
