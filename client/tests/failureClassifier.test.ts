import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Connection, PublicKey } from '@solana/web3.js';
import { FailureClassifier } from '../src/failureClassifier';
import { FailureType, FailureClassification } from '../src/types';

describe('FailureClassifier', () => {
  describe('classify', () => {
    it('should classify slippage errors correctly', () => {
      const testCases = [
        { error: 'slippage tolerance exceeded', expected: FailureType.SLIPPAGE_EXCEEDED },
        { error: 'slippage exceeded', expected: FailureType.SLIPPAGE_EXCEEDED },
        { error: 'price impact too high', expected: FailureType.SLIPPAGE_EXCEEDED },
        { error: 'minimum amount out', expected: FailureType.SLIPPAGE_EXCEEDED }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = FailureClassifier.classify(error);
        expect(result.type).to.equal(expected);
        expect(result.confidence).to.be.greaterThan(0);
        expect(result.originalError).to.equal(error);
      });
    });

    it('should classify liquidity errors correctly', () => {
      const testCases = [
        { error: 'insufficient liquidity', expected: FailureType.INSUFFICIENT_LIQUIDITY },
        { error: 'liquidity not available', expected: FailureType.INSUFFICIENT_LIQUIDITY },
        { error: 'pool not found', expected: FailureType.INSUFFICIENT_LIQUIDITY }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = FailureClassifier.classify(error);
        expect(result.type).to.equal(expected);
        expect(result.confidence).to.be.greaterThan(0);
      });
    });

    it('should classify MEV errors correctly', () => {
      const testCases = [
        { error: 'mev detected', expected: FailureType.MEV_DETECTED },
        { error: 'sandwich attack', expected: FailureType.MEV_DETECTED },
        { error: 'frontrun detected', expected: FailureType.MEV_DETECTED }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = FailureClassifier.classify(error);
        expect(result.type).to.equal(expected);
        expect(result.confidence).to.be.greaterThan(0);
      });
    });

    it('should classify dropped transaction errors correctly', () => {
      const testCases = [
        { error: 'account not found', expected: FailureType.DROPPED_TX },
        { error: 'blockhash not found', expected: FailureType.DROPPED_TX },
        { error: 'transaction expired', expected: FailureType.DROPPED_TX }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = FailureClassifier.classify(error);
        expect(result.type).to.equal(expected);
        expect(result.confidence).to.be.greaterThan(0);
      });
    });

    it('should classify insufficient funds errors correctly', () => {
      const testCases = [
        { error: 'insufficient funds', expected: FailureType.INSUFFICIENT_FUNDS },
        { error: 'insufficient lamports', expected: FailureType.INSUFFICIENT_FUNDS },
        { error: 'not enough funds', expected: FailureType.INSUFFICIENT_FUNDS },
        { error: 'insufficientfundsforrent', expected: FailureType.INSUFFICIENT_FUNDS }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = FailureClassifier.classify(error);
        expect(result.type).to.equal(expected);
        expect(result.confidence).to.be.greaterThan(0);
      });
    });

    it('should handle unknown errors as OTHER', () => {
      const testCases = [
        'unknown error message',
        'random error',
        'custom program error'
      ];

      testCases.forEach(error => {
        const result = FailureClassifier.classify(error);
        expect(result.type).to.equal(FailureType.OTHER);
        expect(result.confidence).to.be.greaterThanOrEqual(0);
        expect(result.originalError).to.equal(error);
      });
    });

    it('should handle null and undefined errors', () => {
      const result1 = FailureClassifier.classify(null as any);
      expect(result1.type).to.equal(FailureType.OTHER);
      expect(result1.confidence).to.equal(0);

      const result2 = FailureClassifier.classify(undefined as any);
      expect(result2.type).to.equal(FailureType.OTHER);
      expect(result2.confidence).to.equal(0);
    });

    it('should calculate confidence correctly', () => {
      // Exact match should have highest confidence
      const exactMatch = FailureClassifier.classify('slippage tolerance exceeded');
      expect(exactMatch.confidence).to.be.greaterThan(0.8);

      // Partial match should have lower confidence
      const partialMatch = FailureClassifier.classify('some slippage error occurred');
      expect(partialMatch.confidence).to.be.greaterThanOrEqual(0.5);
      expect(partialMatch.confidence).to.be.lessThan(exactMatch.confidence);
    });
  });

  describe('getFailureTypeName', () => {
    it('should return correct names for all failure types', () => {
      expect(FailureClassifier.getFailureTypeName(FailureType.SLIPPAGE_EXCEEDED)).to.equal('Slippage Exceeded');
      expect(FailureClassifier.getFailureTypeName(FailureType.INSUFFICIENT_LIQUIDITY)).to.equal('Insufficient Liquidity');
      expect(FailureClassifier.getFailureTypeName(FailureType.MEV_DETECTED)).to.equal('MEV Detected');
      expect(FailureClassifier.getFailureTypeName(FailureType.DROPPED_TX)).to.equal('Dropped Transaction');
      expect(FailureClassifier.getFailureTypeName(FailureType.INSUFFICIENT_FUNDS)).to.equal('Insufficient Funds');
      expect(FailureClassifier.getFailureTypeName(FailureType.OTHER)).to.equal('Other Error');
    });
  });

  describe('getFailureTypeDescription', () => {
    it('should return correct descriptions for all failure types', () => {
      expect(FailureClassifier.getFailureTypeDescription(FailureType.SLIPPAGE_EXCEEDED))
        .to.include('slippage');
      expect(FailureClassifier.getFailureTypeDescription(FailureType.INSUFFICIENT_LIQUIDITY))
        .to.include('liquidity');
      expect(FailureClassifier.getFailureTypeDescription(FailureType.MEV_DETECTED))
        .to.include('MEV');
      expect(FailureClassifier.getFailureTypeDescription(FailureType.DROPPED_TX))
        .to.include('dropped');
      expect(FailureClassifier.getFailureTypeDescription(FailureType.INSUFFICIENT_FUNDS))
        .to.include('balance');
      expect(FailureClassifier.getFailureTypeDescription(FailureType.OTHER))
        .to.include('unknown');
    });
  });

  describe('classifyBatch', () => {
    it('should classify multiple errors correctly', () => {
      const errors = [
        'slippage tolerance exceeded',
        'insufficient funds',
        'unknown error',
        'mev detected'
      ];

      const results = FailureClassifier.classifyBatch(errors);
      
      expect(results).to.have.length(4);
      expect(results[0].type).to.equal(FailureType.SLIPPAGE_EXCEEDED);
      expect(results[1].type).to.equal(FailureType.INSUFFICIENT_FUNDS);
      expect(results[2].type).to.equal(FailureType.OTHER);
      expect(results[3].type).to.equal(FailureType.MEV_DETECTED);
    });
  });

  describe('getClassificationStats', () => {
    it('should calculate correct statistics', () => {
      const classifications: FailureClassification[] = [
        { type: FailureType.SLIPPAGE_EXCEEDED, confidence: 0.9, originalError: 'slippage' },
        { type: FailureType.SLIPPAGE_EXCEEDED, confidence: 0.8, originalError: 'price' },
        { type: FailureType.INSUFFICIENT_FUNDS, confidence: 0.7, originalError: 'funds' },
        { type: FailureType.OTHER, confidence: 0.1, originalError: 'unknown' }
      ];

      const stats = FailureClassifier.getClassificationStats(classifications);
      
      expect(stats[FailureType.SLIPPAGE_EXCEEDED]).to.equal(2);
      expect(stats[FailureType.INSUFFICIENT_FUNDS]).to.equal(1);
      expect(stats[FailureType.OTHER]).to.equal(1);
      expect(stats[FailureType.MEV_DETECTED]).to.equal(0);
      expect(stats[FailureType.DROPPED_TX]).to.equal(0);
      expect(stats[FailureType.INSUFFICIENT_LIQUIDITY]).to.equal(0);
    });
  });
});
