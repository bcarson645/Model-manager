using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class HighestIndividualScore : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Highest Individual Score";
    private const string MarketCode = "63BARUA";
    
    public HighestIndividualScore(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 702;

    public override int GetLegacyMarketId() => 62;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var highScore = inputs.Evaluation.MatchEvaluation.MatchHighScore;
        var adjust = inputs.AdjustmentsPM.MatchAdjustments.HighestIndividualScore;

        var specifiers = new List<Specifier>
        {
            new LineSpecifier(Math.Round(highScore) + adjust + 0.5),
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable)
        };

        return new List<Market>
        {
            Market.CreateUnderOver(GetMarketName(), GetMarketId(), GetLegacyMarketId(), 0.5, specifiers, MarketCode)
        };
    }
}
