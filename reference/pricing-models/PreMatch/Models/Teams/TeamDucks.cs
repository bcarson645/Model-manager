using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamDucks : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Innings Ducks";
    private const string MarketCode = "4PIN";
    private const string VarianceParameters = "MatchDucks";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    
    public TeamDucks(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 706;
        AwayMarketId = 707;
        LegacyMarketId = 65;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var markets = new List<Market>();
        
        if (team1.InningsDucks > 0)
            markets.Add(CreateMarketForTeam(inputs, team1, inputs.AdjustmentsPM.GetTeam1Adjustments()));
    
        if (team2.InningsDucks > 0)
            markets.Add(CreateMarketForTeam(inputs, team2, inputs.AdjustmentsPM.GetTeam2Adjustments()));

        return markets;
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation team, InningsAdjustmentsPM adjustments)
    {
        var expected = team.InningsDucks + adjustments.InningsDucks / 10.0;
        var line = Math.Max((int) Math.Round(expected - 0.8), 0);
        var variance = _varianceLookup[GetVarianceLookupFormat(inputs)].GetVariance(expected);
        var underProb = GetUnderProbability(expected, variance, line);
        return CreateMarket(inputs, team, underProb, line, MarketCode);
    }
}
