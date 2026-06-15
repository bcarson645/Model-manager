using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes.Dismissal;
using PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Overs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamFirstDismissal : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "1st Wicket Method of Dismissal";

    public TeamFirstDismissal(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 816;
        AwayMarketId = 817;
        LegacyMarketId = 25;
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
        var batsman1 = battingTeam.PlayerEvaluations[0];
        var batsman2 = battingTeam.PlayerEvaluations[1];

        var playerMethods = new List<List<double>>
        {
            GetPlayerAdjustedMethods(GetPlayerAdjusts(inputs, batsman1), GetTeamBowlingMethods(bowlingTeam)),
            GetPlayerAdjustedMethods(GetPlayerAdjusts(inputs, batsman2), GetTeamBowlingMethods(bowlingTeam))
        };
        
        double fielderCatchProb = 0;
        double bowledProb = 0;
        double keeperCatchProb = 0;
        double lbwProb = 0;
        double runOutProb = 0;
        double stumpedProb = 0;
        double otherProb = 0;
        
        foreach (var playerMethod in playerMethods)
        {
            fielderCatchProb += playerMethod[0]/2;
            bowledProb += playerMethod[1]/2;
            keeperCatchProb += playerMethod[2]/2;
            lbwProb += playerMethod[3]/2;
            runOutProb += playerMethod[4]/2;
            stumpedProb += playerMethod[5]/2;
            otherProb += playerMethod[6]/2;
        }
        
        var outcomes = new List<Outcome>
        {
            new FielderCatchOutcome(fielderCatchProb),
            new BowledOutcome(bowledProb),
            new KeeperCatchOutcome(keeperCatchProb),
            new LbwOutcome(lbwProb),
            new RunOutOutcome(runOutProb),
            new StumpedOutcome(stumpedProb),
            new OtherOutcome(otherProb)
        };
        
        return new Market(
            GetMarketName(battingTeam.TeamName), 
            GetMarketId(battingTeam.IsHomeTeam), 
            GetLegacyMarketId(), 
            outcomes, 
            GetTeamInningsSpecifiers(inputs, battingTeam), 
            GetMarketCode(battingTeam.IsHomeTeam));
    }

    private static List<double> GetTeamBowlingMethods(TeamEvaluation teamEvaluation) =>
        new()
        {
            teamEvaluation.DismissalMethodEvaluation.Fielder,
            teamEvaluation.DismissalMethodEvaluation.Bowled,
            teamEvaluation.DismissalMethodEvaluation.Keeper,
            teamEvaluation.DismissalMethodEvaluation.LegBeforeWicket,
            teamEvaluation.DismissalMethodEvaluation.RunOut,
            teamEvaluation.DismissalMethodEvaluation.Stumped,
            teamEvaluation.DismissalMethodEvaluation.Other
        };

    private static List<double> GetPlayerAdjustedMethods(IReadOnlyList<double> playerAdjusts, IReadOnlyList<double> teamBowlingMethods)
    {
        var playerAdjustedMethods = new double[playerAdjusts.Count];
        double total = 0;
            
        for (var x = 0; x < playerAdjusts.Count; x++) 
        {
            var adjusted = playerAdjusts[x] * teamBowlingMethods[x];
            playerAdjustedMethods[x] = adjusted;
            total += adjusted;
        }

        for (var i = 0; i < playerAdjustedMethods.Length; i++)
            playerAdjustedMethods[i] /= total;

        return playerAdjustedMethods.ToList();
    }
    
    private List<double> GetPlayerAdjusts(IPricingInputs inputs, PlayerEvaluation player) =>
        new()
        {
            GetFielderCatchAdjust(inputs, player),
            GetBowledAdjust(inputs, player),
            1.0,
            1.0,
            1.0,
            GetStumpedAdjust(inputs, player),
            1.0
        };
    
    private double GetFielderCatchAdjust(IPricingInputs inputs, PlayerEvaluation playerEvaluation)
    {
        var batAverage = playerEvaluation.BatsmanEvaluation.BattingAverage;
        var standard = LookupProvider.GetBatterRunsLookup().Lookup(GetFormatKey(inputs), 1);
        var batAverageAdjust = (batAverage - standard) * 0.01;
        batAverageAdjust += 1;

        var strikeRate = playerEvaluation.BatsmanEvaluation.StrikeRate;
        var standardStrikeRate = LookupProvider.GetStrikeRateLookup().Lookup(GetFormatKey(inputs), 1);
        var strikeRateAdjust = Math.Max(strikeRate - standardStrikeRate, 0) * 0.1;
        strikeRateAdjust += 1;

        return batAverageAdjust * strikeRateAdjust;
    }
        
    private double GetBowledAdjust(IPricingInputs inputs, PlayerEvaluation playerEvaluation)
    {
        var batAverage = playerEvaluation.BatsmanEvaluation.BattingAverage;
        var standard = LookupProvider.GetBatterRunsLookup().Lookup(GetFormatKey(inputs), 1);
        return 1 - Math.Min((batAverage - standard) * 0.01, 0);
    }
        
    private double GetStumpedAdjust(IPricingInputs inputs, PlayerEvaluation playerEvaluation)
    {
        var strikeRate = playerEvaluation.BatsmanEvaluation.StrikeRate;
        var standard = LookupProvider.GetStrikeRateLookup().Lookup(GetFormatKey(inputs), 1);
        return Math.Max((strikeRate - standard) * 0.1, 0.0) + 1;
    }
    
    private static string GetFormatKey(IPricingInputs inputs) =>
        inputs.Evaluation.MatchEvaluation.IsWomen() && (inputs.Evaluation.MatchEvaluation.IsT20 || inputs.Evaluation.MatchEvaluation.IsODI)
            ? $"w{inputs.Evaluation.MatchEvaluation.Format}" 
            : CommonMethods.GetLookupFormat(inputs);
    
    private string GetMarketName(string teamName) => $"{teamName} {GetMarketName()}";

    private static string GetMarketCode(bool isHomeTeam) => $"{(isHomeTeam ? 1 : 2)}1MOPD";
}
