// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrecompileConsumer} from "./utils/PrecompileConsumer.sol";

/// @notice Homework version combining:
/// 1. Required Track: Commit-Reveal
/// 2. Advanced Track: Ritual-native encrypted submissions design hooks
contract AIJudgeAdvanced is PrecompileConsumer {
    uint256 public nextBountyId = 1;

    error NotOwner();
    error InvalidPhase();

    struct Submission {
        address submitter;

        // Required Track
        bytes32 commitment;
        bool revealed;
        string answer;

        // Advanced Track
        bytes32 answerHash;
        string encryptedAnswerRef;

        bool eligible;
    }

    struct Bounty {
        address owner;
        string title;
        string rubric;

        uint256 reward;

        uint256 submissionDeadline;
        uint256 revealDeadline;

        bool judged;
        bool finalized;

        uint256 winnerIndex;
        uint256 revealedSubmissionCount;

        bytes aiReview;

        // Advanced Track output
        string revealedAnswersRef;
        bytes32 revealedAnswersHash;

        Submission[] submissions;
    }

    struct ConvoHistory {
        string storageType;
        string path;
        string secretsName;
    }

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(address => bool)) public hasCommitted;
    mapping(uint256 => mapping(address => uint256)) internal submissionIndex;

    event BountyCreated(uint256 indexed bountyId);
    event CommitmentSubmitted(uint256 indexed bountyId, address indexed user);
    event PrivateSubmissionStored(uint256 indexed bountyId, address indexed user);
    event AnswerRevealed(uint256 indexed bountyId, address indexed user);
    event Judged(uint256 indexed bountyId);
    event RevealBundlePublished(uint256 indexed bountyId);

    modifier onlyOwner(uint256 bountyId) {
        if (msg.sender != bounties[bountyId].owner) revert NotOwner();
        _;
    }

    function createBounty(
        string calldata title,
        string calldata rubric,
        uint256 submissionDeadline,
        uint256 revealDeadline
    ) external payable returns (uint256 id) {
        id = nextBountyId++;

        Bounty storage b = bounties[id];
        b.owner = msg.sender;
        b.title = title;
        b.rubric = rubric;
        b.reward = msg.value;
        b.submissionDeadline = submissionDeadline;
        b.revealDeadline = revealDeadline;

        emit BountyCreated(id);
    }

    /// REQUIRED TRACK
    function submitCommitment(
        uint256 bountyId,
        bytes32 commitment
    ) external {
        Bounty storage b = bounties[bountyId];

        b.submissions.push();
        uint256 idx = b.submissions.length - 1;

        b.submissions[idx].submitter = msg.sender;
        b.submissions[idx].commitment = commitment;

        hasCommitted[bountyId][msg.sender] = true;
        submissionIndex[bountyId][msg.sender] = idx;

        emit CommitmentSubmitted(bountyId, msg.sender);
    }

    /// ADVANCED TRACK
    /// encryptedAnswerRef => IPFS/Arweave reference
    /// answerHash => commitment to plaintext answer
    function submitEncryptedAnswer(
        uint256 bountyId,
        bytes32 answerHash,
        string calldata encryptedAnswerRef
    ) external {
        Bounty storage b = bounties[bountyId];

        b.submissions.push();
        uint256 idx = b.submissions.length - 1;

        b.submissions[idx].submitter = msg.sender;
        b.submissions[idx].answerHash = answerHash;
        b.submissions[idx].encryptedAnswerRef = encryptedAnswerRef;

        emit PrivateSubmissionStored(bountyId, msg.sender);
    }

    function revealAnswer(
        uint256 bountyId,
        string calldata answer,
        bytes32 salt
    ) external {
        Submission storage s =
            bounties[bountyId].submissions[submissionIndex[bountyId][msg.sender]];

        bytes32 expected =
            keccak256(abi.encodePacked(answer, salt, msg.sender, bountyId));

        require(expected == s.commitment, "bad reveal");

        s.answer = answer;
        s.revealed = true;
        s.eligible = true;

        bounties[bountyId].revealedSubmissionCount++;

        emit AnswerRevealed(bountyId, msg.sender);
    }

    function judgeAll(
        uint256 bountyId,
        bytes calldata llmInput
    ) external onlyOwner(bountyId) {
        bytes memory output =
            _executePrecompile(LLM_INFERENCE_PRECOMPILE, llmInput);

        (
            bool hasError,
            bytes memory completionData,
            ,
            string memory errorMessage,

        ) = abi.decode(
                output,
                (bool, bytes, bytes, string, ConvoHistory)
            );

        require(!hasError, errorMessage);

        bounties[bountyId].judged = true;
        bounties[bountyId].aiReview = completionData;

        emit Judged(bountyId);
    }

    /// ADVANCED TRACK
    /// Called after TEE decrypts submissions,
    /// evaluates them together and publishes bundle.
    function publishRevealBundle(
        uint256 bountyId,
        string calldata revealedAnswersRef,
        bytes32 revealedAnswersHash
    ) external onlyOwner(bountyId) {
        Bounty storage b = bounties[bountyId];

        b.revealedAnswersRef = revealedAnswersRef;
        b.revealedAnswersHash = revealedAnswersHash;

        emit RevealBundlePublished(bountyId);
    }

    function finalizeWinner(
        uint256 bountyId,
        uint256 winnerIndex
    ) external onlyOwner(bountyId) {
        Bounty storage b = bounties[bountyId];

        address winner =
            b.submissions[winnerIndex].submitter;

        uint256 reward = b.reward;
        b.reward = 0;

        (bool ok,) = payable(winner).call{value: reward}("");
        require(ok);

        b.finalized = true;
        b.winnerIndex = winnerIndex;
    }
}
