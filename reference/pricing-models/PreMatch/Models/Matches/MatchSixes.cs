using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchSixes : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Sixes";
    private const string VarianceParameters = "MatchSixes";
    private const string MarketCode = "52BARUA";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public MatchSixes(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 640;

    public override int GetLegacyMarketId() => 6;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var team1 = inputs.Evaluation.GetTeam1Evaluation();
        var team2 = inputs.Evaluation.GetTeam2Evaluation();
        
        var limitedSixes = team1.GetTeamSixes() + team2.GetTeamSixes();
        var testSixes = inputs.Evaluation.MatchEvaluation.MatchSixes;
            
        var total = inputs.IsTestOrFirstClassMatch()
            ? testSixes + inputs.AdjustmentsPM.MatchAdjustments.MatchSixes
            : limitedSixes + inputs.AdjustmentsPM.MatchAdjustments.MatchSixes;
        
        return total > 0 ? GetMarkets(total, inputs) : new List<Market>();
    }
    
    private IList<Market> GetMarkets(double total, IPricingInputs inputs)
    {
        var maxOvers = inputs.MatchState.GetCurrentInnings().OversAvailable;
        var sixesVar = _varianceLookup[GetFormat(inputs)].GetVariance(total);
        var dist = new PoissonGammaDistribution(total, sixesVar);

        var sixesProbLower = dist.GetMedian(-1).Probability;
        var sixesProbUpper = dist.GetMedian(1).Probability;

        int sixesLine;
        if (Math.Abs(sixesProbUpper-0.5) > Math.Abs(sixesProbLower - 0.5))
        {
            sixesLine = dist.GetMedian(-1).Value;
        }
        else
        {
            sixesLine = dist.GetMedian(1).Value;
        }


        // displayed to 3dp in the spreadsheet
        var underProb = Math.Round(dist.GetCumulativeProbability(sixesLine).Probability, 3);
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(maxOvers.ToString()),
            new LineSpecifier(sixesLine + 0.5)
        };
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), GetOverUnderOutcomes(underProb), specifiers, MarketCode)
        };
    }
}
