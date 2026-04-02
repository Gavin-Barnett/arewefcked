import Link from "next/link";
import { SourceHealthGrid } from "@/components/source-health-grid";
import { buildSourceHealthSnapshot } from "@/lib/scoring/engine";

export const revalidate = 900;

export default async function SourceHealthPage() {
  const sourceHealth = await buildSourceHealthSnapshot();

  return (
    <div className="space-y-8 py-2">
      <div className="max-w-4xl space-y-4">
        <Link href="/" className="text-xs uppercase tracking-[0.4em] text-sky">
          arewefcked.com
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Source health</h1>
        <p className="max-w-3xl text-base leading-7 text-ink/68 sm:text-lg">If a source is flaky, delayed, or heuristic, the dashboard should say so plainly.</p>
      </div>
      <SourceHealthGrid sources={sourceHealth} />
    </div>
  );
}
