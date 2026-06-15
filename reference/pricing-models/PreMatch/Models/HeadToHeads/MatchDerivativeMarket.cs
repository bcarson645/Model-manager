using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

public abstract class MatchDerivativeMarket : HeadStandardMarketPricingModel
{
    protected MatchDerivativeMarket(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }
    
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var matchMarket = new MatchBetting(LookupProvider);
        return GetMarkets(inputs, matchMarket.GetMarkets(inputs).First());
    }

    public IList<Market> GetMarkets(IPricingInputs inputs, Market matchMarket) => 
        new List<Market> { CreateMarket(inputs, matchMarket) };

    protected abstract Market CreateMarket(IPricingInputs inputs, Market matchMarket);
}
