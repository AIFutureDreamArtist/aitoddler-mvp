const navItems = [
  ["pilotdirector", "PilotDirector"],
  ["dashboard", "Overview"],
  ["chat", "Chat"],
  ["experiments", "Experiments"],
  ["skills", "Skills"],
  ["tools", "Tools"],
  ["memory", "Memory"]
];

let active = "pilotdirector";
let state = null;
let recognition = null;

async function refresh() {
  try {
    state = await fetch("/api/state").then(res => res.json());
  } catch (e) {
    console.error("Failed to refresh state:", e);
    state = { summary: { maturity: "Toddler" }, tasks: [], proposals: [], actions: [], messages: [] };
  }
  render();
}

function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'nl-NL';
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.querySelector("#pilot-goal");
    if (input) input.value = input.value ? input.value + " " + transcript : transcript;
  };
  recognition.onend = () => { const btn = document.querySelector("#voice-btn"); if (btn) btn.textContent = "🎤"; };
  return recognition;
}

const view = document.querySelector("#view");
const nav = document.querySelector("#nav");

navItems.forEach(([id, label]) => {
  const button = document.createElement("button");
  button.textContent = label;
  button.dataset.id = id;
  button.addEventListener("click", () => {
    active = id;
    render();
  });
  nav.appendChild(button);
});

await refresh();

function render() {
  if (!state) {
    view.innerHTML = `<div class="empty">Loading PilotDirector...</div>`;
    return;
  }

  const stageEl = document.querySelector("#stage");
  const modelEl = document.querySelector("#model");
  if (stageEl) stageEl.textContent = state.summary?.maturity || "Toddler";
  if (modelEl) modelEl.textContent = state.summary?.llamaEnabled ? (state.summary.model || "local") : "local fallback";

  nav.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.id === active));

  let html = "";
  if (active === "pilotdirector") {
    html = pilotDirectorView();
  } else if (active === "dashboard") {
    html = typeof dashboardView === "function" ? dashboardView() : `<div class="empty">Dashboard view tijdelijk beperkt.</div>`;
  } else if (active === "chat") {
    html = typeof chatView === "function" ? chatView() : `<div class="empty">Chat view tijdelijk beperkt.</div>`;
  } else {
    html = pilotDirectorView();
  }

  view.innerHTML = html;
  bindViewEvents();
}

function pilotDirectorView() {
  const tasks = state.tasks || [];
  const activeTasks = tasks.filter(t => !['completed','cancelled'].includes(t.status));
  const proposals = state.proposals || [];
  const pending = proposals.filter(p => p.status === 'pending');

  return `
    <div>
      <h1 style="margin-bottom:1rem">PilotDirector</h1>
      <div class="control-panel">
        <textarea id="pilot-goal" placeholder="Bouw een minimale maar functionele demo met voorbeeld data..." style="min-height:90px"></textarea>
        <button id="pilot-launch" class="primary" style="width:100%; margin-top:0.8rem">Launch Slimme Demo</button>
      </div>

      <div class="wide-panel" style="margin-top:1.5rem">
        <div class="section-title"><h2>Approval Queue (met Visuele Diff + Rollback)</h2></div>
        ${pending.length ? pending.map(p => `
          <div style="padding:1rem;background:white;border:1px solid #d9e2d6;border-radius:8px;margin-bottom:0.8rem">
            <div style="font-weight:700;margin-bottom:0.4rem">${escapeHtml(p.path)}</div>
            <pre style="background:#f8faf7;padding:0.6rem;border-radius:6px;font-family:monospace;font-size:0.75rem;max-height:120px;overflow:auto">${escapeHtml(p.diff || '')}</pre>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
              <button data-approve="${p.id}" style="flex:1;background:#0b7a53;color:white;border:0;padding:0.5rem;border-radius:6px">Approve & Write</button>
              <button data-rollback="${p.id}" style="background:#b94040;color:white;border:0;padding:0.5rem 1rem;border-radius:6px">Rollback</button>
            </div>
          </div>
        `).join('') : '<p style="color:#666">Geen openstaande file wijzigingen.</p>'}
      </div>
    </div>
  `;
}

function dashboardView() {
  return `<div class="empty">Dashboard view (tijdelijk beperkt in deze versie)</div>`;
}

function chatView() {
  return `<div class="empty">Chat view (tijdelijk beperkt in deze versie)</div>`;
}

function bindViewEvents() {
  const pilotBtn = document.querySelector("#pilot-launch");
  if (pilotBtn) {
    pilotBtn.addEventListener("click", async () => {
      const goal = document.querySelector("#pilot-goal")?.value.trim();
      if (!goal) return;
      pilotBtn.textContent = "Bezig...";
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `PilotDirector, voer dit uit: ${goal}` })
      });
      await refresh();
      pilotBtn.textContent = "Launch Slimme Demo";
    });
  }

  document.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await fetch("/api/proposals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: btn.dataset.approve })
      });
      await refresh();
    });
  });

  document.querySelectorAll("[data-rollback]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Maak een rollback proposal voor de vorige write." })
      });
      await refresh();
    });
  });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, m => ({'&':'&','<':'<','>':'>','"':'"','\'':'&#039;'}[m]));
}
