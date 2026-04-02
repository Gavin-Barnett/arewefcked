import type { RiskDomain } from "@/lib/types/score";

export const domainWeights: Record<RiskDomain, number> = {
  conflict_security: 0.22,
  civil_unrest: 0.14,
  macroeconomic: 0.14,
  public_health: 0.1,
  natural_disaster: 0.13,
  climate_environment: 0.1,
  cyber_infra: 0.09,
  governance: 0.08
};

export const domainLabels: Record<RiskDomain, string> = {
  conflict_security: "Conflict & security",
  civil_unrest: "Civil unrest",
  macroeconomic: "Macroeconomic stress",
  public_health: "Public health",
  natural_disaster: "Natural disasters",
  climate_environment: "Climate & environment",
  cyber_infra: "Cyber & infrastructure",
  governance: "Governance"
};
