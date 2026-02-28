import fs from "node:fs";
import path from "node:path";
import type { NormalizedUsage } from "../agents/usage.js";

export type UsageByModeSidecarLine = {
  agentMode: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  timestamp: number;
};

function getSidecarPath(sessionFile: string): string {
  const dir = path.dirname(sessionFile);
  const base = path.basename(sessionFile, ".jsonl");
  return path.join(dir, `${base}.usage-mode.jsonl`);
}

/**
 * Append one run's usage to the session's usage-by-mode sidecar.
 * Call this after each agent run so usage is tagged with the agent mode at consumption time.
 */
export function appendUsageByMode(params: {
  sessionFile: string;
  agentMode: "full" | "minimal" | "none" | undefined | null;
  usage: NormalizedUsage;
  totalCost?: number;
  timestamp?: number;
}): void {
  const usage = params.usage;
  const input = usage.input ?? 0;
  const output = usage.output ?? 0;
  const cacheRead = usage.cacheRead ?? 0;
  const cacheWrite = usage.cacheWrite ?? 0;
  const totalTokens = usage.total ?? input + output + cacheRead + cacheWrite;
  if (totalTokens <= 0 && input === 0 && output === 0) {
    return;
  }
  const agentMode = params.agentMode ?? "inherit";
  const line: UsageByModeSidecarLine = {
    agentMode,
    input,
    output,
    cacheRead,
    cacheWrite,
    totalTokens,
    totalCost: params.totalCost ?? 0,
    timestamp: params.timestamp ?? Date.now(),
  };
  const sidecarPath = getSidecarPath(params.sessionFile);
  const lineStr = JSON.stringify(line) + "\n";
  try {
    fs.appendFileSync(sidecarPath, lineStr, "utf-8");
  } catch {
    // Best effort; avoid failing the run if sidecar write fails
  }
}

export { getSidecarPath };
