import type { ModPortfolioPricingData } from "./mod-portfolio-pricing-types";
import raw from "./mod-portfolio-pricing.json";

const data = raw as ModPortfolioPricingData;

export function getModPortfolioPricing(): ModPortfolioPricingData {
  return data;
}
