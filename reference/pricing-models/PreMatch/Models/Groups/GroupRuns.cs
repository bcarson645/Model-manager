using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Inputs.Switches;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Groups;

public class GroupRuns : GroupStandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Runs in First";
    private const string VarianceParameters = "GroupRuns";
    private const string Ratio = "ratio";
    private const string Effect = "sr_effect";
    private const string Five = "5";
    private const string Ten = "10";

    //numerical values in the models
    private const double T20Group10Ratio = 0.6527;
    private const double T20Group8Ratio = 0.315;

    private const int ODIStandardInningsRuns = 278;
    private const double ODIFirst10OversRunsMultiplier = 0.138; // Used in CA7 in prep work
    private const double ODIFirst10OversRunsShift = 14.237; // Used in CA7 in prep work
    private const double ODIFirstInningsGroup10Divisor = 1.0375; // Used in CB7 in prep work
    private const double ODIFirstInningsGroup5Divisor = 1.05; // Used in CB6 in prep work


    private const double TestGroup15Ratio = 3.1;


    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    
    public GroupRuns(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
    private string GetMarketName(int group) => $"{GetMarketName()} {group} Overs";
    private string GetMarketName(string teamName, int group) => $"{teamName} {GetMarketName()} {group} Overs";

    public override int GetMarketId() => 352;
    private int GetMarketId(bool isHomeTeam) => isHomeTeam ? GetMarketId() : 353;

    public override int GetLegacyMarketId() => 8;

    private static string GetMarketCode(int group) => $"0RPGO{group}";
    private static string GetMarketCode(bool isHomeTeam, int group, int line, int[] lines)
    {
        var marketCode = $"{(isHomeTeam ? 1 : 2)}RPGO{group}";
        if (line == lines[1]) marketCode += "A";
        if (line == lines[2]) marketCode += "B";
        return marketCode;
    }


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
            markets.Add(CreateMarket(inputs, group));
        }

        foreach (var group in groups)
        {
            markets.AddRange(CreateMarketsForTeam(matchEvaluation, team1, team1Adjusts, group));
            markets.AddRange(CreateMarketsForTeam(matchEvaluation, team2, team2Adjusts, group));
        }

        return markets;
    }

    private Market CreateMarket(IPricingInputs inputs, int group)
    {
        var (team1, team2) = GetTeams(inputs);

        // These four values are found in prep work and are manually typed by traders.
        // for T20, 1st group mean will be 6 overs and 2nd will be 12 overs, as typed in on prep work tab,odis (5 and 15)
        var firstGroupMean = 0.5 * (team1.FirstGroup + team2.FirstGroup); 
        var secondGroupMean = 0.5 * (team1.SecondGroup + team2.SecondGroup);

        // Adjusts
        var firstGroupAdj = inputs.AdjustmentsPM.MatchAdjustments.FirstGroup;
        var secondGroupAdj = inputs.AdjustmentsPM.MatchAdjustments.SecondGroup;
        var thirdGroupAdj = inputs.AdjustmentsPM.MatchAdjustments.ThirdGroup;
        
        /*
        The code below contains the logic which calculates all the groups means, using the two group means defined above
        along with some constants representing 'standard' values for group runs by format.
        */
        double groupMean;
        switch (group)
        {
            case 10 when inputs.Evaluation.MatchEvaluation.IsT20:
                // t20 group 10
                groupMean = firstGroupMean + (secondGroupMean - firstGroupMean) * T20Group10Ratio; 
                groupMean += thirdGroupAdj;
                break;
            case 10 when inputs.Evaluation.MatchEvaluation.IsODI:
                // odi group 10
                groupMean = GetODIGroup10Mean(inputs, team1, team2); // this is a more complex calculation than the other groups.
                groupMean += secondGroupAdj;
                break;
            case 10:
            case > 4 and < 7 when inputs.Evaluation.MatchEvaluation.IsT10:
                groupMean = secondGroupMean; 
                groupMean += secondGroupAdj;
                break;
            case >= 4 and < 7:
                groupMean = firstGroupMean;
                groupMean += firstGroupAdj;
                break;
            case 8:
                // 8 is always 2nd group in t20
                groupMean = firstGroupMean + (secondGroupMean - firstGroupMean) * T20Group8Ratio; 
                groupMean += secondGroupAdj;
                break;
            default:
            {
                if (inputs.Evaluation.MatchEvaluation.IsODI)
                {   
                    // odi group 15
                    groupMean = secondGroupMean;
                    groupMean += thirdGroupAdj;
                }
                else
                {
                    // first class group 15
                    groupMean = TestGroup15Ratio * firstGroupMean;
                    groupMean += thirdGroupAdj;
                }
                break;
            }
        }
                
        var line = (int) Math.Round(groupMean - 1.2, MidpointRounding.AwayFromZero);
        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(groupMean);
        var dist = new PoissonGammaDistribution(groupMean, variance);
        var underProb = dist.GetCumulativeProbability(line).Probability;

        var specifiers = new List<Specifier>
        {
            new LineSpecifier(line + 0.5),
            new OverSpecifier(group),
            new FirstInningsSpecifier()
        };
        
        return new Market(
            GetMarketName(group), 
            GetMarketId(), 
            GetLegacyMarketId(), 
            GetOverUnderOutcomes(underProb), 
            specifiers, 
            GetMarketCode(group));
    }

    private IEnumerable<Market> CreateMarketsForTeam(
        MatchEvaluation matchEvaluation, TeamEvaluation team, InningsAdjustmentsPM adjusts, int group)
    {
        var markets = new List<Market>();

        var teamGroupRuns = GetTeamGroups(matchEvaluation, team, adjusts, group);

        var middleLine = (int)Math.Round(teamGroupRuns - 1.6);
        var teamGroupVar = _varianceLookup[matchEvaluation.Format == Constants.Format.T10 ? Constants.Format.T20 : matchEvaluation.Format].GetVariance(teamGroupRuns);
        var dist = new PoissonGammaDistribution(teamGroupRuns, teamGroupVar);
        var lines = new[] { middleLine - 5, middleLine, middleLine + 5 };

        foreach (var line in lines)
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

    private double GetODIGroup10Mean(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2)
    {
        var groupFiveRatio = LookupProvider.GetGroupAdjustLookup().Lookup(Five, Ratio);
        var groupFiveStrikeRateEffect = LookupProvider.GetGroupAdjustLookup().Lookup(Five, Effect);
        var groupTenStrikeRateEffect = LookupProvider.GetGroupAdjustLookup().Lookup(Ten, Effect);

        var lookupKey = inputs.Evaluation.MatchEvaluation.IsWomen()
            ? $"w{Constants.Format.ODI}"
            : Constants.Format.ODI;
        
        var bat1avSR = LookupProvider.GetStrikeRateLookup().Lookup(lookupKey, 1);
        var bat2avSR = LookupProvider.GetStrikeRateLookup().Lookup(lookupKey, 2);      


        //calculate final group 10s using new ratio
        var team1Mean = GetTeamODIGroup10Mean(team1, bat1avSR, bat2avSR, groupTenStrikeRateEffect, groupFiveRatio, groupFiveStrikeRateEffect);
        var team2Mean = GetTeamODIGroup10Mean(team2, bat1avSR, bat2avSR, groupTenStrikeRateEffect, groupFiveRatio, groupFiveStrikeRateEffect);

        // calculate new average of both teams for group 10s
        return (team1Mean + team2Mean) * 0.5;
    }

    private double GetTeamODIGroup10Mean(TeamEvaluation team, double bat1AvSR, double bat2AvSR
        , double groupTenStrikeRateEffect, double groupFiveRatio,double groupFiveStrikeRateEffect)
    {
        var bat1SR = team.PlayerEvaluations[0].BatsmanEvaluation.StrikeRate;
        var bat2SR = team.PlayerEvaluations[1].BatsmanEvaluation.StrikeRate;
        var teamRuns = team.InningsRunsPrediction;

        var teamStrikeRateAdjust = (bat1SR + bat2SR) / (bat1AvSR + bat2AvSR) / ((teamRuns / ODIStandardInningsRuns + 1) / 2); //Prep Work CC4

        var bothInningsGroup10Standard = ODIFirst10OversRunsMultiplier * teamRuns + ODIFirst10OversRunsShift; //Prep Work CA7
        var firstInningsGroup10Standard = bothInningsGroup10Standard / ODIFirstInningsGroup10Divisor; //Prep Work CB7
        var firstInningsGroup10Adjusted = firstInningsGroup10Standard * (teamStrikeRateAdjust * groupTenStrikeRateEffect + (1 - groupTenStrikeRateEffect)); //Prep Work CC7

        var bothInningsGroup5Standard = bothInningsGroup10Standard * groupFiveRatio; //Prep Work CA6
        var firstInningsGroup5Standard = bothInningsGroup5Standard / ODIFirstInningsGroup5Divisor; //Prep Work CB6
        var firstInningsGroup5Adjusted = firstInningsGroup5Standard * (teamStrikeRateAdjust * groupFiveStrikeRateEffect + (1 - groupFiveStrikeRateEffect)); //Prep Work CC6

        var ratio = firstInningsGroup10Adjusted / firstInningsGroup5Adjusted; //Prep Work CC7/CC6

        return ratio * team.FirstGroup;
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
                groupRuns = (team.FirstGroup + (team.SecondGroup - team.FirstGroup) * T20Group8Ratio) * 1.01;
                groupRuns += adjusts.SecondGroup;
                break;
            case 10 when matchEvaluation.IsT20:
                groupRuns = (team.FirstGroup + (team.SecondGroup - team.FirstGroup) * T20Group10Ratio) * 1.005;
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
                        groupRuns = TestGroup15Ratio * team.FirstGroup * 1.01;
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

        //calculate final group 10s using new ratio
        return GetTeamODIGroup10Mean(team, bat1AvSr, bat2AvSr, groupTenSre, groupFiveRatio, groupFiveSre);
    }
}
