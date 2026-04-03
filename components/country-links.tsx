import Link from "next/link";
import { Panel } from "@/components/panel";
import { starterCountries } from "@/lib/countries/starter-countries";

export function CountryLinks() {
  return (
    <Panel eyebrow="Country mode" title="Starter country coverage">
      <p className="max-w-3xl text-ink/70 text-sm leading-6">
        Phase one country pages are intentionally narrow. They use focal-city
        climate data and a nearby seismic approximation where available, then
        say so plainly.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {starterCountries.map((country) => (
          <Link
            className="rounded-full border border-line bg-haze/70 px-4 py-2 text-ink/80 text-sm transition hover:border-sky/50 hover:text-ink"
            href={`/country/${country.code}`}
            key={country.code}
          >
            {country.name}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
