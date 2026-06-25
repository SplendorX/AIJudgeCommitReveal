## Starter for Ritual workshop on 23th June 2026

/hardhat -> Where we'll write the smart contract

/web -> Where the frontend lives.

# AIJudge Commit-Reveal Bounty Lifecycle

AIJudge uses a commit-reveal mechanism to prevent answer copying and ensure fair evaluation by AI.

## 1. Create a Bounty

A bounty creator deploys a challenge by calling:

```solidity
createBounty(
    string title,
    string rubric,
    uint256 submissionDeadline,
    uint256 revealDeadline
)
```

The creator must attach RITUAL as the reward.

Requirements:

* Reward must be greater than zero.
* Submission deadline must be in the future.
* Reveal deadline must be after the submission deadline.

The contract creates a new bounty and escrows the reward until completion.

---

## 2. Commit Phase

Participants submit a commitment hash instead of revealing their answer.

```solidity
submitCommitment(
    uint256 bountyId,
    bytes32 commitment
)
```

The commitment is generated as:

```solidity
keccak256(
    abi.encodePacked(
        answer,
        salt,
        submitter,
        bountyId
    )
)
```

This allows participants to prove ownership of an answer later without exposing it during the submission period.

Rules:

* One submission per address.
* Maximum 10 submissions per bounty.
* Submissions close at `submissionDeadline`.

---

## 3. Reveal Phase

After submissions close, participants reveal their answer and salt.

```solidity
revealAnswer(
    uint256 bountyId,
    string answer,
    bytes32 salt
)
```

The contract recomputes the commitment and verifies it matches the original submission.

If valid:

* The answer becomes visible.
* The submission becomes eligible for judging.
* The revealed submission count increases.

Rules:

* Reveals can only occur between `submissionDeadline` and `revealDeadline`.
* Maximum answer length is 3000 characters.
* Each answer can only be revealed once.

---

## 4. AI Judging

After the reveal phase ends, the bounty owner can trigger AI evaluation.

```solidity
judgeAll(
    uint256 bountyId,
    bytes llmInput
)
```

The contract calls Ritual's LLM inference precompile and stores the AI review output on-chain.

Requirements:

* Reveal phase must be finished.
* At least one answer must have been revealed.
* The bounty must not already be judged.

The AI review is emitted through:

```solidity
AllAnswersJudged
```

and stored in:

```solidity
bounty.aiReview
```

---

## 5. Winner Selection

Once AI judging is complete, the bounty owner selects a winner.

```solidity
finalizeWinner(
    uint256 bountyId,
    uint256 winnerIndex
)
```

Requirements:

* Bounty has been judged.
* Submission index exists.
* Submission was successfully revealed.

The reward is transferred directly to the winner and the bounty is finalized.

Event emitted:

```solidity
WinnerFinalized
```

---

## 6. Reward Reclaim (No Reveals)

If nobody reveals an answer before the reveal deadline, the bounty owner can reclaim the reward.

```solidity
reclaimReward(
    uint256 bountyId
)
```

Requirements:

* Reveal deadline has passed.
* No valid reveals exist.
* Bounty has not already been finalized.

The escrowed reward is returned to the bounty owner.

---

## Security Model

The protocol uses a commit-reveal scheme to prevent plagiarism and answer sniping:

1. Users commit only a hash during submission.
2. Answers remain private until the reveal phase.
3. Only correctly revealed answers become eligible for AI evaluation.
4. Rewards remain escrowed in the contract until finalization.

This ensures fair competition while allowing decentralized AI-assisted judging.
