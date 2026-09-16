import type { ModFrequencyPricingData } from "./mod-frequency-pricing-types";
import raw from "./mod-frequency-pricing.json";

const data = raw as ModFrequencyPricingData;

export function getModFrequencyPricing(): ModFrequencyPricingData {
  return data;
}
