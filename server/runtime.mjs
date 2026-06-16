import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");

const files = {
  experiments: path.join(DATA_DIR, "experiments.json"),
  skills: path.join(DATA_DIR, "skills.json"),
  tools: path.join(DATA_DIR, "tools.json"),
  memories: path.join(DATA_DIR, "memories.json"),
  actions: path.join(DATA_DIR, "actions.json"),
  messages: path.join(DATA_DIR, "messages.json")
};

const metricWeights = {
  task_success: 1.3,
  truthfulness: 1.2,
  safety: 1.6,
  user_agency: 1.4,
  learning_value: 1.2,
  future_harm_reduction: 1.2,
  system_improvement: 1.1,
  reversibility: 1.0,
  simplicity: 0.8
};

export async function ensureSeedData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await writeIfMissing(files.experiments, []);
  await writeIfMissing(files.actions, []);
  await writeIfMissing(files.messages, [
    {
      id: randomUUID(),
      role: "assistant",
      content:
        "Aitoddler is awake. Give me a hypothesis or run a bounded experiment. I will keep improvements only when capability and stewardship both improve.",
      createdAt: new Date().toISOString()
    }
  ]);
  await writeIfMissing(files.skills, [
    {
      id: "skill_api_onboarding_steward",
      name: "API Onboarding Steward",
      stage: "Child",
      confidence: 0.74,
      source: "seed",
      description:
        "Turns API onboarding problems into a self-service operating model with policy checks, developer portal flow, and human approval only where risk justifies it.",
      procedure: [
        "Clarify the onboarding goal and current delay.",
        "Map consumers, providers, security, and approval steps.",
        "Separate low-risk self-service from high-risk review.",
        "Generate templates, API standards, and feedback loops.",
        "Measure cycle-time reduction and developer friction."
      ],
      createdAt: new Date().toISOString()
    }
  ]);
  await writeIfMissing(files.tools, [
    {
      id: "health_check",
      name: "Health Check",
      kind: "os",
      risk: "low",
      command: "node --version",
      description: "Checks whether the local Node runtime is available.",
      requiresApproval: false
    },
    {
      id: "list_project",
      name: "List Project Files",
      kind: "filesystem",
      risk: "low",
      command: "list root files",
      description: "Lists top-level files in the MVP folder without modifying anything.",
      requiresApproval: false
    },
    {
      id: "run_smoke_test",
      name: "Run Smoke Test",
      kind: "terminal",
      risk: "medium",
      command: "npm run smoke",
      description: "Runs the API smoke test for the local harness.",
      requiresApproval: false
    },
    {
      id: "blocked_destructive_action",
      name: "Destructive Command Example",
      kind: "terminal",
      risk: "high",
      command: "rm -rf",
      description: "Demonstrates that dangerous actions are visible but blocked by policy.",
      requiresApproval: true,
      blocked: true
    }
  ]);
  await writeIfMissing(files.memories, [
    {
      id: randomUUID(),
      type: "lineage",
      title: "Origin principle",
      content:
        "Wisdom knows what usually works. Stewardship improves the conditions where learning, trust, and creativity can flourish.",
      createdAt: new Date().toISOString()
    }
  ]);
}

export function createHandler() {
  return async (req, res) => {
    try {
      setCors(res);
      if (req.method === "OPTIONS") return sendJson(res, 204, {});
      const url = new URL(req.url, "http://localhost");

      if (url.pathname === "/api/state" && req.method === "GET") {
        return sendJson(res, 200, await getState());
      }

      if (url.pathname === "/api/chat" && req.method === "POST") {
        const payload = await readBody(req);
        const text = String(payload.message || "").trim();
        if (!text) return sendJson(res, 400, { error: "Message is required." });
        return sendJson(res, 200, { message: await chat(text) });
      }

      if (url.pathname === "/api/experiments/run" && req.method === "POST") {
        const payload = await readBody(req);
        const hypothesis = String(payload.hypothesis || "").trim();
        const focus = String(payload.focus || "stewardship");
        if (!hypothesis) return sendJson(res, 400, { error: "Hypothesis is required." });
        const experiment = await runExperiment(hypothesis, focus);
        return sendJson(res, 200, { experiment, state: await getState() });
      }

      if (url.pathname === "/api/actions/execute" && req.method === "POST") {
        const payload = await readBody(req);
        const result = await executeTool(String(payload.toolId || ""));
        return sendJson(res, result.ok ? 200 : 403, result);
      }

      if (url.pathname === "/api/skills/propose" && req.method === "POST") {
        const payload = await readBody(req);
        const description = String(payload.description || "").trim();
        if (!description) return sendJson(res, 400, { error: "Description is required." });
        const skill = await createSkillFromDescription(description);
        return sendJson(res, 200, { skill, state: await getState() });
      }

      if (url.pathname === "/api/export" && req.method === "GET") {
        return sendJson(res, 200, await getState());
      }

      return serveStatic(url, res);
    } catch (error) {
      return sendJson(res, 500, { error: error.message || "Unexpected error." });
    }
  };
}

async function chat(text) {
  const messages = await readJson(files.messages, []);
  const userMessage = { id: randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() };
  messages.push(userMessage);
  const state = await getState();
  const reply = await makeAssistantReply(text, state, messages);
  const assistantMessage = {
    id: randomUUID(),
    role: "assistant",
    content: reply,
    createdAt: new Date().toISOString()
  };
  messages.push(assistantMessage);
  await writeJson(files.messages, messages.slice(-60));
  return assistantMessage;
}

async function getState() {
  const [experiments, skills, tools, memories, actions, messages] = await Promise.all([
    readJson(files.experiments, []),
    readJson(files.skills, []),
    readJson(files.tools, []),
    readJson(files.memories, []),
    readJson(files.actions, []),
    readJson(files.messages, [])
  ]);
  const scored = experiments.filter((item) => Number.isFinite(item.totalScore));
  const best = scored.toSorted((a, b) => b.totalScore - a.totalScore)[0] || null;
  const keep = experiments.filter((item) => item.status === "keep").length;
  const summary = {
    maturity: getMaturityStage(experiments, skills),
    totalExperiments: experiments.length,
    keepRate: experiments.length ? Math.round((keep / experiments.length) * 100) : 0,
    bestScore: best?.totalScore || 0,
    bestExperiment: best?.hypothesis || "No experiment yet",
    skills: skills.length,
    tools: tools.length,
    memories: memories.length,
    actions: actions.length,
    llamaEnabled: Boolean(process.env.LLAMA_BASE_URL),
    model: process.env.LLAMA_MODEL || "local-steward-fallback"
  };
  return { summary, experiments, skills, tools, memories, actions, messages };
}

async function runExperiment(hypothesis, focus) {
  const experiments = await readJson(files.experiments, []);
  const memories = await readJson(files.memories, []);
  const skills = await readJson(files.skills, []);
  const previousBest = experiments.reduce((best, item) => Math.max(best, item.totalScore || 0), 0);
  const metrics = scoreHypothesis(hypothesis, focus, experiments.length);
  const totalScore = weightedScore(metrics);
  const status = totalScore > previousBest && metrics.safety >= 7 && metrics.user_agency >= 6 ? "keep" : "discard";
  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    hypothesis,
    focus,
    status,
    totalScore,
    previousBest,
    metrics,
    reflection: reflectOnExperiment(hypothesis, metrics, status),
    promotedSkillId: null
  };

  if (status === "keep" && totalScore >= 7.4) {
    const skill = promoteExperimentToSkill(record);
    skills.unshift(skill);
    record.promotedSkillId = skill.id;
    await writeJson(files.skills, skills);
  }

  memories.unshift({
    id: randomUUID(),
    type: status === "keep" ? "lesson" : "episode",
    title: status === "keep" ? "Accepted experiment" : "Rejected experiment",
    content: record.reflection,
    createdAt: record.createdAt
  });

  experiments.unshift(record);
  await Promise.all([writeJson(files.experiments, experiments), writeJson(files.memories, memories)]);
  return record;
}

function scoreHypothesis(hypothesis, focus, index) {
  const text = `${hypothesis} ${focus}`.toLowerCase();
  const signal = {
    safety: countHits(text, ["safe", "guard", "risk", "approval", "audit", "rollback", "harm", "protect"]),
    learning: countHits(text, ["learn", "skill", "practice", "feedback", "memory", "lesson", "teach"]),
    system: countHits(text, ["system", "workflow", "portal", "process", "environment", "team", "platform"]),
    agency: countHits(text, ["human", "user", "choice", "approval", "agency", "control", "transparent"]),
    simplicity: countHits(text, ["simple", "small", "bounded", "reversible", "minimal", "clear"])
  };
  const wobble = ((index * 17) % 9) / 10;
  return {
    task_success: clamp(5.8 + signal.system * 0.6 + signal.learning * 0.25 + wobble),
    truthfulness: clamp(6.4 + signal.simplicity * 0.35),
    safety: clamp(5.9 + signal.safety * 0.7 + signal.agency * 0.2),
    user_agency: clamp(5.7 + signal.agency * 0.75 + signal.safety * 0.1),
    learning_value: clamp(6.0 + signal.learning * 0.8 + signal.system * 0.2),
    future_harm_reduction: clamp(5.7 + signal.safety * 0.55 + signal.system * 0.25),
    system_improvement: clamp(5.6 + signal.system * 0.75 + signal.learning * 0.15),
    reversibility: clamp(6.0 + signal.simplicity * 0.55 + signal.safety * 0.15),
    simplicity: clamp(6.0 + signal.simplicity * 0.65 - Math.max(0, hypothesis.length - 180) / 180)
  };
}

function weightedScore(metrics) {
  const entries = Object.entries(metricWeights);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const score = entries.reduce((sum, [key, weight]) => sum + metrics[key] * weight, 0) / totalWeight;
  return Math.round(score * 100) / 100;
}

function reflectOnExperiment(hypothesis, metrics, status) {
  const strongest = Object.entries(metrics).toSorted((a, b) => b[1] - a[1])[0];
  const weakest = Object.entries(metrics).toSorted((a, b) => a[1] - b[1])[0];
  if (status === "keep") {
    return `Kept: "${hypothesis}" improved the harness most on ${label(strongest[0])}. Next inheritance rule: preserve the pattern, but watch ${label(weakest[0])}.`;
  }
  return `Discarded: "${hypothesis}" was not strong enough yet. Main weak point: ${label(weakest[0])}. Turn it into a smaller, safer, more reversible experiment.`;
}

function promoteExperimentToSkill(experiment) {
  return {
    id: `skill_${experiment.id.slice(0, 8)}`,
    name: titleFromHypothesis(experiment.hypothesis),
    stage: "Toddler",
    confidence: Math.min(0.96, Math.round((experiment.totalScore / 10) * 100) / 100),
    source: experiment.id,
    description: `Reusable pattern promoted from a kept experiment: ${experiment.hypothesis}`,
    procedure: [
      "State the intent and expected benefit.",
      "Run the smallest reversible version first.",
      "Evaluate capability and stewardship metrics together.",
      "Keep only if safety and user agency do not regress.",
      "Store the lesson so future agents inherit the pattern."
    ],
    createdAt: new Date().toISOString()
  };
}

async function executeTool(toolId) {
  const tools = await readJson(files.tools, []);
  const actions = await readJson(files.actions, []);
  const memories = await readJson(files.memories, []);
  const tool = tools.find((item) => item.id === toolId);
  if (!tool) return { ok: false, error: "Unknown tool." };
  if (tool.blocked || tool.risk === "high") {
    const action = actionRecord(tool, false, "Blocked by stewardship policy.", "");
    actions.unshift(action);
    await writeJson(files.actions, actions);
    return { ok: false, action };
  }

  let output = "";
  if (tool.id === "health_check") {
    output = await execAllowed("node", ["--version"]);
  } else if (tool.id === "run_smoke_test") {
    output = await execAllowed("npm", ["run", "smoke"]);
  } else if (tool.id === "list_project") {
    const names = await fs.readdir(ROOT);
    output = names.filter((name) => !name.startsWith(".")).sort().join("\n");
  } else {
    return { ok: false, error: "Tool exists but has no executor yet." };
  }

  const action = actionRecord(tool, true, "Executed through allowlisted action wrapper.", output);
  actions.unshift(action);
  memories.unshift({
    id: randomUUID(),
    type: "episode",
    title: `Tool used: ${tool.name}`,
    content: "The tool ran inside the action layer. Result was captured and can be inspected later.",
    createdAt: action.createdAt
  });
  await Promise.all([writeJson(files.actions, actions), writeJson(files.memories, memories)]);
  return { ok: true, action };
}

function execAllowed(command, args) {
  const allowlist = new Set(["node --version", "npm run smoke"]);
  const signature = `${command} ${args.join(" ")}`;
  if (!allowlist.has(signature)) return Promise.reject(new Error("Command is not allowlisted."));
  return new Promise((resolve) => {
    execFile(command, args, { cwd: ROOT, timeout: 15000 }, (error, stdout, stderr) => {
      const body = [stdout, stderr, error ? error.message : ""].filter(Boolean).join("\n").trim();
      resolve(body || "Command completed.");
    });
  });
}

async function makeAssistantReply(text, state, history) {
  const llama = await callLlama(text, state, history);
  if (llama) return llama;
  const lower = text.toLowerCase();
  if (lower.includes("tool") || lower.includes("terminal") || lower.includes("os")) {
    return "Use tools as bounded actions: define intent, check risk, execute only through the allowlist, capture output, then store the lesson. In this MVP, high-risk terminal actions are visible but blocked.";
  }
  if (lower.includes("skill")) {
    return `The harness has ${state.summary.skills} reusable skill(s). A skill should be promoted only after a kept experiment improves both capability and stewardship.`;
  }
  return `Current maturity is ${state.summary.maturity}. Best score is ${state.summary.bestScore}. A good next experiment would be small, reversible, and measured on safety, agency, learning value, and task success together.`;
}

async function callLlama(text, state, history) {
  const base = process.env.LLAMA_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const body = {
    model: process.env.LLAMA_MODEL || "local-model",
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You are Aitoddler, a local autoresearch steward. Be practical, concise, and explain safe next actions."
      },
      { role: "system", content: `Current state: ${JSON.stringify(state.summary)}` },
      ...history.slice(-8).map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: text }
    ]
  };
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function createSkillFromDescription(description) {
  const skills = await readJson(files.skills, []);
  const skill = {
    id: `skill_manual_${randomUUID().slice(0, 8)}`,
    name: titleFromHypothesis(description),
    stage: "Proposed",
    confidence: 0.52,
    source: "manual",
    description,
    procedure: [
      "Define where this skill applies.",
      "Write the smallest repeatable procedure.",
      "Create one evaluation example.",
      "Run against at least three cases.",
      "Promote only after stewardship score improves."
    ],
    createdAt: new Date().toISOString()
  };
  skills.unshift(skill);
  await writeJson(files.skills, skills);
  return skill;
}

async function serveStatic(url, res) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) return sendText(res, 403, "Forbidden");
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(body);
  } catch {
    const body = await fs.readFile(path.join(PUBLIC_DIR, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
  }
}

function actionRecord(tool, ok, policy, output) {
  return {
    id: randomUUID(),
    toolId: tool.id,
    toolName: tool.name,
    risk: tool.risk,
    ok,
    policy,
    output,
    createdAt: new Date().toISOString()
  };
}

function getMaturityStage(experiments, skills) {
  const kept = experiments.filter((item) => item.status === "keep").length;
  if (skills.length >= 8 && kept >= 12) return "Steward";
  if (kept >= 8) return "Wise Adult";
  if (kept >= 5) return "Adult";
  if (experiments.length >= 7) return "Teen";
  if (experiments.length >= 3) return "Child";
  if (experiments.length >= 1) return "Toddler";
  return "Baby";
}

function countHits(text, words) {
  return words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
}

function clamp(value) {
  return Math.max(1, Math.min(10, Math.round(value * 10) / 10));
}

function label(key) {
  return key.replaceAll("_", " ");
}

function titleFromHypothesis(text) {
  const cleaned = text.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").slice(0, 5);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") || "Untitled Skill";
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function sendText(res, status, payload) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(payload);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function writeIfMissing(file, value) {
  try {
    await fs.access(file);
  } catch {
    await writeJson(file, value);
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}
