using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

public class HighestOpeningPartnership : HeadStandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Highest Opening Partnership";
    private const string VarianceParameters = "PlayerRuns";
    private const string VarianceParametersZeroProb = "OpeningPartnershipZeroProb";
    private const string MarketCode = "HOPA";

    private const double PartnershipMeanAdjust = 0.535; // 0.5 * 1.07. The 1.07 represents the 7% of runs scored in extras
    private const double TestPartnershipZeroProbFactor = 1.9572;
    private const double LimitedPartnershipZeroProbFactor = 0.66;

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookupZeroProb;
    
    public HighestOpeningPartnership(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        VarianceLookup = GetVarianceParameters(VarianceParameters);
        _varianceLookupZeroProb = GetVarianceParameters(VarianceParametersZeroProb);
    }

    public override string GetMarketName() => MarketName;
    
    public override int GetMarketId() => 646;
    
    public override int GetLegacyMarketId() => 15;
    
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        
        var selections = new List<RaceDistributionSelection<string>>
        {
            GetTeamDistribution(inputs, team1),
            GetTeamDistribution(inputs, team2)
        };
        
        var raceDist = new RaceDistribution<string>(selections);
        var probabilities = raceDist.GetProbabilities();

        var homeAdj = inputs.AdjustmentsPM.MatchAdjustments.HighestOpeningPartnership;
        var tieAdj = inputs.AdjustmentsPM.MatchAdjustments.HighestOpeningPartnershipTie;
        var homeProb = probabilities[0].Probability + homeAdj / 100 - tieAdj / 100;
        var awayProb = probabilities[1].Probability - homeAdj / 100;

        var outcomes = GetTeamThreeWayOutcomes(team1.TeamName,team1.TeamId, homeProb, team2.TeamName, team2.TeamId, awayProb);
        
        var specifiers = GetMaxOverSpecifier(inputs);
        specifiers.Add(new InningsSpecifier(1));
        specifiers.Add(new WicketSpecifier(1));

        var marketName = GetMarketName();

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = "1st Innings " + marketName;
        }

        return new List<Market>
        {
            new (marketName, GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode)
        };
    }

    private NamedRaceDistributionSelection GetTeamDistribution(IPricingInputs inputs, TeamEvaluation team)
    {
        //gets ech openers expected runs
        var orderedPlayers = team.PlayerEvaluations.OrderBy(p => p.BatsmanEvaluation.BattingNumber).ToList();
        var bat1Runs = orderedPlayers[0].BatsmanEvaluation.ExpectedRuns; 
        var bat2Runs = orderedPlayers[1].BatsmanEvaluation.ExpectedRuns;

        // calculated mean - in sheets that is (average of both openers * 1.07)
        var partnershipMean = (bat1Runs + bat2Runs) * PartnershipMeanAdjust;
        var partnershipVar = VarianceLookup[GetFormat(inputs)].GetVariance(partnershipMean);
        
        // defining shiftedpoisson...  this includes the zero probability. so is mean, variance, zero prob
        var dist = new ShiftedPoissonGammaDistribution(
            partnershipMean, partnershipVar, GetZeroProbability(inputs, partnershipMean));
        
        return new NamedRaceDistributionSelection(team.TeamName, dist);
    }
    
    private double GetZeroProbability(IPricingInputs inputs, double partnershipMean)
    {
        // adjust on probability of opening partnership being zero in sheets, this follows the maths
        return inputs.Evaluation.MatchEvaluation.IsTest
            ? TestPartnershipZeroProbFactor / partnershipMean
            : _varianceLookupZeroProb[GetFormat(inputs)].GetVariance(partnershipMean) * LimitedPartnershipZeroProbFactor;
    }
}
