import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AIJudgeCommitRevealModule", (m) => {
  const AiJudgeCommitReveal = m.contract("AIJudgeCommitReveal");

  return { AiJudgeCommitReveal };
});
