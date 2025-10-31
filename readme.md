# TxGuard

**TxGuard** is a devtool for Solana teams and bots: a drop-in dashboard and Anchor program for tracking, labeling, and visualizing transaction outcomes (including failures: slippage, liquidity, MEV, dropped, insufficient funds, etc.).

### Demo Video : [Google Drive](https://drive.google.com/file/d/1ZYfNyM-9DasDf0qGY4BYpC9ruEO8m-9E/view?usp=drive_link)

## Why build TxGuard
Solana's DeFi transaction failure rate was as high as 75% during peak congestion in early 2024, mostly due to bot-driven arbitrage attempts and network overload, but has since improved to a 62-75% success rate by late 2025 as network upgrades and better tooling were introduced. Most failures now stem from bots deliberately submitting transactions that are expected to fail (slippage/arbitrage protection) rather than regular user actions, and developers have good visibility into transaction status thanks to enhanced analytics and monitoring tools.

TxGuard tries to help developers visualise these failures metrics, so they can develop better solana program
---

## Why use TxGuard?
- See at a glance why your transactions fail—no log scraping or guesswork.
- Export, chart, and analyze every run/test or real world event.
- Works out of the box: just clone, deploy, and use.

---

## Quickstart

### Prerequisites

Set Solana CLI config to devnet:
```sh
solana config set --url devnet
```

### Setup Instructions

#### Terminal 1: Build and Deploy Program

```sh
cd program
anchor build
anchor keys sync

# Most important
# Copy IDL files to frontend
cd ..  # Back to TxGuard root directory
cp program/target/idl/txguard.json frontend/anchor-idl/idl.json
cp program/target/types/txguard.ts frontend/anchor-idl/idl.ts

cd program
anchor test
```
<img width="1710" height="1107" alt="Screenshot 2025-10-31 at 9 15 02 AM" src="https://github.com/user-attachments/assets/4be6c3c1-1e72-4f2d-b630-e5fd1ffb712b" />

#### Terminal 2: Start Frontend Dashboard

```sh
cd frontend
bun install
bun --bun run dev
```

<img width="1710" height="979" alt="Screenshot 2025-10-31 at 9 17 41 AM" src="https://github.com/user-attachments/assets/4a4056a4-1a62-4269-8f13-41ca2d13f631" />

#### Terminal 3: Run Tests (Optional)

```sh
cd program
anchor test --skip-deploy
```

### Testing on UI

Once the frontend is running, open your browser to the dashboard URL (typically `http://localhost:3000`) and test the UI.

## Using TxGuard in Your Project

TxGuard can be embedded into your existing Solana workflow with minimal changes: deploy the included Anchor program to devnet (or your cluster of choice), copy the generated IDL and types into your app, and from your TypeScript dapp, bots, or test suites, call the `registerTxOutcome` instruction whenever you execute or simulate transactions to label outcomes (success/failure, reason, and priority tier). The dashboard (this frontend) reads the same on-chain PDAs to visualize metrics, so teams can keep their core logic untouched while gaining unified observability across local tests, CI, and production bots—simply wire TxGuard calls alongside your normal `@coral-xyz/anchor` or `@solana/web3.js` flows using your existing wallet adapter and RPC.



---

## Recording Outcomes
- Use the dashboard UI to record test and prod tx outcomes (choose success/fail, category, tier).
- Charts and API update instantly. Share outcomes with your team or export for reporting.
- (Optional) Call the Anchor program from your tests/services:
```ts
await program.methods
  .registerTxOutcome(success, failureType, priorityTier)
  .accounts({ payer, registry, failureCatalog, priorityFeeStats })
  .rpc();
```

## Who should use this?
- Solana bots, MM teams, DEXs, protocol devs, researchers, QA, incidents/on-call.
- Anyone who needs to move past anecdotal tx failures and toward reliable, explainable behavior.
