use anchor_lang::prelude::*;

// Declare your program ID
declare_id!("3eV3bUBgyJ59nkYW8wu1T4pWZyrRBsPUH4Yc78woV6YN");

#[program]
pub mod decentralized_voting {
    use super::*;

    // Initialize function for setting up the voting account
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let voting_account = &mut ctx.accounts.voting_account;
        voting_account.cats = 0;
        voting_account.dogs = 0;
        Ok(())
    }

    // Vote function to increment counts based on the choice
    pub fn vote(ctx: Context<Vote>, choice: String) -> Result<()> {
        let voting_account = &mut ctx.accounts.voting_account;

        // Validate the choice and increment the corresponding counter
        match choice.as_str() {
            "cats" => voting_account.cats += 1,
            "dogs" => voting_account.dogs += 1,
            _ => return Err(ErrorCode::InvalidChoice.into()), // Handle invalid choice
        }

        Ok(())
    }
}

// Context for the initialize function
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 + 8)] // Account space: 8 bytes each for u64 fields + metadata
    pub voting_account: Account<'info, VotingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Context for the vote function
#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voting_account: Account<'info, VotingAccount>,
}

// Account structure to store voting data
#[account]
pub struct VotingAccount {
    pub cats: u64,
    pub dogs: u64,
}

// Custom error types
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid choice. Please choose either 'cats' or 'dogs'.")]
    InvalidChoice,
}
