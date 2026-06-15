using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes.YesNo;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class TiedMatch : StandardMarketPricingModel
{
    private const string MarketName = "Tied Match";
    private const string MarketCode = "64PINB";

    public TiedMatch(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 999;

    public override int GetLegacyMarketId() => 41;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var matchMarket = new MatchBetting(LookupProvider);
        var matchOdds = matchMarket.GetMatchOdds(inputs).ToArray();
        var priceDiff = Math.Abs(0.5 - matchOdds[0].Probability) * 2;

        var tiedMatchPrice = inputs.Evaluation.MatchEvaluation.Format switch
        {
            Constants.Format.T10 => 0.02,
            Constants.Format.T20 => 0.02 - 0.02 * priceDiff,
            Constants.Format.ODI => 0.013 - 0.01 * priceDiff,
            _ => 0.001
        };

        var adjust = inputs.AdjustmentsPM.MatchAdjustments.TiedMatch;

        tiedMatchPrice += adjust / 100.0;
            
        var outcomes = new List<Outcome>
        {
            new YesOutcome(tiedMatchPrice),
            new NoOutcome(1 - tiedMatchPrice)
        };

        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, new List<Specifier>(), MarketCode)
        };
    }
}
