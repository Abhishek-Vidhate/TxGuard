import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">TxGuard Features</h1>
        <p className="text-muted-foreground">
          Comprehensive transaction health monitoring and analytics for Solana developers
        </p>
      </div>

      {/* What is TxGuard */}
      <Card>
        <CardHeader>
          <CardTitle>What is TxGuard?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>TxGuard</strong> is a developer-focused toolkit that helps Solana program developers track, categorize, and analyze transaction outcomes in real-time. Instead of guessing why transactions fail, TxGuard provides structured, on-chain data about success rates, failure types, and priority fee effectiveness.
          </p>
          <p>
            TxGuard consists of an <strong>Anchor program</strong> deployed on Solana (devnet/mainnet) that stores transaction outcome data, and a <strong>Next.js dashboard</strong> that visualizes this data with beautiful charts and analytics.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Does TxGuard Work?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1">1. On-Chain State (Anchor Program)</h3>
              <p className="text-sm text-muted-foreground">
                The Anchor program maintains three Program Derived Addresses (PDAs):
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li><strong>Transaction Registry:</strong> Tracks total transactions, success/failure counts, and last 100 outcomes</li>
                <li><strong>Failure Catalog:</strong> Categorizes failures by type (slippage, liquidity, MEV, dropped, insufficient funds, other)</li>
                <li><strong>Priority Fee Stats:</strong> Records usage distribution across fee tiers (Free, Low, Medium, High, Premium)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">2. Recording Outcomes</h3>
              <p className="text-sm text-muted-foreground">
                Developers call the <code className="px-1 py-0.5 bg-muted rounded text-xs">register_tx_outcome</code> instruction with:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Success status (boolean)</li>
                <li>Failure type (u8 enum: 0-5 for slippage, liquidity, MEV, dropped, insufficient funds, other)</li>
                <li>Priority fee tier (u8: 0-4 for Free, Low, Medium, High, Premium)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">3. Dashboard Visualization</h3>
              <p className="text-sm text-muted-foreground">
                The frontend dashboard polls the on-chain PDAs via Next.js API routes and displays:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Real-time success rate charts (area chart)</li>
                <li>Failure breakdown by category (pie chart)</li>
                <li>Priority fee tier usage distribution (bar chart)</li>
                <li>Key metrics: total, successful, failed transactions, success rate percentage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Version Features */}
      <Card>
        <CardHeader>
          <CardTitle>Current Version (v1.0) Features</CardTitle>
          <CardDescription>What you get right now</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">Core</Badge>
              <div>
                <h3 className="font-semibold">On-Chain Transaction Registry</h3>
                <p className="text-sm text-muted-foreground">
                  Store transaction outcomes directly on Solana with immutable, verifiable records. All data is on-chain and accessible via the Anchor program.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">Core</Badge>
              <div>
                <h3 className="font-semibold">Failure Categorization</h3>
                <p className="text-sm text-muted-foreground">
                  Classify failures into 6 categories: Slippage Exceeded, Insufficient Liquidity, MEV Detected, Dropped Transaction, Insufficient Funds, and Other.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">Analytics</Badge>
              <div>
                <h3 className="font-semibold">Priority Fee Tier Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor which priority fee tiers (Free, Low, Medium, High, Premium) are used most and correlate with success rates.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">UI</Badge>
              <div>
                <h3 className="font-semibold">Interactive Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Beautiful dark-themed dashboard with shadcn/ui charts showing success rate trends, failure breakdowns, and fee tier distributions in real-time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">Developer</Badge>
              <div>
                <h3 className="font-semibold">Developer Controls</h3>
                <p className="text-sm text-muted-foreground">
                  UI form to manually record outcomes with customizable success/failure status, failure type, and priority tier for testing and CI scenarios.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">API</Badge>
              <div>
                <h3 className="font-semibold">REST API Endpoints</h3>
                <p className="text-sm text-muted-foreground">
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">/api/transactions</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">/api/failures</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">/api/stats</code> for programmatic access to analytics data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Version Features */}
      <Card>
        <CardHeader>
          <CardTitle>Next Version (v1.1) Roadmap</CardTitle>
          <CardDescription>Coming soon - enhanced metrics and capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Failure Sub-Dimensions</h3>
                <p className="text-sm text-muted-foreground">
                  Enhanced failure categorization with detail codes (e.g., slippage bands: 25/50/100bps, dropped tx reasons: blockhash expired vs not broadcast vs RPC rejected).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Fee Effectiveness Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Record actual Compute Units (CU) consumed per fee tier with histograms showing median and 95th percentile usage patterns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Landing Latency Metrics</h3>
                <p className="text-sm text-muted-foreground">
                  Track slots-to-finality latency per priority tier and failure type to identify network congestion patterns and optimize delivery strategies.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Counterparty Correlation</h3>
                <p className="text-sm text-muted-foreground">
                  Optional PDA to track which external programs (DEXs, AMMs, etc.) correlate with failures or high latency, helping identify integration issues.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">New Program Methods</h3>
                <p className="text-sm text-muted-foreground">
                  Additional instructions: <code className="px-1 py-0.5 bg-muted rounded text-xs">record_latency</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">record_fee_usage</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">record_failure_detail</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">record_counterparty</code>.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Advice Engine</h3>
                <p className="text-sm text-muted-foreground">
                  Client-side SDK feature that analyzes live stats and suggests optimal priority fee tiers and slippage adjustments based on historical patterns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Auto-Error Classification</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic mapping of common Solana error messages to failure detail codes, reducing manual classification overhead.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Webhook Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time webhook pusher (client-side) to alert on failure spikes or unusual patterns, perfect for incident response and monitoring.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Planned</Badge>
              <div>
                <h3 className="font-semibold">Time-Windowed Queries</h3>
                <p className="text-sm text-muted-foreground">
                  Enhanced API endpoints with <code className="px-1 py-0.5 bg-muted rounded text-xs">?from&to&type&tier</code> filters for time-based analytics and trend analysis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="pt-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

