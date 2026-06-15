using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamTopBowler : TeamHomeAwayMarketPricingModel
{
    private const string MarketName = "Top Bowl";
    private const string VarianceParameters = "PlayerWickets";

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public TeamTopBowler(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 676;
        AwayMarketId = 677;
        LegacyMarketId = 37;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team2, team1),
            CreateMarketForTeam(inputs, team1, team2)
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var selections = GetTeamDistribution(inputs, bowlingTeam, battingTeam);
        var raceDist = new RaceDistribution<string>(selections, 10);
        var minProbs = raceDist.GetProbabilities();
        
        minProbs = minProbs.Select(x => 
            new CategoricalProbability<string>(x.Category, MinProbability(inputs, x.Probability))).ToList();

        var adjustments = selections.Select(selection => 0.0).ToList();
        var adjusted = RaceDistributionAdjuster.Adjust(minProbs, adjustments);
        
        var mainProbs = adjusted.Take(11).ToList();
        var totalProb = GetTotalProbability(mainProbs);

        var normalized = RaceDistributionNormalizer.Normalize(mainProbs);

        var extraPlayers = adjusted
            .Skip(11)
            .Select(x => new CategoricalProbability<string>(x.Category, x.Probability / totalProb));
        
        normalized.AddRange(extraPlayers);

        var outcomes = normalized.Select(catProb => 
            new Outcome(catProb.Category, "", catProb.Probability)).ToList();
        
        return new Market(
            GetMarketName(bowlingTeam), 
            GetMarketId(bowlingTeam.IsHomeTeam), 
            GetLegacyMarketId(), 
            outcomes, 
            GetTeamInningsSpecifiers(inputs, bowlingTeam), 
            GetMarketCode(bowlingTeam));
    }
    
    private static double MinProbability(IPricingInputs inputs, double probability)
    {
        const double closeToZero = 1e-9;
        double minimum;

        if (inputs.Evaluation.MatchEvaluation.IsT20)
        {
            minimum = 0.04;
        }
        else if (inputs.Evaluation.MatchEvaluation.IsODI)
        {
            minimum = 0.03;
        }
        else minimum = 0.02;

        return Math.Abs(probability) < closeToZero ? 0.0 : Math.Max(probability, minimum);
    }
    
    private List<RaceDistributionSelection<string>> GetTeamDistribution(
        IPricingInputs inputs, TeamEvaluation bowlingTeam, TeamEvaluation battingTeam)
    {
        var selections = new List<RaceDistributionSelection<string>>();
        
        for(var x = 0; x < bowlingTeam.PlayerEvaluations.Count; x++)
        {
            selections.Add(GetPlayerDistribution(inputs, bowlingTeam, battingTeam, x));
        }

        return selections;
    }
    
    private RaceDistributionSelection<string> GetPlayerDistribution(
        IPricingInputs inputs, TeamEvaluation bowlingTeam, TeamEvaluation battingTeam, int x)
    {
        var playerWickets = GetPlayerWickets(inputs, bowlingTeam, battingTeam, x);
        var wicketsVar = _varianceLookup[GetFormat(inputs)].GetVariance(playerWickets);
        var player = bowlingTeam.PlayerEvaluations[x];
        var playerName = $"{player.PlayerName}|{player.PlayerId}";

        var dist = new PoissonGammaDistribution(playerWickets, wicketsVar);
        return new NamedRaceDistributionSelection(playerName, dist);
    }
    
    private static double GetPlayerWickets(
        IPricingInputs inputs, TeamEvaluation bowlingTeam, TeamEvaluation battingTeam, int x)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var battingRating = battingTeam.BattingRating;
        var wicketAdjust = 0.5 * (battingRating / conditions + 1);

        var expectedWickets = bowlingTeam.PlayerEvaluations[x].BowlerEvaluation.GetExpectedWickets();
        expectedWickets /= wicketAdjust;

        return expectedWickets;
    }
    
    private static double GetTotalProbability<T>(IEnumerable<CategoricalProbability<T>> unnormalized) => 
        unnormalized.Sum(categoricalProbability => categoricalProbability.Probability);
    
    private static string GetMarketCode(TeamEvaluation team) => $"NL{(team.IsHomeTeam ? 1 : 2)}BBNL";
}
