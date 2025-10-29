# TxGuard Client

TypeScript client library for TxGuard Solana program.

## Features

- Transaction outcome monitoring
- Failure classification
- Priority fee analysis
- Sanctum Gateway integration (optional)
- Real-time PDA polling

## Usage

```typescript
import { TxGuardClient } from './src/index';

const client = new TxGuardClient({
  connection: new Connection('http://127.0.0.1:8899'),
  programId: new PublicKey('FxYDzyGPggfBeQsoLCJqmhAq9danG1qQJXaUjrWTwhp1')
});

// Start monitoring
await client.startMonitoring();

// Get current stats
const stats = await client.getStats();
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Test
bun run test

# Watch mode
bun run dev
```
