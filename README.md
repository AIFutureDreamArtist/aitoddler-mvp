# PilotDirector v0.4.0 — Advanced Local AI Agent

**PilotDirector** is a safe, local-first personal AI agent platform combining the best of Antigravity, Lovable, and Hermes — with strong stewardship and human control.

## Latest Features (v0.4.0)

- **Betere Multi-File Scaffolding**: PilotDirector kan meerdere bestanden tegelijk plannen en als proposals aanbieden
- **Approval Queue met Diff**: Duidelijke preview voordat bestanden worden geschreven
- **Multi-Task / Multi-Agent**: Meerdere actieve taken tegelijk
- **File Tools**: `read_file` + `propose_file_write` met approval
- **Optionele Lokale LLM**: Volledige ondersteuning voor llama.cpp / Ollama

## Lokale LLM Integratie (llama.cpp / Ollama) — Aanbevolen

PilotDirector werkt al met een lokale LLM voor betere antwoorden en planning.

### Stap 1: Start llama.cpp server
```bash
llama-server -m /pad/naar/model.gguf --port 8080 -c 4096 --host 127.0.0.1
```

### Stap 2: Start PilotDirector met LLM
```bash
LLAMA_BASE_URL=http://127.0.0.1:8080/v1 LLAMA_MODEL=jouw-model npm run dev
```

Daarna gebruikt PilotDirector automatisch de lokale LLM voor planning en replies.

Zonder LLM gebruikt hij de ingebouwde steward fallback (nog steeds krachtig).

## Quick Start (zonder LLM)
```bash
git clone https://github.com/AIFutureDreamArtist/aitoddler-mvp.git
cd aitoddler-mvp
git checkout jarvis-dashboard
npm run dev
```

Open http://127.0.0.1:8787 → **PilotDirector** tab.

## Volledige Project Scaffolding Voorbeeld

1. Typ een ambitieus doel (bijv. "Bouw een volledige moderne SaaS app met landing + dashboard")
2. Kies **UI + Scaffolding**
3. Launch
4. PilotDirector genereert meerdere file proposals
5. Keur goed in de Approval Queue

Alles blijft veilig en onder jouw controle.