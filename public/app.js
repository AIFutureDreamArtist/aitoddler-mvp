const navItems = [
  ["dashboard", "Dashboard"],
  ["chat", "Chat"],
  ["experiments", "Experiments"],
  ["skills", "Skills"],
  ["tools", "Tools"],
  ["memory", "Memory"]
];

let active = "dashboard";
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
        <input id="chat-input" placeholder="Ask about skills, tools, memory, or the next experiment..." />
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
