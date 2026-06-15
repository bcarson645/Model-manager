using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using System.Numerics;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamFirstPartnership : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Runs at Fall of 1st Wicket";

    public TeamFirstPartnership(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 349;
        AwayMarketId = 350;
        LegacyMarketId = 129;
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);

        var team1Adjustments = inputs.AdjustmentsPM.GetTeam1Adjustments();
        var team2Adjustments = inputs.AdjustmentsPM.GetTeam2Adjustments();
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team1, team1Adjustments),
            CreateMarketForTeam(inputs, team2, team2Adjustments)
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation team, InningsAdjustmentsPM adjustments)
    {
        double bat1Runs;
        double bat2Runs;

        if (inputs.Evaluation.MatchEvaluation.IsT10)
        {
            bat1Runs = team.PlayerEvaluations[0].BatsmanEvaluation.BattingAverage;
            bat2Runs = team.PlayerEvaluations[1].BatsmanEvaluation.BattingAverage;
        }
        else
        {
            bat1Runs = team.PlayerEvaluations[0].BatsmanEvaluation.ExpectedRuns;
            bat2Runs = team.PlayerEvaluations[1].BatsmanEvaluation.ExpectedRuns;
        }

        var multiplier = inputs.Evaluation.MatchEvaluation.IsTest ? 1.0 : inputs.Evaluation.MatchEvaluation.IsODI ? 1.025 : 1.05;
        var averageRuns = 0.5 * (bat1Runs + bat2Runs) * multiplier;

        double meanMedianMultiplier;

        if (inputs.Evaluation.MatchEvaluation.IsTest)
        {
            meanMedianMultiplier = 0.66;
        }
        else if (inputs.Evaluation.MatchEvaluation.IsT20)
        {
            meanMedianMultiplier = 0.72;
        }
        else if (inputs.Evaluation.MatchEvaluation.IsT10)
        {
            meanMedianMultiplier = 0.74;
        }
        else meanMedianMultiplier = 0.69;

        var batterAdj0 = adjustments.BatterAdjustments.Count > 0 ? adjustments.BatterAdjustments[0].BatsmanRuns : 0.0;
        var batterAdj1 = adjustments.BatterAdjustments.Count > 1 ? adjustments.BatterAdjustments[1].BatsmanRuns : 0.0;

        var runLine = (int)Math.Round(averageRuns * meanMedianMultiplier + 0.5 * (batterAdj0 + batterAdj1));

        runLine += (int) adjustments.FallOfWicket;
        
        var specifiers = GetTeamInningsSpecifiers(inputs, team);
        specifiers.Add(new LineSpecifier(runLine + 0.5));
        specifiers.Add(new WicketSpecifier(1));
        specifiers.Add(new Specifier("So far", "0", 102));
        specifiers.Add(new Specifier("LineDelta", "0", 100));

        return new Market(
            GetMarketName(team), 
            GetMarketId(team.IsHomeTeam), 
            GetLegacyMarketId(), 
            GetOverUnderOutcomes(0.5), 
            specifiers, 
            GetMarketCode(team));
    }
    
    private static string GetMarketCode(TeamEvaluation team) => $"{(team.IsHomeTeam ? 1 : 2)}1FONW";
}
