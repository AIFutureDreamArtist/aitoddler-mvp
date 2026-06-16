import { createServer } from "node:http";
import { createHandler, ensureSeedData } from "./runtime.mjs";

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

await ensureSeedData();

const server = createServer(createHandler());

server.listen(port, host, () => {
  console.log(`Aitoddler MVP running on http://${host}:${port}`);
});
