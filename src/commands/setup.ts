import fs from "node:fs/promises";
import JSON5 from "json5";
import { DEFAULT_AGENT_WORKSPACE_DIR, ensureAgentWorkspace } from "../agents/workspace.js";
import { type OpenClawConfig, createConfigIO, writeConfigFile } from "../config/config.js";
import { formatConfigPath, logConfigUpdated } from "../config/logging.js";
import { resolveSessionTranscriptsDir } from "../config/sessions.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";

async function readConfigFileRaw(configPath: string): Promise<{
  exists: boolean;
  parsed: OpenClawConfig;
}> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON5.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { exists: true, parsed: parsed as OpenClawConfig };
    }
    return { exists: true, parsed: {} };
  } catch {
    return { exists: false, parsed: {} };
  }
}

export async function setupCommand(
  opts?: { workspace?: string },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const desiredWorkspace =
    typeof opts?.workspace === "string" && opts.workspace.trim()
      ? opts.workspace.trim()
      : undefined;

  const io = createConfigIO();
  const configPath = io.configPath;
  const existingRaw = await readConfigFileRaw(configPath);
  const cfg = existingRaw.parsed;
  const defaults = cfg.agents?.defaults ?? {};

  const workspace = desiredWorkspace ?? defaults.workspace ?? DEFAULT_AGENT_WORKSPACE_DIR;

  const next: OpenClawConfig = {
    ...cfg,
    gateway: {
      ...cfg.gateway,
      mode: cfg.gateway?.mode ?? "local",
      bind: cfg.gateway?.bind ?? "loopback",
      reload: cfg.gateway?.reload ?? { mode: "hybrid", debounceMs: 300 },
    },
    agents: {
      ...cfg.agents,
      defaults: {
        ...defaults,
        workspace,
      },
    },
  };

  const gatewayChanged =
    !existingRaw.exists ||
    cfg.gateway?.mode !== next.gateway?.mode ||
    cfg.gateway?.bind !== next.gateway?.bind;

  if (!existingRaw.exists || defaults.workspace !== workspace || gatewayChanged) {
    await writeConfigFile(next);
    if (!existingRaw.exists) {
      runtime.log(
        `Wrote ${formatConfigPath(configPath)} (gateway.mode=local, workspace, sessions)`,
      );
    } else {
      const parts = [];
      if (defaults.workspace !== workspace) {
        parts.push("agents.defaults.workspace");
      }
      if (gatewayChanged) {
        parts.push("gateway");
      }
      logConfigUpdated(runtime, {
        path: configPath,
        suffix: parts.length ? `(${parts.join(", ")})` : undefined,
      });
    }
  } else {
    runtime.log(`Config OK: ${formatConfigPath(configPath)}`);
  }

  const ws = await ensureAgentWorkspace({
    dir: workspace,
    ensureBootstrapFiles: !next.agents?.defaults?.skipBootstrap,
  });
  runtime.log(`Workspace OK: ${shortenHomePath(ws.dir)}`);

  const sessionsDir = resolveSessionTranscriptsDir();
  await fs.mkdir(sessionsDir, { recursive: true });
  runtime.log(`Sessions OK: ${shortenHomePath(sessionsDir)}`);
}
