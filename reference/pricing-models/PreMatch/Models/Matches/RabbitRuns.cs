using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class RabbitRuns : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Rabbit Runs";
    private const string MarketCode = "64BARUA";
    private const string VarianceParameters = "RabbitRuns";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public RabbitRuns(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 703;

    public override int GetLegacyMarketId() => 63;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var rabbitRuns = inputs.Evaluation.MatchEvaluation.RabbitRuns;
        return rabbitRuns > 0 ? GetMarkets(rabbitRuns, inputs) : new List<Market>();
    }

    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var line = (int) Math.Round(total - 0.8);
        var format = GetVarianceLookupFormat(inputs);
        var variance = _varianceLookup[format].GetVariance(total);
        var dist = new PoissonGammaDistribution(total, variance);
        var underProb = dist.GetCumulativeProbability(line).Probability;
            
        var adjust = inputs.AdjustmentsPM.MatchAdjustments.RabbitRuns;
        underProb -= adjust / 100;
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(line + 0.5)
        };
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
