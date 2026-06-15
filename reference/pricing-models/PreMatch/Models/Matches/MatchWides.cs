using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchWides : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Wides";
    private const string MarketCode = "56BARUA";
    private const string VarianceParameters = "MatchWides";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public MatchWides(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }
        
    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 696;

    public override int GetLegacyMarketId() => 56;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var limitedWides = team1.InningsWides + team2.InningsWides;
        var testWides = inputs.Evaluation.MatchEvaluation.MatchWides;
            
        var total = inputs.IsTestOrFirstClassMatch() 
            ? testWides + inputs.AdjustmentsPM.MatchAdjustments.MatchWides
            : limitedWides + inputs.AdjustmentsPM.MatchAdjustments.MatchWides;
        
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var widesLine = (int) Math.Round(total - 0.8);
        var widesVar = _varianceLookup[GetFormat(inputs)].GetVariance(total);
        var dist = new PoissonGammaDistribution(total, widesVar);
        var underProb = dist.GetCumulativeProbability(widesLine).Probability;
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(widesLine + 0.5)
        };
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
