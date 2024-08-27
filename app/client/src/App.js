import React, { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import idl from './idl.json';

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");

function App() {
    const [catsVotes, setCatsVotes] = useState(0);
    const [dogsVotes, setDogsVotes] = useState(0);
    const [votingAccount, setVotingAccount] = useState(null);

    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
    const { publicKey, connected } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        const fetchVotingAccount = async () => {
            const [account] = await PublicKey.findProgramAddress(
                [Buffer.from("voting")],
                programID
            );
            setVotingAccount(account);
        };
        fetchVotingAccount();
    }, []);

    const getProvider = () => {
        if (!connected) {
            console.error("Wallet not connected");
            return null;
        }
        const provider = new AnchorProvider(
            connection, 
            window.solana, 
            { preflightCommitment: "processed" }
        );
        return provider;
    };

    const fetchVotes = async () => {
        const provider = getProvider();
        if (!provider) return;

        const program = new Program(idl, programID, provider);
        try {
            const account = await program.account.votingAccount.fetch(votingAccount);
            setCatsVotes(account.cats.toNumber());
            setDogsVotes(account.dogs.toNumber());
        } catch (err) {
            console.error("Error fetching votes:", err);
        }
    };

    const castVote = async (choice) => {
        if (!connected) {
            alert("Please connect your wallet!");
            return;
        }

        const provider = getProvider();
        if (!provider) return;

        const program = new Program(idl, programID, provider);

        try {
            const transaction = await program.methods.vote(choice)
                .accounts({
                    votingAccount: votingAccount,
                })
                .transaction();

            transaction.feePayer = publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const signedTransaction = await provider.wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            
            await connection.confirmTransaction(signature);

            console.log("Vote cast successfully:", signature);
            await fetchVotes();
        } catch (err) {
            console.error("Error casting vote:", err);
        }
    };

    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
                        <h1 className="text-4xl font-bold mb-8">Decentralized Voting</h1>
                        <WalletMultiButton />
                        <div className="mt-8">
                            <button onClick={() => castVote("cats")} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2">Vote for Cats</button>
                            <button onClick={() => castVote("dogs")} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded m-2">Vote for Dogs</button>
                        </div>
                        <div className="mt-8">
                            <button onClick={fetchVotes} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Fetch Votes</button>
                            <p className="mt-4">Cats: {catsVotes}</p>
                            <p>Dogs: {dogsVotes}</p>
                        </div>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
