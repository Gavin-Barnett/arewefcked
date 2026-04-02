import Link from "next/link";
import { starterCountries } from "@/lib/countries/starter-countries";
import { Panel } from "@/components/panel";

export function CountryLinks() {
  return (
    <Panel eyebrow="Country mode" title="Starter country coverage">
      <p className="max-w-3xl text-sm leading-6 text-ink/70">
        Phase one country pages are intentionally narrow. They use focal-city climate data and a nearby seismic approximation where available, then say so plainly.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {starterCountries.map((country) => (
          <Link
            key={country.code}
            href={`/country/${country.code}`}
            className="rounded-full border border-line bg-haze/70 px-4 py-2 text-sm text-ink/80 transition hover:border-sky/50 hover:text-ink"
          >
            {country.name}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
