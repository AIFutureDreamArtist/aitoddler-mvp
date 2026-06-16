const navItems = [
  ["dashboard", "Dashboard"],
  ["jarvis", "Jarvis Agent"],
  ["chat", "Chat"],
  ["experiments", "Experiments"],
  ["skills", "Skills"],
  ["tools", "Tools"],
  ["memory", "Memory"]
];

let active = "jarvis";
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
    dashboard: dashboardView,
    jarvis: jarvisView,
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

// NEW: Jarvis Agent View
function jarvisView() {
  return `
    <section class="two-column">
      <div class="control-panel">
        <div class="section-title">
          <h2>🤖 Jarvis — Jouw Persoonlijke Agent</h2>
          <span class="badge neutral">Steward Mode</span>
        </div>
        
        <p style="color: var(--muted); margin-bottom: 1rem;">
          Geef Jarvis een hoog-niveau doel. Hij plant de taak, kiest veilige tools, vraagt goedkeuring waar nodig en voert uit met volledige logging.
        </p>

        <textarea id="jarvis-goal" placeholder="Bijv: Bouw een mooie landingspagina voor mijn startup met hero, features en contact form. Of: Onderzoek de laatste trends in AI agents en maak een samenvatting met bronnen."></textarea>
        
        <div style="margin: 1rem 0;">
          <label style="font-size: 0.85rem; color: var(--muted);">Focus / Stijl</label>
          <div class="segmented" id="jarvis-focus">
            <button class="selected" data-focus="general">Algemeen</button>
            <button data-focus="code">Code / Cursor-style</button>
            <button data-focus="ui">UI / Lovable-style</button>
            <button data-focus="research">Research / Hermes-style</button>
            <button data-focus="automation">Automation</button>
          </div>
        </div>

        <button class="primary" id="jarvis-submit" style="width: 100%;">🚀 Laat Jarvis aan de slag gaan</button>

        <div style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--muted);">
          <strong>Veiligheid:</strong> Hoog-risico acties worden eerst voorgesteld en wachten op jouw goedkeuring. Alles wordt gelogd in Memory & Actions.
        </div>
      </div>

      <div class="list-panel">
        <div class="section-title">
          <h2>Actieve & Recente Taken</h2>
          <span id="task-count">${state.actions.length + state.experiments.length}</span>
        </div>
        
        <div id="jarvis-tasks">
          ${state.messages.slice(-6).reverse().map(msg => `
            <div class="row" style="padding: 0.8rem 0; border-top: 1px solid var(--line);">
              <div>
                <strong>${msg.role === 'user' ? 'Jij' : 'Jarvis'}</strong><br>
                <span style="font-size: 0.9rem; color: var(--muted);">${escapeHtml(msg.content.substring(0, 140))}${msg.content.length > 140 ? '...' : ''}</span>
              </div>
            </div>
          `).join('') || '<p style="color: var(--muted);">Nog geen taken. Geef Jarvis een doel hierboven.</p>'}
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--line); font-size: 0.8rem; color: var(--muted);">
          Jarvis gebruikt het Aitoddler steward systeem: hij runt bounded experiments, promoot skills alleen als safety + agency verbeteren, en vraagt approval bij riskante acties.
        </div>
      </div>
    </section>
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
        <input id="chat-input" placeholder="Vraag Jarvis iets of geef een taak..." />
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
  // Jarvis submit handler
  const jarvisBtn = document.querySelector("#jarvis-submit");
  if (jarvisBtn) {
    jarvisBtn.addEventListener("click", async () => {
      const goal = document.querySelector("#jarvis-goal").value.trim();
      if (!goal) return alert("Geef Jarvis een doel.");
      
      const focusBtn = document.querySelector("#jarvis-focus .selected");
      const focus = focusBtn ? focusBtn.dataset.focus : "general";
      
      jarvisBtn.textContent = "Jarvis denkt na...";
      jarvisBtn.disabled = true;

      // For now: send as chat + run an experiment as planning step
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Jarvis, voer deze taak uit: ${goal}. Focus: ${focus}. Plan het stap voor stap met safety checks.` })
      });

      // Also run a planning experiment
      await fetch("/api/experiments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hypothesis: `Plan and safely execute user goal: ${goal} (focus: ${focus})`, 
          focus: "stewardship" 
        })
      });

      await refresh();
      jarvisBtn.textContent = "🚀 Laat Jarvis aan de slag gaan";
      jarvisBtn.disabled = false;
    });
  }

  // Segmented buttons for Jarvis focus
  document.querySelectorAll("#jarvis-focus [data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#jarvis-focus [data-focus]").forEach((item) => item.classList.remove("selected"));
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
