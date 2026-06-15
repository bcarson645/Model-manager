using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchExtras : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Extras";
    private const string VarianceParameters = "MatchExtras";
    private const string MarketCode = "57BARUA";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public MatchExtras(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 655;
        
    public override int GetLegacyMarketId() => 22;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var limitedExtras = team1.ExtrasPrediction + team2.ExtrasPrediction;
        var testExtras = inputs.Evaluation.MatchEvaluation.MatchExtras;

        var total = inputs.IsTestOrFirstClassMatch()
            ? testExtras + inputs.AdjustmentsPM.MatchAdjustments.MatchExtras 
            : limitedExtras + inputs.AdjustmentsPM.MatchAdjustments.MatchExtras;
        total = Math.Round(total, 2);
            
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var format = GetFormat(inputs, Constants.Format.ODI);
        var extrasLine = (int) Math.Round(total - 0.8);
        var variance = _varianceLookup[format].GetVariance(total);
        var dist = new PoissonGammaDistribution(total, variance);
        var underProb = dist.GetCumulativeProbability(extrasLine).Probability;
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(extrasLine + 0.5)
        };

        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
