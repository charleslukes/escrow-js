export type Escrow = {
  "version": "0.1.0",
  "name": "escrow",
  "instructions": [
    {
      "name": "make",
      "accounts": [
        {
          "name": "maker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "makerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        },
        {
          "name": "depositAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "accounts": [
        {
          "name": "maker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "makerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "maker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "makerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "addAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "take",
      "accounts": [
        {
          "name": "maker",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gibPayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "takerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maker",
            "type": "publicKey"
          },
          {
            "name": "makerToken",
            "type": "publicKey"
          },
          {
            "name": "seed",
            "type": "u64"
          },
          {
            "name": "authBump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "AuthBumpError",
      "msg": "Unable to get auth bump"
    },
    {
      "code": 6001,
      "name": "VaultBumpError",
      "msg": "Unable to get vault bump"
    },
    {
      "code": 6002,
      "name": "EscrowBumpError",
      "msg": "Unable to get escrow bump"
    }
  ]
};

export const IDL: Escrow = {
  "version": "0.1.0",
  "name": "escrow",
  "instructions": [
    {
      "name": "make",
      "accounts": [
        {
          "name": "maker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "makerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        },
        {
          "name": "depositAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "accounts": [
        {
          "name": "maker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "makerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "maker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "makerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "addAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "take",
      "accounts": [
        {
          "name": "maker",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "makerToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gibPayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "takerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maker",
            "type": "publicKey"
          },
          {
            "name": "makerToken",
            "type": "publicKey"
          },
          {
            "name": "seed",
            "type": "u64"
          },
          {
            "name": "authBump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "AuthBumpError",
      "msg": "Unable to get auth bump"
    },
    {
      "code": 6001,
      "name": "VaultBumpError",
      "msg": "Unable to get vault bump"
    },
    {
      "code": 6002,
      "name": "EscrowBumpError",
      "msg": "Unable to get escrow bump"
    }
  ]
};
