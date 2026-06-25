// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrecompileConsumer} from "./utils/PrecompileConsumer.sol";

contract AIJudgeCommitReveal is PrecompileConsumer {
    uint256 public constant MAX_SUBMISSIONS = 10;
    uint256 public constant MAX_ANSWER_LENGTH = 3000;

    uint256 public nextBountyId = 1;

    error NotBountyOwner();
    error BountyNotFound();
    error SubmissionClosed();
    error RevealNotStarted();
    error RevealEnded();
    error AlreadySubmitted();
    error AlreadyRevealed();
    error InvalidReveal();
    error AlreadyJudged();
    error AlreadyFinalized();
    error NoCommitment();
    error NoRevealedSubmissions();
    error InvalidWinner();
    error PaymentFailed();
    error AnswerTooLong();
    error TooManySubmissions();

    struct Submission {
        address submitter;
        bytes32 commitment;
        bool revealed;
        bool eligible;
        string answer;
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
        bytes aiReview;
        uint256 winnerIndex;
        uint256 revealedSubmissionCount;
        Submission[] submissions;
    }

    struct ConvoHistory {
        string storageType;
        string path;
        string secretsName;
    }

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(address => bool)) public hasCommitted;
    mapping(uint256 => mapping(address => uint256)) private submissionIndex;

    modifier bountyExists(uint256 bountyId) {
        if (bounties[bountyId].owner == address(0)) revert BountyNotFound();
        _;
    }

    modifier onlyOwner(uint256 bountyId) {
        if (msg.sender != bounties[bountyId].owner) revert NotBountyOwner();
        _;
    }

    event BountyCreated(uint256 indexed bountyId, address indexed owner);
    event CommitmentSubmitted(uint256 indexed bountyId, address indexed submitter, bytes32 commitment);
    event AnswerRevealed(uint256 indexed bountyId, address indexed submitter);
    event AllAnswersJudged(uint256 indexed bountyId, bytes aiReview);
    event WinnerFinalized(uint256 indexed bountyId, uint256 indexed winnerIndex, address indexed winner, uint256 reward);

    function createBounty(
        string calldata title,
        string calldata rubric,
        uint256 submissionDeadline,
        uint256 revealDeadline
    ) external payable returns (uint256 bountyId) {
        require(msg.value > 0, "reward required");
        require(submissionDeadline > block.timestamp, "bad submission deadline");
        require(revealDeadline > submissionDeadline, "bad reveal deadline");

        bountyId = nextBountyId++;
        Bounty storage b = bounties[bountyId];
        b.owner = msg.sender;
        b.title = title;
        b.rubric = rubric;
        b.reward = msg.value;
        b.submissionDeadline = submissionDeadline;
        b.revealDeadline = revealDeadline;
        b.winnerIndex = type(uint256).max;

        emit BountyCreated(bountyId, msg.sender);
    }

    function submitCommitment(uint256 bountyId, bytes32 commitment)
        external
        bountyExists(bountyId)
    {
        Bounty storage b = bounties[bountyId];

        if (block.timestamp >= b.submissionDeadline) revert SubmissionClosed();
        if (b.judged) revert AlreadyJudged();
        if (b.finalized) revert AlreadyFinalized();
        if (b.submissions.length >= MAX_SUBMISSIONS) revert TooManySubmissions();
        if (hasCommitted[bountyId][msg.sender]) revert AlreadySubmitted();

        b.submissions.push(
            Submission(msg.sender, commitment, false, false, "")
        );

        hasCommitted[bountyId][msg.sender] = true;
        submissionIndex[bountyId][msg.sender] = b.submissions.length - 1;

        emit CommitmentSubmitted(bountyId, msg.sender, commitment);
    }

    function revealAnswer(
        uint256 bountyId,
        string calldata answer,
        bytes32 salt
    ) external bountyExists(bountyId) {
        Bounty storage b = bounties[bountyId];

        if (block.timestamp < b.submissionDeadline) revert RevealNotStarted();
        if (block.timestamp >= b.revealDeadline) revert RevealEnded();
        if (!hasCommitted[bountyId][msg.sender]) revert NoCommitment();
        if (bytes(answer).length > MAX_ANSWER_LENGTH) revert AnswerTooLong();

        Submission storage s = b.submissions[submissionIndex[bountyId][msg.sender]];

        if (s.revealed) revert AlreadyRevealed();

        bytes32 expected = keccak256(
            abi.encodePacked(answer, salt, msg.sender, bountyId)
        );

        if (expected != s.commitment) revert InvalidReveal();

        s.answer = answer;
        s.revealed = true;
        s.eligible = true;

        b.revealedSubmissionCount++;

        emit AnswerRevealed(bountyId, msg.sender);
    }

    function judgeAll(uint256 bountyId, bytes calldata llmInput)
        external
        bountyExists(bountyId)
        onlyOwner(bountyId)
    {
        Bounty storage b = bounties[bountyId];

        if (block.timestamp <= b.revealDeadline) revert RevealEnded();
        if (b.judged) revert AlreadyJudged();
        if (b.finalized) revert AlreadyFinalized();
        if (b.revealedSubmissionCount == 0) revert NoRevealedSubmissions();

        bytes memory output = _executePrecompile(
            LLM_INFERENCE_PRECOMPILE,
            llmInput
        );

        (
            bool hasError,
            bytes memory completionData,
            ,
            string memory errorMessage,

        ) = abi.decode(output, (bool, bytes, bytes, string, ConvoHistory));

        require(!hasError, errorMessage);

        b.judged = true;
        b.aiReview = completionData;

        emit AllAnswersJudged(bountyId, completionData);
    }

    function finalizeWinner(uint256 bountyId, uint256 winnerIndex)
        external
        bountyExists(bountyId)
        onlyOwner(bountyId)
    {
        Bounty storage b = bounties[bountyId];

        if (!b.judged) revert AlreadyJudged();
        if (b.finalized) revert AlreadyFinalized();
        if (winnerIndex >= b.submissions.length) revert InvalidWinner();

        Submission storage s = b.submissions[winnerIndex];
        if (!s.eligible) revert InvalidWinner();

        b.finalized = true;
        b.winnerIndex = winnerIndex;

        uint256 reward = b.reward;
        b.reward = 0;

        (bool ok,) = payable(s.submitter).call{value: reward}("");
        if (!ok) revert PaymentFailed();

        emit WinnerFinalized(bountyId, winnerIndex, s.submitter, reward);
    }

    function reclaimReward(uint256 bountyId)
        external
        bountyExists(bountyId)
        onlyOwner(bountyId)
    {
        Bounty storage b = bounties[bountyId];

        require(block.timestamp > b.revealDeadline, "too early");
        require(b.revealedSubmissionCount == 0, "reveals exist");
        require(!b.finalized, "finalized");

        b.finalized = true;

        uint256 reward = b.reward;
        b.reward = 0;

        (bool ok,) = payable(b.owner).call{value: reward}("");
        if (!ok) revert PaymentFailed();
    }

    function computeCommitment(
        string calldata answer,
        bytes32 salt,
        uint256 bountyId,
        address submitter
    ) external pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(answer, salt, submitter, bountyId)
        );
    }
}
