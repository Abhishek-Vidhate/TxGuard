import { PublicKey, Connection } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

// Re-export types from generated IDL
export type { Txguard } from '../program/target/types/txguard';

// Failure types matching the program's enum
export enum FailureType {
  SLIPPAGE_EXCEEDED = 0,
  INSUFFICIENT_LIQUIDITY = 1,
  MEV_DETECTED = 2,
  DROPPED_TX = 3,
  INSUFFICIENT_FUNDS = 4,
  OTHER = 5
}

// Priority fee tiers (0-4)
export enum PriorityFeeTier {
  TIER_0 = 0, // Lowest
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
  TIER_4 = 4  // Highest
}

// Transaction outcome states
export enum TxOutcome {
  FAILURE = 0,
  SUCCESS = 1,
  PENDING = 2
}

// Client configuration
export interface TxGuardClientConfig {
  connection: Connection;
  programId: PublicKey;
  wallet?: any; // Optional wallet for signing
  pollingInterval?: number; // Default: 5000ms
  gatewayApiKey?: string; // Optional Sanctum Gateway API key
}

// Account data structures (matching program)
export interface TransactionRegistryData {
  txCount: number;
  successCount: number;
  failureCount: number;
  last100Outcomes: number[]; // Array of TxOutcome values
  cursor: number;
}

export interface FailureCatalogData {
  slippageExceeded: number;
  insufficientLiquidity: number;
  mevDetected: number;
  droppedTx: number;
  insufficientFunds: number;
  other: number;
}

export interface PriorityFeeStatsData {
  tiers: number[]; // Array of 5 tier counts
}

// Combined stats for easy consumption
export interface TxGuardStats {
  registry: TransactionRegistryData;
  failures: FailureCatalogData;
  priorityFees: PriorityFeeStatsData;
  successRate: number;
  lastUpdated: Date;
}

// Event types for monitoring
export interface TxRecordedEvent {
  signature: string;
  success: boolean;
  failureType: FailureType;
  priorityFeeTier: PriorityFeeTier;
  timestamp: Date;
}

export interface StatsUpdateEvent {
  stats: TxGuardStats;
  timestamp: Date;
}

// Error classification result
export interface FailureClassification {
  type: FailureType;
  confidence: number; // 0-1
  originalError: string;
}

// Priority fee analysis result
export interface PriorityFeeAnalysis {
  recommendedTier: PriorityFeeTier;
  tierEffectiveness: Record<PriorityFeeTier, number>; // Success rate per tier
  averageFee: number;
  lastAnalyzed: Date;
}

// Sanctum Gateway types
export interface SanctumGatewayConfig {
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface SanctumOptimizationResult {
  optimized: boolean;
  signature?: string;
  error?: string;
}

// Client event listeners
export type TxRecordedListener = (event: TxRecordedEvent) => void;
export type StatsUpdateListener = (event: StatsUpdateEvent) => void;
export type ErrorListener = (error: Error) => void;

// PDA addresses
export interface TxGuardPDAs {
  registry: PublicKey;
  failureCatalog: PublicKey;
  priorityFeeStats: PublicKey;
}

// Client state
export interface TxGuardClientState {
  isMonitoring: boolean;
  lastStats?: TxGuardStats;
  pdaAddresses: TxGuardPDAs;
  errorCount: number;
  lastError?: Error;
}
