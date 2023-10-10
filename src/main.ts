import * as anchor from "@coral-xyz/anchor";
import { Escrow, IDL } from "../utils/types/escrow";
import {
  PublicKey,
  Commitment,
  Keypair,
  SystemProgram,
  clusterApiUrl,
  Connection,
  Cluster,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID as associatedTokenProgram,
  TOKEN_PROGRAM_ID as tokenProgram,
  TOKEN_PROGRAM_ID,
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Buffer } from "buffer";
import { randomU64 } from "../utils/helper";
import bs58 from "bs58";

window.Buffer = Buffer;

const commitment: Commitment = "confirmed";

const opts = {
  preflightCommitment: "recent",
};

class GibEscrow {
  programId = new PublicKey("AWLErDWVWkjWYRhkCdnaUxSrKYQqPxi7qGXvHNB1rQWk");
  seed: anchor.BN;
  tokenPubKey: PublicKey;
  makerPublicKey: PublicKey;
  program: anchor.Program<Escrow>;
  provider: anchor.AnchorProvider;
  connection: Connection;

  constructor(network: Cluster, tokenPubKey: PublicKey) {
    const wallet = window.solana;
    if (!wallet) {
      throw new Error("Install a solana wallet");
    }
    this.tokenPubKey = new PublicKey(tokenPubKey);
    this.connection = new Connection(clusterApiUrl(network), commitment);
    this.provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment,
    });

    this.program = new anchor.Program<Escrow>(
      IDL,
      this.programId,
      this.provider
    );
  }

  private generatePDAs = (makerPublicKey: PublicKey, u64num: anchor.BN) => {    
    const seedBN = new anchor.BN(u64num.toString());

    const auth = PublicKey.findProgramAddressSync(
      [Buffer.from("auth")],
      this.program.programId
    )[0];

    const escrow = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        makerPublicKey.toBytes(),
        seedBN.toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    )[0];

    const vault = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), escrow.toBuffer()],
      this.program.programId
    )[0];

    return {
      vault,
      escrow,
      auth,
    };
  };

  fundEscrow = async (walletProvider: any, amount: number) => {
    const makerAta = await this.ownerTokenAta(walletProvider, this.tokenPubKey);
    const u64Seed = randomU64();
    const seedBN = new anchor.BN(u64Seed.toString());
    const { auth, escrow, vault } = this.generatePDAs(
      walletProvider.publicKey,
      seedBN
    );

    const transaction = await this.program.methods
      .make(seedBN, new anchor.BN(amount * 1e6))
      .accounts({
        maker: walletProvider.publicKey,
        makerAta,
        makerToken: this.tokenPubKey,
        auth,
        escrow,
        vault,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    let { blockhash } = await this.connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletProvider.publicKey;

    const signedTransaction = await walletProvider.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize()
    );
    return { signature, u64Seed };
  };

  updateEscrow = async (
    u64Seed: number,
    walletProvider: any,
    amount: number
  ) => {
    const makerAta = await this.ownerTokenAta(walletProvider, this.tokenPubKey);
    const seedBN = new anchor.BN(u64Seed.toString());
    const { auth, escrow, vault } = this.generatePDAs(
      walletProvider.publicKey,
      seedBN
    );

    const transaction = await this.program.methods
      .update(new anchor.BN(amount * 1e6))
      .accounts({
        maker: walletProvider.publicKey,
        makerAta,
        makerToken: this.tokenPubKey,
        auth,
        vault,
        escrow,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    let { blockhash } = await this.connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletProvider.publicKey;

    const signedTransaction = await walletProvider.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    return signature;
  };

  withdrawEscrow = async (
    takerWallet: any,
    makerPublicKey: string,
    u64Seed: number,
    gibPayerPK: string
  ) => {
    const takerAta = await this.ownerTokenAta(takerWallet, this.tokenPubKey);
    const maker = new PublicKey(makerPublicKey);
    const seedBN = new anchor.BN(u64Seed.toString());
    const { auth, escrow, vault } = this.generatePDAs(maker, seedBN);
    const unit8key = bs58.decode(gibPayerPK);
    const gibPayer = Keypair.fromSecretKey(unit8key);

    const signature = await this.program.methods
      .take()
      .accounts({
        gibPayer: gibPayer.publicKey,
        takerAta,
        taker: takerWallet.publicKey,
        maker,
        makerToken: this.tokenPubKey,
        auth,
        escrow,
        vault,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([gibPayer])
      .rpc()
      .then(this.confirmTx);

    return signature;
  };

  private confirmTx = async (signature: string) => {
    const latestBlockHash = await this.connection.getLatestBlockhash();
    const result = await this.connection.confirmTransaction(
      {
        signature,
        ...latestBlockHash,
      },
      commitment
    );

    return result;
  };

  private ownerTokenAta = async (owner: any, tokenPubKey: PublicKey) => {
    console.log({
      tokenPubKey,
      x: owner.publicKey,
    });
    const tAccount = await this.gibGetOrCreateAssociatedTokenAccount(
      this.connection,
      owner,
      tokenPubKey,
      owner.publicKey,
      false
    );

    return tAccount?.address;
  };

  private gibGetOrCreateAssociatedTokenAccount = async (
    connection: Connection,
    provider: any,
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve = false,
    commitment?: Commitment,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
  ): Promise<Account> => {
    const associatedToken = getAssociatedTokenAddressSync(
      mint,
      owner,
      allowOwnerOffCurve,
      programId,
      associatedTokenProgramId
    );

    // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
    // Sadly we can't do this atomically.
    let account: Account;
    try {
      account = await getAccount(
        connection,
        associatedToken,
        commitment,
        programId
      );
    } catch (error: unknown) {
      console.log({ unk: error });

      // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
      // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
      // TokenInvalidAccountOwnerError in this code path.
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        // As this isn't atomic, it's possible others can create associated accounts meanwhile.
        try {
          const transaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              provider.publicKey,
              associatedToken,
              owner,
              mint,
              programId,
              associatedTokenProgramId
            )
          );

          let { blockhash } = await this.connection.getLatestBlockhash();

          transaction.recentBlockhash = blockhash;
          transaction.feePayer = provider.publicKey;

          await provider.signAndSendTransaction(transaction);
          const signedTransaction = await provider.signTransaction(transaction);
          await this.connection.sendRawTransaction(
            signedTransaction.serialize()
          );
        } catch (error: unknown) {
          // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
          // instruction error if the associated account exists already.
          console.log({ error });
        }

        // Now this should always succeed
        account = await getAccount(
          connection,
          associatedToken,
          commitment,
          programId
        );
      } else {
        console.log("it throws");
        throw error;
      }
    }

    return account;
  };
}

declare global {
  interface Window {
    solana: any;
  }
}

export default GibEscrow;
