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
  recognition.onend = () => {
    const btn = document.querySelector("#voice-btn");
    if (btn) btn.textContent = "🎤";
  };
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
  document.querySelector("#stage").textContent = state.summary.maturity;
  document.querySelector("#model").textContent = state.summary.llamaEnabled ? state.summary.model : "local fallback";
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
  const recent = state.messages.slice(-5).reverse();

  return `
    <div>
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <div>
          <h1 style="margin:0;font-size:2.5rem">PilotDirector</h1>
          <p style="margin:0.3rem 0 0;color:var(--muted)">Geavanceerde scaffolding • Voice • Rollback</p>
        </div>
        <div style="margin-left:auto">
          <div class="status-pill" style="background:#e6f4ed;border-color:#0b7a53">
            <span class="status-dot" style="background:#0b7a53"></span>
            <strong style="color:#0b7a53">Steward Active</strong>
          </div>
        </div>
      </div>

      <!-- Advanced Scaffolding Launcher -->
      <div class="control-panel" style="margin-bottom:1.5rem;border:2px solid #0b7a53">
        <h2 style="margin-top:0;color:#0b7a53">🚀 Geavanceerde Project Scaffolding</h2>
        <div style="position:relative">
          <textarea id="pilot-goal" placeholder="Bouw een volledige moderne SaaS app met package.json, meerdere componenten, landing + dashboard" style="min-height:100px;padding-right:55px"></textarea>
          <button id="voice-btn" style="position:absolute;top:12px;right:12px;background:#f4f7f1;border:1px solid #d9e2d6;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:1.1rem">🎤</button>
        </div>

        <div class="segmented" id="pilot-focus" style="margin:0.8rem 0">
          <button class="selected" data-focus="ui">UI + Advanced Scaffolding</button>
          <button data-focus="code">Full Code Project</button>
          <button data-focus="research">Research Project</button>
        </div>

        <button id="pilot-launch" class="primary" style="width:100%; padding:1rem; font-size:1.1rem; background:#0b7a53">
          Launch Geavanceerde Scaffolding (package.json + componenten)
        </button>
        <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--muted); text-align:center">
          Genereert automatisch package.json + meerdere componenten + proposals
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem">
        <div class="wide-panel">
          <div class="section-title"><h2>Actieve Agenten / Taken</h2><span>${activeTasks.length}</span></div>
          ${activeTasks.length ? activeTasks.map(t => `<div class="row" style="padding:0.9rem;border-left:5px solid #0b7a53"><strong>${escapeHtml(t.goal)}</strong><div style="font-size:0.8rem;color:var(--muted);margin-top:0.3rem">${t.focus} • ${t.status}</div></div>`).join('') : '<div class="empty">Geen actieve agents</div>'}
        </div>

        <div class="wide-panel">
          <div class="section-title"><h2>Approval Queue + Rollback</h2><span>${pending.length}</span></div>
          ${pending.length ? pending.map(p => `
            <div style="padding:1rem;background:white;border:1px solid #d9e2d6;border-radius:8px;margin-bottom:0.8rem">
              <div style="font-weight:700;margin-bottom:0.4rem">${escapeHtml(p.path)}</div>
              <pre style="background:#f4f7f1;padding:0.7rem;border-radius:6px;font-size:0.75rem;max-height:100px;overflow:auto">${escapeHtml(p.diff || '')}</pre>
              <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
                <button data-approve="${p.id}" style="flex:1;background:#0b7a53;color:white;border:0;padding:0.5rem;border-radius:6px">Approve & Write</button>
                <button data-rollback="${p.id}" style="background:#b94040;color:white;border:0;padding:0.5rem 1rem;border-radius:6px">Rollback</button>
              </div>
            </div>
          `).join('') : '<div class="empty">Geen openstaande wijzigingen</div>'}
        </div>
      </div>

      <div class="wide-panel">
        <div class="section-title"><h2>Recente Activiteit</h2></div>
        ${recent.map(m => `<div style="padding:0.8rem;margin-bottom:0.5rem;background:${m.role==='user'?'#161815':'#f8faf7'};color:${m.role==='user'?'white':'#161815'};border-radius:8px">${escapeHtml(m.content.substring(0,180))}</div>`).join('')}
      </div>
    </div>
  `;
}

function bindViewEvents() {
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

  // Launch with advanced scaffolding prompt
  const pilotBtn = document.querySelector("#pilot-launch");
  if (pilotBtn) {
    pilotBtn.addEventListener("click", async () => {
      const goal = document.querySelector("#pilot-goal").value.trim();
      if (!goal) return alert("Geef een doel");
      const focus = document.querySelector("#pilot-focus .selected")?.dataset.focus || "ui";

      pilotBtn.textContent = "Genereert geavanceerd project...";
      pilotBtn.disabled = true;

      await fetch("/api/tasks/create", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({goal, focus}) });

      await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message: `PilotDirector, voer GEAVANCEERDE multi-file scaffolding uit voor: ${goal}. Genereer automatisch een package.json + meerdere componenten/bestanden als proposals met diff. Maak een compleet, werkend project. Vraag approval voor elke write.` })
      });

      await fetch("/api/experiments/run", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ hypothesis: `Advanced multi-file scaffolding with package.json and components: ${goal}`, focus:"stewardship" }) });

      await refresh();
      pilotBtn.textContent = "Launch Geavanceerde Scaffolding";
      pilotBtn.disabled = false;
    });
  }

  // Approve + Rollback buttons
  document.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Writing...";
      await fetch("/api/proposals/approve", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({proposalId: btn.dataset.approve}) });
      await refresh();
    });
  });

  document.querySelectorAll("[data-rollback]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const proposalId = btn.dataset.rollback;
      btn.textContent = "Rolling back...";
      await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message: `Maak een rollback proposal voor de vorige write (proposal ${proposalId}). Stel de originele staat voor.` })
      });
      await refresh();
    });
  });

  // Other handlers...
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&','<':'<','>':'>','"':'"','\'':'&#039;'}[m]));
}
