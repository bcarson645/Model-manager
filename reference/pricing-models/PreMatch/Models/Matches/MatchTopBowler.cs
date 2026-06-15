using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchTopBowler : MatchTopPlayer
{
    private const string MarketName = "Match Top Bowler";
    private const string VarianceParameters = "PlayerWickets";
    private const string MarketCode = "PMTWTNL";

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    
    public MatchTopBowler(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
    
    public override int GetMarketId() => 684;
    
    public override int GetLegacyMarketId() => 46;
    
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var selections = GetSelections(inputs);
        var raceDist = new RaceDistribution<string>(selections, 10);
        var adjustments = selections.Select(_ => 0.00).ToList();

        var adjusted = RaceDistributionAdjuster.Adjust(raceDist.GetProbabilities(), adjustments);
        var mainProbs = adjusted.Take(22).ToList();
        var totalProb = RaceDistributionNormalizer.GetTotalProbability(mainProbs);
        var normalized =  RaceDistributionNormalizer.Normalize(mainProbs);
        
        var extraPlayers = adjusted.Skip(22)
            .Select(x => new CategoricalProbability<string>(x.Category, x.Probability / totalProb))
            .ToList();

        normalized.AddRange(extraPlayers);

        var outcomes = new List<Outcome>();
        foreach (var catProb in normalized)
        {
            outcomes.Add(new Outcome(catProb.Category, string.Empty, catProb.Probability));
        }

        return new List<Market>
        {
            new(
                GetMarketName(), 
                GetMarketId(), 
                GetLegacyMarketId(), 
                outcomes, 
                GetSpecifiers(GetInitialOversForFormat(inputs.Evaluation.MatchEvaluation.Format)), 
                MarketCode)
        };
    }

    protected override NamedRaceDistributionSelection GetPlayerDistribution(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam, int x)
    {
        var playerWickets = GetPlayerWickets(inputs, battingTeam, bowlingTeam, x);
        var wicketsVar = _varianceLookup[GetFormat(inputs)].GetVariance(playerWickets);
        var playerName = bowlingTeam.PlayerEvaluations[x].PlayerName;
        var dist = new PoissonGammaDistribution(playerWickets, wicketsVar);
        return new NamedRaceDistributionSelection(playerName, dist);
    }
    
    private static double GetPlayerWickets(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam, int x)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var wicketAdjust = 0.5 * (battingTeam.BattingRating / conditions + 1);
        var expectedWickets = bowlingTeam.PlayerEvaluations[x].BowlerEvaluation.GetExpectedWickets();
        return expectedWickets / wicketAdjust;
    }
}
