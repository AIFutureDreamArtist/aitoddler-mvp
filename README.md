# Aitoddler MVP → Jarvis Steward Platform

**Aitoddler** is evolving into your personal **Jarvis Steward** — a safe, local-first AI agent platform that runs in the background and helps you get things done like Cursor, Lovable, Copilot, research agents, and automation tools — but with strong stewardship, human oversight, and reversible actions.

## Core Philosophy (unchanged)
- Bounded experiments
- Safety + human agency first
- Skills are promoted only when they improve both capability *and* stewardship
- All terminal/OS actions go through policy + allowlist + logging

## New Jarvis Features (in development on `jarvis-dashboard` branch)
- **Jarvis Dashboard**: Central command center
- **Personal Agent**: Natural language → task decomposition → safe execution
- **Background Platform**: Always-on server with task queue
- **Multi-tool Agent**: Code editing (Cursor-like), UI building (Lovable-like), research, automation
- **Approval Gates**: High-risk actions require your explicit approval
- **Memory & Skills Inheritance**: Jarvis learns and reuses patterns safely

## Quick Start (same as before)
```bash
git checkout jarvis-dashboard
npm run dev
```

Open http://127.0.0.1:8787

The dashboard now includes a dedicated **Jarvis** tab where you can give high-level goals and watch the agent work (with safety rails).

## Roadmap
- [x] Base steward harness (experiments, skills, tools, memory)
- [ ] Jarvis task planner + executor
- [ ] Enhanced dashboard with live task view
- [ ] Safe code/file tools
- [ ] Integration hooks for Cursor/Lovable-style workflows
- [ ] Voice + proactive suggestions

This keeps everything local-first and under your control.