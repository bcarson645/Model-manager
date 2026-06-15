using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamMaxOver : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Max Runs in an Over";
    private const string MarketCode = "INRUA";

    public TeamMaxOver(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 670;
        AwayMarketId = 671;
        LegacyMarketId = 34;
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var markets = new List<Market>();

        if (team1.InningsMaxOver > 0)
            markets.Add(CreateMarketForTeam(inputs, team1));
        
        if (team2.InningsMaxOver > 0)
            markets.Add(CreateMarketForTeam(inputs, team2));

        return markets;
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation team)
    {
        var inns = team.IsHomeTeam ? 0 : 1;
        var adjust = inputs.AdjustmentsPM.InningsAdjustments[inns].MaxRunsInOver;
        var line = (int) Math.Round(team.InningsMaxOver + adjust - 0.8);
        var dist = new PoissonDistribution(team.InningsMaxOver + adjust);
        var underProb = dist.GetCumulativeProbability(line).Probability;
        return CreateMarket(inputs, team, underProb, line, MarketCode);
    }
}
