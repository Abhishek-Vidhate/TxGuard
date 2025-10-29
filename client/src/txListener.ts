import { 
  Connection, 
  PublicKey, 
  Program, 
  AnchorProvider,
  Wallet
} from '@coral-xyz/anchor';
import { Keypair, PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { 
  TxGuardClientConfig, 
  TxGuardStats, 
  TxGuardPDAs,
  TxRecordedEvent,
  StatsUpdateEvent,
  TxRecordedListener,
  StatsUpdateListener,
  ErrorListener,
  TransactionRegistryData,
  FailureCatalogData,
  PriorityFeeStatsData,
  TxGuardClientState
} from './types';
import { FailureClassifier } from './failureClassifier';

// Import the generated program types
import { Txguard } from '../../program/target/types/txguard';

/**
 * Transaction listener that polls PDA accounts for real-time monitoring
 * Implements the monitoring pattern from reference-codebases/Solana-Real-time-Transaction-Indexer
 */
export class TxListener {
  private connection: Connection;
  private program: Program<Txguard>;
  private programId: PublicKey;
  private pollingInterval: number;
  private isPolling: boolean = false;
  private pollingTimer?: NodeJS.Timeout;
  
  // Event listeners
  private txRecordedListeners: TxRecordedListener[] = [];
  private statsUpdateListeners: StatsUpdateListener[] = [];
  private errorListeners: ErrorListener[] = [];
  
  // State
  private lastStats?: TxGuardStats;
  private pdaAddresses: TxGuardPDAs;
  private errorCount: number = 0;
  private lastError?: Error;

  constructor(config: TxGuardClientConfig) {
    this.connection = config.connection;
    this.programId = config.programId;
    this.pollingInterval = config.pollingInterval || 5000; // Default 5 seconds
    
    // Initialize Anchor provider and program
    const defaultKeypair = Keypair.generate(); // Generate a random keypair for read-only operations
    const provider = new AnchorProvider(
      this.connection,
      config.wallet || new Wallet(defaultKeypair), // Default wallet for read-only
      {}
    );
    
    this.program = new Program<Txguard>(
      require('../../program/target/idl/txguard.json'),
      provider
    );
    
    // Derive PDA addresses
    this.pdaAddresses = this.derivePDAs();
  }

  /**
   * Derive PDA addresses for all state accounts
   */
  private derivePDAs(): TxGuardPDAs {
    const [registry] = SolanaPublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      this.programId
    );
    
    const [catalog] = SolanaPublicKey.findProgramAddressSync(
      [Buffer.from('catalog')],
      this.programId
    );
    
    const [priorityStats] = SolanaPublicKey.findProgramAddressSync(
      [Buffer.from('priority')],
      this.programId
    );
    
    return {
      registry,
      catalog,
      priorityStats
    };
  }

  /**
   * Start polling for account updates
   */
  async startPolling(): Promise<void> {
    if (this.isPolling) {
      console.warn('TxListener is already polling');
      return;
    }

    console.log('Starting TxListener polling...');
    this.isPolling = true;
    
    // Initial fetch
    await this.pollAccounts();
    
    // Set up interval
    this.pollingTimer = setInterval(async () => {
      try {
        await this.pollAccounts();
      } catch (error) {
        this.handleError(error as Error);
      }
    }, this.pollingInterval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (!this.isPolling) {
      return;
    }

    console.log('Stopping TxListener polling...');
    this.isPolling = false;
    
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
  }

  /**
   * Poll all PDA accounts and emit events if changes detected
   */
  private async pollAccounts(): Promise<void> {
    try {
      const [registryData, catalogData, priorityData] = await Promise.all([
        this.fetchRegistryData(),
        this.fetchCatalogData(),
        this.fetchPriorityData()
      ]);

      const newStats: TxGuardStats = {
        registry: registryData,
        failures: catalogData,
        priorityFees: priorityData,
        successRate: this.calculateSuccessRate(registryData),
        lastUpdated: new Date()
      };

      // Check for changes and emit events
      const hasChanges = this.hasStatsChanged(newStats);
      
      if (hasChanges) {
        this.lastStats = newStats;
        
        // Emit stats update event
        const statsEvent: StatsUpdateEvent = {
          stats: newStats,
          timestamp: new Date()
        };
        
        this.statsUpdateListeners.forEach(listener => {
          try {
            listener(statsEvent);
          } catch (error) {
            console.error('Error in stats update listener:', error);
          }
        });

        // Detect new transactions and emit tx recorded events
        await this.detectNewTransactions(newStats);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Fetch transaction registry data
   */
  private async fetchRegistryData(): Promise<TransactionRegistryData> {
    try {
      const account = await this.program.account.transactionRegistry.fetch(
        this.pdaAddresses.registry
      );
      
      return {
        txCount: account.txCount.toNumber(),
        successCount: account.successCount.toNumber(),
        failureCount: account.failureCount.toNumber(),
        last100Outcomes: account.last100Outcomes.map(outcome => 
          typeof outcome === 'number' ? outcome : outcome.toNumber()
        ),
        cursor: account.cursor
      };
    } catch (error) {
      console.error('Failed to fetch registry data:', error);
      throw new Error(`Failed to fetch registry data: ${error}`);
    }
  }

  /**
   * Fetch failure catalog data
   */
  private async fetchCatalogData(): Promise<FailureCatalogData> {
    try {
      const account = await this.program.account.failureCatalog.fetch(
        this.pdaAddresses.catalog
      );
      
      return {
        slippageExceeded: account.slippageExceeded,
        insufficientLiquidity: account.insufficientLiquidity,
        mevDetected: account.mevDetected,
        droppedTx: account.droppedTx,
        insufficientFunds: account.insufficientFunds,
        other: account.other
      };
    } catch (error) {
      console.error('Failed to fetch catalog data:', error);
      throw new Error(`Failed to fetch catalog data: ${error}`);
    }
  }

  /**
   * Fetch priority fee stats data
   */
  private async fetchPriorityData(): Promise<PriorityFeeStatsData> {
    try {
      const account = await this.program.account.priorityFeeStats.fetch(
        this.pdaAddresses.priorityStats
      );
      
      return {
        tiers: account.tiers.map(tier => tier.toNumber())
      };
    } catch (error) {
      console.error('Failed to fetch priority data:', error);
      throw new Error(`Failed to fetch priority data: ${error}`);
    }
  }

  /**
   * Calculate success rate from registry data
   */
  private calculateSuccessRate(registry: TransactionRegistryData): number {
    if (registry.txCount === 0) {
      return 0;
    }
    return (registry.successCount / registry.txCount) * 100;
  }

  /**
   * Check if stats have changed since last poll
   */
  private hasStatsChanged(newStats: TxGuardStats): boolean {
    if (!this.lastStats) {
      return true; // First poll
    }

    return (
      newStats.registry.txCount !== this.lastStats.registry.txCount ||
      newStats.registry.successCount !== this.lastStats.registry.successCount ||
      newStats.registry.failureCount !== this.lastStats.registry.failureCount ||
      JSON.stringify(newStats.failures) !== JSON.stringify(this.lastStats.failures) ||
      JSON.stringify(newStats.priorityFees) !== JSON.stringify(this.lastStats.priorityFees)
    );
  }

  /**
   * Detect new transactions by comparing with previous state
   */
  private async detectNewTransactions(newStats: TxGuardStats): Promise<void> {
    if (!this.lastStats) {
      return; // First poll, no previous state to compare
    }

    const txDiff = newStats.registry.txCount - this.lastStats.registry.txCount;
    const successDiff = newStats.registry.successCount - this.lastStats.registry.successCount;
    const failureDiff = newStats.registry.failureCount - this.lastStats.registry.failureCount;

    // Emit events for new transactions
    for (let i = 0; i < txDiff; i++) {
      const isSuccess = i < successDiff;
      const failureType = isSuccess ? 0 : this.detectFailureTypeFromChanges(newStats, this.lastStats);
      
      const txEvent: TxRecordedEvent = {
        signature: `mock-${Date.now()}-${i}`, // In real implementation, this would come from transaction logs
        success: isSuccess,
        failureType: failureType,
        priorityFeeTier: this.detectPriorityTierFromChanges(newStats, this.lastStats),
        timestamp: new Date()
      };

      this.txRecordedListeners.forEach(listener => {
        try {
          listener(txEvent);
        } catch (error) {
          console.error('Error in tx recorded listener:', error);
        }
      });
    }
  }

  /**
   * Detect failure type from catalog changes
   */
  private detectFailureTypeFromChanges(newStats: TxGuardStats, oldStats: TxGuardStats): number {
    const failures = newStats.failures;
    const oldFailures = oldStats.failures;

    if (failures.slippageExceeded > oldFailures.slippageExceeded) return 0;
    if (failures.insufficientLiquidity > oldFailures.insufficientLiquidity) return 1;
    if (failures.mevDetected > oldFailures.mevDetected) return 2;
    if (failures.droppedTx > oldFailures.droppedTx) return 3;
    if (failures.insufficientFunds > oldFailures.insufficientFunds) return 4;
    
    return 5; // OTHER
  }

  /**
   * Detect priority tier from stats changes
   */
  private detectPriorityTierFromChanges(newStats: TxGuardStats, oldStats: TxGuardStats): number {
    const tiers = newStats.priorityFees.tiers;
    const oldTiers = oldStats.priorityFees.tiers;

    for (let i = 0; i < tiers.length; i++) {
      if (tiers[i] > oldTiers[i]) {
        return i;
      }
    }

    return 2; // Default to middle tier
  }

  /**
   * Handle errors during polling
   */
  private handleError(error: Error): void {
    this.errorCount++;
    this.lastError = error;
    
    console.error('TxListener error:', error);
    
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
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
   * Get current client state
   */
  getState(): TxGuardClientState {
    return {
      isMonitoring: this.isPolling,
      lastStats: this.lastStats,
      pdaAddresses: this.pdaAddresses,
      errorCount: this.errorCount,
      lastError: this.lastError
    };
  }

  /**
   * Get current stats (latest polled data)
   */
  getCurrentStats(): TxGuardStats | undefined {
    return this.lastStats;
  }

  /**
   * Force a manual poll (useful for testing)
   */
  async forcePoll(): Promise<TxGuardStats | undefined> {
    await this.pollAccounts();
    return this.lastStats;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPolling();
    this.txRecordedListeners = [];
    this.statsUpdateListeners = [];
    this.errorListeners = [];
  }
}
