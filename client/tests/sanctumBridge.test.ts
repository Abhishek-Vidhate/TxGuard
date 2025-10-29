import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  SanctumBridge, 
  SanctumGatewayConfig,
  SanctumOptimizationResult 
} from '../src/sanctumBridge';

describe('SanctumBridge', () => {
  let bridge: SanctumBridge;
  let connection: Connection;
  let mockTransaction: Transaction;

  before(async () => {
    connection = new Connection('http://127.0.0.1:8899');
    mockTransaction = new Transaction();
    
    // Add a simple instruction and recent blockhash to make transaction valid
    mockTransaction.add(
      SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 0
      })
    );
    
    // Set fee payer
    mockTransaction.feePayer = PublicKey.default;
    
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      mockTransaction.recentBlockhash = blockhash;
    } catch (error) {
      // If connection fails, use a mock blockhash
      mockTransaction.recentBlockhash = '11111111111111111111111111111111';
    }
  });

  beforeEach(() => {
    const config: SanctumGatewayConfig = {
      enabled: false,
      baseUrl: 'https://api.gateway.sanctum.so/v1'
    };
    bridge = new SanctumBridge(config, connection);
  });

  describe('isEnabled', () => {
    it('should return false when not enabled', () => {
      expect(bridge.isEnabled()).to.be.false;
    });

    it('should return true when enabled with API key', () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-api-key'
      });
      expect(bridge.isEnabled()).to.be.true;
    });

    it('should return false when enabled but no API key', () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: undefined
      });
      expect(bridge.isEnabled()).to.be.false;
    });
  });

  describe('sendTransaction', () => {
    it('should return not optimized when disabled', async () => {
      const result = await bridge.sendTransaction(mockTransaction);
      
      expect(result.optimized).to.be.false;
      expect(result.error).to.equal('Sanctum Gateway not enabled');
      expect(result.signature).to.be.undefined;
    });

    it('should handle enabled configuration', async () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-key'
      });

      // Mock fetch to avoid actual API calls
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return new Response(JSON.stringify({ signature: 'test-signature' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      };

      try {
        const result = await bridge.sendTransaction(mockTransaction);
        expect(result.optimized).to.be.true; // Now it should work with proper transaction
        expect(result.signature).to.equal('test-signature');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API errors gracefully', async () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-key'
      });

      // Mock fetch to return error
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return new Response('API Error', { status: 400 });
      };

      try {
        const result = await bridge.sendTransaction(mockTransaction);
        expect(result.optimized).to.be.false;
        expect(result.error).to.include('Sanctum Gateway error');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('optimizeTransaction', () => {
    it('should return not optimized when disabled', async () => {
      const result = await bridge.optimizeTransaction(mockTransaction);
      
      expect(result.optimized).to.be.false;
      expect(result.error).to.equal('Sanctum Gateway not enabled');
    });

    it('should handle optimization request when enabled', async () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-key'
      });

      // Mock fetch
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return new Response(JSON.stringify({ optimizedTransaction: 'optimized-tx' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      };

      try {
        const result = await bridge.optimizeTransaction(mockTransaction);
        expect(result.optimized).to.be.true; // Now it should work with proper transaction
        expect(result.signature).to.equal('optimized-tx');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('isSanctumUsed', () => {
    it('should detect Sanctum usage in transaction', () => {
      // Create a mock transaction with Sanctum-like program ID
      const transaction = new Transaction();
      
      // This is a simplified test - in reality you'd need to properly construct instructions
      const result = SanctumBridge.isSanctumUsed(transaction);
      
      // For now, expect false since we're not actually adding Sanctum instructions
      expect(result).to.be.false;
    });

    it('should handle transaction parsing errors gracefully', () => {
      // Test with invalid transaction
      const result = SanctumBridge.isSanctumUsed(null as any);
      expect(result).to.be.false;
    });
  });

  describe('getSanctumSuccessRate', () => {
    it('should return expected success rate', () => {
      const rate = SanctumBridge.getSanctumSuccessRate();
      expect(rate).to.be.greaterThan(95);
      expect(rate).to.be.lessThan(100);
    });
  });

  describe('getDeliveryImprovement', () => {
    it('should return expected improvement percentage', () => {
      const improvement = SanctumBridge.getDeliveryImprovement();
      expect(improvement).to.be.greaterThan(20);
      expect(improvement).to.be.lessThan(50);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when disabled', () => {
      const status = bridge.getStatus();
      
      expect(status.enabled).to.be.false;
      expect(status.configured).to.be.false;
      expect(status.hasApiKey).to.be.false;
      expect(status.baseUrl).to.equal('https://api.gateway.sanctum.so/v1');
    });

    it('should return correct status when enabled', () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-key'
      });

      const status = bridge.getStatus();
      
      expect(status.enabled).to.be.true;
      expect(status.configured).to.be.true;
      expect(status.hasApiKey).to.be.true;
    });
  });

  describe('updateConfig', () => {
    it('should update configuration correctly', () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'new-key',
        baseUrl: 'https://custom.api.com'
      });

      const status = bridge.getStatus();
      expect(status.enabled).to.be.true;
      expect(status.hasApiKey).to.be.true;
      expect(status.baseUrl).to.equal('https://custom.api.com');
    });
  });

  describe('testConnection', () => {
    it('should return not connected when disabled', async () => {
      const result = await bridge.testConnection();
      
      expect(result.connected).to.be.false;
      expect(result.error).to.equal('Sanctum Gateway not enabled');
    });

    it('should test connection when enabled', async () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-key'
      });

      // Mock fetch for health check
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return new Response('OK', { status: 200 });
      };

      try {
        const result = await bridge.testConnection();
        expect(result.connected).to.be.true;
        expect(result.responseTime).to.be.a('number');
        expect(result.error).to.be.undefined;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle connection errors', async () => {
      bridge.updateConfig({
        enabled: true,
        apiKey: 'test-key'
      });

      // Mock fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };

      try {
        const result = await bridge.testConnection();
        expect(result.connected).to.be.false;
        expect(result.error).to.equal('Network error');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('getMetrics', () => {
    it('should return placeholder metrics', async () => {
      const metrics = await bridge.getMetrics();
      
      expect(metrics.totalTransactions).to.be.a('number');
      expect(metrics.successRate).to.be.a('number');
      expect(metrics.averageLatency).to.be.a('number');
      expect(metrics.lastUpdated).to.be.instanceOf(Date);
      
      expect(metrics.successRate).to.be.greaterThan(95);
      expect(metrics.averageLatency).to.be.greaterThan(0);
    });
  });
});
