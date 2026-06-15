using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using PremiumCricket.Lib.Pricing.PricingModels;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchRunOuts : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Run Outs";
    private const string MarketCode = "53BARUA";    
    public MatchRunOuts(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 654;

    public override int GetLegacyMarketId() => 21;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var limitedRunOuts = team1.InningsRunOuts + team2.InningsRunOuts;
        var testRunOuts = inputs.Evaluation.MatchEvaluation.MatchRunOuts;
            
        var total = inputs.IsTestOrFirstClassMatch()
            ? testRunOuts + inputs.AdjustmentsPM.MatchAdjustments.MatchRunOuts/10.0
            : limitedRunOuts + inputs.AdjustmentsPM.MatchAdjustments.MatchRunOuts/10.0;
            
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var runOutLine = (int) Math.Round(total - 0.8);
        var dist = new PoissonDistribution(total);
        var underProb = dist.GetCumulativeProbability(runOutLine).Probability;
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(runOutLine + 0.5)
        };
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
