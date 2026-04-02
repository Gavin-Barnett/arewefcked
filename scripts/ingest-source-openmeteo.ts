import { openMeteoAdapter } from "../lib/sources/openmeteo";
import { persistSourceResult } from "./persist";

async function main() {
  const result = await openMeteoAdapter.fetch({ mode: "global" });
  console.log(JSON.stringify({ source: result.sourceKey, health: result.health, events: result.events.length }, null, 2));

  if (process.env.DATABASE_URL) {
    await persistSourceResult(result);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
