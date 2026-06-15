using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamFours : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Fours";
    private const string MarketCode = "4PIN";
    private const string VarianceParameters = "MatchFours";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public TeamFours(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 658;
        AwayMarketId = 659;
        LegacyMarketId = 26;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
    
    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var markets = new List<Market>();
        markets.AddRange(CreateMarketsForTeam(inputs, team1, inputs.AdjustmentsPM.GetTeam1Adjustments()));
        markets.AddRange(CreateMarketsForTeam(inputs, team2, inputs.AdjustmentsPM.GetTeam2Adjustments()));
        return markets;
    }

    private IEnumerable<Market> CreateMarketsForTeam(IPricingInputs inputs, TeamEvaluation team, InningsAdjustmentsPM adjustments)
    {
        var expected = team.GetTeamFours() + adjustments.InningsFours;
        var middleLine = (int) Math.Round(expected - 0.8);
        var lineDelta = Math.Max((int) Math.Round(expected / 10), 1);

        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expected);
        var dist = new PoissonGammaDistribution(expected, variance);
        var lines = new[] { middleLine - lineDelta, middleLine, middleLine + lineDelta };

        var markets = new List<Market>();
        foreach (var line in lines)
        {
            var underProb = dist.GetCumulativeProbability(line).Probability;
            markets.Add(CreateMarket(inputs, team, underProb, line, MarketCode));
        }
        
        return markets;
    }
}
