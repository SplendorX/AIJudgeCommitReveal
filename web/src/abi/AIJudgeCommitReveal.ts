const abi = [
    {
      "inputs": [],
      "name": "AlreadyFinalized",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AlreadyJudged",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AlreadyRevealed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AlreadySubmitted",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AnswerTooLong",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "BountyNotFound",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidReveal",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidWinner",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NoCommitment",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NoRevealedSubmissions",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotBountyOwner",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "PaymentFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "RevealEnded",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "RevealNotStarted",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SubmissionClosed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TooManySubmissions",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "aiReview",
          "type": "bytes"
        }
      ],
      "name": "AllAnswersJudged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "submitter",
          "type": "address"
        }
      ],
      "name": "AnswerRevealed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "BountyCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "submitter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "commitment",
          "type": "bytes32"
        }
      ],
      "name": "CommitmentSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "winnerIndex",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "reward",
          "type": "uint256"
        }
      ],
      "name": "WinnerFinalized",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MAX_ANSWER_LENGTH",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_SUBMISSIONS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "bounties",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "rubric",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "reward",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "submissionDeadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "revealDeadline",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "judged",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "finalized",
          "type": "bool"
        },
        {
          "internalType": "bytes",
          "name": "aiReview",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "winnerIndex",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "revealedSubmissionCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "answer",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "salt",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "submitter",
          "type": "address"
        }
      ],
      "name": "computeCommitment",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "rubric",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "submissionDeadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "revealDeadline",
          "type": "uint256"
        }
      ],
      "name": "createBounty",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "winnerIndex",
          "type": "uint256"
        }
      ],
      "name": "finalizeWinner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "hasCommitted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "llmInput",
          "type": "bytes"
        }
      ],
      "name": "judgeAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextBountyId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        }
      ],
      "name": "reclaimReward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "answer",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "salt",
          "type": "bytes32"
        }
      ],
      "name": "revealAnswer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bountyId",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "commitment",
          "type": "bytes32"
        }
      ],
      "name": "submitCommitment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
  ] as const;

export default abi; 
