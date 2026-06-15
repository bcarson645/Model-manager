using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamRunOuts : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Innings Run Outs";
    private const string MarketCode = "INRU";

    public TeamRunOuts(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 668;
        AwayMarketId = 669;
        LegacyMarketId = 33;
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team1),
            CreateMarketForTeam(inputs, team2)
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation team)
    {
        var inns = team.IsHomeTeam ? 0 : 1;
        var adjust = inputs.AdjustmentsPM.InningsAdjustments[inns].InningsRunOuts;
        var expected = team.InningsRunOuts + adjust/10.0;
        var dist = new PoissonDistribution(expected);
        var underProb = dist.GetCumulativeProbability(0).Probability;
        string marketName = GetMarketName(team);

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = $"{team.TeamName} 1st Innings Run Outs";
        }

        return new Market(
            marketName, 
            GetMarketId(team.IsHomeTeam), 
            GetLegacyMarketId(), 
            GetOverUnderOutcomes(underProb), 
            GetHomeAwaySpecifiers(inputs, team, 0), 
            GetMarketCode(team, MarketCode));
    }
}
