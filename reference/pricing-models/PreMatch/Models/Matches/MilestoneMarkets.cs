using PremiumCricket.Lib.Pricing.Lookups;
namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class FiftyInnings : MilestoneMarketModel
{
    public FiftyInnings(ILookupProvider lookupProvider) : base(
        lookupProvider,
        marketName: "Fifty in First Innings",
        marketCode: "61BARUA",
        marketId: 700,
        legacyMarketId: 60,
        getProbability: inputs => inputs.Evaluation.MatchEvaluation.FiftyInnings,
        getAdjustment: inputs => inputs.AdjustmentsPM.MatchAdjustments.FirstInningsFifty,
        includeInningsSpecifier: true)
    {
    }
}

public class HundredInnings : MilestoneMarketModel
{
    public HundredInnings(ILookupProvider lookupProvider) : base(
        lookupProvider,
        marketName: "Hundred in First Innings",
        marketCode: "HUNDIN",
        marketId: 700,
        legacyMarketId: 60,
        getProbability: inputs => inputs.Evaluation.MatchEvaluation.HundredInnings,
        getAdjustment: inputs => inputs.AdjustmentsPM.MatchAdjustments.FirstInningsHundred,
        includeInningsSpecifier: true)
    {
    }
}

public class HundredMatch : MilestoneMarketModel
{
    public HundredMatch(ILookupProvider lookupProvider) : base(
        lookupProvider,
        marketName: "Hundred in Match",
        marketCode: "62BARUA",
        marketId: 701,
        legacyMarketId: 61,
        getProbability: inputs => inputs.Evaluation.MatchEvaluation.HundredMatch,
        getAdjustment: inputs => inputs.AdjustmentsPM.MatchAdjustments.MatchHundred,
        includeInningsSpecifier: false)
    {
    }
}
