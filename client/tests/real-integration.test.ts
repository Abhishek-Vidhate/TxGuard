import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { TxGuardClient } from '../src/index';
import { FailureType, PriorityFeeTier } from '../src/types';
import idl from '../../program/target/idl/txguard.json';

/**
 * REAL INTEGRATION TEST
 * Tests the TxGuard client against the ACTUALLY DEPLOYED program on localnet
 * This validates that the client works with real blockchain data
 */
describe('TxGuard Client - REAL Integration with Deployed Program', () => {
  let client: TxGuardClient;
  let connection: Connection;
  let programId: PublicKey;
  let payer: Keypair;
  
  before(async () => {
    // Setup connection to localnet
    connection = new Connection('http://127.0.0.1:8899', 'confirmed');
    programId = new PublicKey('FxYDzyGPggfBeQsoLCJqmhAq9danG1qQJXaUjrWTwhp1');
    
    // Generate payer
    payer = Keypair.generate();
    
    // Airdrop some SOL for transactions
    const signature = await connection.requestAirdrop(
      payer.publicKey,
      2_000_000_000 // 2 SOL
    );
    await connection.confirmTransaction(signature);
    
    console.log('✓ Airdropped 2 SOL to payer:', payer.publicKey.toBase58());
    
    // Initialize the client
    client = new TxGuardClient({
      connection,
      programId,
      pollingInterval: 2000 // 2 seconds
    });
    
    console.log('✓ TxGuard client initialized');
  });

  it('should connect to local validator and read program ID', async () => {
    const programInfo = await connection.getAccountInfo(programId);
    expect(programInfo).to.not.be.null;
    expect(programInfo!.executable).to.be.true;
    console.log('✓ Program is deployed and executable');
  });

  it('should initialize PDAs via program instruction', async () => {
    // Create Anchor provider and program
    const wallet = new Wallet(payer);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed'
    });
    const program = new Program(idl as any, provider);
    
    // Call initialize instruction
    const tx = await program.methods
      .initialize()
      .rpc();
    
    console.log('✓ Initialize transaction:', tx);
    
    // Fetch and verify registry
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      programId
    );
    
    const registry = await program.account.transactionRegistry.fetch(registryPda);
    
    expect(registry.txCount.toNumber()).to.equal(0);
    expect(registry.successCount.toNumber()).to.equal(0);
    expect(registry.failureCount.toNumber()).to.equal(0);
    console.log('✓ Registry PDA initialized correctly');
  });

  it('should register a successful transaction', async () => {
    const wallet = new Wallet(payer);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed'
    });
    const program = new Program(idl as any, provider);
    
    // Register success
    const tx = await program.methods
      .registerTxOutcome(true, 0, 2) // success, no failure, tier 2
      .rpc();
    
    console.log('✓ Success transaction registered:', tx);
    
    // Fetch registry
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      programId
    );
    
    const registry = await program.account.transactionRegistry.fetch(registryPda);
    
    expect(registry.txCount.toNumber()).to.equal(1);
    expect(registry.successCount.toNumber()).to.equal(1);
    expect(registry.failureCount.toNumber()).to.equal(0);
    console.log('✓ Transaction successfully recorded');
  });

  it('should register a failure transaction', async () => {
    const wallet = new Wallet(payer);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed'
    });
    const program = new Program(idl as any, provider);
    
    // Register failure (slippage)
    const tx = await program.methods
      .registerTxOutcome(false, 0, 1) // failure, slippage, tier 1
      .rpc();
    
    console.log('✓ Failure transaction registered:', tx);
    
    // Fetch both registry and catalog
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      programId
    );
    
    const [catalogPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('catalog')],
      programId
    );
    
    const registry = await program.account.transactionRegistry.fetch(registryPda);
    const catalog = await program.account.failureCatalog.fetch(catalogPda);
    
    expect(registry.txCount.toNumber()).to.equal(2);
    expect(registry.successCount.toNumber()).to.equal(1);
    expect(registry.failureCount.toNumber()).to.equal(1);
    expect(catalog.slippageExceeded).to.equal(1);
    console.log('✓ Failure recorded in catalog correctly');
  });

  it('should read statistics via TxGuard client', async () => {
    // Start monitoring
    await client.startMonitoring();
    
    // Wait for poll
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const stats = await client.getStats();
    
    expect(stats).to.not.be.undefined;
    expect(stats!.registry.txCount).to.be.greaterThan(0);
    expect(stats!.registry.successCount).to.be.greaterThan(0);
    expect(stats!.registry.failureCount).to.be.greaterThan(0);
    expect(stats!.failures.slippageExceeded).to.be.greaterThan(0);
    
    console.log('✓ Client successfully reads from deployed program:');
    console.log('  - Total transactions:', stats!.registry.txCount);
    console.log('  - Success count:', stats!.registry.successCount);
    console.log('  - Failure count:', stats!.registry.failureCount);
    console.log('  - Success rate:', stats!.successRate.toFixed(2) + '%');
    console.log('  - Slippage failures:', stats!.failures.slippageExceeded);
    
    client.stopMonitoring();
  });

  it('should classify failures correctly', () => {
    const testCases = [
      { error: 'slippage tolerance exceeded', expected: FailureType.SLIPPAGE_EXCEEDED },
      { error: 'insufficient funds', expected: FailureType.INSUFFICIENT_FUNDS },
      { error: 'mev detected', expected: FailureType.MEV_DETECTED }
    ];

    testCases.forEach(({ error, expected }) => {
      const classification = client.classifyFailure(error);
      expect(classification.type).to.equal(expected);
      console.log(`✓ Classified "${error}" as ${classification.type}`);
    });
  });

  it('should analyze priority fees from real data', async () => {
    await client.startMonitoring();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const stats = await client.getStats();
    if (stats) {
      const analysis = client.analyzePriorityFees(stats);
      
      expect(analysis).to.not.be.undefined;
      expect(analysis!.tierEffectiveness).to.have.property(0);
      expect(analysis!.tierEffectiveness).to.have.property(4);
      
      console.log('✓ Priority fee analysis successful:');
      console.log('  - Recommended tier:', analysis!.recommendedTier);
      console.log('  - Average fee:', analysis!.averageFee.toFixed(2));
      
      client.stopMonitoring();
    }
  });

  it('should generate comprehensive analysis report', async () => {
    await client.startMonitoring();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const report = await client.getAnalysisReport();
    
    expect(report).to.have.property('stats');
    expect(report).to.have.property('priorityAnalysis');
    expect(report).to.have.property('sanctumStatus');
    expect(report).to.have.property('recommendations');
    
    console.log('✓ Analysis report generated:');
    console.log('  - Stats available:', !!report.stats);
    console.log('  - Priority analysis:', !!report.priorityAnalysis);
    console.log('  - Recommendations:', report.recommendations.reasoning);
    
    client.stopMonitoring();
  });

  after(() => {
    if (client) {
      client.destroy();
    }
  });
});
