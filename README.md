# PilotDirector

**PilotDirector** is your safe, local-first personal AI agent platform.

It combines the best of:
- **Google Antigravity** — agent-first orchestration, parallel tasks, browser-like execution
- **Lovable** — vibe coding and full app/component generation
- **Hermes / OpenClaw** — self-evolving personal agent with persistent memory and skills

...but with **strong stewardship, human oversight, and reversibility** at its core (inspired by Aitoddler principles).

## Core Promise

You give high-level goals → PilotDirector plans, decomposes, executes safely, and learns.
Everything runs locally. Risky actions are proposed first and require your explicit approval. Nothing happens without your control.

## Key Features

### Agent-First Dashboard
- Central command center (like Antigravity Agent Manager)
- High-level goal input with focus modes (Code, UI/App, Research, Automation)
- Live task overview and history

### Safe Multi-Step Execution
- Natural language → structured plan (via bounded experiments)
- Tool use through strict allowlist + policy layer
- Approval gates for any medium/high risk action
- Full audit log + memory inheritance

### Self-Evolving Intelligence
- Successful patterns are promoted to reusable **Skills**
- Memory timeline (episodes, lessons, lineage)
- Continuous improvement through scored experiments

### Built-in Safety (non-negotiable)
- Human agency always preserved
- Reversibility preferred
- No unbounded autonomy
- All actions logged and explainable

## Quick Start

```bash
git clone https://github.com/AIFutureDreamArtist/aitoddler-mvp.git
cd aitoddler-mvp
git checkout jarvis-dashboard   # or main for stable
npm run dev
```

Open **http://127.0.0.1:8787**

The **PilotDirector** tab is now the main interface.

## How to Use (PilotDirector Tab)

1. Type a high-level goal (e.g. "Build a beautiful SaaS landing page with hero, features, pricing and contact form")
2. Choose focus: Code / UI / Research / Automation
3. Click "Launch Pilot"
4. Watch PilotDirector plan + execute step-by-step
5. Approve or modify any risky actions in the log

## Architecture

```
User Goal
   ↓
PilotDirector Planner (Chat + Experiment scoring)
   ↓
Task Decomposition + Tool Selection
   ↓
Safety Check + Approval Gate (if needed)
   ↓
Execute (allowlisted tools only)
   ↓
Capture result → Memory + Skill promotion
   ↓
Feedback loop
```

## Current Status (v0.2.0 on jarvis-dashboard branch)

- Full working dashboard with PilotDirector tab
- Integrated chat + experiment engine
- Safe tool execution layer
- Memory, Skills, and Action logging
- Basic multi-focus agent behavior

## Roadmap (next priorities)
- Real task queue + background agent worker
- Safe file system tools (read/write with diff preview + approval)
- UI/Component generator (Lovable-style)
- Project scaffolding (full app generation)
- Multi-agent orchestration (parallel pilots)
- Proactive suggestions from memory
- Optional local LLM integration (llama.cpp / Ollama)

## Philosophy

PilotDirector is not just another AI coding tool.
It is a **personal director** that helps you build and research — while always keeping you in the pilot seat.

Built with care for safety, agency, and long-term capability growth.