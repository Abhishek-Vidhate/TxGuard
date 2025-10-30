import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '../anchor-idl/idl.json';

// Import the generated types
import type { Txguard } from '../anchor-idl/idl';

/**
 * Anchor client for reading PDA data
 * Used by Next.js API routes to fetch on-chain data
 */
let program: Program<Txguard> | null = null;

/**
 * Get or create the Anchor program instance
 */
export async function getProgram(): Promise<Program<Txguard>> {
  if (program) {
    return program;
  }

  // Create connection to localnet
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

  // Verify validator connectivity early to surface actionable error
  try {
    await connection.getVersion();
  } catch (e) {
    throw new Error('Failed to connect to validator at http://127.0.0.1:8899. Start it with `solana-test-validator --reset`.');
  }

  // Create a simple read-only wallet (Keypair wrapper)
  const keypair = Keypair.generate();
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => { return tx; },
    signAllTransactions: async (txs: any[]) => { return txs; }
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: 'confirmed'
  });

  // Create program instance using IDL
  program = new Program(idl as Txguard, provider);

  return program;
}

/**
 * Derive PDA addresses
 */
export function getPDAs(programId: PublicKey) {
  const [registry] = PublicKey.findProgramAddressSync(
    [Buffer.from('registry')],
    programId
  );

  const [catalog] = PublicKey.findProgramAddressSync(
    [Buffer.from('catalog')],
    programId
  );

  const [priorityStats] = PublicKey.findProgramAddressSync(
    [Buffer.from('priority')],
    programId
  );

  return {
    registry,
    catalog,
    priorityStats
  };
}

/**
 * Fetch transaction registry data
 */
export async function getTransactionRegistry(): Promise<{
  txCount: number;
  successCount: number;
  failureCount: number;
  last100Outcomes: number[];
  cursor: number;
}> {
  const program = await getProgram();
  const pda = getPDAs(program.programId);

  try {
    const account = await program.account.transactionRegistry.fetch(pda.registry);

    return {
      txCount: account.txCount.toNumber(),
      successCount: account.successCount.toNumber(),
      failureCount: account.failureCount.toNumber(),
      last100Outcomes: Array.from(account.last100Outcomes).map((o: any) => 
        typeof o === 'number' ? o : o.toNumber()
      ),
      cursor: account.cursor
    };
  } catch (error) {
    console.error('Failed to fetch transaction registry:', error);
    throw error;
  }
}

/**
 * Fetch failure catalog data
 */
export async function getFailureCatalog(): Promise<{
  slippageExceeded: number;
  insufficientLiquidity: number;
  mevDetected: number;
  droppedTx: number;
  insufficientFunds: number;
  other: number;
}> {
  const program = await getProgram();
  const pda = getPDAs(program.programId);

  try {
    const account = await program.account.failureCatalog.fetch(pda.catalog);

    return {
      slippageExceeded: account.slippageExceeded,
      insufficientLiquidity: account.insufficientLiquidity,
      mevDetected: account.mevDetected,
      droppedTx: account.droppedTx,
      insufficientFunds: account.insufficientFunds,
      other: account.other
    };
  } catch (error) {
    console.error('Failed to fetch failure catalog:', error);
    throw error;
  }
}

/**
 * Fetch priority fee statistics
 */
export async function getPriorityFeeStats(): Promise<{
  tiers: number[];
}> {
  const program = await getProgram();
  const pda = getPDAs(program.programId);

  try {
    const account = await program.account.priorityFeeStats.fetch(pda.priorityStats);

    return {
      tiers: Array.from(account.tiers).map((t: any) => 
        typeof t === 'number' ? t : t.toNumber()
      )
    };
  } catch (error) {
    console.error('Failed to fetch priority fee stats:', error);
    throw error;
  }
}

/**
 * Calculate success rate from registry data
 */
export function calculateSuccessRate(registry: {
  txCount: number;
  successCount: number;
  failureCount: number;
}): number {
  if (registry.txCount === 0) {
    return 0;
  }
  return (registry.successCount / registry.txCount) * 100;
}
