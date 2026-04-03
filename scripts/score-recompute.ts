import { recomputeAndPersistTrackedScores } from "../lib/scoring/recompute";

async function main() {
  const summary = await recomputeAndPersistTrackedScores();
  console.log(JSON.stringify(summary, null, 2));

  if (!(summary.ok || summary.partial)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
