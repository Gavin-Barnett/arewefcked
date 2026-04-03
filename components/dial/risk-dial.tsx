"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { getSeverityTheme } from "@/lib/scoring/severity-theme";
import { clamp, round } from "@/lib/utils";

type Point = { x: number; y: number };

const dialBands = [
  "#2f6f4d",
  "#3e8657",
  "#5b9a4f",
  "#84a946",
  "#c89a34",
  "#de7d24",
  "#d95f23",
  "#c64922",
  "#a8351f",
  "#7e2319",
] as const;

function polar(cx: number, cy: number, radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function wedgePath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polar(cx, cy, outerRadius, startAngle);
  const outerEnd = polar(cx, cy, outerRadius, endAngle);
  const innerEnd = polar(cx, cy, innerRadius, endAngle);
  const innerStart = polar(cx, cy, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function semicirclePath(cx: number, cy: number, radius: number) {
  const left = polar(cx, cy, radius, 180);
  const right = polar(cx, cy, radius, 360);

  return [
    `M ${left.x} ${left.y}`,
    `A ${radius} ${radius} 0 0 1 ${right.x} ${right.y}`,
    `L ${right.x} ${cy}`,
    `L ${left.x} ${cy}`,
    "Z",
  ].join(" ");
}

function toneForScore(score: number) {
  if (score >= 70) {
    return "danger" as const;
  }
  if (score >= 30) {
    return "warning" as const;
  }
  return "success" as const;
}

function freshnessLabel(freshness: string) {
  switch (freshness) {
    case "live-ish":
      return "Live";
    case "fresh":
      return "Fresh";
    case "delayed":
      return "Source delay";
    case "stale":
      return "Stale";
    default:
      return freshness.replaceAll("-", " ");
  }
}

function shouldReduceMotion() {
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

export function RiskDial(props: {
  score: number;
  shortLabel: string;
  confidence: number;
  freshness: string;
  scopeLabel?: string;
}) {
  const score = round(props.score, 1);
  const normalizedScore = clamp(score, 0, 100);
  const [animatedScore, setAnimatedScore] = useState(() =>
    process.env.NODE_ENV === "test" ? normalizedScore : 0
  );
  const theme = getSeverityTheme(normalizedScore);
  const displayScore = round(animatedScore, 1);
  const currentBand = Math.min(
    9,
    Math.floor(Math.min(animatedScore, 99.999) / 10)
  );
  const cx = 360;
  const cy = 330;
  const outerRadius = 314;
  const innerRadius = 178;
  const hubRadius = 140;
  const pointerAngle = 180 + clamp(animatedScore, 0, 100) * 1.8;
  const pointerEnd = polar(cx, cy, outerRadius - 18, pointerAngle);
  const labelTone = toneForScore(normalizedScore);
  const idBase = `dial-${(props.scopeLabel ?? "global").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const freshnessText = freshnessLabel(props.freshness);

  useEffect(() => {
    if (shouldReduceMotion()) {
      setAnimatedScore(normalizedScore);
      return;
    }

    let frame = 0;
    const durationMs = 1500;
    const startAt = performance.now();
    setAnimatedScore(0);

    const tick = (now: number) => {
      const progress = Math.min((now - startAt) / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      setAnimatedScore(normalizedScore * easedProgress);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [normalizedScore]);

  return (
    <div className="relative mx-auto w-full max-w-[36rem] xl:max-w-[38rem]">
      <div
        aria-hidden
        className="absolute inset-x-[18%] top-[10%] h-24 rounded-full blur-3xl"
        style={{ background: theme.glow }}
      />

      <div className="relative">
        <svg
          aria-label={`${props.scopeLabel ?? "Global score"}: ${score} out of 100, ${props.shortLabel}, ${Math.round(props.confidence * 100)} percent confidence, ${freshnessText}`}
          className="relative w-full drop-shadow-[0_34px_90px_rgba(0,0,0,0.55)]"
          role="img"
          viewBox="0 0 720 392"
        >
          <defs>
            <linearGradient
              id={`${idBase}-pointer`}
              x1="0%"
              x2="100%"
              y1="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor={theme.needleStart} />
              <stop offset="100%" stopColor={theme.needleEnd} />
            </linearGradient>
            <linearGradient
              id={`${idBase}-hub`}
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={theme.hubTop} />
              <stop offset="100%" stopColor={theme.hubBottom} />
            </linearGradient>
          </defs>

          <g className="animate-dial-body-in">
            <path
              d={wedgePath(cx, cy, innerRadius - 10, outerRadius + 8, 180, 360)}
              fill="rgba(0,0,0,0.34)"
            />
            {dialBands.map((color, index) => (
              <path
                d={wedgePath(
                  cx,
                  cy,
                  innerRadius,
                  outerRadius,
                  180 + index * 18 + 0.7,
                  180 + (index + 1) * 18 - 0.7
                )}
                fill={color}
                key={color}
                opacity={animatedScore >= index * 10 ? 0.98 : 0.78}
                stroke={
                  index === currentBand ? theme.outline : "rgba(10,10,12,0.72)"
                }
                strokeWidth={index === currentBand ? 4 : 2.5}
              />
            ))}
            <path
              d={semicirclePath(cx, cy, hubRadius)}
              fill={`url(#${idBase}-hub)`}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={2}
            />
          </g>

          <g>
            <line
              stroke={`url(#${idBase}-pointer)`}
              strokeLinecap="round"
              strokeWidth={14}
              x1={cx}
              x2={pointerEnd.x}
              y1={cy}
              y2={pointerEnd.y}
            />
            <circle
              cx={cx}
              cy={cy}
              fill="#09090b"
              r={16}
              stroke="rgba(255,255,255,0.32)"
              strokeWidth={4}
            />
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-[70%] z-10 flex -translate-y-1/2 justify-center px-4 sm:top-[69%]">
          <div className="w-full max-w-[16rem] text-center">
            <p className="dial-score-shadow font-mono font-semibold text-[clamp(2.9rem,6.3vw,4.1rem)] text-ink leading-[0.92] tracking-tight">
              {displayScore.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="dial-meta-shadow -mt-1 text-center">
        <div className="flex justify-center">
          <StatusPill label={props.shortLabel} tone={labelTone} />
        </div>
        <p className="mt-4 font-mono text-[0.68rem] text-ink/60 uppercase tracking-[0.3em]">
          {props.scopeLabel ?? "Live global severity index"}
        </p>
        <div className="mt-2 flex items-center justify-center text-[0.72rem] text-ink/54 uppercase tracking-[0.18em]">
          <span>{Math.round(props.confidence * 100)}% confidence</span>
        </div>
      </div>
    </div>
  );
}
