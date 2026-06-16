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

// === PILOTDIRECTOR VIEW (Main Agent Interface) ===
function pilotDirectorView() {
  const recentTasks = state.messages.slice(-8).reverse();
  
  return `
    <div>
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h1 style="margin: 0; font-size: 2.2rem;">PilotDirector</h1>
          <p style="margin: 0.3rem 0 0; color: var(--muted); font-size: 1.05rem;">
            Jouw veilige persoonlijke AI agent • Antigravity × Lovable × Hermes stijl
          </p>
        </div>
        <div style="margin-left: auto; text-align: right;">
          <div class="status-pill">
            <span class="status-dot"></span>
            <strong>Steward Active</strong>
          </div>
          <div style="font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem;">
            ${state.summary.maturity} • ${state.summary.skills} skills
          </div>
        </div>
      </div>

      <!-- Goal Input -->
      <div class="control-panel" style="margin-bottom: 1.5rem;">
        <h2 style="margin-top: 0;">Geef een hoog-niveau doel</h2>
        <textarea id="pilot-goal" placeholder="Voorbeeld: Bouw een moderne SaaS landingspagina met hero sectie, features, pricing tiers en contact form. Of: Onderzoek de laatste ontwikkelingen in multi-agent systemen en maak een gestructureerd rapport met aanbevelingen." style="min-height: 110px; font-size: 1rem;"></textarea>

        <div style="margin: 1rem 0 0.5rem;">
          <label style="font-size: 0.9rem; color: var(--muted); font-weight: 600;">Focus / Agent Mode</label>
          <div class="segmented" id="pilot-focus" style="margin-top: 0.5rem;">
            <button class="selected" data-focus="ui">UI / App Builder (Lovable)</button>
            <button data-focus="code">Code & Refactor (Cursor/Antigravity)</button>
            <button data-focus="research">Research & Analysis (Hermes)</button>
            <button data-focus="automation">Automation & Tasks</button>
          </div>
        </div>

        <button class="primary" id="pilot-launch" style="width: 100%; padding: 1rem; font-size: 1.1rem; margin-top: 0.8rem;">
          🚀 Launch Pilot — Laat PilotDirector aan de slag gaan
        </button>

        <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--muted); display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <div>✓ Veilige planning via experiments</div>
          <div>✓ Approval gates bij riskante acties</div>
          <div>✓ Volledige logging & memory</div>
          <div>✓ Skills worden automatisch gepromoot</div>
        </div>
      </div>

      <!-- Live Task Overview -->
      <div class="wide-panel">
        <div class="section-title">
          <h2>Actieve & Recente Pilot Taken</h2>
          <span>${recentTasks.length} recente interacties</span>
        </div>
        
        <div style="display: grid; gap: 0.75rem;">
          ${recentTasks.length > 0 
            ? recentTasks.map(msg => `
              <div class="row" style="padding: 1rem; background: ${msg.role === 'user' ? 'rgba(22,24,21,0.03)' : 'white'};">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                    <span style="font-weight: 700; color: ${msg.role === 'user' ? '#161815' : 'var(--accent)'};">
                      ${msg.role === 'user' ? 'Jij' : 'PilotDirector'}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--muted);">${new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p style="margin: 0; line-height: 1.5; color: #30362f;">${escapeHtml(msg.content)}</p>
                </div>
              </div>
            `).join('')
            : `<div class="empty" style="min-height: 120px;">Nog geen taken. Start hierboven met een doel.</div>`
          }
        </div>
      </div>

      <div style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--muted); text-align: center;">
        PilotDirector werkt altijd via het steward-systeem: hij plant veilig, vraagt goedkeuring waar nodig en leert van elke uitvoering.
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
        <input id="chat-input" placeholder="Vraag PilotDirector iets of geef een taak..." />
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
  // PilotDirector Launch
  const pilotBtn = document.querySelector("#pilot-launch");
  if (pilotBtn) {
    pilotBtn.addEventListener("click", async () => {
      const goal = document.querySelector("#pilot-goal").value.trim();
      if (!goal) {
        alert("Geef PilotDirector een duidelijk doel.");
        return;
      }
      
      const focusBtn = document.querySelector("#pilot-focus .selected");
      const focus = focusBtn ? focusBtn.dataset.focus : "ui";
      
      pilotBtn.textContent = "PilotDirector plant en werkt...";
      pilotBtn.disabled = true;

      // Send goal to chat
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `PilotDirector, voer dit doel uit: ${goal}. Gebruik focus: ${focus}. Plan stap-voor-stap, gebruik veilige tools en vraag goedkeuring waar nodig.` 
        })
      });

      // Trigger a planning experiment
      await fetch("/api/experiments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hypothesis: `High-level goal execution: ${goal} (mode: ${focus}) — safe, reversible, high value for user`, 
          focus: "stewardship" 
        })
      });

      await refresh();
      pilotBtn.textContent = "🚀 Launch Pilot — Laat PilotDirector aan de slag gaan";
      pilotBtn.disabled = false;

      // Optional: scroll to recent tasks
      setTimeout(() => {
        const tasksSection = document.querySelector('.wide-panel');
        if (tasksSection) tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    });
  }

  // Segmented focus buttons
  document.querySelectorAll("#pilot-focus [data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#pilot-focus [data-focus]").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  const chatForm = document.querySelector("#chat-form");
  if (chatForm) {
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.querySelector("#chat-input");
      const message = input.value.trim();
      if (!message) return;
      input.value = "";
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      await refresh();
    });
  }

  document.querySelectorAll("[data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-focus]").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  const runButton = document.querySelector("#run-experiment");
  if (runButton) {
    runButton.addEventListener("click", async () => {
      const hypothesis = document.querySelector("#hypothesis").value;
      const focus = document.querySelector("[data-focus].selected")?.dataset.focus || "stewardship";
      runButton.textContent = "Running...";
      await fetch("/api/experiments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis, focus })
      });
      await refresh();
    });
  }

  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.textContent = "Running...";
      await fetch("/api/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: button.dataset.tool })
      });
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
