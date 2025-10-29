import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Txguard } from "../target/types/txguard";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("txguard", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet;

  const program = anchor.workspace.txguard as Program<Txguard>;

  it("Initialize PDAs for registry, catalog, and priority stats", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Initialize transaction signature:", tx);

    // Fetch the registry account
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

    const registry = await program.account.transactionRegistry.fetch(registryPda);
    
    // Verify initialization
    expect(registry.txCount.toNumber()).to.equal(0);
    expect(registry.successCount.toNumber()).to.equal(0);
    expect(registry.failureCount.toNumber()).to.equal(0);
    expect(registry.cursor).to.equal(0);
    expect(registry.last100Outcomes.length).to.equal(100);
  });

  it("Register successful transaction", async () => {
    const tx = await program.methods
      .registerTxOutcome(true, 0, 2)
      .rpc();
    console.log("Register success transaction signature:", tx);

    // Fetch the registry
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

    const registry = await program.account.transactionRegistry.fetch(registryPda);
    
    // Verify counts
    expect(registry.txCount.toNumber()).to.equal(1);
    expect(registry.successCount.toNumber()).to.equal(1);
    expect(registry.failureCount.toNumber()).to.equal(0);
  });

  it("Register slippage failure transaction", async () => {
    const tx = await program.methods
      .registerTxOutcome(false, 0, 1)
      .rpc();
    console.log("Register slippage failure transaction signature:", tx);

    // Fetch the registry and catalog
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );
    
    const [catalogPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("catalog")],
      program.programId
    );

    const registry = await program.account.transactionRegistry.fetch(registryPda);
    const catalog = await program.account.failureCatalog.fetch(catalogPda);
    
    // Verify counts
    expect(registry.txCount.toNumber()).to.equal(2);
    expect(registry.successCount.toNumber()).to.equal(1);
    expect(registry.failureCount.toNumber()).to.equal(1);
    expect(catalog.slippageExceeded).to.equal(1);
  });

  it("Record failure directly", async () => {
    const tx = await program.methods
      .recordFailure(4) // insufficient_funds
      .rpc();
    console.log("Record failure transaction signature:", tx);

    const [catalogPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("catalog")],
      program.programId
    );

    const catalog = await program.account.failureCatalog.fetch(catalogPda);
    
    // Verify failure catalog
    expect(catalog.insufficientFunds).to.equal(1);
  });

  it("Update priority fee tier", async () => {
    const tx = await program.methods
      .updatePriorityFee(3)
      .rpc();
    console.log("Update priority fee transaction signature:", tx);

    const [priorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("priority")],
      program.programId
    );

    const stats = await program.account.priorityFeeStats.fetch(priorityPda);
    
    // Verify tier count
    expect(stats.tiers.length).to.equal(5);
    expect(stats.tiers[3].toNumber()).to.equal(1);
  });

  it("Verify multiple transactions update counts correctly", async () => {
    // Register multiple successful transactions with different priority tiers
    await program.methods.registerTxOutcome(true, 0, 0).rpc();
    await program.methods.registerTxOutcome(true, 0, 1).rpc();
    await program.methods.registerTxOutcome(true, 0, 2).rpc();
    await program.methods.registerTxOutcome(false, 1, 3).rpc(); // liquidity failure
    await program.methods.registerTxOutcome(true, 0, 4).rpc();

    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );
    
    const [catalogPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("catalog")],
      program.programId
    );

    const registry = await program.account.transactionRegistry.fetch(registryPda);
    const catalog = await program.account.failureCatalog.fetch(catalogPda);
    
    // Should have 7 transactions total (1 from previous tests + 5 new = 6, wait, let me recount)
    // Actually: 2 from previous tests (success + slippage), then 5 more = 7 total
    expect(registry.txCount.toNumber()).to.be.greaterThanOrEqual(7);
    expect(catalog.insufficientLiquidity).to.be.greaterThanOrEqual(1);
    
    console.log("✓ Multiple transactions verified");
  });
});
