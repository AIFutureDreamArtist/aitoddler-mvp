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

  const templates = [
    { label: "Portfolio", prompt: "Bouw een moderne portfolio website met dark mode, hero, projecten overzicht, skills en contact formulier" },
    { label: "SaaS Landing", prompt: "Bouw een professionele SaaS landingspagina met hero, features, pricing tiers en CTA" },
    { label: "Todo App", prompt: "Bouw een werkende todo app met lokale opslag, voorbeeld data, add/delete, dark mode en filters" },
    { label: "Dashboard", prompt: "Bouw een simpel admin dashboard met sidebar, stats kaarten en een data tabel" }
  ];

  return `
    <div>
      <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem">
        <div>
          <h1 style="margin:0; font-size:2.2rem">PilotDirector</h1>
          <p style="margin:0.3rem 0 0; color:#666; font-size:1.05rem">Slimme scaffolding • Templates • Visuele diffs • Voice • Undo</p>
        </div>
        <div style="margin-left:auto">
          <div class="status-pill" style="background:#e6f4ed; border-color:#0b7a53">
            <span class="status-dot" style="background:#0b7a53"></span>
            <strong style="color:#0b7a53">Steward Active</strong>
          </div>
        </div>
      </div>

      <!-- Templates -->
      <div style="margin-bottom:1rem">
        <div style="font-size:0.85rem; color:#666; margin-bottom:0.4rem; font-weight:600">Snelle Templates</div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
          ${templates.map(t => `<button data-template="${t.prompt}" style="background:#f4f7f1; border:1px solid #d9e2d6; padding:0.45rem 0.9rem; border-radius:999px; font-size:0.85rem; cursor:pointer">${t.label}</button>`).join('')}
        </div>
      </div>

      <!-- Launch Panel -->
      <div class="control-panel" style="margin-bottom:1.5rem; border:2px solid #0b7a53">
        <h2 style="margin-top:0; color:#0b7a53">🚀 Geavanceerde Project Scaffolding</h2>
        <div style="position:relative">
          <textarea id="pilot-goal" placeholder="Bouw een minimale maar functionele demo met voorbeeld data..." style="min-height:100px; padding-right:55px"></textarea>
          <button id="voice-btn" style="position:absolute; top:12px; right:12px; background:#f4f7f1; border:1px solid #d9e2d6; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:1.1rem">🎤</button>
        </div>

        <div class="segmented" id="pilot-focus" style="margin:0.8rem 0">
          <button class="selected" data-focus="ui">UI + Functionele Demo</button>
          <button data-focus="code">Full Code Project</button>
          <button data-focus="research">Research Project</button>
        </div>

        <button id="pilot-launch" class="primary" style="width:100%; padding:1rem; font-size:1.1rem; background:#0b7a53">
          Launch Slimme Demo
        </button>
        <div style="margin-top:0.5rem; font-size:0.8rem; color:#666; text-align:center">
          Genereert automatisch meerdere bestanden + proposals met diff
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem">
        <div class="wide-panel">
          <div class="section-title"><h2>Actieve Agenten / Taken</h2><span>${activeTasks.length}</span></div>
          ${activeTasks.length ? activeTasks.map(t => `
            <div class="row" style="padding:0.9rem; border-left:5px solid #0b7a53">
              <strong>${escapeHtml(t.goal)}</strong>
              <div style="font-size:0.8rem; color:#666; margin-top:0.3rem">${t.focus || 'ui'} • ${t.status}</div>
            </div>
          `).join('') : '<div class="empty">Geen actieve agents</div>'}
        </div>

        <div class="wide-panel">
          <div class="section-title"><h2>Approval Queue (Visuele Diff)</h2><span>${pending.length}</span></div>
          ${pending.length ? pending.map(p => `
            <div style="padding:1rem; background:white; border:1px solid #d9e2d6; border-radius:8px; margin-bottom:0.8rem">
              <div style="font-weight:700; margin-bottom:0.4rem">${escapeHtml(p.path)}</div>
              <pre style="background:#f8faf7; padding:0.6rem; border-radius:6px; font-family:monospace; font-size:0.75rem; max-height:110px; overflow:auto">${escapeHtml(p.diff || '')}</pre>
              <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
                <button data-approve="${p.id}" style="flex:1; background:#0b7a53; color:white; border:0; padding:0.5rem; border-radius:6px">Approve</button>
                <button data-rollback="${p.id}" style="background:#b94040; color:white; border:0; padding:0.5rem 1rem; border-radius:6px">Rollback</button>
              </div>
            </div>
          `).join('') : '<div class="empty">Geen openstaande wijzigingen</div>'}
        </div>
      </div>

      <div class="wide-panel" style="margin-bottom:1.5rem">
        <div class="section-title"><h2>Undo Geschiedenis (Recente Acties)</h2></div>
        <div class="empty">Undo functionaliteit actief via Rollback</div>
      </div>

      <div class="wide-panel">
        <div class="section-title"><h2>Recente Activiteit</h2></div>
        ${state.messages && state.messages.length ? state.messages.slice(-5).reverse().map(m => `
          <div style="padding:0.8rem; margin-bottom:0.5rem; background:${m.role==='user' ? '#161815' : '#f8faf7'}; color:${m.role==='user' ? 'white' : '#161815'}; border-radius:8px; font-size:0.9rem">
            ${escapeHtml(m.content.substring(0, 200))}
          </div>
        `).join('') : '<div class="empty">Nog geen activiteit</div>'}
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
  // Templates
  document.querySelectorAll("[data-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.querySelector("#pilot-goal");
      if (input) input.value = btn.dataset.template;
    });
  });

  // Voice
  const voiceBtn = document.querySelector("#voice-btn");
  if (voiceBtn) {
    if (!recognition) recognition = setupVoiceInput();
    voiceBtn.addEventListener("click", () => {
      if (!recognition) { alert("Voice input niet ondersteund (gebruik Chrome/Edge)"); return; }
      voiceBtn.textContent = "🎙️ Luistert...";
      recognition.start();
    });
  }

  const pilotBtn = document.querySelector("#pilot-launch");
  if (pilotBtn) {
    pilotBtn.addEventListener("click", async () => {
      const goal = document.querySelector("#pilot-goal")?.value.trim();
      if (!goal) return alert("Geef een doel");

      const focus = document.querySelector("#pilot-focus .selected")?.dataset.focus || "ui";
      pilotBtn.textContent = "Genereert project...";
      pilotBtn.disabled = true;

      // Sterke scaffolding prompt
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `PilotDirector, voer GEAVANCEERDE multi-file scaffolding uit voor: ${goal}. 
Genereer een volledige minimale maar functionele app structuur met package.json (indien nodig), meerdere componenten/bestanden, voorbeeld data en een logische bestandsstructuur.
Maak concrete file proposals met diff voor elk bestand.
Vraag expliciet om approval voordat je schrijft.
Maak het project direct werkbaar.` 
        })
      });

      // Trigger experiment voor betere planning
      await fetch("/api/experiments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hypothesis: `Advanced multi-file project scaffolding with example data and working structure: ${goal}`, 
          focus: "stewardship" 
        })
      });

      await refresh();
      pilotBtn.textContent = "Launch Slimme Demo";
      pilotBtn.disabled = false;
    });
  }

  // Approve
  document.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Writing...";
      await fetch("/api/proposals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: btn.dataset.approve })
      });
      await refresh();
    });
  });

  // Rollback
  document.querySelectorAll("[data-rollback]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Rolling back...";
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
