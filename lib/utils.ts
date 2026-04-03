import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function hashString(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string"
    ? new Date(value).toISOString()
    : value.toISOString();
}

export function directionFromDelta(delta: number | null) {
  if (delta === null) {
    return "flat" as const;
  }

  if (delta > 0.25) {
    return "up" as const;
  }

  if (delta < -0.25) {
    return "down" as const;
  }

  return "flat" as const;
}
