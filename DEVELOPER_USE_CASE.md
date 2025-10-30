# TxGuard — Developer Usage Guide

## What is TxGuard?
TxGuard lets you track and categorize transaction outcomes (success/failure + reason) for Solana programs and bots, visualizing live stats/bar/pie/area charts via a beautiful frontend and simple on-chain program.

## Why Use TxGuard?
- **Easy deployment:** Just clone, deploy program to devnet, run the dashboard.
- **Real failure visibility:** Don’t guess why your txs fail—label, query, and plot them.
- **CI/QA:** Simulate all common failure types and ensure your protocols/dapps handle them.
- **Analytics:** Export and analyze outcome and fee charts for data-driven optimizations.

---

## How To Use TxGuard In Your Own Project

### 1. Clone and Deploy
```sh
git clone https://github.com/YOUR_ORG_OR_THIS_REPO/TxGuard.git
cd TxGuard
# Deploy Anchor program to devnet
cd program
anchor build && anchor deploy --provider.cluster devnet
# Launch the frontend for the dashboard
cd ../frontend
bun install # or npm install
bun run dev # or npm run dev
```

### 2. Record Outcomes in UI (Manual or During Tests)
- UI shows “Record Outcome” card.
- Choose success/failure and category (slippage, liquidity, MEV, etc.), pick priority fee tier, click Record.
- Transactions/analytics update in real time.

### 3. Integrate With Your Scripts/Services (Optional)
- **Shell:** Use the UI or programmatically call the Anchor program’s register instruction from your test scripts or CI pipelines.
- **TypeScript/JS:**
```ts
await program.methods
  .registerTxOutcome(success, failureTypeCode, priorityFeeTier)
  .accounts({ payer, registry, failureCatalog, priorityFeeStats })
  .rpc();
```
- **Anchor:** Use the provided types/IDL for your tests.
- **CI/CD:** Trigger known failures before deploying new logic.

### 4. Export, Query, or Visualize The Data
- Use the dashboard charts live.
- Export .CSV or JSON via API or front-end for offline analysis.
- Build alerting or reporting using `/api/transactions`, `/api/failures`, `/api/stats`.

---

## How Does This Help?
- Decentralized teams agree on “truth” for test and production outcomes.
- Surface rare edge/failure classes you’d never catch with basic off-chain logging.
- Provide usable analytics for researchers, bot devs, and protocol designers.
- Simple: no crate packaging, no third-party deps. Just clone, deploy, and label.

---

## Pro Tips
- Use in your regression suite to label and reproduce failures.
- Run alongside your bot or testnet deployments; see why txs actually drop or fail.
- Perfect for hackathons, CI, QA, and research.

---

## Summary
TxGuard is a drop-in, clone-and-go solution for making Solana program failures explicit, visual, and sharable across all your team’s needs.

---

## Practical Developer Story (How teams actually use this)

Priya maintains a DEX aggregator. Users report intermittent swap failures.

1. She deploys TxGuard on devnet and runs the dashboard.
2. During development and CI, she records both successes and deliberate failures (slippage, insufficient_liquidity, dropped_tx, etc.), creating ground‑truth labels.
3. Her swap service calls `registerTxOutcome` after each attempt; failures are categorized using simple error parsing.
4. The dashboard shows a spike in `dropped_tx` between 12–2 UTC; she correlates with provider incidents and improves retry + blockhash refresh logic.
5. She exports 24h data to CSV, plots fee tier vs success rate, and tunes the default priority tier.
6. With data over time, she writes an internal playbook: when `slippage_exceeded` dominates, widen slippage or fallback route; when `insufficient_liquidity` spikes, reduce batch size.

Outcome: her team replaces guesswork with actionable data, tests all failure classes in CI, and iterates faster with measurable reliability gains.

---

## v1.1 – Proposed On‑Chain Metrics & Methods (Roadmap)

These are incremental additions that keep state bounded and cheap while unlocking better insights.

### Additional metrics
- Failure sub‑dimensions (u8/u16 detail codes):
  - `slippage_exceeded` with bps bands (25/50/100bps)
  - `insufficient_liquidity` annotated route/pool size bucket
  - `dropped_tx` split: blockhash expired vs not broadcast vs rpc rejected
- Fee effectiveness:
  - Keep small histograms per tier of CU used + median/95p
- Landing latency (slots to finality): per tier and per failure type
- Counterparty correlation:
  - Optional PDA keyed by involved program_id to see which external programs correlate with failures/latency

### New program methods (Anchor)
- `record_latency(slots_to_finality: u16, tier: u8)`
- `record_fee_usage(cu_used: u32, tier: u8)`
- `record_failure_detail(kind: u8, detail_code: u16)`
- `record_counterparty(program_id: Pubkey, outcome: bool)`

### State design (bounded & compact)
- Per‑tier ring buffers for latency/CU usage (N=32..128) + rolling stats
- Compact enums (u8/u16) for detail codes
- Optional PDAs (created on demand) to avoid rent bloat

### Client/SDK improvements
- Advice Engine: given live stats, suggest fee tier/slippage bump; warn on patterns (e.g., blockhash expiry spikes)
- Error auto‑classifier: common Solana error → failure detail code

### Observability & safety
- Webhook pusher (client‑side) for real‑time alerts
- Optional write throttling/whitelist to avoid spam on mainnet

---

## API & Exports (reference)

- `/api/transactions` — recent outcomes + success rate
- `/api/failures` — counts by failure type
- `/api/stats` — priority fee tier usage

Tip: add `?from&to&type&tier` for time‑windowed analyses and export CSV for BI tools.


