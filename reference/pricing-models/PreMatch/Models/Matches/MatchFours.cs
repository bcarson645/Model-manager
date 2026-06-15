using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchFours : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Fours";
    private const string VarianceParameters = "MatchFours";
    private const string MarketCode = "51BARUA";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public MatchFours(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 639;

    public override int GetLegacyMarketId() => 5;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        var limitedFours = team1.GetTeamFours() + team2.GetTeamFours();
        var testFours = inputs.Evaluation.MatchEvaluation.MatchFours;

        var total = inputs.IsTestOrFirstClassMatch()
            ? testFours + inputs.AdjustmentsPM.MatchAdjustments.MatchFours 
            : limitedFours + inputs.AdjustmentsPM.MatchAdjustments.MatchFours;
        
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        
        var foursVar = _varianceLookup[GetFormat(inputs)].GetVariance(total);
        var dist = new PoissonGammaDistribution(total, foursVar);

        var foursProbLower = dist.GetMedian(-1).Probability;
        var foursProbUpper = dist.GetMedian(1).Probability;

        int foursLine;
        if (Math.Abs(foursProbUpper - 0.5) > Math.Abs(foursProbLower - 0.5))
        {
            foursLine = dist.GetMedian(-1).Value;
        }
        else
        {
            foursLine = dist.GetMedian(1).Value;
        }

        // displayed to 3dp in the spreadsheet
        var underProb = Math.Round(dist.GetCumulativeProbability(foursLine).Probability, 3);

        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(foursLine + 0.5)
        };
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
