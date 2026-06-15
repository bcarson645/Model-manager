using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels;

public interface IMatchDerivativeMarket
{
    IList<Market> GetMarkets(IPricingInputs inputs, Market matchMarket);
}
