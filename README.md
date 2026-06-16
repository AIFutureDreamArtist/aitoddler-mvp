# Aitoddler MVP

A working local MVP for a Karpathy-style autoresearch harness that grows from curiosity into stewardship.

## What it does

- Chat panel for discussing the current harness state.
- Experiment lab that runs bounded simulated autoresearch experiments.
- Stewardship evaluation across task success, safety, human agency, learning value, reversibility, simplicity, and future harm reduction.
- Skill library where strong experiments are promoted into reusable skills.
- Tool registry with safe OS/terminal action wrappers.
- Memory timeline with episode, lesson, and lineage entries.
- Optional local model integration through a llama.cpp/OpenAI-compatible endpoint.

## Start

```bash
npm run dev
```

Open the UI at:

```text
http://127.0.0.1:8787
```

The API also runs at:

```text
http://127.0.0.1:8787
```

## Optional llama.cpp connection

Start your local model server:

```bash
llama-server -m /path/to/qwen2.5-coder-7b-instruct-q4_k_m.gguf --port 8080 -c 4096
```

Then run:

```bash
LLAMA_BASE_URL=http://127.0.0.1:8080/v1 LLAMA_MODEL=qwen2.5-coder npm run dev
```

No npm package installation is required. The MVP uses only built-in Node.js modules.

## Design principle

The MVP does not let the AI freely rewrite the machine. It uses an action layer:

```text
intent -> policy -> allowlist -> execute -> verify -> memory -> skill
```

That keeps the system useful, inspectable, and reversible.

## Maturity Ladder

```text
Baby       = reacts
Toddler    = explores
Child      = learns patterns
Teen       = challenges boundaries
Adult      = acts responsibly
Wise Adult = sees long-term consequences
Steward    = improves conditions for growth
```

## Keep Rule

Keep an experiment only when:

- total score improves,
- safety does not regress,
- human agency is preserved,
- the change is explainable,
- the result can become a reusable skill or lesson.

## Tool Rule

Terminal and OS actions are never raw freedom. They are wrapped actions with:
- intent,
- risk level,
- allowlist,
- execution boundary,
- output capture,
- rollback note,
- memory entry.
