using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using PremiumCricket.Lib.Pricing.PricingModels;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchMaxOver : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Max Runs Scored in an Over";
    private const string MarketCode = "54BARUA";
    
    public MatchMaxOver(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }
        
    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 682;

    public override int GetLegacyMarketId() => 44;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var total = inputs.Evaluation.MatchEvaluation.MatchMaxOver + inputs.AdjustmentsPM.MatchAdjustments.MaxRunsInOver;
        
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var maxOverLine = (int) Math.Round(total - 0.8);
        var underProb = new PoissonDistribution(total).GetCumulativeProbability(maxOverLine).Probability;
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(maxOverLine + 0.5)
        };
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
