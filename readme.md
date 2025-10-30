# TxGuard

**TxGuard** is a devtool for Solana teams and bots: a drop-in dashboard and Anchor program for tracking, labeling, and visualizing transaction outcomes (including failures: slippage, liquidity, MEV, dropped, insufficient funds, etc.).

---

## Why use TxGuard?
- See at a glance why your transactions fail—no log scraping or guesswork.
- Export, chart, and analyze every run/test or real world event.
- Works out of the box: just clone, deploy, and use.

---

## Quickstart

```sh
git clone https://github.com/YOUR_ORG_OR_THIS_REPO/TxGuard.git
cd TxGuard
# Deploy the Anchor program (on devnet)
cd program
anchor build && anchor deploy --provider.cluster devnet
# Start the dashboard
cd ../frontend
bun install # or npm install
bun run dev # or npm run dev
```

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
- CI/CD: Add "label outcome" steps to your pipline—failures, slippage, or MEV.

## Exporting/Analyzing Data
- Use dashboard view for real-time.
- Download/export via API endpoints (see DEVELOPER_USE_CASE.md for advanced usage).

## Who should use this?
- Solana bots, MM teams, DEXs, protocol devs, researchers, QA, incidents/on-call.
- Anyone who needs to move past anecdotal tx failures and toward reliable, explainable behavior.

Full instructions, API notes, and tips: [DEVELOPER_USE_CASE.md](./DEVELOPER_USE_CASE.md)
