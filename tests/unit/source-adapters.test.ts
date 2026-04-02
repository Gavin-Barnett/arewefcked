import { starterCountries } from "@/lib/countries/starter-countries";
import { currentNewsAdapter, dedupeCurrentNewsEvents } from "@/lib/sources/current-news";
import { gdeltAdapter } from "@/lib/sources/gdelt";
import { globalMonitorPoints } from "@/lib/sources/monitor-points";
import { openMeteoAdapter } from "@/lib/sources/openmeteo";
import { usgsAdapter } from "@/lib/sources/usgs";
import { whoDonAdapter } from "@/lib/sources/who-don";
import { worldBankAdapter } from "@/lib/sources/world-bank";
import type { NormalizedEvent } from "@/lib/types/score";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

function xmlResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/rss+xml" }
  });
}

function worldBankResponse(indicatorId: string, indicatorLabel: string, countryCode: string, countryName: string, value: number | null, date = "2024") {
  return [
    {
      page: 1,
      pages: 1,
      per_page: 4,
      total: 1,
      sourceid: "2",
      lastupdated: "2026-02-24"
    },
    [
      {
        indicator: {
          id: indicatorId,
          value: indicatorLabel
        },
        country: {
          id: countryCode,
          value: countryName
        },
        countryiso3code: `${countryCode}X`,
        date,
        value,
        unit: "",
        obs_status: "",
        decimal: 1
      }
    ]
  ];
}

describe("source adapters", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes USGS earthquake responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          metadata: {
            generated: Date.now(),
            title: "USGS Feed",
            url: "https://earthquake.usgs.gov/"
          },
          features: [
            {
              id: "quake-1",
              properties: {
                mag: 6.2,
                place: "100 km S of Test City",
                time: Date.now(),
                url: "https://earthquake.usgs.gov/test",
                sig: 620,
                felt: 12,
                tsunami: 0,
                alert: null,
                title: "M 6.2 - 100 km S of Test City"
              },
              geometry: {
                coordinates: [10, 20, 30]
              }
            }
          ]
        })
      )
    );

    const result = await usgsAdapter.fetch({ mode: "global" });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.domain).toBe("natural_disaster");
    expect(result.health.status).toBe("operational");
  });

  it("normalizes Open-Meteo monitoring responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("air-quality")) {
          return Promise.resolve(
            jsonResponse({
              latitude: 0,
              longitude: 0,
              current: {
                time: new Date().toISOString(),
                us_aqi: 92,
                pm2_5: 34,
                pm10: 46,
                ozone: 12
              }
            })
          );
        }

        return Promise.resolve(
          jsonResponse({
            latitude: 0,
            longitude: 0,
            current: {
              time: new Date().toISOString(),
              temperature_2m: 31,
              apparent_temperature: 35,
              wind_speed_10m: 14,
              weather_code: 2
            }
          })
        );
      })
    );

    const result = await openMeteoAdapter.fetch({ mode: "global" });

    expect(result.events).toHaveLength(globalMonitorPoints.length);
    expect(result.events[0]?.domain).toBe("climate_environment");
    expect(result.health.status).toBe("operational");
  });

  it("keeps successful Open-Meteo points when some points fail", async () => {
    let weatherCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("air-quality")) {
          return Promise.resolve(
            jsonResponse({
              latitude: 0,
              longitude: 0,
              current: {
                time: new Date().toISOString(),
                us_aqi: 55,
                pm2_5: 18,
                pm10: 20,
                ozone: 10
              }
            })
          );
        }

        weatherCalls += 1;

        if (weatherCalls === 1) {
          return Promise.reject(new Error("timeout"));
        }

        return Promise.resolve(
          jsonResponse({
            latitude: 0,
            longitude: 0,
            current: {
              time: new Date().toISOString(),
              temperature_2m: 28,
              apparent_temperature: 31,
              wind_speed_10m: 12,
              weather_code: 2
            }
          })
        );
      })
    );

    const result = await openMeteoAdapter.fetch({ mode: "global" });

    expect(result.health.status).toBe("degraded");
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events.length).toBeLessThan(globalMonitorPoints.length);
  });

  it("normalizes GDELT article monitoring and dedupes overlapping domain hits", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse({
            articles: [
              {
                url: "https://example.com/ukraine-strike",
                title: "Missile strike and sanctions pressure hit Ukraine",
                seendate: "20260402T120000Z",
                domain: "example.com",
                language: "English",
                sourcecountry: "US"
              }
            ]
          })
        )
      )
    );

    const result = await gdeltAdapter.fetch({ mode: "country", country: starterCountries.find((country) => country.code === "UA")! });

    expect(result.health.status).toBe("operational");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.countryCodes).toContain("UA");
    expect(result.events[0]?.domain).toBe("conflict_security");
  });

  it("normalizes WHO outbreak responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          value: [
            {
              Id: "who-1",
              Title: "Mpox update - United Kingdom",
              ItemDefaultUrl: "/2026-DON595",
              PublicationDate: new Date().toISOString(),
              Summary: "WHO confirmed a new mpox development in the United Kingdom.",
              Overview: "The United Kingdom is investigating additional exposures.",
              Assessment: "WHO assesses the public health risk as moderate."
            }
          ]
        })
      )
    );

    const result = await whoDonAdapter.fetch({ mode: "global" });

    expect(result.health.status).toBe("operational");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.domain).toBe("public_health");
    expect(result.events[0]?.countryCodes).toContain("GB");
  });

  it("aggregates World Bank indicators into country macro signals and degrades gracefully on partial failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("FP.CPI.TOTL.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("FP.CPI.TOTL.ZG", "Inflation, consumer prices (annual %)", "UA", "Ukraine", 12.8)));
        }

        if (url.includes("SL.UEM.TOTL.ZS")) {
          return Promise.reject(new Error("temporary world bank timeout"));
        }

        if (url.includes("NY.GDP.MKTP.KD.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("NY.GDP.MKTP.KD.ZG", "GDP growth (annual %)", "UA", "Ukraine", -3.4)));
        }

        return Promise.resolve(jsonResponse(worldBankResponse("TM.VAL.FUEL.ZS.UN", "Fuel imports (% of merchandise imports)", "UA", "Ukraine", 12.6)));
      })
    );

    const result = await worldBankAdapter.fetch({ mode: "country", country: starterCountries.find((country) => country.code === "UA")! });

    expect(result.health.status).toBe("degraded");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.domain).toBe("macroeconomic");
    expect(result.events[0]?.summary).toContain("inflation");
  });

  it("dedupes duplicate current-news stories and survives partial feed failure", async () => {
    let callCount = 0;
    const publishedAt = new Date().toUTCString();
    const feed = `
      <rss>
        <channel>
          <lastBuildDate>${publishedAt}</lastBuildDate>
          <item>
            <title>War escalates near border - Example News</title>
            <link>https://example.com/story</link>
            <pubDate>${publishedAt}</pubDate>
            <description>Missile attack and war escalation continue.</description>
            <source url="https://example.com">Example News</source>
          </item>
        </channel>
      </rss>
    `;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount += 1;

        if (callCount <= 2) {
          return Promise.resolve(xmlResponse(feed));
        }

        return Promise.reject(new Error("rss failure"));
      })
    );

    const result = await currentNewsAdapter.fetch({ mode: "global" });

    expect(result.health.status).toBe("degraded");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.countryCodes).toEqual([starterCountries[0]?.code, starterCountries[1]?.code]);
  });

  it("keeps indirect war spillover headlines out of direct conflict scoring", async () => {
    const publishedAt = new Date().toUTCString();
    const feed = `
      <rss>
        <channel>
          <lastBuildDate>${publishedAt}</lastBuildDate>
          <item>
            <title>South Korea CPI inflation rises 2.2% in March as Iran war drives energy costs - Example News</title>
            <link>https://example.com/kr-inflation</link>
            <pubDate>${publishedAt}</pubDate>
            <description>Inflation, energy prices and oil costs are rising.</description>
            <source url="https://example.com">Example News</source>
          </item>
          <item>
            <title>Stocks rally worldwide and oil prices ease on the hopes for a possible end to Iran war - Example News</title>
            <link>https://example.com/kr-rally</link>
            <pubDate>${publishedAt}</pubDate>
            <description>Markets rally as oil prices ease and relief spreads.</description>
            <source url="https://example.com">Example News</source>
          </item>
          <item>
            <title>South Korea resumes remains recovery at major Korean War battle site in DMZ - Example News</title>
            <link>https://example.com/kr-history</link>
            <pubDate>${publishedAt}</pubDate>
            <description>Historical remains recovery at a memorial site.</description>
            <source url="https://example.com">Example News</source>
          </item>
        </channel>
      </rss>
    `;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse(feed)));

    const result = await currentNewsAdapter.fetch({ mode: "country", country: starterCountries.find((country) => country.code === "KR")! });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.domain).toBe("macroeconomic");
    expect(result.events[0]?.title).toContain("inflation rises");
  });

  it("does not pin WHO global updates onto countries named only in supporting text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          value: [
            {
              Id: "who-global-1",
              Title: "Middle East respiratory syndrome coronavirus - Global update",
              ItemDefaultUrl: "/2025-DON591",
              PublicationDate: new Date().toISOString(),
              Summary: "WHO reports a global update with cases in Saudi Arabia and France.",
              Overview: "Historical references include the Republic of Korea and other previously affected countries.",
              Assessment: "WHO assesses the public health risk as moderate."
            }
          ]
        })
      )
    );

    const result = await whoDonAdapter.fetch({ mode: "global" });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.countryCodes).toEqual([]);
  });

  it("merges duplicate current-news events across countries", () => {
    const events: NormalizedEvent[] = [
      {
        id: "a",
        source: "current_news",
        sourceType: "news",
        title: "Border attack intensifies",
        summary: "First summary",
        url: "https://example.com/story",
        countryCodes: ["UA"],
        occurredAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
        ingestedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
        domain: "conflict_security",
        severityRaw: 40,
        severityNormalized: 60,
        confidence: 0.42,
        tags: ["Example News", "war"],
        metadata: { publisher: "Example News" }
      },
      {
        id: "b",
        source: "current_news",
        sourceType: "news",
        title: "Border attack intensifies",
        summary: "Second summary",
        url: "https://example.com/story",
        countryCodes: ["RU"],
        occurredAt: new Date("2026-04-01T02:00:00.000Z").toISOString(),
        ingestedAt: new Date("2026-04-01T02:00:00.000Z").toISOString(),
        domain: "conflict_security",
        severityRaw: 44,
        severityNormalized: 68,
        confidence: 0.42,
        tags: ["Example News", "missile"],
        metadata: { publisher: "Example News" }
      }
    ];

    const merged = dedupeCurrentNewsEvents(events);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.countryCodes).toEqual(["UA", "RU"]);
    expect(merged[0]?.severityNormalized).toBe(68);
    expect(merged[0]?.tags).toContain("missile");
  });
});


