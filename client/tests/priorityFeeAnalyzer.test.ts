import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Connection, PublicKey } from '@solana/web3.js';
import { PriorityFeeAnalyzer } from '../src/utils/priorityFeeAnalyzer';
import { PriorityFeeTier, PriorityFeeAnalysis, TxGuardStats } from '../src/types';

describe('PriorityFeeAnalyzer', () => {
  let analyzer: PriorityFeeAnalyzer;
  let connection: Connection;
  let programId: PublicKey;

  before(() => {
    connection = new Connection('http://127.0.0.1:8899');
    programId = new PublicKey('FxYDzyGPggfBeQsoLCJqmhAq9danG1qQJXaUjrWTwhp1');
    analyzer = new PriorityFeeAnalyzer(connection, programId);
  });

  describe('getTierForFee', () => {
    it('should correctly categorize fees into tiers', () => {
      expect(analyzer.getTierForFee(0)).to.equal(PriorityFeeTier.TIER_0);
      expect(analyzer.getTierForFee(500)).to.equal(PriorityFeeTier.TIER_0);
      expect(analyzer.getTierForFee(1000)).to.equal(PriorityFeeTier.TIER_1);
      expect(analyzer.getTierForFee(3000)).to.equal(PriorityFeeTier.TIER_1);
      expect(analyzer.getTierForFee(5000)).to.equal(PriorityFeeTier.TIER_2);
      expect(analyzer.getTierForFee(7000)).to.equal(PriorityFeeTier.TIER_2);
      expect(analyzer.getTierForFee(10000)).to.equal(PriorityFeeTier.TIER_3);
      expect(analyzer.getTierForFee(25000)).to.equal(PriorityFeeTier.TIER_3);
      expect(analyzer.getTierForFee(50000)).to.equal(PriorityFeeTier.TIER_4);
      expect(analyzer.getTierForFee(100000)).to.equal(PriorityFeeTier.TIER_4);
    });
  });

  describe('getRecommendedFeeForTier', () => {
    it('should return appropriate fees for each tier', () => {
      expect(analyzer.getRecommendedFeeForTier(PriorityFeeTier.TIER_0)).to.equal(0);
      expect(analyzer.getRecommendedFeeForTier(PriorityFeeTier.TIER_1)).to.be.greaterThan(1000);
      expect(analyzer.getRecommendedFeeForTier(PriorityFeeTier.TIER_2)).to.be.greaterThan(5000);
      expect(analyzer.getRecommendedFeeForTier(PriorityFeeTier.TIER_3)).to.be.greaterThan(10000);
      expect(analyzer.getRecommendedFeeForTier(PriorityFeeTier.TIER_4)).to.be.greaterThan(50000);
    });
  });

  describe('analyzeFromStats', () => {
    it('should analyze priority fees from stats correctly', () => {
      const mockStats: TxGuardStats = {
        registry: {
          txCount: 100,
          successCount: 85,
          failureCount: 15,
          last100Outcomes: Array(100).fill(1),
          cursor: 0
        },
        failures: {
          slippageExceeded: 5,
          insufficientLiquidity: 3,
          mevDetected: 2,
          droppedTx: 2,
          insufficientFunds: 2,
          other: 1
        },
        priorityFees: {
          tiers: [10, 20, 30, 25, 15] // Usage counts per tier
        },
        successRate: 85,
        lastUpdated: new Date()
      };

      const analysis = analyzer.analyzeFromStats(mockStats);
      
      expect(analysis).to.not.be.undefined;
      expect(analysis!.recommendedTier).to.be.oneOf([
        PriorityFeeTier.TIER_0,
        PriorityFeeTier.TIER_1,
        PriorityFeeTier.TIER_2,
        PriorityFeeTier.TIER_3,
        PriorityFeeTier.TIER_4
      ]);
      expect(analysis!.tierEffectiveness).to.have.property(PriorityFeeTier.TIER_0);
      expect(analysis!.tierEffectiveness).to.have.property(PriorityFeeTier.TIER_1);
      expect(analysis!.tierEffectiveness).to.have.property(PriorityFeeTier.TIER_2);
      expect(analysis!.tierEffectiveness).to.have.property(PriorityFeeTier.TIER_3);
      expect(analysis!.tierEffectiveness).to.have.property(PriorityFeeTier.TIER_4);
      expect(analysis!.averageFee).to.be.a('number');
      expect(analysis!.lastAnalyzed).to.be.instanceOf(Date);
    });

    it('should handle zero transaction stats', () => {
      const mockStats: TxGuardStats = {
        registry: {
          txCount: 0,
          successCount: 0,
          failureCount: 0,
          last100Outcomes: [],
          cursor: 0
        },
        failures: {
          slippageExceeded: 0,
          insufficientLiquidity: 0,
          mevDetected: 0,
          droppedTx: 0,
          insufficientFunds: 0,
          other: 0
        },
        priorityFees: {
          tiers: [0, 0, 0, 0, 0]
        },
        successRate: 0,
        lastUpdated: new Date()
      };

      const analysis = analyzer.analyzeFromStats(mockStats);
      
      expect(analysis).to.not.be.undefined;
      expect(analysis!.averageFee).to.equal(0);
    });
  });

  describe('suggestTierForNetworkConditions', () => {
    it('should suggest appropriate tier for low success rate', () => {
      const mockStats: TxGuardStats = {
        registry: {
          txCount: 100,
          successCount: 30,
          failureCount: 70,
          last100Outcomes: Array(100).fill(0),
          cursor: 0
        },
        failures: {
          slippageExceeded: 20,
          insufficientLiquidity: 15,
          mevDetected: 10,
          droppedTx: 15,
          insufficientFunds: 5,
          other: 5
        },
        priorityFees: {
          tiers: [5, 10, 15, 20, 50]
        },
        successRate: 30,
        lastUpdated: new Date()
      };

      const suggestedTier = analyzer.suggestTierForNetworkConditions(mockStats);
      expect(suggestedTier).to.equal(PriorityFeeTier.TIER_4);
    });

    it('should suggest appropriate tier for high success rate', () => {
      const mockStats: TxGuardStats = {
        registry: {
          txCount: 100,
          successCount: 98,
          failureCount: 2,
          last100Outcomes: Array(100).fill(1),
          cursor: 0
        },
        failures: {
          slippageExceeded: 1,
          insufficientLiquidity: 0,
          mevDetected: 0,
          droppedTx: 0,
          insufficientFunds: 1,
          other: 0
        },
        priorityFees: {
          tiers: [50, 30, 15, 4, 1]
        },
        successRate: 98,
        lastUpdated: new Date()
      };

      const suggestedTier = analyzer.suggestTierForNetworkConditions(mockStats);
      expect(suggestedTier).to.equal(PriorityFeeTier.TIER_0);
    });

    it('should suggest middle tier for moderate success rate', () => {
      const mockStats: TxGuardStats = {
        registry: {
          txCount: 100,
          successCount: 80,
          failureCount: 20,
          last100Outcomes: Array(100).fill(1),
          cursor: 0
        },
        failures: {
          slippageExceeded: 8,
          insufficientLiquidity: 5,
          mevDetected: 3,
          droppedTx: 2,
          insufficientFunds: 1,
          other: 1
        },
        priorityFees: {
          tiers: [10, 20, 30, 25, 15]
        },
        successRate: 80,
        lastUpdated: new Date()
      };

      const suggestedTier = analyzer.suggestTierForNetworkConditions(mockStats);
      expect(suggestedTier).to.equal(PriorityFeeTier.TIER_2);
    });

    it('should suggest middle tier for insufficient data', () => {
      const mockStats: TxGuardStats = {
        registry: {
          txCount: 5,
          successCount: 3,
          failureCount: 2,
          last100Outcomes: Array(5).fill(1),
          cursor: 0
        },
        failures: {
          slippageExceeded: 1,
          insufficientLiquidity: 0,
          mevDetected: 0,
          droppedTx: 0,
          insufficientFunds: 1,
          other: 0
        },
        priorityFees: {
          tiers: [1, 1, 1, 1, 1]
        },
        successRate: 60,
        lastUpdated: new Date()
      };

      const suggestedTier = analyzer.suggestTierForNetworkConditions(mockStats);
      expect(suggestedTier).to.equal(PriorityFeeTier.TIER_2);
    });
  });

  describe('createPriorityFeeInstruction', () => {
    it('should create valid priority fee instruction', () => {
      const instruction = analyzer.createPriorityFeeInstruction(PriorityFeeTier.TIER_2);
      
      expect(instruction).to.not.be.undefined;
      expect(instruction.programId.toString()).to.equal('ComputeBudget111111111111111111111111111111');
      expect(instruction.data).to.not.be.undefined;
    });
  });

  describe('getTierStats', () => {
    it('should return correct tier statistics', () => {
      const effectiveness = {
        [PriorityFeeTier.TIER_0]: 70,
        [PriorityFeeTier.TIER_1]: 80,
        [PriorityFeeTier.TIER_2]: 85,
        [PriorityFeeTier.TIER_3]: 90,
        [PriorityFeeTier.TIER_4]: 95
      };

      const stats = analyzer.getTierStats(effectiveness);
      
      expect(stats).to.have.length(5);
      expect(stats[0].tier).to.equal(PriorityFeeTier.TIER_0);
      expect(stats[0].name).to.equal('Free');
      expect(stats[0].effectiveness).to.equal(70);
      expect(stats[4].tier).to.equal(PriorityFeeTier.TIER_4);
      expect(stats[4].name).to.equal('Premium');
      expect(stats[4].effectiveness).to.equal(95);
    });
  });

  describe('calculateCostBenefit', () => {
    it('should calculate cost-benefit analysis correctly', () => {
      const effectiveness = {
        [PriorityFeeTier.TIER_0]: 70,
        [PriorityFeeTier.TIER_1]: 80,
        [PriorityFeeTier.TIER_2]: 85,
        [PriorityFeeTier.TIER_3]: 90,
        [PriorityFeeTier.TIER_4]: 95
      };

      const baseSuccessRate = 70;
      const analysis = analyzer.calculateCostBenefit(effectiveness, baseSuccessRate);
      
      expect(analysis).to.have.length(5);
      expect(analysis[0].tier).to.equal(PriorityFeeTier.TIER_0);
      expect(analysis[0].improvement).to.equal(0); // No improvement over base
      expect(analysis[1].improvement).to.equal(10); // 80 - 70
      expect(analysis[4].improvement).to.equal(25); // 95 - 70
    });
  });

  describe('updateTierThresholds', () => {
    it('should update tier thresholds correctly', () => {
      const newThresholds = new Map([
        [PriorityFeeTier.TIER_0, 0],
        [PriorityFeeTier.TIER_1, 2000],
        [PriorityFeeTier.TIER_2, 8000],
        [PriorityFeeTier.TIER_3, 15000],
        [PriorityFeeTier.TIER_4, 60000]
      ]);

      analyzer.updateTierThresholds(newThresholds);
      
      const thresholds = analyzer.getTierThresholds();
      expect(thresholds.get(PriorityFeeTier.TIER_1)).to.equal(2000);
      expect(thresholds.get(PriorityFeeTier.TIER_2)).to.equal(8000);
      expect(thresholds.get(PriorityFeeTier.TIER_4)).to.equal(60000);
    });
  });
});
