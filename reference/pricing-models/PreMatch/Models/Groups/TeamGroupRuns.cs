using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Groups;

public class TeamGroupRuns : GroupStandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Runs in First";
    private const string VarianceParameters = "GroupRuns";
    private const string Ratio = "ratio";
    private const string Effect = "sr_effect";
    private const string Five = "5";
    private const string Ten = "10";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    
    public TeamGroupRuns(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override int GetMarketId() => 352;
    
    public override int GetLegacyMarketId() => 8;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var markets = new List<Market>();
        var (team1, team2) = GetTeams(inputs);
        var team1Adjusts = inputs.AdjustmentsPM.GetTeam1Adjustments();
        var team2Adjusts = inputs.AdjustmentsPM.GetTeam2Adjustments();
        var matchEvaluation = inputs.Evaluation.MatchEvaluation;
        var groups = GetOverGroups(matchEvaluation.Format);
        
        foreach (var group in groups)
        {
            markets.AddRange(CreateMarketsForTeam(matchEvaluation, team1, team1Adjusts, group));
            markets.AddRange(CreateMarketsForTeam(matchEvaluation, team2, team2Adjusts, group));
        }
        
        return markets;
    }

    private IEnumerable<Market> CreateMarketsForTeam(
        MatchEvaluation matchEvaluation, TeamEvaluation team, InningsAdjustmentsPM adjusts, int group)
    {
        var markets = new List<Market>();

        var teamGroupRuns = GetTeamGroups(matchEvaluation, team, adjusts, group);

        var middleLine = (int) Math.Round(teamGroupRuns - 1.6);
        var teamGroupVar = _varianceLookup[matchEvaluation.Format == Constants.Format.T10 ? Constants.Format.T20 : matchEvaluation.Format].GetVariance(teamGroupRuns);
        var dist = new PoissonGammaDistribution(teamGroupRuns, teamGroupVar);
        var lines = new[] { middleLine - 5, middleLine, middleLine + 5 };

        foreach(var line in lines)
        {
            var underProb = dist.GetCumulativeProbability(line).Probability;

            var specifiers = new List<Specifier>
            {
                new TeamSpecifier($"{team.TeamName}|{team.TeamId}"),
                new LineSpecifier(line + 0.5),
                new OverSpecifier(group)
            };
            
            markets.Add(new Market(
                GetMarketName(team.TeamName, group), 
                GetMarketId(team.IsHomeTeam), 
                GetLegacyMarketId(), 
                GetOverUnderOutcomes(underProb), 
                specifiers,
                GetMarketCode(team.IsHomeTeam, group, line, lines)));
        }

        return markets;
    }

    private double GetTeamGroups(
        MatchEvaluation matchEvaluation, TeamEvaluation team, InningsAdjustmentsPM adjusts, int group)
    {
        double groupRuns;
        
        switch (group)
        {
            case 4:
            case > 4 and < 7 when matchEvaluation.IsT20:
                groupRuns = team.FirstGroup * 1.015;
                groupRuns += adjusts.FirstGroup;
                break;
            case > 4 and < 7 when matchEvaluation.IsT10:
            case 10 when matchEvaluation.IsTestOrFirstClass:
                groupRuns = team.SecondGroup * 1.01;
                groupRuns += adjusts.SecondGroup;
                break;
            case > 4 and < 7 when matchEvaluation.IsODI:
                groupRuns = team.FirstGroup * 1.03;
                groupRuns += adjusts.FirstGroup;
                break;
            case > 4 and < 7:
                groupRuns = team.FirstGroup * 1.01;
                groupRuns += adjusts.FirstGroup;
                break;
            case 8:
                groupRuns = (team.FirstGroup + (team.SecondGroup - team.FirstGroup) * 0.315) * 1.01;
                groupRuns += adjusts.SecondGroup;
                break;
            case 10 when matchEvaluation.IsT20:
                groupRuns = (team.FirstGroup + (team.SecondGroup - team.FirstGroup) * 0.6527) * 1.005;
                groupRuns += adjusts.ThirdGroup;
                break;
            case 10 when matchEvaluation.IsODI:
                groupRuns = GetGroupRuns(matchEvaluation, team) * 1.02;
                groupRuns += adjusts.SecondGroup;
                break;
            default:
            {
                if (matchEvaluation.IsODI)
                {
                    groupRuns = team.SecondGroup * 1.01;
                    groupRuns += adjusts.ThirdGroup;
                }
                else 
                    {
                        groupRuns = 3.1 * team.FirstGroup * 1.01;
                        groupRuns += adjusts.ThirdGroup;                      
                    }
                break;
            }
        }

        return groupRuns;
    }
    
    private double GetGroupRuns(MatchEvaluation matchEvaluation, TeamEvaluation team)
    {
        var groupFiveRatio = LookupProvider.GetGroupAdjustLookup().Lookup(Five, Ratio);
        var groupFiveSre = LookupProvider.GetGroupAdjustLookup().Lookup(Five, Effect);
        var groupTenSre = LookupProvider.GetGroupAdjustLookup().Lookup(Ten, Effect);

        var lookupKey = matchEvaluation.IsWomen() ? $"w{Constants.Format.ODI}" : Constants.Format.ODI;
        var bat1AvSr = LookupProvider.GetStrikeRateLookup().Lookup(lookupKey, 1);
        var bat2AvSr = LookupProvider.GetStrikeRateLookup().Lookup(lookupKey, 2);
        
        var bat1Sr = team.PlayerEvaluations[0].BatsmanEvaluation.StrikeRate;
        var bat2Sr = team.PlayerEvaluations[1].BatsmanEvaluation.StrikeRate;
        var teamRuns = team.InningsRunsPrediction;

        // calculating the SR adjust figure for each team in column cc in prep work
        var srAdjust = (bat1Sr + bat2Sr) / (bat1AvSr + bat2AvSr) / ((teamRuns / 278  + 1) / 2);

        // calculate values for team 1
        var team1A = 0.138 * teamRuns + 14.237;
        var team1B = team1A / 1.0375;
        var team1C = team1B * (srAdjust * groupTenSre + (1 - groupTenSre));

        var team1D = team1A * groupFiveRatio;
        var team1E = team1D / 1.05;
        var team1F = team1E * (srAdjust * groupFiveSre + (1 - groupFiveSre));

        // calculate ratios (group 10/group 5)
        var ratio = team1C / team1F;

        //calculate final group 10s using new ratio
        return ratio * team.FirstGroup;
    }
    
    private string GetMarketName(string teamName, int group) => $"{teamName} {GetMarketName()} {group} Overs";

    private static string GetMarketCode(bool isHomeTeam, int group, int line, int[] lines)
    {
        var marketCode = $"{(isHomeTeam ? 1 : 2)}RPGO{group}";
        if (line == lines[1]) marketCode += "A";
        if (line == lines[2]) marketCode += "B";
        return marketCode;
    }
    
    private int GetMarketId(bool isHomeTeam) => isHomeTeam ? GetMarketId() : 353;
}
