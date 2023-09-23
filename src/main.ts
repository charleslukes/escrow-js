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
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID as associatedTokenProgram,
  TOKEN_PROGRAM_ID as tokenProgram,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Buffer } from "buffer";

const commitment: Commitment = "confirmed";
const seed = new anchor.BN(1234);

const opts = {
  preflightCommitment: "recent",
};

class GibEscrow {
  programId = new PublicKey("AWLErDWVWkjWYRhkCdnaUxSrKYQqPxi7qGXvHNB1rQWk");
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
    
    this.makerPublicKey = new PublicKey(makerPublicKey);
    this.tokenPubKey = new PublicKey(tokenPubKey)
    this.connection = new Connection(clusterApiUrl(network), commitment);
    this.provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment,
    });

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
        seed.toArrayLike(Buffer, "be", 32).reverse(),
      ],
      this.program.programId
    )[0];

    this.vault = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), this.escrow.toBuffer()],
      this.program.programId
    )[0];
  }

  fundEscrow = async (maker: Keypair, amount: number) => {
    const makerAta = await this.ownerTokenAta(maker, this.tokenPubKey);
    const signature = await this.program.methods
      .make(seed, new anchor.BN(amount * 1e6))
      .accounts({
        maker: maker.publicKey,
        makerAta,
        makerToken: this.tokenPubKey,
        auth: this.auth,
        escrow: this.escrow,
        vault: this.vault,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(this.confirmTx);

    return signature;
  };

  updateEscrow = async (maker: Keypair, amount: number) => {
    const makerAta = await this.ownerTokenAta(maker, this.tokenPubKey);
    const signature = await this.program.methods
      .update(new anchor.BN(amount * 1e6))
      .accounts({
        maker: maker.publicKey,
        makerAta,
        makerToken: this.tokenPubKey,
        auth: this.auth,
        vault: this.vault,
        escrow: this.escrow,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(this.confirmTx);
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

  private ownerTokenAta = async (owner: Keypair, tokenPubKey: PublicKey) => {
    const tAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      owner,
      tokenPubKey,
      owner.publicKey,
      false
    );

    return tAccount?.address;
  };
}

declare global {
  interface Window {
    solana: any;
  }
}

export default GibEscrow;
