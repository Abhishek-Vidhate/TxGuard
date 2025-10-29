import { FailureType, FailureClassification } from './types';

/**
 * Maps Solana transaction errors to TxGuard failure categories
 * Based on common error patterns from Solana programs and RPC responses
 */
export class FailureClassifier {
  private static readonly ERROR_PATTERNS: Record<string, FailureType> = {
    // Slippage-related errors
    'slippage tolerance exceeded': FailureType.SLIPPAGE_EXCEEDED,
    'slippage exceeded': FailureType.SLIPPAGE_EXCEEDED,
    'price impact too high': FailureType.SLIPPAGE_EXCEEDED,
    'minimum amount out': FailureType.SLIPPAGE_EXCEEDED,
    'amount out below minimum': FailureType.SLIPPAGE_EXCEEDED,
    
    // Insufficient liquidity
    'insufficient liquidity': FailureType.INSUFFICIENT_LIQUIDITY,
    'liquidity not available': FailureType.INSUFFICIENT_LIQUIDITY,
    'pool not found': FailureType.INSUFFICIENT_LIQUIDITY,
    'reserve not found': FailureType.INSUFFICIENT_LIQUIDITY,
    'no liquidity': FailureType.INSUFFICIENT_LIQUIDITY,
    
    // MEV/Sandwich detection
    'mev detected': FailureType.MEV_DETECTED,
    'sandwich attack': FailureType.MEV_DETECTED,
    'frontrun detected': FailureType.MEV_DETECTED,
    'arbitrage detected': FailureType.MEV_DETECTED,
    'price manipulation': FailureType.MEV_DETECTED,
    
    // Dropped transactions
    'account not found': FailureType.DROPPED_TX,
    'blockhash not found': FailureType.DROPPED_TX,
    'blockhash too old': FailureType.DROPPED_TX,
    'transaction expired': FailureType.DROPPED_TX,
    'dropped transaction': FailureType.DROPPED_TX,
    'transaction not found': FailureType.DROPPED_TX,
    
    // Insufficient funds
    'insufficient funds': FailureType.INSUFFICIENT_FUNDS,
    'insufficient lamports': FailureType.INSUFFICIENT_FUNDS,
    'insufficient sol': FailureType.INSUFFICIENT_FUNDS,
    'insufficient balance': FailureType.INSUFFICIENT_FUNDS,
    'not enough funds': FailureType.INSUFFICIENT_FUNDS,
    'insufficient token balance': FailureType.INSUFFICIENT_FUNDS,
    'insufficientfundsforrent': FailureType.INSUFFICIENT_FUNDS,
    
    // Compute unit errors (often related to insufficient funds for rent)
    'exceeded compute unit limit': FailureType.INSUFFICIENT_FUNDS,
    'compute budget exceeded': FailureType.INSUFFICIENT_FUNDS,
    'program failed to complete': FailureType.INSUFFICIENT_FUNDS,
    
    // Account-related errors
    'account already exists': FailureType.INSUFFICIENT_FUNDS,
    'account does not exist': FailureType.DROPPED_TX,
    'invalid account': FailureType.DROPPED_TX,
    
    // Program-specific errors
    'program error': FailureType.OTHER,
    'instruction error': FailureType.OTHER,
    'custom program error': FailureType.OTHER,
    'unknown error': FailureType.OTHER,
  };

  /**
   * Classify a transaction error into a failure type
   * @param errorLog - The error message or log from the transaction
   * @returns Classification result with type and confidence
   */
  static classify(errorLog: string): FailureClassification {
    if (!errorLog || typeof errorLog !== 'string') {
      return {
        type: FailureType.OTHER,
        confidence: 0,
        originalError: errorLog || 'Empty error'
      };
    }

    const lowerError = errorLog.toLowerCase();
    
    // Find exact matches first (highest confidence)
    for (const [pattern, type] of Object.entries(this.ERROR_PATTERNS)) {
      if (lowerError.includes(pattern)) {
        return {
          type,
          confidence: this.calculateConfidence(pattern, lowerError),
          originalError: errorLog
        };
      }
    }

    // Check for partial matches (lower confidence)
    const partialMatches = this.findPartialMatches(lowerError);
    if (partialMatches.length > 0) {
      const bestMatch = partialMatches[0];
      return {
        type: bestMatch.type,
        confidence: bestMatch.confidence,
        originalError: errorLog
      };
    }

    // Default to OTHER if no pattern matches
    return {
      type: FailureType.OTHER,
      confidence: 0.1,
      originalError: errorLog
    };
  }

  /**
   * Calculate confidence based on pattern match quality
   */
  private static calculateConfidence(pattern: string, errorText: string): number {
    // Exact match gets highest confidence
    if (errorText === pattern) {
      return 1.0;
    }
    
    // Pattern at start of error gets high confidence
    if (errorText.startsWith(pattern)) {
      return 0.9;
    }
    
    // Pattern at end of error gets high confidence
    if (errorText.endsWith(pattern)) {
      return 0.8;
    }
    
    // Pattern contains key words gets medium confidence
    const keyWords = ['insufficient', 'slippage', 'liquidity', 'funds', 'dropped', 'mev'];
    const hasKeyWords = keyWords.some(word => pattern.includes(word));
    
    return hasKeyWords ? 0.7 : 0.6;
  }

  /**
   * Find partial matches using keyword analysis
   */
  private static findPartialMatches(errorText: string): Array<{type: FailureType, confidence: number}> {
    const matches: Array<{type: FailureType, confidence: number}> = [];
    
    // Check for key failure indicators
    if (errorText.includes('slippage') || errorText.includes('price')) {
      matches.push({ type: FailureType.SLIPPAGE_EXCEEDED, confidence: 0.5 });
    }
    
    if (errorText.includes('liquidity') || errorText.includes('pool')) {
      matches.push({ type: FailureType.INSUFFICIENT_LIQUIDITY, confidence: 0.5 });
    }
    
    if (errorText.includes('mev') || errorText.includes('sandwich') || errorText.includes('frontrun')) {
      matches.push({ type: FailureType.MEV_DETECTED, confidence: 0.5 });
    }
    
    if (errorText.includes('not found') || errorText.includes('expired') || errorText.includes('old')) {
      matches.push({ type: FailureType.DROPPED_TX, confidence: 0.5 });
    }
    
    if (errorText.includes('insufficient') || errorText.includes('funds') || errorText.includes('balance')) {
      matches.push({ type: FailureType.INSUFFICIENT_FUNDS, confidence: 0.5 });
    }
    
    return matches;
  }

  /**
   * Get human-readable failure type name
   */
  static getFailureTypeName(type: FailureType): string {
    const names: Record<FailureType, string> = {
      [FailureType.SLIPPAGE_EXCEEDED]: 'Slippage Exceeded',
      [FailureType.INSUFFICIENT_LIQUIDITY]: 'Insufficient Liquidity',
      [FailureType.MEV_DETECTED]: 'MEV Detected',
      [FailureType.DROPPED_TX]: 'Dropped Transaction',
      [FailureType.INSUFFICIENT_FUNDS]: 'Insufficient Funds',
      [FailureType.OTHER]: 'Other Error'
    };
    
    return names[type] || 'Unknown';
  }

  /**
   * Get failure type description
   */
  static getFailureTypeDescription(type: FailureType): string {
    const descriptions: Record<FailureType, string> = {
      [FailureType.SLIPPAGE_EXCEEDED]: 'Transaction failed due to price slippage exceeding tolerance',
      [FailureType.INSUFFICIENT_LIQUIDITY]: 'Transaction failed due to insufficient liquidity in the pool',
      [FailureType.MEV_DETECTED]: 'Transaction was detected as MEV/sandwich attack',
      [FailureType.DROPPED_TX]: 'Transaction was dropped or not found on-chain',
      [FailureType.INSUFFICIENT_FUNDS]: 'Transaction failed due to insufficient account balance',
      [FailureType.OTHER]: 'Transaction failed due to unknown or uncategorized error'
    };
    
    return descriptions[type] || 'Unknown error type';
  }

  /**
   * Batch classify multiple errors
   */
  static classifyBatch(errorLogs: string[]): FailureClassification[] {
    return errorLogs.map(error => this.classify(error));
  }

  /**
   * Get statistics from batch classification
   */
  static getClassificationStats(classifications: FailureClassification[]): Record<FailureType, number> {
    const stats: Record<FailureType, number> = {
      [FailureType.SLIPPAGE_EXCEEDED]: 0,
      [FailureType.INSUFFICIENT_LIQUIDITY]: 0,
      [FailureType.MEV_DETECTED]: 0,
      [FailureType.DROPPED_TX]: 0,
      [FailureType.INSUFFICIENT_FUNDS]: 0,
      [FailureType.OTHER]: 0
    };

    classifications.forEach(classification => {
      stats[classification.type]++;
    });

    return stats;
  }
}
