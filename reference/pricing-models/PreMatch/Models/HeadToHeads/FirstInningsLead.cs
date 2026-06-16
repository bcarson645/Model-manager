using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

public class FirstInningsLead : HeadStandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "First Innings Lead";
    private const string VarianceParameters = "TestMatchRuns";
    private const string MarketCode = "FRSTIL";
    
    public FirstInningsLead(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        VarianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override int GetMarketId() => 711;
    
    public override int GetLegacyMarketId() => 72;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);

        var selections = new List<RaceDistributionSelection<string>>
        {
            GetTeamDistribution(inputs, team1, team2),
            GetTeamDistribution(inputs, team2, team1)
        };

        var raceDist = new RaceDistribution<string>(selections);
        var probabilities = raceDist.GetProbabilities();
        
        var adjust = inputs.AdjustmentsPM.MatchAdjustments.FirstInningsLead;
        var homeProb = probabilities[0].Probability - adjust / 100;
        var awayProb = probabilities[1].Probability + adjust / 100;
        
        var outcomes = GetTeamThreeWayOutcomes(team1.TeamName,team1.TeamId, homeProb, team2.TeamName, team2.TeamId, awayProb);
        
        var specifiers = GetMaxOverSpecifier(inputs);
        specifiers.Add(new InningsSpecifier(1));
        
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode)
        };
    }
    
    private NamedRaceDistributionSelection GetTeamDistribution(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var runs = GetInningsRuns(inputs, battingTeam, bowlingTeam);
        var inningsRunsVar = VarianceLookup[GetFormat(inputs)].GetVariance(runs);
        var dist = new PoissonGammaDistribution(runs, inningsRunsVar);
        return new NamedRaceDistributionSelection(battingTeam.TeamName, dist);
    }

    private static double GetInningsRuns(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var conditionsFactor = battingTeam.BattingRating * bowlingTeam.BowlingRating * conditions;
        
        double standardValue = inputs.Evaluation.MatchEvaluation.Format switch
        {
            Constants.Format.Test => 338,
            _ => 328
        };

        return conditionsFactor * standardValue;
    }
}
