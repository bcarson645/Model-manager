using PremiumCricket.Lib.Pricing.Lookups;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Groups;

public abstract class GroupStandardMarketPricingModel : StandardMarketPricingModel
{
    protected GroupStandardMarketPricingModel(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    protected int[] GetOverGroups(string format) =>
        format switch
        {
            Constants.Format.T20 => new[] { 6, 8, 10 },
            Constants.Format.T10 => new[] { 4, 6 },
            _ => new[] { 5, 10, 15 }
        };
}
