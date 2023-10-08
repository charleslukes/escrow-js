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

window.Buffer = Buffer;

const commitment: Commitment = "confirmed";

const opts = {
  preflightCommitment: "recent",
};

class GibEscrow {
  programId = new PublicKey("AWLErDWVWkjWYRhkCdnaUxSrKYQqPxi7qGXvHNB1rQWk");
  seed: anchor.BN;
  auth: anchor.web3.PublicKey;
  escrow: anchor.web3.PublicKey;
  vault: anchor.web3.PublicKey;
  tokenPubKey: PublicKey;
  makerPublicKey: PublicKey;
  program: anchor.Program<Escrow>;
  provider: anchor.AnchorProvider;
  connection: Connection;

  constructor(
    network: Cluster,
    makerPublicKey: PublicKey,
    tokenPubKey: PublicKey
  ) {
    const wallet = window.solana;
    if (!wallet) {
      throw new Error("Install a solana wallet");
    }

    this.makerPublicKey = makerPublicKey;
    this.tokenPubKey = new PublicKey(tokenPubKey);
    this.connection = new Connection(clusterApiUrl(network), commitment);
    this.provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment,
    });

    this.seed = new anchor.BN(randomU64().toString());

    this.program = new anchor.Program<Escrow>(
      IDL,
      this.programId,
      this.provider
    );

    this.auth = PublicKey.findProgramAddressSync(
      [Buffer.from("auth")],
      this.program.programId
    )[0];

    this.escrow = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        this.makerPublicKey.toBytes(),
        this.seed.toArrayLike(Buffer, "le", 8)
      ],
      this.program.programId
    )[0];

    this.vault = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), this.escrow.toBuffer()],
      this.program.programId
    )[0];
  }

  fundEscrow = async (walletProvider: any, amount: number) => {
    const makerAta = await this.ownerTokenAta(walletProvider, this.tokenPubKey);
    const transaction = await this.program.methods
      .make(this.seed, new anchor.BN(amount * 1e6))
      .accounts({
        maker: walletProvider.publicKey,
        makerAta,
        makerToken: this.tokenPubKey,
        auth: this.auth,
        escrow: this.escrow,
        vault: this.vault,
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
    return signature;
  };

  updateEscrow = async (walletProvider: any, amount: number) => {
    const makerAta = await this.ownerTokenAta(walletProvider, this.tokenPubKey);
    const transaction = await this.program.methods
      .update(new anchor.BN(amount * 1e6))
      .accounts({
        maker: walletProvider.publicKey,
        makerAta,
        makerToken: this.tokenPubKey,
        auth: this.auth,
        vault: this.vault,
        escrow: this.escrow,
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

  withdrawEscrow = async (taker: Keypair, makerPublicKey: PublicKey) => {
    const takerAta = await this.ownerTokenAta(taker, this.tokenPubKey);
    const signature = await this.program.methods
      .take()
      .accounts({
        gibPayer: taker.publicKey,
        takerAta,
        taker: taker.publicKey,
        maker: makerPublicKey,
        makerToken: this.tokenPubKey,
        auth: this.auth,
        escrow: this.escrow,
        vault: this.vault,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc()
      .then(this.confirmTx);

    return signature;
  };

  private confirmTx = async (signature: string) => {
    const latestBlockHash = await this.connection.getLatestBlockhash();
    await this.connection.confirmTransaction(
      {
        signature,
        ...latestBlockHash,
      },
      commitment
    );
  };

  private ownerTokenAta = async (owner: any, tokenPubKey: PublicKey) => {
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
