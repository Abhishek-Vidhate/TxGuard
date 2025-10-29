import { 
  Connection, 
  PublicKey,
  Wallet 
} from '@solana/web3.js';
import { 
  TxGuardClientConfig, 
  TxGuardStats,
  TxRecordedEvent,
  StatsUpdateEvent,
  TxRecordedListener,
  StatsUpdateListener,
  ErrorListener,
  PriorityFeeAnalysis,
  FailureClassification,
  SanctumOptimizationResult,
  Transaction,
  VersionedTransaction
} from './types';
import { TxListener } from './txListener';
import { FailureClassifier } from './failureClassifier';
import { SanctumBridge } from './sanctumBridge';
import { PriorityFeeAnalyzer } from './utils/priorityFeeAnalyzer';

// Import the generated program types
import { Txguard } from '../../program/target/types/txguard';

/**
 * Main TxGuard client for monitoring Solana transactions
 * Integrates all components: listener, classifier, analyzer, and Sanctum bridge
 */
export class TxGuardClient {
  private config: TxGuardClientConfig;
  private listener: TxListener;
  private classifier: typeof FailureClassifier;
  private analyzer: PriorityFeeAnalyzer;
  private sanctumBridge: SanctumBridge;
  
  // Event listeners
  private txRecordedListeners: TxRecordedListener[] = [];
  private statsUpdateListeners: StatsUpdateListener[] = [];
  private errorListeners: ErrorListener[] = [];

  constructor(config: TxGuardClientConfig) {
    this.config = config;
    
    // Initialize components
    this.listener = new TxListener(config);
    this.classifier = FailureClassifier;
    this.analyzer = new PriorityFeeAnalyzer(config.connection, config.programId);
    this.sanctumBridge = new SanctumBridge(
      {
        enabled: !!config.gatewayApiKey,
        apiKey: config.gatewayApiKey
      },
      config.connection
    );

    // Set up internal event forwarding
    this.setupEventForwarding();
  }

  /**
   * Start monitoring transactions
   */
  async startMonitoring(): Promise<void> {
    console.log('Starting TxGuard monitoring...');
    await this.listener.startPolling();
  }

  /**
   * Stop monitoring transactions
   */
  stopMonitoring(): void {
    console.log('Stopping TxGuard monitoring...');
    this.listener.stopPolling();
  }

  /**
   * Get current transaction statistics
   */
  async getStats(): Promise<TxGuardStats | undefined> {
    return this.listener.getCurrentStats();
  }

  /**
   * Force a manual poll of account data
   */
  async refreshStats(): Promise<TxGuardStats | undefined> {
    return await this.listener.forcePoll();
  }

  /**
   * Classify a transaction error
   */
  classifyFailure(errorLog: string): FailureClassification {
    return this.classifier.classify(errorLog);
  }

  /**
   * Analyze priority fee effectiveness
   */
  analyzePriorityFees(stats?: TxGuardStats): PriorityFeeAnalysis | undefined {
    const currentStats = stats || this.listener.getCurrentStats();
    if (!currentStats) {
      return undefined;
    }
    return this.analyzer.analyzeFromStats(currentStats);
  }

  /**
   * Get recommended priority fee tier
   */
  getRecommendedPriorityTier(): PriorityFeeTier | undefined {
    const stats = this.listener.getCurrentStats();
    if (!stats) {
      return undefined;
    }
    return this.analyzer.suggestTierForNetworkConditions(stats);
  }

  /**
   * Send transaction through Sanctum Gateway
   */
  async sendViaSanctum(
    transaction: Transaction | VersionedTransaction,
    options?: {
      skipPreflight?: boolean;
      maxRetries?: number;
      commitment?: 'processed' | 'confirmed' | 'finalized';
    }
  ): Promise<SanctumOptimizationResult> {
    return await this.sanctumBridge.sendTransaction(transaction, options);
  }

  /**
   * Check if Sanctum Gateway is enabled
   */
  isSanctumEnabled(): boolean {
    return this.sanctumBridge.isEnabled();
  }

  /**
   * Get Sanctum Gateway status
   */
  getSanctumStatus() {
    return this.sanctumBridge.getStatus();
  }

  /**
   * Test Sanctum Gateway connectivity
   */
  async testSanctumConnection() {
    return await this.sanctumBridge.testConnection();
  }

  /**
   * Analyze a transaction and suggest optimal priority fee
   */
  analyzeTransaction(transaction: Transaction): {
    suggestedTier: PriorityFeeTier;
    suggestedFee: number;
    reasoning: string;
  } | undefined {
    const stats = this.listener.getCurrentStats();
    if (!stats) {
      return undefined;
    }
    return this.analyzer.analyzeTransaction(transaction, stats);
  }

  /**
   * Get priority fee instruction for a specific tier
   */
  getPriorityFeeInstruction(tier: PriorityFeeTier) {
    return this.analyzer.createPriorityFeeInstruction(tier);
  }

  /**
   * Get comprehensive analysis report
   */
  async getAnalysisReport(): Promise<{
    stats: TxGuardStats | undefined;
    priorityAnalysis: PriorityFeeAnalysis | undefined;
    sanctumStatus: any;
    recommendations: {
      priorityTier: PriorityFeeTier | undefined;
      useSanctum: boolean;
      reasoning: string;
    };
  }> {
    const stats = await this.getStats();
    const priorityAnalysis = this.analyzePriorityFees(stats);
    const sanctumStatus = this.getSanctumStatus();
    const recommendedTier = this.getRecommendedPriorityTier();
    
    let reasoning = '';
    let useSanctum = false;
    
    if (stats) {
      if (stats.successRate < 70) {
        reasoning = 'Low success rate detected. Consider using higher priority fees and Sanctum Gateway.';
        useSanctum = true;
      } else if (stats.successRate > 95) {
        reasoning = 'High success rate. Current configuration is optimal.';
        useSanctum = false;
      } else {
        reasoning = 'Moderate success rate. Consider optimizing priority fees.';
        useSanctum = this.isSanctumEnabled();
      }
    }

    return {
      stats,
      priorityAnalysis,
      sanctumStatus,
      recommendations: {
        priorityTier: recommendedTier,
        useSanctum,
        reasoning
      }
    };
  }

  /**
   * Set up event forwarding from internal components
   */
  private setupEventForwarding(): void {
    // Forward transaction recorded events
    this.listener.onTxRecorded((event: TxRecordedEvent) => {
      this.txRecordedListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in tx recorded listener:', error);
        }
      });
    });

    // Forward stats update events
    this.listener.onStatsUpdate((event: StatsUpdateEvent) => {
      this.statsUpdateListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in stats update listener:', error);
        }
      });
    });

    // Forward error events
    this.listener.onError((error: Error) => {
      this.errorListeners.forEach(listener => {
        try {
          listener(error);
        } catch (listenerError) {
          console.error('Error in error listener:', listenerError);
        }
      });
    });
  }

  /**
   * Add event listeners
   */
  onTxRecorded(listener: TxRecordedListener): void {
    this.txRecordedListeners.push(listener);
  }

  onStatsUpdate(listener: StatsUpdateListener): void {
    this.statsUpdateListeners.push(listener);
  }

  onError(listener: ErrorListener): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove event listeners
   */
  removeTxRecordedListener(listener: TxRecordedListener): void {
    const index = this.txRecordedListeners.indexOf(listener);
    if (index > -1) {
      this.txRecordedListeners.splice(index, 1);
    }
  }

  removeStatsUpdateListener(listener: StatsUpdateListener): void {
    const index = this.statsUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.statsUpdateListeners.splice(index, 1);
    }
  }

  removeErrorListener(listener: ErrorListener): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Get client state and configuration
   */
  getState() {
    return {
      config: this.config,
      listenerState: this.listener.getState(),
      sanctumStatus: this.sanctumBridge.getStatus(),
      isMonitoring: this.listener.getState().isMonitoring
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.listener.destroy();
    this.txRecordedListeners = [];
    this.statsUpdateListeners = [];
    this.errorListeners = [];
  }
}

// Export all types and classes
export * from './types';
export { TxListener } from './txListener';
export { FailureClassifier } from './failureClassifier';
export { SanctumBridge } from './sanctumBridge';
export { PriorityFeeAnalyzer } from './utils/priorityFeeAnalyzer';

// Default export
export default TxGuardClient;
