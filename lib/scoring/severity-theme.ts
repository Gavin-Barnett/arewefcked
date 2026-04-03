import { clamp } from "@/lib/utils";

export type SeverityTheme = {
  primary: string;
  glow: string;
  glowSoft: string;
  topWash: string;
  needleStart: string;
  needleEnd: string;
  hubTop: string;
  hubBottom: string;
  outline: string;
};

const severityThemes: Array<{ max: number; theme: SeverityTheme }> = [
  {
    max: 19,
    theme: {
      primary: "142 57% 46%",
      glow: "rgba(34, 197, 94, 0.26)",
      glowSoft: "rgba(20, 83, 45, 0.18)",
      topWash: "rgba(16, 185, 129, 0.12)",
      needleStart: "#eefee7",
      needleEnd: "#86efac",
      hubTop: "#0d1611",
      hubBottom: "#040806",
      outline: "rgba(134, 239, 172, 0.35)",
    },
  },
  {
    max: 39,
    theme: {
      primary: "84 77% 52%",
      glow: "rgba(163, 230, 53, 0.26)",
      glowSoft: "rgba(101, 163, 13, 0.18)",
      topWash: "rgba(234, 179, 8, 0.1)",
      needleStart: "#fff9dd",
      needleEnd: "#bef264",
      hubTop: "#15170c",
      hubBottom: "#060704",
      outline: "rgba(190, 242, 100, 0.34)",
    },
  },
  {
    max: 59,
    theme: {
      primary: "40 96% 58%",
      glow: "rgba(251, 191, 36, 0.28)",
      glowSoft: "rgba(180, 83, 9, 0.2)",
      topWash: "rgba(245, 158, 11, 0.12)",
      needleStart: "#fff1d2",
      needleEnd: "#fbbf24",
      hubTop: "#181008",
      hubBottom: "#060403",
      outline: "rgba(251, 191, 36, 0.36)",
    },
  },
  {
    max: 79,
    theme: {
      primary: "24 95% 56%",
      glow: "rgba(249, 115, 22, 0.3)",
      glowSoft: "rgba(194, 65, 12, 0.2)",
      topWash: "rgba(249, 115, 22, 0.13)",
      needleStart: "#ffead5",
      needleEnd: "#fb923c",
      hubTop: "#1a0d08",
      hubBottom: "#050302",
      outline: "rgba(251, 146, 60, 0.36)",
    },
  },
  {
    max: 100,
    theme: {
      primary: "6 79% 57%",
      glow: "rgba(239, 68, 68, 0.3)",
      glowSoft: "rgba(153, 27, 27, 0.22)",
      topWash: "rgba(239, 68, 68, 0.13)",
      needleStart: "#ffe1de",
      needleEnd: "#f87171",
      hubTop: "#180909",
      hubBottom: "#050202",
      outline: "rgba(248, 113, 113, 0.36)",
    },
  },
];

export function getSeverityTheme(score: number) {
  const normalized = clamp(score, 0, 100);
  return (
    severityThemes.find((entry) => normalized <= entry.max)?.theme ??
    severityThemes.at(-1)?.theme ??
    severityThemes[0].theme
  );
}
