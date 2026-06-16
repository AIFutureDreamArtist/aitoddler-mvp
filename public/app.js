const navItems = [
  ["pilot", "PilotDirector"],
  ["dashboard", "Overview"],
  ["chat", "Chat"],
  ["experiments", "Experiments"],
  ["skills", "Skills"],
  ["tools", "Tools"],
  ["memory", "Memory"]
];

let active = "pilot";
let state = null;
let recognition = null;

async function refresh() {
  try {
    state = await fetch("/api/state").then(res => res.json());
  } catch (e) {
    console.error("Failed to refresh state:", e);
    state = { summary: {}, tasks: [], proposals: [], actions: [], messages: [] };
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
  button.addEventListener("click", () => { active = id; render(); });
  nav.appendChild(button);
});

await refresh();

function render() {
  if (!state) {
    view.innerHTML = `<div class="empty">Loading...</div>`;
    return;
  }
  document.querySelector("#stage").textContent = state.summary?.maturity || "Starting";
  document.querySelector("#model").textContent = state.summary?.llamaEnabled ? state.summary.model : "local fallback";
  nav.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.id === active));
  const views = { pilot: pilotDirectorView, dashboard: dashboardView, chat: chatView, experiments: experimentsView, skills: skillsView, tools: toolsView, memory: memoryView };
  view.innerHTML = views[active]();
  bindViewEvents();
}

function pilotDirectorView() {
  const tasks = state.tasks || [];
  const activeTasks = tasks.filter(t => !['completed','cancelled'].includes(t.status));
  const proposals = state.proposals || [];
  const pending = proposals.filter(p => p.status === 'pending');
  const recent = state.messages?.slice(-6).reverse() || [];
  const recentActions = state.actions?.slice(0, 5) || [];

  const templates = [
    { label: "Portfolio", prompt: "Bouw een moderne portfolio website met dark mode, hero, projecten, skills en contact form" },
    { label: "SaaS Landing", prompt: "Bouw een professionele SaaS landingspagina met hero, features, pricing en CTA" },
    { label: "Todo App", prompt: "Bouw een werkende todo app met lokale opslag, voorbeeld data en dark mode" },
    { label: "Dashboard", prompt: "Bouw een simpel admin dashboard met sidebar, stats en voorbeeld data" }
  ];

  return `
    <div>
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <div>
          <h1 style="margin:0;font-size:2.5rem">PilotDirector</h1>
          <p style="margin:0.3rem 0 0;color:var(--muted)">Slimme scaffolding • Templates • Visuele diffs • Voice • Undo</p>
        </div>
        <div style="margin-left:auto">
          <div class="status-pill" style="background:#e6f4ed;border-color:#0b7a53">
            <span class="status-dot" style="background:#0b7a53"></span>
            <strong style="color:#0b7a53">Steward Active</strong>
          </div>
        </div>
      </div>

      <div style="margin-bottom:1rem">
        <div style="font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;font-weight:600">Snelle Templates</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          ${templates.map(t => `<button data-template="${t.prompt}" style="background:#f4f7f1;border:1px solid #d9e2d6;padding:0.45rem 0.9rem;border-radius:999px;font-size:0.85rem;cursor:pointer">${t.label}</button>`).join('')}
        </div>
      </div>

      <div class="control-panel" style="margin-bottom:1.5rem;border:2px solid #0b7a53">
        <h2 style="margin-top:0;color:#0b7a53">🚀 Geavanceerde Project Scaffolding</h2>
        <div style="position:relative">
          <textarea id="pilot-goal" placeholder="Bouw een minimale maar écht functionele demo met voorbeeld data" style="min-height:100px;padding-right:55px"></textarea>
          <button id="voice-btn" style="position:absolute;top:12px;right:12px;background:#f4f7f1;border:1px solid #d9e2d6;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:1.1rem">🎤</button>
        </div>

        <div class="segmented" id="pilot-focus" style="margin:0.8rem 0">
          <button class="selected" data-focus="ui">UI + Functionele Demo</button>
          <button data-focus="code">Full Code Project</button>
          <button data-focus="research">Research Project</button>
        </div>

        <button id="pilot-launch" class="primary" style="width:100%;padding:1rem;font-size:1.1rem;background:#0b7a53">
          Launch Minimale Werkende Demo
        </button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div class="wide-panel">
          <div class="section-title"><h2>Actieve Agenten / Taken</h2><span>${activeTasks.length}</span></div>
          ${activeTasks.length ? activeTasks.map(t => `<div class="row" style="padding:0.9rem;border-left:5px solid #0b7a53"><strong>${escapeHtml(t.goal)}</strong><div style="font-size:0.8rem;color:var(--muted);margin-top:0.3rem">${t.focus} • ${t.status}</div></div>`).join('') : '<div class="empty">Geen actieve agents</div>'}
        </div>

        <div class="wide-panel">
          <div class="section-title"><h2>Approval Queue (Visuele Diff)</h2><span>${pending.length}</span></div>
          ${pending.length ? pending.map(p => {
            const diffHtml = (p.diff || '').split('\n').map(line => {
              if (line.startsWith('+')) return `<div style="color:#0b7a53;background:#e6f4ed">${escapeHtml(line)}</div>`;
              if (line.startsWith('-')) return `<div style="color:#b94040;background:#f9e3e3">${escapeHtml(line)}</div>`;
              return `<div style="color:#555">${escapeHtml(line)}</div>`;
            }).join('');
            return `
              <div style="padding:1rem;background:white;border:1px solid #d9e2d6;border-radius:8px;margin-bottom:0.8rem">
                <div style="font-weight:700;margin-bottom:0.4rem">${escapeHtml(p.path)}</div>
                <div style="background:#f8faf7;padding:0.6rem;border-radius:6px;font-family:monospace;font-size:0.75rem;max-height:140px;overflow:auto;line-height:1.4">${diffHtml}</div>
                <div style="display:flex;gap:0.5rem;margin-top:0.6rem">
                  <button data-approve="${p.id}" style="flex:1;background:#0b7a53;color:white;border:0;padding:0.5rem;border-radius:6px">Approve</button>
                  <button data-rollback="${p.id}" style="background:#b94040;color:white;border:0;padding:0.5rem 1rem;border-radius:6px">Rollback</button>
                </div>
              </div>`;
          }).join('') : '<div class="empty">Geen openstaande wijzigingen</div>'}
        </div>
      </div>

      <div class="wide-panel" style="margin-bottom:1.5rem">
        <div class="section-title"><h2>Undo Geschiedenis (Recente Acties)</h2><span>${recentActions.length}</span></div>
        ${recentActions.length ? recentActions.map(a => `
          <div class="row" style="padding:0.7rem 1rem;align-items:center">
            <div style="flex:1">
              <strong>${escapeHtml(a.toolName || 'Action')}</strong>
              <div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem">${escapeHtml(a.policy || '')}</div>
            </div>
            <button data-undo-action="${a.id}" style="background:#f4f7f1;border:1px solid #d9e2d6;padding:0.4rem 0.9rem;border-radius:6px;font-size:0.85rem">Undo</button>
          </div>
        `).join('') : '<div class="empty">Geen recente acties</div>'}
      </div>

      <div class="wide-panel">
        <div class="section-title"><h2>Recente Activiteit</h2></div>
        ${recent.map(m => `<div style="padding:0.8rem;margin-bottom:0.5rem;background:${m.role==='user'?'#161815':'#f8faf7'};color:${m.role==='user'?'white':'#161815'};border-radius:8px">${escapeHtml(m.content.substring(0,180))}</div>`).join('')}
      </div>
    </div>
  `;
}

function bindViewEvents() {
  document.querySelectorAll("[data-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.querySelector("#pilot-goal");
      if (input) input.value = btn.dataset.template;
    });
  });

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
      const goal = document.querySelector("#pilot-goal").value.trim();
      if (!goal) return alert("Geef een doel");
      const focus = document.querySelector("#pilot-focus .selected")?.dataset.focus || "ui";

      pilotBtn.textContent = "Genereert minimale functionele demo...";
      pilotBtn.disabled = true;

      await fetch("/api/tasks/create", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({goal, focus}) });

      await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message: `PilotDirector, voer GEAVANCEERDE multi-file scaffolding uit voor: ${goal}. Genereer een MINIMALE maar ÉCHT FUNCTIONELE demo met package.json, meerdere componenten, voorbeeld data en een structuur die direct werkt.` })
      });

      await fetch("/api/experiments/run", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ hypothesis: `Minimal functional working demo: ${goal}`, focus:"stewardship" }) });

      await refresh();
      pilotBtn.textContent = "Launch Slimme Werkende Demo";
      pilotBtn.disabled = false;
    });
  }

  document.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Writing...";
      await fetch("/api/proposals/approve", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({proposalId: btn.dataset.approve}) });
      await refresh();
    });
  });

  document.querySelectorAll("[data-rollback]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Rolling back...";
      await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: `Maak een rollback proposal voor de vorige write.` }) });
      await refresh();
    });
  });

  document.querySelectorAll("[data-undo-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Undoing...";
      await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: `Maak een rollback proposal voor de vorige actie.` }) });
      await refresh();
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&','<':'<','>':'>','"':'"','\'':'&#039;'}[m]));
}
