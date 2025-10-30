"use client";
import { useCallback, useMemo, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProgram, getPDAs } from "@/lib/anchor-client";

const FAILURE_OPTIONS = [
  { key: "slippage_exceeded", label: "Slippage Exceeded", value: 0 },
  { key: "insufficient_liquidity", label: "Insufficient Liquidity", value: 1 },
  { key: "mev_detected", label: "MEV Detected", value: 2 },
  { key: "dropped_tx", label: "Dropped Transaction", value: 3 },
  { key: "insufficient_funds", label: "Insufficient Funds", value: 4 },
  { key: "other", label: "Other", value: 5 },
];

const PRIORITY_OPTIONS = [
  { label: "Free", value: 0 },
  { label: "Low", value: 1 },
  { label: "Medium", value: 2 },
  { label: "High", value: 3 },
  { label: "Premium", value: 4 },
];

export default function SendSolDemo() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inputs for developers to craft outcomes
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [failureType, setFailureType] = useState<number>(FAILURE_OPTIONS[0].value);
  const [priorityTier, setPriorityTier] = useState<number>(PRIORITY_OPTIONS[1].value); // default Low

  const failureDisabled = useMemo(() => isSuccess, [isSuccess]);

  const handleSend = useCallback(async () => {
    setSending(true);
    setResult(null);
    setError(null);
    try {
      if (!publicKey || !sendTransaction) throw new Error("Connect your wallet first.");

      const program = await getProgram();
      const pda = getPDAs(program.programId);

      const args: [boolean, number, number] = [
        Boolean(isSuccess),
        Number(failureDisabled ? FAILURE_OPTIONS[FAILURE_OPTIONS.length - 1].value : failureType),
        Number(priorityTier),
      ];

      const tx = await program.methods
        .registerTxOutcome(...args)
        .accounts({
          payer: publicKey,
          registry: pda.registry,
          failureCatalog: pda.catalog,
          priorityFeeStats: pda.priorityStats,
        })
        .transaction();

      // Fill payer and recent blockhash before sending
      const { blockhash } = await connection.getLatestBlockhash();
      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhash;

      const sig = await sendTransaction(tx, connection);
      setResult(sig);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSending(false);
    }
  }, [publicKey, sendTransaction, connection, isSuccess, failureType, priorityTier, failureDisabled]);

  return (
    <Card className="max-w-xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Call Anchor Program (Devnet)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 text-muted-foreground text-sm">This demo calls your deployed Anchor program (register_tx_outcome) directly via wallet.</div>
          <div className="mb-2"><strong>Payer/Sender:</strong> <span className="font-mono text-xs">{publicKey?.toBase58() || "Not connected"}</span></div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isSuccess}
              onChange={(e) => setIsSuccess(e.target.checked)}
            />
            <span>Mark as Success (unchecked = Failure)</span>
          </label>

          <label className="text-sm">
            <span className="block mb-1">Failure Type</span>
            <select
              className="w-full border rounded px-2 py-1"
              disabled={failureDisabled}
              value={failureType}
              onChange={(e) => setFailureType(Number(e.target.value))}
            >
              {FAILURE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1">Priority Fee Tier</span>
            <select
              className="w-full border rounded px-2 py-1"
              value={priorityTier}
              onChange={(e) => setPriorityTier(Number(e.target.value))}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <Button onClick={handleSend} disabled={sending || !connected}>
          {!connected ? "Connect Wallet First" : (sending ? "Sending..." : "Record Outcome")}
        </Button>

        {!connected && (
          <div className="bg-yellow-50 text-yellow-900 border-l-4 border-yellow-400 rounded p-2 text-xs">
            Please connect your wallet to call the program.
          </div>
        )}
        {result && (
          <div className="bg-green-100 text-green-800 rounded p-2 text-xs break-all">
            Success! Tx Signature:<br /> {result}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-800 rounded p-2 text-xs break-all">
            Error: {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
