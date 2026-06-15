using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models;

public static class TopBatterMethods
{
    public static List<double> GetCap(
        ILookupProvider lookupProvider, IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var runsCap = new List<double>();
        var format = inputs.Evaluation.MatchEvaluation.Format;

        for (var x = 0; x < 11; x++)
        {
            var strikeRateAdjust = GetStrikeRateRatioAdjust(lookupProvider, battingTeam.PlayerEvaluations[x], format);
            var runsRemaining = GetRunsRemaining(inputs, battingTeam, bowlingTeam)[Math.Max(x - 1, 0)];
            runsCap.Add(strikeRateAdjust * runsRemaining * 0.95);
        }
        return runsCap;
    }
    
    public static double GetPlayerRuns(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam, int x)
    {
        return battingTeam.PlayerEvaluations[x].BatsmanEvaluation.BattingAverage
               * inputs.Evaluation.MatchEvaluation.ConditionAdjustment
               * bowlingTeam.BowlingRating
               * 1.07;
    }
    
    private static double GetStrikeRateRatioAdjust(ILookupProvider lookupProvider, PlayerEvaluation batsman, string format)
    {
        var standardStrikeRate = lookupProvider.GetStrikeRateLookup().Lookup(format, 1);
        return Math.Max(batsman.BatsmanEvaluation.StrikeRate / standardStrikeRate, 1);
    }
    
    private static List<double> GetRunsRemaining(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var inningsRuns = battingTeam.GetRunsExpected();
        var runsRemaining = new List<double> { inningsRuns };
        var inningsRunsRemaining = inningsRuns;
        
        for (var x = 0; x < 10; x++)
        {
            inningsRunsRemaining -= GetPartnerships(inputs, battingTeam, bowlingTeam)[x];
            runsRemaining.Add(inningsRunsRemaining);
        }

        return runsRemaining;
    }
    
    private static List<double> GetPartnerships(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var playerRuns = GetPlayerRunsList(inputs, battingTeam, bowlingTeam);
        return GetPartnerships(playerRuns);
    }

    public static List<double> GetPartnerships(List<double> playerRuns)
    {
        var partnerships = new List<double>();
        var firstPartnership = 0.5 * (playerRuns[0] + playerRuns[1]) * 1.07;

        for (var x = 1; x < 11; x++)
        {
            double partnership;
            
            if (x == 1)
            {
                partnership = firstPartnership;
            }
            else
            {
                partnership = partnerships[x - 2] / 1.07;
                partnership += playerRuns[x] * 0.69;
                partnership *= 0.5 * 1.07;
            }

            partnerships.Add(partnership);
        }
        
        return partnerships;
    }
    
    private static List<double> GetPlayerRunsList(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var playerRuns = new List<double>();
        
        for (var x = 0; x < battingTeam.PlayerEvaluations.Count; x++)
        {
            playerRuns.Add(GetPlayerRuns(inputs, battingTeam, bowlingTeam, x));
        }
        return playerRuns;
    }
}
