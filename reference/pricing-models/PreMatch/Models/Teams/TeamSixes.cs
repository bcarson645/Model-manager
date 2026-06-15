using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamSixes : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Sixes";
    private const string MarketCode = "6PIN";
    private const string VarianceParameters = "MatchSixes";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public TeamSixes(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 658;
        AwayMarketId = 659;
        LegacyMarketId = 27;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var markets = new List<Market>();
        markets.AddRange(CreateMarketsForTeam(inputs, team1));
        markets.AddRange(CreateMarketsForTeam(inputs, team2));
        return markets;
    }
    
    private IEnumerable<Market> CreateMarketsForTeam(IPricingInputs inputs, TeamEvaluation team)
    {
        var expected = team.GetTeamSixes();
        var middleLine = (int) Math.Round(expected - 0.8);

        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expected);
        var dist = new PoissonGammaDistribution(expected, variance);
        var lines = new[] { middleLine - 1, middleLine, middleLine + 1 };

        var markets = new List<Market>();
        foreach (var line in lines)
        {
            var underProb = dist.GetCumulativeProbability(line).Probability;
            markets.Add(CreateMarket(inputs, team, underProb, line, MarketCode));
        }

        return markets;
    }
}
