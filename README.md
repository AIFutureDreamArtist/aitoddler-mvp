# PilotDirector

**PilotDirector** is your safe, local-first personal AI agent platform.

It combines the best of:
- **Google Antigravity** — agent-first orchestration and parallel task thinking
- **Lovable** — vibe coding and app/component generation
- **Hermes / OpenClaw** — self-evolving personal agent with persistent memory & skills

...but with **strong stewardship, human oversight, and reversibility** built in from day one.

## Core Promise

You give high-level goals → PilotDirector plans, breaks it down, executes safely through tools, and learns. 
Everything stays local. Risky actions are always proposed first for your approval.

## Current Status (v0.2.0 - jarvis-dashboard branch)

**PilotDirector is ready to use.**

### What works now:
- Beautiful **PilotDirector tab** as main command center
- High-level goal input with 4 focus modes (UI/App, Code, Research, Automation)
- Automatic planning via the steward experiment system
- New safe AI tools: `generate_component` and `create_project_plan`
- Full Memory, Skills promotion, Action logging
- Approval gates for any high-risk actions
- Persistent tasks tracking (tasks.json)
- Works completely locally (optional local LLM support)

## Quick Start

```bash
git clone https://github.com/AIFutureDreamArtist/aitoddler-mvp.git
cd aitoddler-mvp
git checkout jarvis-dashboard
npm run dev
```

Open **http://127.0.0.1:8787** — the **PilotDirector** tab is the main interface.

## How to use

1. Ga naar de **PilotDirector** tab
2. Typ een hoog-niveau doel (bijv. "Bouw een moderne portfolio website met dark mode en contact form")
3. Kies de juiste mode (UI, Code, Research of Automation)
4. Klik **Launch Pilot**
5. PilotDirector plant het, gebruikt tools, en houdt je op de hoogte via chat + logs
6. Bij riskante acties krijg je een duidelijke approval prompt

## Architecture & Safety

```
User Goal
   ↓
PilotDirector Planner (Chat + Scored Experiments)
   ↓
Task Decomposition
   ↓
Tool Selection (allowlist only)
   ↓
Safety Check + Human Approval Gate (if needed)
   ↓
Execute → Capture result
   ↓
Memory update + Skill promotion (if valuable & safe)
   ↓
Continuous improvement
```

PilotDirector never has raw access to your system. Everything goes through the proven steward layer.

## Next logical improvements (easy to add)
- Real background task queue + multi-agent
- Safe file read/write with diff preview
- Full project scaffolding
- Proactive suggestions from memory

## Philosophy

PilotDirector is not just another AI tool.
It is **your personal director** that helps you build, research and automate — while you stay firmly in the pilot seat.

Local. Safe. Self-improving. Under your control.