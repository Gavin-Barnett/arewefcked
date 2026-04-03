import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10">
      <div className="max-w-2xl rounded-[2rem] border border-line/80 bg-card/90 p-10 text-center shadow-panel backdrop-blur-sm">
        <p className="text-sky text-xs uppercase tracking-[0.32em]">
          arewefcked.com
        </p>
        <h1 className="mt-4 font-semibold text-4xl text-ink">
          That country is not in the current starter set.
        </h1>
        <p className="mt-4 text-base text-ink/68 leading-7">
          The project is still building out country coverage carefully. If the
          data is thin, the UI should say less, not bluff more.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full border border-line bg-haze px-4 py-2 text-ink/80 text-sm transition hover:border-white/20 hover:text-ink"
          href="/"
        >
          Back to global view
        </Link>
      </div>
    </div>
  );
}
