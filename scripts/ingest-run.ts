import { activeSourceAdapters } from "../lib/sources";
import { persistSourceResult } from "./persist";

async function main() {
  const results = await Promise.all(activeSourceAdapters.map((adapter) => adapter.fetch({ mode: "global" })));

  for (const result of results) {
    console.log(JSON.stringify({ source: result.sourceKey, health: result.health, events: result.events.length }, null, 2));

    if (process.env.DATABASE_URL) {
      await persistSourceResult(result);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
