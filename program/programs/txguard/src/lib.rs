use anchor_lang::prelude::*;

declare_id!("FxYDzyGPggfBeQsoLCJqmhAq9danG1qQJXaUjrWTwhp1");

#[program]
pub mod txguard {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.tx_count = 0;
        registry.success_count = 0;
        registry.failure_count = 0;
        registry.cursor = 0;
        
        // Initialize all outcomes to 2 (pending/unknown)
        // Vec will be initialized empty, we'll handle this properly
        registry.last_100_outcomes.clear();
        for _ in 0..100 {
            registry.last_100_outcomes.push(2);
        }
        
            // Reset failure catalog so re-runs start from a clean slate
            let catalog = &mut ctx.accounts.failure_catalog;
            catalog.slippage_exceeded = 0;
            catalog.insufficient_liquidity = 0;
            catalog.mev_detected = 0;
            catalog.dropped_tx = 0;
            catalog.insufficient_funds = 0;
            catalog.other = 0;

        // Initialize priority fee stats
        let stats = &mut ctx.accounts.priority_fee_stats;
        stats.tiers.clear();
        for _ in 0..5 {
            stats.tiers.push(0);
        }
        
        msg!("Transaction Registry initialized");
        Ok(())
    }

    pub fn register_tx_outcome(
        ctx: Context<RegisterTxOutcome>,
        success: bool,
        failure_type: u8,
        priority_fee_tier: u8,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        let catalog = &mut ctx.accounts.failure_catalog;
        let stats = &mut ctx.accounts.priority_fee_stats;

        // Validate priority fee tier (0-4)
        require!(
            priority_fee_tier < 5,
            TxGuardError::InvalidPriorityFeeTier
        );

        // Update registry
        registry.tx_count = registry.tx_count.checked_add(1)
            .ok_or(TxGuardError::CountOverflow)?;

        // Update circular buffer
        let cursor_idx = registry.cursor as usize;
        if cursor_idx < registry.last_100_outcomes.len() {
            registry.last_100_outcomes[cursor_idx] = if success { 1 } else { 0 };
        }
        registry.cursor = (registry.cursor + 1) % 100;

        if success {
            registry.success_count = registry.success_count.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?;
        } else {
            registry.failure_count = registry.failure_count.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?;

            // Update failure catalog
            match failure_type {
                0 => catalog.slippage_exceeded = catalog.slippage_exceeded.checked_add(1)
                    .ok_or(TxGuardError::CountOverflow)?,
                1 => catalog.insufficient_liquidity = catalog.insufficient_liquidity.checked_add(1)
                    .ok_or(TxGuardError::CountOverflow)?,
                2 => catalog.mev_detected = catalog.mev_detected.checked_add(1)
                    .ok_or(TxGuardError::CountOverflow)?,
                3 => catalog.dropped_tx = catalog.dropped_tx.checked_add(1)
                    .ok_or(TxGuardError::CountOverflow)?,
                4 => catalog.insufficient_funds = catalog.insufficient_funds.checked_add(1)
                    .ok_or(TxGuardError::CountOverflow)?,
                _ => catalog.other = catalog.other.checked_add(1)
                    .ok_or(TxGuardError::CountOverflow)?,
            }
        }

        // Update priority fee stats
        if (priority_fee_tier as usize) < stats.tiers.len() {
            stats.tiers[priority_fee_tier as usize] = stats.tiers[priority_fee_tier as usize]
                .checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?;
        }

        msg!("Transaction recorded: success={}, failure_type={}, tier={}", 
             success, failure_type, priority_fee_tier);
        Ok(())
    }

    pub fn record_failure(ctx: Context<RecordFailure>, failure_type: u8) -> Result<()> {
        let catalog = &mut ctx.accounts.failure_catalog;
        
        match failure_type {
            0 => catalog.slippage_exceeded = catalog.slippage_exceeded.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?,
            1 => catalog.insufficient_liquidity = catalog.insufficient_liquidity.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?,
            2 => catalog.mev_detected = catalog.mev_detected.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?,
            3 => catalog.dropped_tx = catalog.dropped_tx.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?,
            4 => catalog.insufficient_funds = catalog.insufficient_funds.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?,
            _ => catalog.other = catalog.other.checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?,
        }
        
        msg!("Failure recorded: type={}", failure_type);
        Ok(())
    }

    pub fn update_priority_fee(ctx: Context<UpdatePriorityFee>, tier: u8) -> Result<()> {
        require!(tier < 5, TxGuardError::InvalidPriorityFeeTier);
        
        let stats = &mut ctx.accounts.priority_fee_stats;
        
        // Ensure tier index is valid
        if (tier as usize) < stats.tiers.len() {
            stats.tiers[tier as usize] = stats.tiers[tier as usize]
                .checked_add(1)
                .ok_or(TxGuardError::CountOverflow)?;
        }
        
        msg!("Priority fee tier updated: tier={}", tier);
        Ok(())
    }
}

// Transaction Registry Account
#[account]
#[derive(InitSpace)]
pub struct TransactionRegistry {
    pub tx_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    #[max_len(100)]
    pub last_100_outcomes: Vec<u8>, // 0=failure, 1=success, 2=pending
    pub cursor: u8,
}

// Failure Catalog Account
#[account]
#[derive(InitSpace)]
pub struct FailureCatalog {
    pub slippage_exceeded: u32,
    pub insufficient_liquidity: u32,
    pub mev_detected: u32,
    pub dropped_tx: u32,
    pub insufficient_funds: u32,
    pub other: u32,
}

// Priority Fee Statistics Account
#[account]
#[derive(InitSpace)]
pub struct PriorityFeeStats {
    #[max_len(5)]
    pub tiers: Vec<u64>, // Counts for 5 priority fee tiers (0-4)
}

// Instruction Contexts
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
            init_if_needed,
        payer = payer,
        space = 8 + TransactionRegistry::INIT_SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, TransactionRegistry>,
    
    #[account(
            init_if_needed,
        payer = payer,
        space = 8 + FailureCatalog::INIT_SPACE,
        seeds = [b"catalog"],
        bump
    )]
    pub failure_catalog: Account<'info, FailureCatalog>,
    
    #[account(
            init_if_needed,
        payer = payer,
        space = 8 + PriorityFeeStats::INIT_SPACE,
        seeds = [b"priority"],
        bump
    )]
    pub priority_fee_stats: Account<'info, PriorityFeeStats>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterTxOutcome<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut, seeds = [b"registry"], bump)]
    pub registry: Account<'info, TransactionRegistry>,
    
    #[account(mut, seeds = [b"catalog"], bump)]
    pub failure_catalog: Account<'info, FailureCatalog>,
    
    #[account(mut, seeds = [b"priority"], bump)]
    pub priority_fee_stats: Account<'info, PriorityFeeStats>,
}

#[derive(Accounts)]
pub struct RecordFailure<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut, seeds = [b"catalog"], bump)]
    pub failure_catalog: Account<'info, FailureCatalog>,
}

#[derive(Accounts)]
pub struct UpdatePriorityFee<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut, seeds = [b"priority"], bump)]
    pub priority_fee_stats: Account<'info, PriorityFeeStats>,
}

// Custom Errors
#[error_code]
pub enum TxGuardError {
    #[msg("Invalid priority fee tier")]
    InvalidPriorityFeeTier,
    #[msg("Count overflow")]
    CountOverflow,
}
