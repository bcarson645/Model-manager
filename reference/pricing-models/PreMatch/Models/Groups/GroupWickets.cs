using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Groups;

public class GroupWickets : GroupStandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Wickets in First";
    private const string VarianceParameters = "GroupWickets";

    private const double T20FirstGroupWicketsMultiplier = 1.44 / 6.1;
    private const double T10FirstGroupWicketsMultiplier = 0.65 / 7.5;
    private const double ODIFirstGroupWicketsMultiplier = 0.65 / 7.5;
    private const double TestFirstGroupWicketsMultiplier = 0.48;

    private const double T20SecondGroupWicketsMultiplier = 2.32 / 1.44;
    private const double ODIandTestSecondGroupWicketsMultiplier = 2.00;

    private const double T20ThirdGroupWicketsMultiplier = 2.85 / 1.44;
    private const double ODIandTestThirdGroupWicketsMultiplier = 2.87;


    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    
    public GroupWickets(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
    
    public override int GetMarketId() => 999; // placeholder - not sure this market actually exists in UOF
    
    public override int GetLegacyMarketId() => 30;

    public override IList<Market> GetMarkets(IPricingInputs inputs) => 
        GetOverGroups(inputs.Evaluation.MatchEvaluation.Format).Select(group => CreateMarket(inputs, group)).ToList();


    private Market CreateMarket(IPricingInputs inputs, int group)
    {
        var (team1, team2) = GetTeams(inputs);

        var team1ConditionsAdjust = GetConditionsAdjust(inputs, team1, team2);
        var team2ConditionsAdjust = GetConditionsAdjust(inputs, team2, team1);

        var team1Wickets = inputs.Evaluation.GetTeam1Evaluation().WicketsLost; // this is an expected wickets lost so should be renamed to avoid confusion.
        var team2Wickets = inputs.Evaluation.GetTeam2Evaluation().WicketsLost; // using batting and bowling team as shortcuts for team1 and team2.

        var team1WicketMean = GetGroupWicketMean(inputs, group, team1Wickets, team1ConditionsAdjust);
        var team2WicketMean = GetGroupWicketMean(inputs, group, team2Wickets, team2ConditionsAdjust);

        var groupWicketMean = 0.5 * (team1WicketMean + team2WicketMean);
        var groupWicketLine = (int) Math.Round(groupWicketMean - 0.8);
        var groupWicketVar = _varianceLookup[GetFormat(inputs)].GetVariance(groupWicketMean);
        var dist = new PoissonGammaDistribution(groupWicketMean, groupWicketVar);
        var underProb = dist.GetCumulativeProbability(groupWicketLine).Probability;

        var specifiers = new List<Specifier>
        {
            new LineSpecifier(groupWicketLine + 0.5),
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

    private static double GetConditionsAdjust(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2)
    {
        var battingRating = team1.BattingRating;
        var bowlingRating = team2.BowlingRating;
        var conditionsAdjust = inputs.Evaluation.MatchEvaluation.ConditionAdjustment * battingRating * bowlingRating;
        return conditionsAdjust;
    }
    
    private static double GetGroupWicketMean(
        IPricingInputs inputs, int group, double wickets, double conditionsAdjust)
    {

        double firstGroupWicketMean = inputs.Evaluation.MatchEvaluation switch
        {
            { IsT20: true } => T20FirstGroupWicketsMultiplier * wickets,
            { IsT10: true } => T10FirstGroupWicketsMultiplier * wickets,
            { IsODI: true } => ODIFirstGroupWicketsMultiplier * wickets,
            _ => TestFirstGroupWicketsMultiplier / conditionsAdjust
        };


        double groupWicketMean = group switch
        {
            < 8 => firstGroupWicketMean
                   + inputs.AdjustmentsPM.MatchAdjustments.FirstGroupWickets / 10,

            8 => T20SecondGroupWicketsMultiplier * firstGroupWicketMean
                 + inputs.AdjustmentsPM.MatchAdjustments.SecondGroupWickets / 10,

            10 when inputs.Evaluation.MatchEvaluation.IsT20 =>
                T20ThirdGroupWicketsMultiplier * firstGroupWicketMean
                + inputs.AdjustmentsPM.MatchAdjustments.ThirdGroupWickets / 10,

            10 => ODIandTestSecondGroupWicketsMultiplier * firstGroupWicketMean
                  + inputs.AdjustmentsPM.MatchAdjustments.SecondGroupWickets / 10,

            _ => ODIandTestThirdGroupWicketsMultiplier * firstGroupWicketMean
                 + inputs.AdjustmentsPM.MatchAdjustments.ThirdGroupWickets / 10
        };

        return groupWicketMean;
    }
    
    private string GetMarketName(int group) => $"{GetMarketName()} {group} Overs";
    
    private static string GetMarketCode(int group) => $"0WPGO{group}";
}
