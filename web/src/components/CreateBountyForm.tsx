"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseEther, parseEventLogs } from "viem";
import { contractAddress, isContractConfigured } from "@/config/contract";
import { ritualChain } from "@/config/wagmi";
import aiJudgeAbi from "@/abi/AIJudgeCommitReveal";
import { useNow } from "@/hooks/useNow";
import { useWriteTx } from "@/hooks/useWriteTx";
import {
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Textarea,
  Button,
  TxStatus,
  Notice,
} from "@/components/ui";

const explorerBase = ritualChain.blockExplorers?.default.url;
const CREATE_BOUNTY_GAS_LIMIT = 1_000_000n;
const MAX_RUBRIC_LENGTH = 2000;
const MIN_SUBMISSION_LEAD_MS = 30 * 1000;
const DEFAULT_SUBMISSION_OFFSET_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REVEAL_OFFSET_MS = 48 * 60 * 60 * 1000;

function formatDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSubmissionDeadline(): string {
  return formatDatetimeLocal(Date.now() + DEFAULT_SUBMISSION_OFFSET_MS);
}

function defaultRevealDeadline(): string {
  return formatDatetimeLocal(Date.now() + DEFAULT_REVEAL_OFFSET_MS);
}

export function CreateBountyForm({
  onCreated,
}: {
  onCreated?: (bountyId: bigint) => void;
}) {
  const { isConnected } = useAccount();
  const now = useNow();

  const [title, setTitle] = useState("");
  const [rubric, setRubric] = useState("");

  const [submissionDeadline, setSubmissionDeadline] = useState(
    defaultSubmissionDeadline()
  );

  const [revealDeadline, setRevealDeadline] = useState(
    defaultRevealDeadline()
  );

  const [reward, setReward] = useState("");
  const [createdId, setCreatedId] = useState<bigint | null>(null);
  const minSubmissionInput = now
    ? formatDatetimeLocal(now + MIN_SUBMISSION_LEAD_MS)
    : undefined;

  const tx = useWriteTx((receipt) => {
    try {
      const logs = parseEventLogs({
        abi: aiJudgeAbi,
        eventName: "BountyCreated",
        logs: receipt.logs,
      });

      const id = logs[0]?.args?.bountyId;

      if (id !== undefined) {
        setCreatedId(id);
        onCreated?.(id);
      }
    } catch {
      // ignore decode failures
    }
  });

  const validation = useMemo(() => {
    if (!title.trim()) return "Title is required.";
    if (!rubric.trim()) return "Rubric is required.";

    const submissionMs = new Date(submissionDeadline).getTime();
    const revealMs = new Date(revealDeadline).getTime();

    if (!Number.isFinite(submissionMs))
      return "Invalid submission deadline.";

    if (!Number.isFinite(revealMs))
      return "Invalid reveal deadline.";

    if (now && submissionMs <= now) {
      return "Submission deadline must be in the future.";
    }

    if (revealMs <= submissionMs)
      return "Reveal deadline must be after submission deadline.";

    if (rubric.trim().length > MAX_RUBRIC_LENGTH) {
      return `Rubric must be ${MAX_RUBRIC_LENGTH} characters or less.`;
    }

    if (!reward.trim()) return "Reward is required.";

    try {
      if (parseEther(reward.trim()) <= 0n) {
        return "Reward must be greater than 0.";
      }
    } catch {
      return "Reward must be a valid number.";
    }

    return null;
  }, [title, rubric, submissionDeadline, revealDeadline, reward, now]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (validation || !contractAddress) return;

    const submissionMs = new Date(submissionDeadline).getTime();
    const revealMs = new Date(revealDeadline).getTime();

    if (submissionMs <= Date.now()) {
      window.alert("Submission deadline must be in the future.");
      return;
    }

    if (revealMs <= submissionMs) {
      window.alert(
        "Reveal deadline must be later than submission deadline."
      );
      return;
    }

    const submissionDeadlineTs = BigInt(
      Math.floor(submissionMs / 1000)
    );

    const revealDeadlineTs = BigInt(
      Math.floor(revealMs / 1000)
    );

    const value = parseEther(reward.trim());

    setCreatedId(null);

    console.log("Creating bounty", {
      title,
      rubric,
      submissionDeadlineTs,
      revealDeadlineTs,
      reward,
    });

    try {
      await tx.run({
        address: contractAddress,
        abi: aiJudgeAbi,
        functionName: "createBounty",
        args: [
          title.trim(),
          rubric.trim(),
          submissionDeadlineTs,
          revealDeadlineTs,
        ],
        value,
        chainId: ritualChain.id,
        gas: CREATE_BOUNTY_GAS_LIMIT,
      });
    } catch {
      // handled by tx state
    }
  }

  return (
    <Card>
      <CardHeader
        title="Create a bounty"
        subtitle="Create a private AI-judged commit-reveal bounty."
      />

      <CardBody>
        {!isContractConfigured && (
          <Notice tone="amber">
            Set{" "}
            <code className="font-mono">
              NEXT_PUBLIC_CONTRACT_ADDRESS
            </code>{" "}
            in your{" "}
            <code className="font-mono">
              .env.local
            </code>{" "}
            file.
          </Notice>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-3"
        >
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Best AI security audit"
              maxLength={200}
            />
          </Field>

          <Field
            label="Rubric"
            hint="AI will evaluate revealed answers using this rubric."
          >
            <Textarea
              value={rubric}
              onChange={(e) =>
                setRubric(e.target.value)
              }
              rows={4}
              maxLength={MAX_RUBRIC_LENGTH}
              placeholder="Correctness 50%, clarity 30%, originality 20%"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Submission Deadline">
              <Input
                type="datetime-local"
                min={minSubmissionInput}
                value={submissionDeadline}
                onChange={(e) =>
                  setSubmissionDeadline(
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Reveal Deadline">
              <Input
                type="datetime-local"
                min={submissionDeadline}
                value={revealDeadline}
                onChange={(e) =>
                  setRevealDeadline(
                    e.target.value
                  )
                }
              />
            </Field>
          </div>

          <Field
            label="Reward (RITUAL)"
            hint="Locked in the contract."
          >
            <Input
              type="number"
              min="0.000000000000000001"
              step="any"
              value={reward}
              onChange={(e) =>
                setReward(e.target.value)
              }
              placeholder="1.0"
            />
          </Field>

          {validation && (
            <p className="text-xs text-amber-300">
              {validation}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              !isConnected ||
              !isContractConfigured ||
              !!validation ||
              tx.isBusy
            }
            className="w-full"
          >
            {tx.isBusy
              ? "Creating..."
              : "Create Bounty"}
          </Button>

          {!isConnected && (
            <p className="text-xs text-zinc-500">
              Connect your wallet to create a bounty.
            </p>
          )}

          <TxStatus
            state={tx.state}
            error={tx.error}
            hash={tx.hash}
            explorerBase={explorerBase}
          />

          {createdId !== null && (
            <Notice tone="green">
              Bounty created successfully.
              <br />
              ID:{" "}
              <span className="font-mono font-semibold">
                #{createdId.toString()}
              </span>
            </Notice>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
