/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/txguard.json`.
 */
export type Txguard = {
  "address": "FxYDzyGPggfBeQsoLCJqmhAq9danG1qQJXaUjrWTwhp1",
  "metadata": {
    "name": "txguard",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "failureCatalog",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  116,
                  97,
                  108,
                  111,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "priorityFeeStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  105,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "recordFailure",
      "discriminator": [
        86,
        94,
        231,
        2,
        95,
        43,
        53,
        161
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "failureCatalog",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  116,
                  97,
                  108,
                  111,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "failureType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "registerTxOutcome",
      "discriminator": [
        230,
        86,
        70,
        24,
        111,
        33,
        136,
        196
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "failureCatalog",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  116,
                  97,
                  108,
                  111,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "priorityFeeStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  105,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "success",
          "type": "bool"
        },
        {
          "name": "failureType",
          "type": "u8"
        },
        {
          "name": "priorityFeeTier",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updatePriorityFee",
      "discriminator": [
        29,
        149,
        238,
        80,
        148,
        208,
        73,
        66
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "priorityFeeStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  105,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "tier",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "failureCatalog",
      "discriminator": [
        103,
        75,
        222,
        15,
        18,
        86,
        199,
        97
      ]
    },
    {
      "name": "priorityFeeStats",
      "discriminator": [
        52,
        190,
        74,
        129,
        208,
        215,
        192,
        199
      ]
    },
    {
      "name": "transactionRegistry",
      "discriminator": [
        190,
        146,
        237,
        4,
        19,
        150,
        13,
        217
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPriorityFeeTier",
      "msg": "Invalid priority fee tier"
    },
    {
      "code": 6001,
      "name": "countOverflow",
      "msg": "Count overflow"
    }
  ],
  "types": [
    {
      "name": "failureCatalog",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slippageExceeded",
            "type": "u32"
          },
          {
            "name": "insufficientLiquidity",
            "type": "u32"
          },
          {
            "name": "mevDetected",
            "type": "u32"
          },
          {
            "name": "droppedTx",
            "type": "u32"
          },
          {
            "name": "insufficientFunds",
            "type": "u32"
          },
          {
            "name": "other",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "priorityFeeStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tiers",
            "type": {
              "vec": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "transactionRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "txCount",
            "type": "u64"
          },
          {
            "name": "successCount",
            "type": "u64"
          },
          {
            "name": "failureCount",
            "type": "u64"
          },
          {
            "name": "last100Outcomes",
            "type": "bytes"
          },
          {
            "name": "cursor",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
