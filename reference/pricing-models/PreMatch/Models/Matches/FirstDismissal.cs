using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes.Dismissal;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using PremiumCricket.Lib.Pricing.PricingModels;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class FirstDismissal : StandardMarketPricingModel
{
    private const string MarketName = "Method of First Dismissal";
    private const string MarketCode = "01MOPD";
    
    public FirstDismissal(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 718;
        
    public override int GetLegacyMarketId() => 25;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        var team1BowlingMethods = GetTeamBowlingMethods(team1);
        var team2BowlingMethods = GetTeamBowlingMethods(team2);

        var team1Opener1 = team1.PlayerEvaluations[0];
        var team1Opener2 = team1.PlayerEvaluations[1];
        var team2Opener1 = team2.PlayerEvaluations[0];
        var team2Opener2 = team2.PlayerEvaluations[1];
            
        var playerMethods = new List<List<double>>
        {
            GetPlayerAdjustedMethods(GetPlayerAdjusts(inputs, team1Opener1), team2BowlingMethods),
            GetPlayerAdjustedMethods(GetPlayerAdjusts(inputs, team1Opener2), team2BowlingMethods),
            GetPlayerAdjustedMethods(GetPlayerAdjusts(inputs, team2Opener1), team1BowlingMethods),
            GetPlayerAdjustedMethods(GetPlayerAdjusts(inputs, team2Opener2), team1BowlingMethods)
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
            fielderCatchProb += playerMethod[0] / 4;
            bowledProb += playerMethod[1] / 4;
            keeperCatchProb += playerMethod[2] / 4;
            lbwProb += playerMethod[3] / 4;
            runOutProb += playerMethod[4] / 4;
            stumpedProb += playerMethod[5] / 4;
            otherProb += playerMethod[6] / 4;
        }

        var adjusts = inputs.AdjustmentsPM.MatchAdjustments;

        fielderCatchProb += adjusts.FielderCatch/100.0;
        bowledProb += adjusts.Bowled/100.0;
        keeperCatchProb += adjusts.KeeperCatch/100.0;
        lbwProb += adjusts.Lbw/100.0;
        runOutProb += adjusts.RunOut/100.0;
        stumpedProb += adjusts.Stumped/100.0;
        otherProb += adjusts.Other/100.0;

        var newTotal = fielderCatchProb + bowledProb + keeperCatchProb + lbwProb + runOutProb + stumpedProb + otherProb;

        fielderCatchProb = fielderCatchProb / newTotal;
        bowledProb = bowledProb / newTotal;
        keeperCatchProb = keeperCatchProb / newTotal;
        lbwProb = lbwProb / newTotal;
        runOutProb = runOutProb / newTotal;
        stumpedProb = stumpedProb / newTotal;
        otherProb = otherProb / newTotal;
            
        var outcomes = new List<Outcome>
        {
            new FielderCatchOutcome(Math.Round(fielderCatchProb, 3)),
            new BowledOutcome(Math.Round(bowledProb, 3)),
            new KeeperCatchOutcome(Math.Round(keeperCatchProb, 3)),
            new LbwOutcome(Math.Round(lbwProb, 3)),
            new RunOutOutcome(Math.Round(runOutProb, 3)),
            new StumpedOutcome(Math.Round(stumpedProb, 3)),
            new OtherOutcome(Math.Round(otherProb, 3))
        };

        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new InningsSpecifier(1),
        };
            
        return new List<Market>
        {
            new (GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode)
        };
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
    
    private static string GetFormatKey(IPricingInputs inputs)
    {
        return inputs.Evaluation.MatchEvaluation.IsWomen() && (inputs.Evaluation.MatchEvaluation.IsT20 || inputs.Evaluation.MatchEvaluation.IsODI)
            ? $"w{inputs.Evaluation.MatchEvaluation.Format}"
            : inputs.Evaluation.MatchEvaluation.Format;
    }
}
