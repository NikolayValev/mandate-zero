# Agent Loop

This folder enables continuous autonomous quality improvement for Mandate Zero.

## What it does

- Runs a command pipeline (`loop.config.json`) as an iteration.
- Stores outcomes in `memory.json`.
- Produces timestamped markdown reports in `reports/`.
- Maps failures to reusable skills from `skills/*.json`.
- Learns from previous iterations by prioritizing commands linked to recent failures.

## Usage

Run one iteration:

```bash
npm run agent:loop
```

Run continuously (every 30 minutes):

```bash
npm run agent:loop:continuous
```

Include E2E checks in the loop:

```bash
AGENT_RUN_E2E=1 npm run agent:loop
```

PowerShell:

```powershell
$env:AGENT_RUN_E2E="1"; npm run agent:loop
```

## Files

- `loop.config.json`: command and timeout configuration.
- `memory.json`: persisted run history and skill focus.
- `skills/*.json`: failure triggers and playbooks.
- `reports/*.md`: per-iteration outputs.
