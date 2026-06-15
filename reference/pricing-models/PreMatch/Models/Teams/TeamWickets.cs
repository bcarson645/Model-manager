using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamWickets : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Wickets Lost";
    private const string MarketCode = "WILO";
    
    public TeamWickets(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 649;
        AwayMarketId = 650;
        LegacyMarketId = 18;
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team1, team2),
            CreateMarketForTeam(inputs, team2, team1)
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var teamWickets = GetTeamWickets(inputs, battingTeam, bowlingTeam);
        var line = (int) Math.Round(teamWickets - 0.8);
        var variance = teamWickets * teamWickets / -15.4612329915015;
        variance += teamWickets;

        var underProb = GetUnderProbability(teamWickets, variance, line);
        return CreateMarket(inputs, battingTeam, underProb, line, MarketCode);
    }
    
    private static double GetTeamWickets(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var genderAdjust = inputs.Evaluation.MatchEvaluation.IsWomen() ? 0.78 : 1;
        var wicketAdjust = 0.5 * (battingTeam.BattingRating / conditions * genderAdjust + 1);

        var teamRawWickets = bowlingTeam.GetTeamRawWickets();
        var teamWickets = teamRawWickets / wicketAdjust;
        return teamWickets + battingTeam.InningsRunOuts;
    }
}
