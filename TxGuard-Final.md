# Sanctum Gateway Hackathon - Project Idea & Implementation Guide

## 🎯 **PROJECT TITLE: "TxGuard" - Intelligent Transaction Health Monitor & Delivery Optimizer for Solana DeFi**

---

## **PROBLEM STATEMENT**

### The Core Problem
On Solana, **40-75% of DeFi transactions fail** during network congestion, yet most failures are **invisible to developers**. The distinction between transaction failures is unclear:
- **Dropped transactions**: Never reach validators (network layer issue)
- **Failed transactions**: Reach validators but revert (logic/execution issue)
- **Sandwiched transactions**: MEV exploited before execution

### Why This Matters for Your Users
1. **Trading Bots**: 99.95% failure rate on unprofitable arbitrage attempts (but still pay fees)
2. **Liquidation Protocols**: Miss liquidation opportunities due to silent failures
3. **DeFi Apps**: No real-time visibility into why their transactions fail
4. **LLM Trading Agents**: Cannot learn from failed transactions without categorization

### The Sanctum Gateway Opportunity
**Sanctum Gateway solves the delivery problem**, but developers need visibility into:
- Which transactions are actually failing (and why)
- Which transactions are getting sandwiched
- Real-time delivery success rates
- Optimal priority fee tiers for their use case

---

## 📋 **PROJECT IDEA: TxGuard**

### **What You Build**
A **Solana on-chain monitoring program + TypeScript client** that:

1. **Monitors transaction outcomes** in real-time (success/failure/dropped)
2. **Categorizes failure reasons** (slippage exceeded, insufficient liquidity, sandwiched, etc.)
3. **Tracks priority fee effectiveness** (which fees worked, which didn't)
4. **Provides Sanctum Gateway integration hints** (if use Sanctum, delivery succeeds at 98%+)

### **Key Features (Realistic for 1 Day)**

#### **On-Chain Program (Anchor)**
- **Transaction Registry Account**: Stores last 100 transaction outcomes
- **Failure Catalog PDA**: Tracks failure types and frequency
- **Priority Fee Analytics**: Records which fee tiers succeeded/failed
- **Simple State**: Fixed-size accounts (no dynamic vectors to avoid complexity)

#### **Client (TypeScript)**
- **Real-time listener**: Monitors transaction logs from connected program
- **Failure classifier**: Parses error codes and maps to categories
- **Dashboard data provider**: REST endpoints for frontend
- **Sanctum Gateway bridge**: Detects if transaction used Sanctum (success indicator)

#### **Frontend (Next.js + shadcn/ui - Copy-paste Components)**
- Transaction success rate chart (real-time)
- Failure breakdown pie chart (slippage, MEV, insufficient funds, etc.)
- Priority fee effectiveness matrix
- Sanctum Gateway adoption impact visualization

---

## **WHY THIS WINS**

✅ **Solves Real Problem**: 75% failure rate is actual pain point  
✅ **Uses Sanctum Gateway**: Core submission tool leverages Sanctum's delivery optimization  
✅ **Novel Use Case**: Not another DEX/token swap—it's **MEV + transaction health monitoring**  
✅ **Hackathon Realistic**: Can ship working version in 1 day  
✅ **On-Chain Logic**: Real Anchor program, not just UI wrapper  
✅ **Differentiator**: Most submissions are token swaps; you're solving infrastructure visibility  

---

## 🛠️ **TECH STACK & LIBRARIES**
IMPORTANT NOTE : I use `bun` JS package manager

### **On-Chain (Anchor Program)**
```
Language: Rust
Framework: Anchor 0.32.1 
Dependencies:
- anchor-lang
- solana-program ( included in anchor-lang)
- anchor-spl (for token validation)
- borsh (serialization; included in anchor-lang )
- thiserror (error handling)
```

### **Client & Testing** (TypeScript Only - NO Mollusk Rust Tests)
```
Language: TypeScript
Runtime: Node.js
Testing Framework: Mocha (TS tests only)
Tools:
- @coral-xyz/anchor (Anchor TypeScript client)

@coral-xyz/anchor depends on node.js native modules. Therefore, webpack 5 will not work with current version. You will either need to rollback to webpack 4, or use a polyfill for each missing dependency.

- @solana/web3.js (transaction decoding, RPC calls)
- @solana/spl-token (token helpers)
- mocha (TS testing framework)
- chai (assertion library)
- ts-node (TypeScript execution)

NOTE: Sanctum Gateway Integration
- Sanctum Gateway API requires HTTP/REST only (no special SDK needed)
- Use fetch() or native HTTP client
- axios is NOT required (use native fetch API instead)
```

### **Frontend** (NEXT.JS + shadcn/ui REQUIRED)
```
Framework: Next.js 16 (App Router) - REQUIRED
UI Components: shadcn/ui (Tailwind CSS based, copy-paste components) - REQUIRED
Charts: shadcn/ui built-in chart components (Recharts wrapper)
Wallet Integration: @solana/wallet-adapter-react
Real-time Data: TanStack Query (React Query)
Styling: Tailwind CSS (comes with shadcn/ui)
HTTP Client: fetch (built-in) or axios
Deployment: Vercel
```

### **Deployment**
```
Program: Devnet (Solana)
Frontend: Vercel (Next.js + shadcn/ui automatic deployment)
```

---

## 📁 **PROJECT STRUCTURE**

```
txguard/
├── program/                          # Anchor program
│   ├── programs/
│   │   └── txguard/
│   │       ├── src/
│   │       │   ├── lib.rs           # Main program entry
│   │       │   ├── instructions/
│   │       │   │   ├── register_tx.rs      # Register transaction outcome
│   │       │   │   ├── record_failure.rs   # Record failure type
│   │       │   │   └── update_priority_fee.rs
│   │       │   ├── state/
│   │       │   │   ├── transaction_registry.rs
│   │       │   │   ├── failure_catalog.rs
│   │       │   │   └── priority_fee_stats.rs
│   │       │   └── errors.rs
│   │       ├── Cargo.toml
│   │       └── tests/
│   │           └── integration.ts   # TypeScript Mocha tests (NOT Mollusk Rust)
│   ├── Anchor.toml
│   └── package.json
│
├── client/                          # TypeScript client
│   ├── src/
│   │   ├── index.ts                # Main client
│   │   ├── types.ts
│   │   ├── txListener.ts           # Real-time listener
│   │   ├── failureClassifier.ts    # Failure categorization logic
│   │   ├── sanctumBridge.ts        # Sanctum Gateway integration (fetch only)
│   │   ├── api/
│   │   │   └── endpoints.ts        # REST API definitions
│   │   └── utils/
│   │       ├── errorParser.ts
│   │       └── priorityFeeAnalyzer.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── tests/
│       └── client.test.ts          # Mocha tests for client
│
├── frontend/                        # Next.js + shadcn/ui App
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Next.js 16 App Router)
│   │   ├── page.tsx                # Dashboard page
│   │   ├── api/
│   │   │   ├── transactions/       # API route (Next.js API routes)
│   │   │   ├── failures/           # API route
│   │   │   └── stats/              # API route
│   │   └── components/
│   │       ├── Dashboard.tsx       # Main dashboard (shadcn/ui components)
│   │       ├── SuccessRateChart.tsx (shadcn/ui chart component - copy-paste)
│   │       ├── FailureBreakdown.tsx (shadcn/ui chart component - copy-paste)
│   │       ├── PriorityFeeMatrix.tsx (shadcn/ui component)
│   │       ├── SanctumImpact.tsx (shadcn/ui chart component - copy-paste)
│   │       └── WalletConnect.tsx
│   ├── hooks/
│   │   ├── useTxGuardData.ts       # Custom hook for fetching data
│   │   └── useSolana.ts
│   ├── lib/
│   │   ├── api-client.ts           # Client for calling /api routes
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js          # Tailwind + shadcn/ui config
│   ├── next.config.js
│   ├── components.json             # shadcn/ui components config
│   └── .env.local                  # Local env vars only
│
└── README.md                        # Comprehensive docs
```

---

## **BUILD CHECKLIST (1 Day)**

### **Morning (4 hours): Anchor Program + TypeScript Client**
- [ ] Anchor project setup
- [ ] State definitions (transaction registry, failure catalog)
- [ ] 2-3 instruction handlers
- [ ] **TypeScript Mocha tests** (5-10 test cases)
- [ ] Deploy to devnet

## important note : after successfully implementing solana program , copy IDL and types for /target to /frontend/anchor-idl ;
``` bash
cp ../program/idl/txguard.json frontend/anchor-idl/idl.json
cp ../program/target/types/txguard.ts frontend/anchor-idl/idl.ts
```

### **Afternoon (4 hours): TypeScript Client + Next.js API Routes**
- [ ] Transaction listener implementation
- [ ] Failure classifier (maps error codes to categories)
- [ ] Sanctum Gateway bridge (fetch API only, NO axios)
- [ ] **Create Next.js API routes** (`/api/transactions`, `/api/failures`, `/api/stats`)
- [ ] Client integration tests (Mocha)
- [ ] Connect to Next.js backend

### **Evening (2-3 hours): Next.js + shadcn/ui Frontend**
- [ ] Next.js 16 setup 
- [ ] shadcn/ui setup with pre-built components
- [ ] 4 chart components (copy-paste from shadcn/ui docs)
- [ ] Real-time data connection via Next.js API routes
- [ ] Final testing
- [ ] deploy on vercel (i'll do this task manually)

---

## **TESTING STRATEGY: (TypeScript Only)**

### Use Mocha instead for all testing

**Why TypeScript Mocha instead of Mollusk Rust tests?**
- ✅ Faster to write and run
- ✅ Use @coral-xyz/anchor client directly
- ✅ Test real program behavior against devnet
- ✅ Works with TypeScript codebase

### **Mocha Test Structure**

**Tests for Anchor Program** (`program/tests/integration.ts`):
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { TxGuard } from "../target/types/txguard"; // use for anchor-idl ; use the one which is correct practice and ready for production

describe("TxGuard Program", () => {
  // Set up provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TxGuard as Program<TxGuard>;

  // Test 1: Initialize Transaction Registry
  it("should initialize transaction registry", async () => {
    // Create PDA for registry
    // Call initialize instruction
    // Assert account was created
  });

  // Test 2: Register successful transaction
  it("should register successful transaction", async () => {
    // Call register_tx_outcome instruction with success=true
    // Assert success_count incremented
  });

  // Test 3: Classify failure type
  it("should record slippage exceeded failure", async () => {
    // Call register_tx_outcome instruction with failure_type=slippage
    // Assert failure_catalog.slippage_exceeded incremented
  });

  // Test 4-10: Additional test cases...
});
```

**Tests for TypeScript Client** (`client/tests/client.test.ts`):
```typescript
import { describe, it } from "mocha";
import { assert, expect } from "chai";
import { classifyFailure } from "../src/failureClassifier";
import { isSanctumUsed } from "../src/sanctumBridge";

describe("TxGuard Client", () => {
  it("should classify slippage errors correctly", () => {
    const error = "slippage tolerance exceeded";
    assert.equal(classifyFailure(error), "slippage_exceeded");
  });

  it("should detect Sanctum Gateway usage", () => {
    // Test Sanctum detection logic
  });

  // Additional tests...
});
```

### **Run Tests**
```bash
# Anchor program tests (TypeScript)
cd program && anchor test

# Client tests (TypeScript) ; this is for reference use correct commands
cd client && bun test 
```

---

## **SANCTUM GATEWAY INTEGRATION (NO axios - Use fetch)**

### **Important: Sanctum Gateway API Overview**

Sanctum Gateway is an **HTTP REST API** for transaction optimization on Solana. It does NOT require axios or any special SDK.

IMPORTANT NOTE : USE SANCTUM'S DEVNET API & URL

**Sanctum Gateway Methods:**
1. **optimizeTransaction**: Prepare a transaction for optimized delivery
2. **sendTransaction**: Send a transaction through Sanctum's delivery network

### **Implementation (Use fetch, NOT axios)**

```typescript
// client/src/sanctumBridge.ts
export async function sendViaSanctumGateway(
  tx: Transaction,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.gateway.sanctum.so/v1/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      transaction: tx.toString("base64"),
      options: {
        skipPreflight: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Sanctum Gateway error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.signature; // Transaction signature
}

export function isSanctumUsed(tx: Transaction): boolean {
  // Check if transaction was routed through Sanctum
  // Sanctum adds specific program instructions that we can detect
  return tx.instructions.some(
    (ix) =>
      ix.programId.toString().includes("sanctum") ||
      ix.data.toString().includes("optimized")
  );
}
```

**Why NO axios?**
- Sanctum Gateway is a standard HTTP API
- Use native `fetch()` instead (built into Node.js 18+)
- Simpler, lighter, no extra dependencies
- Same functionality as axios

---

## **NEXT.JS + shadcn/ui FRONTEND SETUP**

### **Critical: Use Next.js 16 with shadcn/ui**

#### **Step 1: Create Next.js App**
```bash
npx create-next-app@latest frontend --app --typescript --tailwind
cd frontend
```

#### **Step 2: Install shadcn/ui**
```bash
npx shadcn-ui@latest init
# Follow prompts: TypeScript ✓, Tailwind ✓, dark mode ✓
```

#### **Step 3: Add shadcn/ui Components (Copy-Paste Only)**
```bash
# Add chart component (includes Recharts)
npx shadcn-ui@latest add chart

# Add card component
npx shadcn-ui@latest add card

# Add button component
npx shadcn-ui@latest add button
```

All components are copied directly into your codebase. Edit them directly for customization.

#### **Step 4: Create Dashboard with shadcn/ui Charts**

```typescript
// frontend/app/components/SuccessRateChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SuccessRateChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="successRate" stroke="#8884d8" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

All shadcn/ui components come with pre-built styling and accessibility. Just import and use.

---

## **NEXT.JS API ROUTES (No Separate Backend)**

### **API Routes = Your Backend**

```typescript
// frontend/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTransactionRegistry } from "@/lib/anchor-client";

export async function GET(request: NextRequest) {
  try {
    const registry = await getTransactionRegistry();

    return NextResponse.json({
      totalTransactions: registry.txCount,
      successCount: registry.successCount,
      failureCount: registry.failureCount,
      successRate: (registry.successCount / registry.txCount) * 100,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
```

**That's it.** No Express, no separate server. Next.js handles everything.

---

## **IMPLEMENTATION DETAILS**

### **Anchor Program Logic (Simplified)**

**State Account 1: TransactionRegistry**
```rust
#[account]
pub struct TransactionRegistry {
    pub tx_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub last_100_outcomes: [u8; 100],  // 1 = success, 0 = failure, 2 = pending
}
```

**State Account 2: FailureCatalog**
```rust
#[account]
pub struct FailureCatalog {
    pub slippage_exceeded: u32,
    pub insufficient_liquidity: u32,
    pub mev_detected: u32,
    pub dropped_tx: u32,
    pub insufficient_funds: u32,
    pub other: u32,
}
```

**Instruction: RegisterTxOutcome**
```rust
#[derive(Accounts)]
pub struct RegisterTxOutcome<'info> {
    #[account(mut)]
    pub registry: Account<'info, TransactionRegistry>,
    #[account(mut)]
    pub failure_catalog: Account<'info, FailureCatalog>,
    pub payer: Signer<'info>,
}

pub fn register_tx_outcome(
    ctx: Context<RegisterTxOutcome>,
    success: bool,
    failure_type: u8,  // 0 = slippage, 1 = liquidity, etc.
) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.tx_count += 1;

    if success {
        registry.success_count += 1;
    } else {
        registry.failure_count += 1;
        let catalog = &mut ctx.accounts.failure_catalog;
        match failure_type {
            0 => catalog.slippage_exceeded += 1,
            1 => catalog.insufficient_liquidity += 1,
            _ => catalog.other += 1,
        }
    }
    Ok(())
}
```

### **TypeScript Failure Classifier**

```typescript
// client/src/failureClassifier.ts
const ERROR_MAPPING: Record<string, FailureType> = {
  slippage: "slippage_exceeded",
  "insufficient funds": "insufficient_funds",
  liquidity: "insufficient_liquidity",
  "exceeded compute unit": "compute_error",
  "account not found": "dropped_tx",
};

export function classifyFailure(errorLog: string): FailureType {
  const lowerError = errorLog.toLowerCase();
  for (const [key, type] of Object.entries(ERROR_MAPPING)) {
    if (lowerError.includes(key)) {
      return type;
    }
  }
  return "other";
}
```

---

## **DEPENDENCIES CLARIFICATION**

### **What You Need** this is reference versions, use the latest compatible version
```json
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.32.1",
    "@solana/web3.js": "^1.98.4",
    "@solana/spl-token": "^0.4.14"
  },
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.3.0",
    "ts-node": "^10.9.0"
  }
}
```

### **What You DON'T Need**
- ❌ mollusk (Rust testing - use Mocha TypeScript instead)
- ❌ axios (use native fetch API)
- ❌ Express or separate backend (Next.js API routes)

---

## ✅ **SUCCESS CRITERIA**

Your project should have:

1. ✅ **Working Anchor program** on devnet (can call instructions)
2. ✅ **TypeScript Mocha tests** (≥5 test cases for program, ≥3 for client)
3. ✅ **TypeScript client** that listens to transactions
4. ✅ **Failure classification** (≥5 categories: slippage, liquidity, MEV, dropped, insufficient_funds)
5. ✅ **Sanctum Gateway integration** (fetch API call to detect/send via Sanctum)
6. ✅ **Next.js 16 dashboard** with shadcn/ui components (≥3 charts)
7. ✅ **Next.js API routes** (`/api/transactions`, `/api/failures`, `/api/stats`)
8. ✅ **Comprehensive README** with setup instructions
9. ✅ **Deployed on devnet** (program) + Vercel (frontend + API routes)

---

## 🏆 **HACKATHON SUBMISSION CHECKLIST**

- [ ] GitHub repo with all code
- [ ] README with architecture diagram
- [ ] 2-3 minute demo video showing dashboard live
- [ ] Anchor program deployed to devnet
- [ ] Frontend + API routes deployed to Vercel (single deployment)
- [ ] Mentions Sanctum Gateway in submission description
- [ ] Shows real transaction monitoring in action
- [ ] Explains how it solves Solana's 75% failure rate problem
- [ ] All tests passing (Mocha tests - TypeScript only)

---

## 🚨 **CRITICAL REMINDERS**

- **Next.js + shadcn/ui ONLY for frontend** - no other UI frameworks
- **Mocha TypeScript tests ONLY** - no Mollusk Rust tests
- **fetch API ONLY for HTTP calls** - no axios required
- **Focus on core features**: TX monitoring + classification + Sanctum bridge
- **Deploy early**: Get to devnet by morning
- **Test continuously**: Run Mocha tests every 30 minutes
- **Keep components simple**: 3-4 shadcn/ui components max
- **Use API routes**: Next.js handles backend, no separate server

---

## 📖 **KEY DOCUMENTATION TO READ BEFORE CODING**

1. **Next.js 16 App Router**: `https://nextjs.org/docs/app`
2. **shadcn/ui Chart Docs**: `https://ui.shadcn.com/docs/components/chart`
3. **Anchor Book**: `https://book.anchor-lang.com`
4. **Solana Web3.js**: `https://solana-labs.github.io/solana-web3.js/`
5. **Mocha Documentation**: `https://mochajs.org/`
6. **Sanctum Gateway API**: Check Sanctum's HTTP endpoint docs (no special SDK)

---

## 🎁 **BONUS: Speed Tips**

1. Start with a GitHub template for Next.js + shadcn/ui (already configured)
2. Copy-paste shadcn/ui components directly - customize later
3. Use simple mock data first, connect real data last
4. Test API routes locally with curl/Postman before frontend
5. Deploy to Vercel the moment frontend compiles
6. Use Anchor CLI for program deployment (one command)

---

## **Good Luck! 🚀**

Build something useful. Focus on Solana's real problems. Use Sanctum Gateway as your delivery mechanism. Ship it on Vercel.
