import * as anchor from "@project-serum/anchor";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Resolve the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the IDL file
const idlPath = new URL('./idl.json', import.meta.url);
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

// Set up the connection to the devnet cluster
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const programId = new anchor.web3.PublicKey("3eV3bUBgyJ59nkYW8wu1T4pWZyrRBsPUH4Yc78woV6YN");
const program = new anchor.Program(idl, programId);

const initializeVotingAccount = async () => {
    try {
        // Generate a new keypair for the voting account
        const votingAccount = anchor.web3.Keypair.generate();

        const tx = await program.methods.initialize()
            .accounts({
                votingAccount: votingAccount.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([provider.wallet.payer, votingAccount])
            .rpc();

        console.log("Transaction signature:", tx);
        console.log("Voting account public key:", votingAccount.publicKey.toString());
    } catch (error) {
        console.error("Error initializing voting account:", error);
    }
};

initializeVotingAccount();
