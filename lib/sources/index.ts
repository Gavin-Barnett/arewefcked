import { currentNewsAdapter } from "@/lib/sources/current-news";
import { gdeltAdapter } from "@/lib/sources/gdelt";
import { ochaOptAdapter } from "@/lib/sources/ocha-opt";
import { openMeteoAdapter } from "@/lib/sources/openmeteo";
import { usgsAdapter } from "@/lib/sources/usgs";
import { whoDonAdapter } from "@/lib/sources/who-don";
import { worldBankAdapter } from "@/lib/sources/world-bank";

export const activeSourceAdapters = [
  usgsAdapter,
  openMeteoAdapter,
  gdeltAdapter,
  whoDonAdapter,
  worldBankAdapter,
  ochaOptAdapter,
  currentNewsAdapter,
];
