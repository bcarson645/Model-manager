using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchDucks : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Ducks";
    private const string VarianceParameters = "MatchDucks";
    private const string MarketCode = "55BARUA";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public MatchDucks(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 695;
        
    public override int GetLegacyMarketId() => 55;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var limitedDucks = team1.InningsDucks + team2.InningsDucks;
        var testDucks = inputs.Evaluation.MatchEvaluation.MatchDucks;

        var total = inputs.IsTestOrFirstClassMatch()
            ? testDucks + inputs.AdjustmentsPM.MatchAdjustments.MatchDucks / 10 
            : limitedDucks + inputs.AdjustmentsPM.MatchAdjustments.MatchDucks / 10;
        
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }

    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var format = GetFormat(inputs);
        if (inputs.IsTestOrFirstClassMatch()) format = Constants.Format.Test;
            
        var ducksLine = (int) Math.Round(total - 0.8);
        var variance = _varianceLookup[format].GetVariance(total);
        var dist = new PoissonGammaDistribution(total, variance);
        var underProb = dist.GetCumulativeProbability(ducksLine).Probability;

        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(ducksLine + 0.5)
        };

        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
