"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCountryByCode, resolveCountryInput, searchCountries } from "@/lib/countries/starter-countries";
import { cn } from "@/lib/utils";

export function CountryAutocomplete(props: { currentCountryCode?: string; className?: string }) {
  const router = useRouter();
  const initialQuery = props.currentCountryCode ? getCountryByCode(props.currentCountryCode)?.name ?? props.currentCountryCode : "";
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const matches = searchCountries(deferredQuery).slice(0, 8);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function navigateToCountry(code: string) {
    const nextCode = code.toUpperCase();
    const nextCountry = getCountryByCode(nextCode);

    if (!nextCountry) {
      return;
    }

    setQuery(nextCountry.name);
    setOpen(false);
    startTransition(() => {
      router.push(`/country/${nextCountry.code}`);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolvedCountry = resolveCountryInput(query) ?? (matches.length === 1 ? matches[0] : null);

    if (resolvedCountry) {
      navigateToCountry(resolvedCountry.code);
      return;
    }

    if (!deferredQuery.trim()) {
      startTransition(() => {
        router.push("/");
      });
    }
  }

  return (
    <div className={cn("relative z-[70] w-full max-w-3xl", props.className)}>
      <form onSubmit={handleSubmit} className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-2 shadow-panel backdrop-blur-xl">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex min-w-0 items-center gap-3 rounded-[0.8rem] border border-white/10 bg-black/25 px-4 py-3">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-primary/78">Country</span>
            <div className="h-4 w-px bg-white/10" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              placeholder="Search country or ISO code"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/35"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-[0.8rem] bg-primary px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-primary-foreground transition hover:brightness-110">
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
                startTransition(() => {
                  router.push("/");
                });
              }}
              className="rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm uppercase tracking-[0.14em] text-ink/75 transition hover:border-white/20 hover:text-ink"
            >
              Global
            </button>
          </div>
        </div>
      </form>

      {open && deferredQuery.trim() ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-[80] max-h-[22rem] overflow-y-auto rounded-[1rem] border border-white/10 bg-card/95 p-2 shadow-panel backdrop-blur-xl">
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-ink/55">No country match.</p>
          ) : (
            <ul className="space-y-1">
              {matches.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onMouseDown={() => navigateToCountry(country.code)}
                    className="flex w-full items-center justify-between rounded-[0.8rem] px-3 py-3 text-left text-sm text-ink/80 transition hover:bg-white/[0.05] hover:text-ink"
                  >
                    <span>{country.name}</span>
                    <span className="font-mono text-xs uppercase tracking-[0.24em] text-primary/75">{country.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}