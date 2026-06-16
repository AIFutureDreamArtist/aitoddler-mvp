import { createServer } from "node:http";
import { createHandler, ensureSeedData } from "../server/runtime.mjs";

await ensureSeedData();

const server = createServer(createHandler());

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const state = await fetch(`${base}/api/state`).then((res) => res.json());
if (!state.summary || !Array.isArray(state.tools)) {
  throw new Error("State endpoint did not return expected payload.");
}

const experiment = await fetch(`${base}/api/experiments/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    hypothesis:
      "Add a safe bounded learning checkpoint with audit log, rollback note, human agency, and reusable skill promotion.",
    focus: "stewardship"
  })
}).then((res) => res.json());

if (!experiment.experiment?.id) {
  throw new Error("Experiment endpoint did not create a record.");
}

const action = await fetch(`${base}/api/actions/execute`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ toolId: "health_check" })
}).then((res) => res.json());

if (!action.ok) {
  throw new Error("Health check action failed.");
}

await new Promise((resolve) => server.close(resolve));
console.log("Aitoddler smoke test passed.");
