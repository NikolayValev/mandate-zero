#!/usr/bin/env node

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const agentDir = path.join(rootDir, "agent");
const reportsDir = path.join(agentDir, "reports");
const skillsDir = path.join(agentDir, "skills");
const configPath = path.join(agentDir, "loop.config.json");
const memoryPath = path.join(agentDir, "memory.json");

function parseArgs(argv) {
  const args = {
    continuous: false,
    intervalMinutes: 30,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--continuous") {
      args.continuous = true;
      continue;
    }

    if (current === "--interval-minutes") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--interval-minutes must be a positive number.");
      }
      args.intervalMinutes = value;
      index += 1;
      continue;
    }
  }

  return args;
}

function toBool(value, defaultValue = false) {
  if (value == null) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content.replace(/^\uFEFF/, ""));
  } catch {
    return fallbackValue;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCommands(config) {
  const commands = safeArray(config?.commands)
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      if (typeof entry.id !== "string" || typeof entry.run !== "string") {
        return null;
      }

      return {
        id: entry.id,
        run: entry.run,
        envFlag: typeof entry.envFlag === "string" ? entry.envFlag : null,
        defaultEnabled: Boolean(entry.defaultEnabled),
      };
    })
    .filter((entry) => entry !== null);

  if (!commands.length) {
    throw new Error("No valid commands found in agent/loop.config.json");
  }

  return commands;
}

function commandEnabled(command) {
  if (!command.envFlag) {
    return true;
  }

  return toBool(process.env[command.envFlag], command.defaultEnabled);
}

function reorderCommands(commands, memory, skills) {
  const lastRun = safeArray(memory?.runs).at(-1) ?? null;
  const previouslyFailed = new Set(
    safeArray(lastRun?.commands)
      .filter((entry) => entry?.status === "failed")
      .map((entry) => entry.id),
  );

  const focusedCommands = new Set(safeArray(memory?.activeFocusCommands));
  const skillIndex = new Map(skills.map((skill) => [skill.id, skill]));

  for (const skillId of safeArray(memory?.activeFocusSkills)) {
    const skill = skillIndex.get(skillId);
    if (!skill?.triggers?.commands) {
      continue;
    }

    for (const commandId of safeArray(skill.triggers.commands)) {
      focusedCommands.add(commandId);
    }
  }

  const scored = commands.map((command, index) => {
    let score = 0;

    if (focusedCommands.has(command.id)) {
      score += 2;
    }

    if (previouslyFailed.has(command.id)) {
      score += 1;
    }

    return {
      command,
      score,
      index,
    };
  });

  return scored
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.command);
}

function truncateOutput(text, maxChars = 5000) {
  if (!text || text.length <= maxChars) {
    return text || "";
  }

  return `...\n${text.slice(-maxChars)}`;
}

function firstMeaningfulLine(text) {
  const line = String(text || "")
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.length > 0);

  return line ?? "No output captured.";
}

async function executeCommand(command, timeoutMs) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(command, {
      cwd: rootDir,
      env: process.env,
      shell: true,
    });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeoutHandle);
      resolve({
        status: "failed",
        exitCode: -1,
        durationMs: Date.now() - startedAt,
        output: truncateOutput(`${stdout}\n${stderr}\n${error.message}`.trim()),
        summary: error.message,
      });
    });

    child.on("close", (exitCode) => {
      clearTimeout(timeoutHandle);
      const mergedOutput = `${stdout}\n${stderr}`.trim();
      const failed = timedOut || exitCode !== 0;

      resolve({
        status: failed ? "failed" : "passed",
        exitCode: exitCode ?? -1,
        durationMs: Date.now() - startedAt,
        output: truncateOutput(mergedOutput),
        summary: timedOut ? `Timed out after ${timeoutMs} ms` : firstMeaningfulLine(mergedOutput),
      });
    });
  });
}

async function loadSkills() {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skillFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(skillsDir, entry.name));

  const skills = [];

  for (const skillPath of skillFiles) {
    try {
      const parsed = JSON.parse((await fs.readFile(skillPath, "utf8")).replace(/^\uFEFF/, ""));
      if (!parsed?.id || !parsed?.title) {
        continue;
      }
      skills.push(parsed);
    } catch {
      // Ignore malformed skill files so one bad file does not block the loop.
    }
  }

  return skills;
}

function matchSkills(failedCommands, skills) {
  const matched = new Map();

  for (const command of failedCommands) {
    const combinedOutput = `${command.summary || ""}\n${command.output || ""}`;

    for (const skill of skills) {
      const triggerCommands = new Set(safeArray(skill?.triggers?.commands));
      const triggerPatterns = safeArray(skill?.triggers?.patterns);

      let hit = false;

      if (triggerCommands.has(command.id)) {
        hit = true;
      }

      if (!hit && triggerPatterns.length) {
        hit = triggerPatterns.some((pattern) => {
          try {
            const regex = new RegExp(pattern, "i");
            return regex.test(combinedOutput);
          } catch {
            return false;
          }
        });
      }

      if (!hit) {
        continue;
      }

      const existing = matched.get(skill.id) ?? { skill, hits: 0, triggeredBy: new Set() };
      existing.hits += 1;
      existing.triggeredBy.add(command.id);
      matched.set(skill.id, existing);
    }
  }

  return Array.from(matched.values()).map((entry) => ({
    id: entry.skill.id,
    title: entry.skill.title,
    playbook: safeArray(entry.skill.playbook),
    hits: entry.hits,
    triggeredBy: Array.from(entry.triggeredBy),
  }));
}

function compareWithPreviousRun(currentResults, previousRun) {
  const previousByCommand = new Map(
    safeArray(previousRun?.commands).map((command) => [command.id, command.status]),
  );

  const regressions = [];
  const improvements = [];
  const recurringFailures = [];

  for (const result of currentResults) {
    const previousStatus = previousByCommand.get(result.id);
    if (!previousStatus) {
      continue;
    }

    if (previousStatus === "passed" && result.status === "failed") {
      regressions.push(result.id);
      continue;
    }

    if (previousStatus === "failed" && result.status === "passed") {
      improvements.push(result.id);
      continue;
    }

    if (previousStatus === "failed" && result.status === "failed") {
      recurringFailures.push(result.id);
    }
  }

  return { regressions, improvements, recurringFailures };
}

function updateSkillStats(previousStats, matchedSkills, finishedAt) {
  const nextStats = { ...(previousStats || {}) };
  const matchedIds = new Set(matchedSkills.map((skill) => skill.id));

  for (const [skillId, stat] of Object.entries(nextStats)) {
    if (matchedIds.has(skillId)) {
      continue;
    }

    nextStats[skillId] = {
      ...stat,
      streak: 0,
    };
  }

  for (const matchedSkill of matchedSkills) {
    const previous = nextStats[matchedSkill.id] ?? {
      hits: 0,
      streak: 0,
      lastSeenAt: null,
    };

    nextStats[matchedSkill.id] = {
      hits: Number(previous.hits || 0) + matchedSkill.hits,
      streak: Number(previous.streak || 0) + 1,
      lastSeenAt: finishedAt,
    };
  }

  const activeFocusSkills = Object.entries(nextStats)
    .filter((entry) => Number(entry[1]?.streak || 0) > 0)
    .sort((left, right) => {
      const streakDelta = Number(right[1].streak || 0) - Number(left[1].streak || 0);
      if (streakDelta !== 0) {
        return streakDelta;
      }

      return Number(right[1].hits || 0) - Number(left[1].hits || 0);
    })
    .slice(0, 3)
    .map(([skillId]) => skillId);

  return {
    nextStats,
    activeFocusSkills,
  };
}

function buildReport({
  runId,
  startedAt,
  finishedAt,
  overallStatus,
  commandResults,
  regressions,
  improvements,
  recurringFailures,
  matchedSkills,
  activeFocusCommands,
  activeFocusSkills,
}) {
  const lines = [];

  lines.push("# Agent Iteration Report");
  lines.push("");
  lines.push(`- Run ID: ${runId}`);
  lines.push(`- Started: ${startedAt}`);
  lines.push(`- Finished: ${finishedAt}`);
  lines.push(`- Overall Status: ${overallStatus.toUpperCase()}`);
  lines.push("");

  lines.push("## Command Results");
  lines.push("");
  lines.push("| Command | Status | Duration (ms) | Summary |");
  lines.push("| --- | --- | ---: | --- |");

  for (const result of commandResults) {
    lines.push(`| ${result.id} | ${result.status} | ${result.durationMs} | ${result.summary.replace(/\|/g, "\\|")} |`);
  }

  lines.push("");
  lines.push("## Learning Delta");
  lines.push("");

  lines.push("### Improvements");
  if (improvements.length) {
    for (const commandId of improvements) {
      lines.push(`- ${commandId}`);
    }
  } else {
    lines.push("- None");
  }

  lines.push("");
  lines.push("### Regressions");
  if (regressions.length) {
    for (const commandId of regressions) {
      lines.push(`- ${commandId}`);
    }
  } else {
    lines.push("- None");
  }

  lines.push("");
  lines.push("### Recurring Failures");
  if (recurringFailures.length) {
    for (const commandId of recurringFailures) {
      lines.push(`- ${commandId}`);
    }
  } else {
    lines.push("- None");
  }

  lines.push("");
  lines.push("## Activated Skills");
  lines.push("");

  if (matchedSkills.length) {
    for (const skill of matchedSkills) {
      lines.push(`### ${skill.title} (${skill.id})`);
      lines.push(`- Triggered by: ${skill.triggeredBy.join(", ")}`);
      for (const step of skill.playbook) {
        lines.push(`- ${step}`);
      }
      lines.push("");
    }
  } else {
    lines.push("- None");
    lines.push("");
  }

  lines.push("## Focus For Next Iteration");
  lines.push("");
  lines.push(`- Commands: ${activeFocusCommands.length ? activeFocusCommands.join(", ") : "none"}`);
  lines.push(`- Skills: ${activeFocusSkills.length ? activeFocusSkills.join(", ") : "none"}`);
  lines.push("");

  lines.push("## Failure Output Tail");
  lines.push("");

  const failedCommands = commandResults.filter((result) => result.status === "failed");
  if (!failedCommands.length) {
    lines.push("- None");
  } else {
    for (const failed of failedCommands) {
      lines.push(`### ${failed.id}`);
      lines.push("```");
      lines.push((failed.output || "No output captured.").slice(0, 5000));
      lines.push("```");
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function createRunId(timestamp) {
  return `run-${timestamp.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runIteration() {
  await fs.mkdir(reportsDir, { recursive: true });

  const config = await readJsonFile(configPath, null);
  if (!config) {
    throw new Error("agent/loop.config.json is missing or invalid.");
  }

  const memory = await readJsonFile(memoryPath, {
    version: 1,
    updatedAt: null,
    activeFocusSkills: [],
    activeFocusCommands: [],
    skillStats: {},
    runs: [],
  });

  const skills = await loadSkills();
  const baseCommands = normalizeCommands(config).filter((command) => commandEnabled(command));
  if (!baseCommands.length) {
    throw new Error("No enabled commands found for this run. Check env flags in agent/loop.config.json.");
  }

  const commands = reorderCommands(baseCommands, memory, skills);
  const commandTimeoutMs = Number(config.commandTimeoutMs) > 0 ? Number(config.commandTimeoutMs) : 300000;

  const startedAtDate = new Date();
  const runId = createRunId(startedAtDate.toISOString());

  const commandResults = [];

  for (const command of commands) {
    console.log(`[agent-loop] Running ${command.id}: ${command.run}`);
    const result = await executeCommand(command.run, commandTimeoutMs);
    commandResults.push({
      id: command.id,
      command: command.run,
      status: result.status,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      summary: result.summary,
      output: result.output,
    });
  }

  const failedCommands = commandResults.filter((command) => command.status === "failed");
  const overallStatus = failedCommands.length ? "failed" : "passed";

  const previousRun = safeArray(memory.runs).at(-1) ?? null;
  const { regressions, improvements, recurringFailures } = compareWithPreviousRun(commandResults, previousRun);

  const matchedSkills = matchSkills(failedCommands, skills);

  const finishedAtDate = new Date();
  const { nextStats, activeFocusSkills } = updateSkillStats(
    memory.skillStats,
    matchedSkills,
    finishedAtDate.toISOString(),
  );

  const activeFocusCommands = Array.from(
    new Set([...regressions, ...recurringFailures, ...failedCommands.map((command) => command.id)]),
  ).slice(0, 5);

  const reportContent = buildReport({
    runId,
    startedAt: startedAtDate.toISOString(),
    finishedAt: finishedAtDate.toISOString(),
    overallStatus,
    commandResults,
    regressions,
    improvements,
    recurringFailures,
    matchedSkills,
    activeFocusCommands,
    activeFocusSkills,
  });

  const reportPath = path.join(reportsDir, `${runId}.md`);
  await fs.writeFile(reportPath, reportContent, "utf8");

  const historyLimit = Number(config.historyLimit) > 0 ? Number(config.historyLimit) : 40;

  const nextRunSummary = {
    runId,
    startedAt: startedAtDate.toISOString(),
    finishedAt: finishedAtDate.toISOString(),
    overallStatus,
    regressions,
    improvements,
    recurringFailures,
    matchedSkills: matchedSkills.map((skill) => ({
      id: skill.id,
      title: skill.title,
      hits: skill.hits,
      triggeredBy: skill.triggeredBy,
    })),
    commands: commandResults.map((command) => ({
      id: command.id,
      status: command.status,
      durationMs: command.durationMs,
      summary: command.summary,
      exitCode: command.exitCode,
    })),
    reportPath: path.relative(rootDir, reportPath).replace(/\\/g, "/"),
  };

  const nextRuns = [...safeArray(memory.runs), nextRunSummary].slice(-historyLimit);

  const nextMemory = {
    version: 1,
    updatedAt: finishedAtDate.toISOString(),
    activeFocusSkills,
    activeFocusCommands,
    skillStats: nextStats,
    runs: nextRuns,
  };

  await writeJsonFile(memoryPath, nextMemory);

  console.log(`[agent-loop] Run ${runId} finished with status: ${overallStatus.toUpperCase()}`);
  console.log(`[agent-loop] Report: ${path.relative(rootDir, reportPath).replace(/\\/g, "/")}`);

  return {
    runId,
    overallStatus,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  while (true) {
    try {
      const result = await runIteration();
      if (!args.continuous) {
        process.exitCode = result.overallStatus === "passed" ? 0 : 1;
        return;
      }
    } catch (error) {
      console.error(`[agent-loop] ${error instanceof Error ? error.message : String(error)}`);
      if (!args.continuous) {
        process.exitCode = 1;
        return;
      }
    }

    const delayMs = Math.round(args.intervalMinutes * 60_000);
    console.log(`[agent-loop] Sleeping for ${args.intervalMinutes} minute(s) before next iteration.`);
    await sleep(delayMs);
  }
}

await main();
