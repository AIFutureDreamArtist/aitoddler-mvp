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

async function refresh() {
  state = await fetch("/api/state").then((res) => res.json());
  render();
}

function render() {
  document.querySelector("#stage").textContent = state.summary.maturity;
  document.querySelector("#model").textContent = state.summary.llamaEnabled ? state.summary.model : "local fallback";
  nav.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.id === active);
  });
  const views = {
    pilot: pilotDirectorView,
    dashboard: dashboardView,
    chat: chatView,
    experiments: experimentsView,
    skills: skillsView,
    tools: toolsView,
    memory: memoryView
  };
  view.innerHTML = views[active]();
  bindViewEvents();
}

function dashboardView() {
  const summary = state.summary;
  return `
    <section class="panel-grid">
      ${metric("Maturity", summary.maturity)}
      ${metric("Best score", Number(summary.bestScore).toFixed(2))}
      ${metric("Keep rate", `${summary.keepRate}%`)}
      ${metric("Skills", summary.skills)}
      <div class="wide-panel">
        <div class="section-title"><h2>Experiment score trend</h2><span>${summary.totalExperiments} runs</span></div>
        ${scoreChart(state.experiments.slice(0, 8).reverse())}
      </div>
      <div class="wide-panel split">
        <div>
          <h2>Best inheritance</h2>
          <p class="large-copy">${escapeHtml(summary.bestExperiment)}</p>
        </div>
        <div class="principles">
          <span>bounded</span><span>measured</span><span>reversible</span><span>human-led</span>
        </div>
      </div>
    </section>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function scoreChart(items) {
  if (!items.length) return `<div class="empty">Run your first experiment to draw the learning curve.</div>`;
  const max = Math.max(...items.map((item) => item.totalScore || 0), 10);
  const points = items
    .map((item, index) => {
      const x = 20 + (index / Math.max(items.length - 1, 1)) * 560;
      const y = 160 - ((item.totalScore || 0) / max) * 130;
      return `${x},${y}`;
    })
    .join(" ");
  const circles = items
    .map((item, index) => {
      const x = 20 + (index / Math.max(items.length - 1, 1)) * 560;
      const y = 160 - ((item.totalScore || 0) / max) * 130;
      return `<circle cx="${x}" cy="${y}" r="5" class="${item.status}"></circle>`;
    })
    .join("");
  return `
    <svg class="chart" viewBox="0 0 620 190" role="img" aria-label="Experiment score trend">
      <line x1="20" y1="160" x2="600" y2="160"></line>
      <line x1="20" y1="20" x2="20" y2="160"></line>
      <polyline points="${points}"></polyline>
      ${circles}
    </svg>
  `;
}

// === FULL PILOTDIRECTOR VIEW ===
function pilotDirectorView() {
  const tasks = state.tasks || [];
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const recentMessages = state.messages.slice(-6).reverse();

  return `
    <div>
      <!-- Header -->
      <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <h1 style="margin:0; font-size:2.4rem; line-height:1;">PilotDirector</h1>
          <p style="margin:0.4rem 0 0; color:var(--muted); font-size:1.1rem;">
            Jouw veilige persoonlijke AI agent • Antigravity × Lovable × Hermes
          </p>
        </div>
        <div style="margin-left:auto; text-align:right;">
          <div class="status-pill" style="background:#e6f4ed; border-color:#0b7a53;">
            <span class="status-dot" style="background:#0b7a53;"></span>
            <strong style="color:#0b7a53;">Steward Active</strong>
          </div>
          <div style="font-size:0.85rem; color:var(--muted); margin-top:4px;">
            ${state.summary.maturity} • ${state.summary.skills} skills • ${activeTasks.length} actieve taken
          </div>
        </div>
      </div>

      <!-- Goal Launcher -->
      <div class="control-panel" style="margin-bottom:1.8rem; border:2px solid var(--accent-soft);">
        <h2 style="margin-top:0; color:var(--accent);">🚀 Nieuw doel lanceren</h2>
        <textarea id="pilot-goal" placeholder="Bijv: Bouw een volledige moderne portfolio website met dark mode, projecten sectie, skills en contact formulier. Of: Onderzoek multi-agent systemen en maak een gedetailleerd rapport met aanbevelingen en bronnen." style="min-height:100px; font-size:1.05rem;"></textarea>

        <div style="margin:1rem 0 0.6rem;">
          <label style="font-size:0.9rem; font-weight:600; color:var(--muted);">Agent Mode</label>
          <div class="segmented" id="pilot-focus" style="margin-top:0.5rem; flex-wrap:wrap;">
            <button class="selected" data-focus="ui">UI / App Builder</button>
            <button data-focus="code">Code & Refactor</button>
            <button data-focus="research">Research & Analysis</button>
            <button data-focus="automation">Automation</button>
          </div>
        </div>

        <button id="pilot-launch" class="primary" style="width:100%; padding:1.1rem; font-size:1.15rem; font-weight:800;">
          Launch PilotDirector
        </button>
      </div>

      <!-- Active Tasks -->
      <div class="wide-panel" style="margin-bottom:1.5rem;">
        <div class="section-title">
          <h2>Actieve Taken</h2>
          <span>${activeTasks.length} lopend</span>
        </div>
        
        ${activeTasks.length > 0 
          ? activeTasks.map(task => `
            <div class="row" style="padding:1rem; background:white; border-left:5px solid var(--accent);">
              <div style="flex:1;">
                <strong>${escapeHtml(task.goal)}</strong>
                <div style="margin-top:0.4rem; font-size:0.85rem; color:var(--muted);">
                  Mode: ${task.focus} • Status: <strong style="color:#0b7a53;">${task.status}</strong>
                </div>
              </div>
              <div style="text-align:right; font-size:0.8rem; color:var(--muted);">
                ${new Date(task.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </div>
            </div>
          `).join('')
          : `<div class="empty" style="min-height:80px; background:#f8faf7;">Geen actieve taken. Lanceer hierboven een nieuw doel.</div>`
        }
      </div>

      <!-- Recent Activity -->
      <div class="wide-panel">
        <div class="section-title">
          <h2>Recente Activiteit & Logs</h2>
          <span>${recentMessages.length} berichten</span>
        </div>
        
        <div style="display:grid; gap:0.6rem;">
          ${recentMessages.map(msg => `
            <div style="padding:0.9rem 1rem; background:${msg.role === 'user' ? '#161815' : 'white'}; color:${msg.role === 'user' ? 'white' : '#161815'}; border-radius:0.6rem; font-size:0.95rem;">
              <div style="font-weight:700; margin-bottom:0.25rem; opacity:0.85; font-size:0.8rem;">
                ${msg.role === 'user' ? 'JIJ' : 'PILOTDIRECTOR'}
              </div>
              <div>${escapeHtml(msg.content.length > 220 ? msg.content.substring(0, 220) + '...' : msg.content)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top:1.8rem; text-align:center; font-size:0.85rem; color:var(--muted);">
        Alles verloopt via het veilige steward-systeem • Jij behoudt altijd de controle
      </div>
    </div>
  `;
}

function chatView() {
  return `
    <section class="conversation">
      <div class="message-list">
        ${state.messages
          .map(
            (item) => `
            <article class="message ${item.role}">
              <span>${item.role}</span>
              <p>${escapeHtml(item.content)}</p>
            </article>
          `
          )
          .join("")}
      </div>
      <form class="composer" id="chat-form">
        <input id="chat-input" placeholder="Vraag PilotDirector iets..." />
        <button>Send</button>
      </form>
    </section>
  `;
}

function experimentsView() {
  return `
    <section class="two-column">
      <div class="control-panel">
        <h2>Run a bounded experiment</h2>
        <textarea id="hypothesis">Add a reversible reflection checkpoint that improves learning value, safety, human agency, and skill promotion.</textarea>
        <div class="segmented" id="focus">
          ${["stewardship", "tool-use", "memory", "skill"].map((item, index) => `<button class="${index === 0 ? "selected" : ""}" data-focus="${item}">${item}</button>`).join("")}
        </div>
        <button class="primary" id="run-experiment">Run experiment</button>
      </div>
      <div class="list-panel">
        <div class="section-title"><h2>Experiment log</h2><span>${state.experiments.length}</span></div>
        ${state.experiments.map(experimentRow).join("")}
      </div>
    </section>
  `;
}

function experimentRow(item) {
  return `
    <article class="row">
      <div>
        <strong>${escapeHtml(item.hypothesis)}</strong>
        <p>${escapeHtml(item.reflection)}</p>
      </div>
      <span class="badge ${item.status}">${item.status}</span>
      <b>${item.totalScore}</b>
    </article>
  `;
}

function skillsView() {
  return `
    <section class="library-list">
      ${state.skills
        .map(
          (skill) => `
          <article class="skill">
            <div>
              <span class="badge neutral">${skill.stage}</span>
              <h2>${escapeHtml(skill.name)}</h2>
              <p>${escapeHtml(skill.description)}</p>
            </div>
              <ol>${skill.procedure.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
          </article>
        `
        )
        .join("")}
    </section>
  `;
}

function toolsView() {
  return `
    <section class="two-column">
      <div class="list-panel">
        <div class="section-title"><h2>Tool registry</h2><span>${state.tools.length}</span></div>
        ${state.tools
          .map(
            (tool) => `
            <article class="tool-row">
              <div>
                <strong>${escapeHtml(tool.name)}</strong>
                <p>${escapeHtml(tool.description)}</p>
                <code>${escapeHtml(tool.command)}</code>
              </div>
              <button data-tool="${tool.id}">${tool.blocked ? "Test block" : "Execute"}</button>
            </article>
          `
          )
          .join("")}
      </div>
      <div class="list-panel">
        <div class="section-title"><h2>Action log</h2><span>${state.actions.length}</span></div>
        ${state.actions
          .map(
            (action) => `
            <article class="row">
              <div>
                <strong>${escapeHtml(action.toolName)}</strong>
                <p>${escapeHtml(action.policy)}</p>
                ${action.output ? `<pre>${escapeHtml(action.output)}</pre>` : ""}
              </div>
              <span class="badge risk-${action.risk}">${action.risk}</span>
            </article>
          `
          )
          .join("")}
      </div>
    </section>
  `;
}

function memoryView() {
  return `
    <section class="memory-stream">
      ${state.memories
        .map(
          (memory) => `
          <article class="memory">
            <span>${memory.type}</span>
            <h2>${escapeHtml(memory.title)}</h2>
            <p>${escapeHtml(memory.content)}</p>
          </article>
        `
        )
        .join("")}
    </section>
  `;
}

function bindViewEvents() {
  const pilotBtn = document.querySelector("#pilot-launch");
  if (pilotBtn) {
    pilotBtn.addEventListener("click", async () => {
      const goal = document.querySelector("#pilot-goal").value.trim();
      if (!goal) return alert("Geef een duidelijk doel.");

      const focusBtn = document.querySelector("#pilot-focus .selected");
      const focus = focusBtn ? focusBtn.dataset.focus : "ui";

      pilotBtn.textContent = "PilotDirector plant en werkt...";
      pilotBtn.disabled = true;

      // Create task
      try {
        await fetch("/api/tasks/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, focus })
        });
      } catch(e) {}

      // Send to chat
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `PilotDirector, voer dit doel uit: ${goal}. Focus/mode: ${focus}. Plan het stap voor stap, gebruik veilige tools en vraag expliciete goedkeuring bij riskante acties.` 
        })
      });

      // Planning experiment
      await fetch("/api/experiments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hypothesis: `Execute high-level user goal safely: ${goal} (mode: ${focus})`, 
          focus: "stewardship" 
        })
      });

      await refresh();
      pilotBtn.textContent = "Launch PilotDirector";
      pilotBtn.disabled = false;
    });
  }

  document.querySelectorAll("#pilot-focus [data-focus]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#pilot-focus [data-focus]").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  const chatForm = document.querySelector("#chat-form");
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.querySelector("#chat-input");
      const msg = input.value.trim();
      if (!msg) return;
      input.value = "";
      await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({message: msg}) });
      await refresh();
    });
  }

  document.querySelectorAll("[data-focus]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-focus]").forEach(b => b.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  const runBtn = document.querySelector("#run-experiment");
  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      const hyp = document.querySelector("#hypothesis").value;
      const f = document.querySelector("[data-focus].selected")?.dataset.focus || "stewardship";
      runBtn.textContent = "Running...";
      await fetch("/api/experiments/run", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({hypothesis: hyp, focus: f}) });
      await refresh();
    });
  }

  document.querySelectorAll("[data-tool]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "Running...";
      await fetch("/api/actions/execute", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({toolId: btn.dataset.tool}) });
      await refresh();
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """)
    .replaceAll("'", "&#039;");
}
