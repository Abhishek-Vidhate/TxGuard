import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Txguard } from '../../program/target/types/txguard';

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const idl = require('../../program/target/idl/txguard.json');
  const program = new Program<Txguard>(idl, provider);
  const sig = await program.methods.initialize().rpc();
  console.log('Initialized PDAs. Tx:', sig);
})();