"use client";

import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  getCountryByCode,
  resolveCountryInput,
  searchCountries,
} from "@/lib/countries/starter-countries";
import { cn } from "@/lib/utils";

export function CountryAutocomplete(props: {
  currentCountryCode?: string;
  className?: string;
}) {
  const router = useRouter();
  const initialQuery = props.currentCountryCode
    ? (getCountryByCode(props.currentCountryCode)?.name ??
      props.currentCountryCode)
    : "";
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
    const resolvedCountry =
      resolveCountryInput(query) ?? (matches.length === 1 ? matches[0] : null);

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
      <form
        className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-2 shadow-panel backdrop-blur-xl"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex min-w-0 items-center gap-3 rounded-[0.8rem] border border-white/10 bg-black/25 px-4 py-3">
            <span className="font-mono text-[0.68rem] text-primary/78 uppercase tracking-[0.34em]">
              Country
            </span>
            <div className="h-4 w-px bg-white/10" />
            <input
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/35"
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search country or ISO code"
              value={query}
            />
          </label>
          <div className="flex gap-2">
            <button
              className="rounded-[0.8rem] bg-primary px-4 py-3 font-medium text-primary-foreground text-sm uppercase tracking-[0.14em] transition hover:brightness-110"
              type="submit"
            >
              Search
            </button>
            <button
              className="rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-ink/75 text-sm uppercase tracking-[0.14em] transition hover:border-white/20 hover:text-ink"
              onClick={() => {
                setQuery("");
                setOpen(false);
                startTransition(() => {
                  router.push("/");
                });
              }}
              type="button"
            >
              Global
            </button>
          </div>
        </div>
      </form>

      {open && deferredQuery.trim() ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-[80] max-h-[22rem] overflow-y-auto rounded-[1rem] border border-white/10 bg-card/95 p-2 shadow-panel backdrop-blur-xl">
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-ink/55 text-sm">No country match.</p>
          ) : (
            <ul className="space-y-1">
              {matches.map((country) => (
                <li key={country.code}>
                  <button
                    className="flex w-full items-center justify-between rounded-[0.8rem] px-3 py-3 text-left text-ink/80 text-sm transition hover:bg-white/[0.05] hover:text-ink"
                    onMouseDown={() => navigateToCountry(country.code)}
                    type="button"
                  >
                    <span>{country.name}</span>
                    <span className="font-mono text-primary/75 text-xs uppercase tracking-[0.24em]">
                      {country.code}
                    </span>
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
