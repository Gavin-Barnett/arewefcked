import { buildScoreSnapshot } from "@/lib/scoring/engine";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Current news</title>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <item>
      <title>Missile strikes intensify near major Ukrainian cities - Example Outlet</title>
      <link>https://news.example.com/ukraine</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Recent attacks continue as sanctions pressure grows.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
  </channel>
</rss>`;

const ukraineConflictRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Ukraine feed</title>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <item>
      <title>Missile strikes intensify near major Ukrainian cities - Example Outlet</title>
      <link>https://news.example.com/ukraine-1</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Missile and drone attacks continue as the war grinds on.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
    <item>
      <title>Frontline war pressure grows across eastern Ukraine - Example Outlet</title>
      <link>https://news.example.com/ukraine-2</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Shelling and drone attacks intensify near the frontline.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
    <item>
      <title>Airstrike damage mounts as Ukraine war enters another hard week - Example Outlet</title>
      <link>https://news.example.com/ukraine-3</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Airstrike damage and bombardment continue amid wider conflict pressure.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
  </channel>
</rss>`;

const israelConflictRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Israel feed</title>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <item>
      <title>Israel and Iran exchange missile fire as war enters another week - Example Outlet</title>
      <link>https://news.example.com/israel-1</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Missile attacks continue around Tel Aviv as the war with Iran intensifies.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
    <item>
      <title>IDF says attacks continue as Tehran launches drones toward Tel Aviv - Example Outlet</title>
      <link>https://news.example.com/israel-2</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Drone and missile fire continued overnight.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
    <item>
      <title>Netanyahu warns the regional war is expanding after more strikes - Example Outlet</title>
      <link>https://news.example.com/israel-3</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Military strikes and casualties continue across Israel and Gaza.</description>
      <source url="https://news.example.com">Example Outlet</source>
    </item>
  </channel>
</rss>`;

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

describe("score snapshot", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a denser global snapshot when measured health and macro feeds are live", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("earthquake.usgs.gov")) {
          return Promise.resolve(
            jsonResponse({
              metadata: {
                generated: Date.now(),
                title: "USGS Feed",
                url: "https://earthquake.usgs.gov/",
                count: 1
              },
              features: [
                {
                  id: "quake-1",
                  properties: {
                    mag: 6.1,
                    place: "Near Test Region",
                    time: Date.now(),
                    url: "https://earthquake.usgs.gov/test",
                    sig: 610,
                    felt: 4,
                    tsunami: 0,
                    alert: null,
                    title: "M 6.1 - Near Test Region"
                  },
                  geometry: {
                    coordinates: [10, 20, 30]
                  }
                }
              ]
            })
          );
        }

        if (url.includes("news.google.com")) {
          return Promise.resolve(new Response(sampleRss, { status: 200, headers: { "Content-Type": "application/rss+xml" } }));
        }

        if (url.includes("api.gdeltproject.org")) {
          return Promise.resolve(
            jsonResponse({
              articles: [
                {
                  url: "https://example.com/ukraine-conflict",
                  title: "Missile strikes escalate in Ukraine",
                  seendate: "20260402T120000Z",
                  domain: "example.com",
                  language: "English",
                  sourcecountry: "US"
                }
              ]
            })
          );
        }

        if (url.includes("diseaseoutbreaknews")) {
          return Promise.resolve(
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
          );
        }

        if (url.includes("FP.CPI.TOTL.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("FP.CPI.TOTL.ZG", "Inflation, consumer prices (annual %)", "UA", "Ukraine", 12.8)));
        }

        if (url.includes("SL.UEM.TOTL.ZS")) {
          return Promise.resolve(jsonResponse(worldBankResponse("SL.UEM.TOTL.ZS", "Unemployment, total (% of total labor force)", "UA", "Ukraine", 8.6)));
        }

        if (url.includes("NY.GDP.MKTP.KD.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("NY.GDP.MKTP.KD.ZG", "GDP growth (annual %)", "UA", "Ukraine", -3.4)));
        }

        if (url.includes("TM.VAL.FUEL.ZS.UN")) {
          return Promise.resolve(jsonResponse(worldBankResponse("TM.VAL.FUEL.ZS.UN", "Fuel imports (% of merchandise imports)", "UA", "Ukraine", 12.6)));
        }

        if (url.includes("air-quality")) {
          return Promise.resolve(
            jsonResponse({
              latitude: 0,
              longitude: 0,
              current: {
                time: new Date().toISOString(),
                us_aqi: 88,
                pm2_5: 28,
                pm10: 42,
                ozone: 16
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
              temperature_2m: 29,
              apparent_temperature: 33,
              wind_speed_10m: 18,
              weather_code: 2
            }
          })
        );
      })
    );

    const snapshot = await buildScoreSnapshot({ scope: "global" });

    expect(snapshot.scope).toBe("global");
    expect(snapshot.sparseData).toBe(false);
    expect(snapshot.domainBreakdown.find((item) => item.domain === "natural_disaster")?.coverage).toBe("measured");
    expect(snapshot.domainBreakdown.find((item) => item.domain === "climate_environment")?.coverage).toBe("measured");
    expect(snapshot.domainBreakdown.find((item) => item.domain === "macroeconomic")?.coverage).toBe("measured");
    expect(snapshot.domainBreakdown.find((item) => item.domain === "public_health")?.coverage).toBe("measured");
    expect(snapshot.domainBreakdown.find((item) => item.domain === "governance")?.coverage).toBe("sparse");
  });

  it("treats active Israel war coverage as sustained conflict instead of a mild headline spike", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("earthquake.usgs.gov")) {
          return Promise.resolve(
            jsonResponse({
              metadata: {
                generated: Date.now(),
                title: "USGS Feed",
                url: "https://earthquake.usgs.gov/"
              },
              features: []
            })
          );
        }

        if (url.includes("news.google.com")) {
          return Promise.resolve(new Response(israelConflictRss, { status: 200, headers: { "Content-Type": "application/rss+xml" } }));
        }

        if (url.includes("api.gdeltproject.org")) {
          return Promise.reject(new Error("GDELT timeout"));
        }

        if (url.includes("diseaseoutbreaknews")) {
          return Promise.resolve(jsonResponse({ value: [] }));
        }

        if (url.includes("FP.CPI.TOTL.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("FP.CPI.TOTL.ZG", "Inflation, consumer prices (annual %)", "IL", "Israel", 2.8)));
        }

        if (url.includes("SL.UEM.TOTL.ZS")) {
          return Promise.resolve(jsonResponse(worldBankResponse("SL.UEM.TOTL.ZS", "Unemployment, total (% of total labor force)", "IL", "Israel", 3.5)));
        }

        if (url.includes("NY.GDP.MKTP.KD.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("NY.GDP.MKTP.KD.ZG", "GDP growth (annual %)", "IL", "Israel", 1.4)));
        }

        if (url.includes("TM.VAL.FUEL.ZS.UN")) {
          return Promise.resolve(jsonResponse(worldBankResponse("TM.VAL.FUEL.ZS.UN", "Fuel imports (% of merchandise imports)", "IL", "Israel", 6.2)));
        }

        if (url.includes("air-quality")) {
          return Promise.resolve(
            jsonResponse({
              latitude: 0,
              longitude: 0,
              current: {
                time: new Date().toISOString(),
                us_aqi: 58,
                pm2_5: 18,
                pm10: 24,
                ozone: 11
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
              temperature_2m: 24,
              apparent_temperature: 27,
              wind_speed_10m: 8,
              weather_code: 2
            }
          })
        );
      })
    );

    const snapshot = await buildScoreSnapshot({ scope: "country", countryCode: "IL" });
    const conflictDomain = snapshot.domainBreakdown.find((item) => item.domain === "conflict_security");

    expect(snapshot.score).toBeGreaterThan(40);
    expect(snapshot.summaryBullets[2]).toContain("Sustained active-war reporting");
    expect(conflictDomain?.score).toBeGreaterThanOrEqual(80);
    expect(conflictDomain?.confidence).toBeGreaterThanOrEqual(0.58);
    expect(snapshot.evidence.some((item) => item.countryCodes.includes("PS"))).toBe(true);
  });

  it("keeps country scoring focused on direct country evidence and lifts sustained war conditions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("earthquake.usgs.gov")) {
          return Promise.resolve(
            jsonResponse({
              metadata: {
                generated: Date.now(),
                title: "USGS Feed",
                url: "https://earthquake.usgs.gov/"
              },
              features: []
            })
          );
        }

        if (url.includes("news.google.com")) {
          return Promise.resolve(new Response(ukraineConflictRss, { status: 200, headers: { "Content-Type": "application/rss+xml" } }));
        }

        if (url.includes("api.gdeltproject.org")) {
          return Promise.resolve(
            jsonResponse({
              articles: [
                {
                  url: "https://example.com/ukraine-conflict-1",
                  title: "Missile and drone attacks escalate in Ukraine",
                  seendate: "20260402T120000Z",
                  domain: "example.com",
                  language: "English",
                  sourcecountry: "US"
                },
                {
                  url: "https://example.com/ukraine-conflict-2",
                  title: "Ukraine frontline war pressure intensifies",
                  seendate: "20260402T090000Z",
                  domain: "example.com",
                  language: "English",
                  sourcecountry: "GB"
                }
              ]
            })
          );
        }

        if (url.includes("diseaseoutbreaknews")) {
          return Promise.resolve(
            jsonResponse({
              value: [
                {
                  Id: "who-global-1",
                  Title: "Multi-country mpox situation update",
                  ItemDefaultUrl: "/2026-DON600",
                  PublicationDate: new Date().toISOString(),
                  Summary: "WHO is tracking a multi-country mpox situation across several regions.",
                  Overview: "This bulletin does not identify Ukraine specifically.",
                  Assessment: "WHO assesses the public health risk as moderate."
                }
              ]
            })
          );
        }

        if (url.includes("FP.CPI.TOTL.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("FP.CPI.TOTL.ZG", "Inflation, consumer prices (annual %)", "UA", "Ukraine", 12.8)));
        }

        if (url.includes("SL.UEM.TOTL.ZS")) {
          return Promise.resolve(jsonResponse(worldBankResponse("SL.UEM.TOTL.ZS", "Unemployment, total (% of total labor force)", "UA", "Ukraine", 8.6)));
        }

        if (url.includes("NY.GDP.MKTP.KD.ZG")) {
          return Promise.resolve(jsonResponse(worldBankResponse("NY.GDP.MKTP.KD.ZG", "GDP growth (annual %)", "UA", "Ukraine", -3.4)));
        }

        if (url.includes("TM.VAL.FUEL.ZS.UN")) {
          return Promise.resolve(jsonResponse(worldBankResponse("TM.VAL.FUEL.ZS.UN", "Fuel imports (% of merchandise imports)", "UA", "Ukraine", 12.6)));
        }

        if (url.includes("air-quality")) {
          return Promise.resolve(
            jsonResponse({
              latitude: 0,
              longitude: 0,
              current: {
                time: new Date().toISOString(),
                us_aqi: 70,
                pm2_5: 22,
                pm10: 31,
                ozone: 14
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
              temperature_2m: 26,
              apparent_temperature: 29,
              wind_speed_10m: 10,
              weather_code: 2
            }
          })
        );
      })
    );

    const snapshot = await buildScoreSnapshot({ scope: "country", countryCode: "UA" });
    const conflictDomain = snapshot.domainBreakdown.find((item) => item.domain === "conflict_security");
    const macroDomain = snapshot.domainBreakdown.find((item) => item.domain === "macroeconomic");

    expect(snapshot.scope).toBe("country");
    expect(snapshot.countryCode).toBe("UA");
    expect(snapshot.score).toBeGreaterThan(40);
    expect(snapshot.summaryBullets[2]).toContain("Sustained active-war reporting");
    expect(conflictDomain?.score).toBeGreaterThanOrEqual(70);
    expect(conflictDomain?.summary).toContain("sustained active-war stress");
    expect(macroDomain?.score).toBeGreaterThan(0);
    expect(snapshot.evidence.every((item) => item.countryCodes.includes("UA"))).toBe(true);
    expect(snapshot.evidence.some((item) => item.source === "who_don")).toBe(false);
  });
});