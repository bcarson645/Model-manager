using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchWickets : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Wickets";
    private const string MarketCode = "58BARUA";
    
    public MatchWickets(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 639;

    public override int GetLegacyMarketId() => 57;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        
        var limitedWickets = inputs.Evaluation.GetTeam1Evaluation().WicketsLost + inputs.Evaluation.GetTeam2Evaluation().WicketsLost;
        var testWickets = inputs.Evaluation.MatchEvaluation.MatchWickets;
            
        var total = inputs.IsTestOrFirstClassMatch()
            ? testWickets + inputs.AdjustmentsPM.MatchAdjustments.MatchWickets
            : limitedWickets + inputs.AdjustmentsPM.MatchAdjustments.MatchWickets;
        
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var maxOvers = inputs.MatchState.GetCurrentInnings().OversAvailable;
        var wicketsLine = (int) Math.Round(total - 0.8);
        var wicketVar = GetWicketVar(inputs, total);
        var dist = new PoissonGammaDistribution(total, wicketVar);
        var underProb = dist.GetCumulativeProbability(wicketsLine).Probability;

        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(maxOvers.ToString()),
            new LineSpecifier(wicketsLine + 0.5)
        };
           
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
        
    private static double GetWicketVar(IPricingInputs inputs, double mean)
    {
        var wicketsRemaining = inputs.IsTestOrFirstClassMatch() ? 40 : 20;
        var wicketVar = mean * mean / (-1.54612329915015 * wicketsRemaining);
        return wicketVar + mean;
    }
}
