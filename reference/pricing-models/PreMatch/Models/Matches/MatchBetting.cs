using PremiumCricket.Lib.Pricing.Distributions.Continuous;
using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes.TeamTwoWay;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchBetting : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Match Betting";
    private const string MarketCode = "2WMW";

    private const int T20Standard = 163;
    private const int ODIStandard = 270;
    private const int TestStandard = 338;
    private const int FirstClassStandard = 328;
    private const int T10Standard = 110;

    private readonly TeamOfTopBat _teamOfTopBatter;
    private readonly TeamOfTopBowl _teamOfTopBowler;
        
    public MatchBetting(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _teamOfTopBatter = new TeamOfTopBat(lookupProvider);
        _teamOfTopBowler = new TeamOfTopBowl(lookupProvider);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 340;
        
    public override int GetLegacyMarketId() => 1;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var matchMarketInstance = CreateMarket(inputs);
        var markets = new List<Market> { matchMarketInstance};
        markets.AddRange(_teamOfTopBatter.GetMarkets(inputs, matchMarketInstance));
        markets.AddRange(_teamOfTopBowler.GetMarkets(inputs, matchMarketInstance));
        return markets;
    }
        
    public IEnumerable<Outcome> GetMatchOdds(IPricingInputs inputs) => CreateMarket(inputs).Outcomes;

    private Market CreateMarket(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var home = team1.IsHomeTeam ? team1 : team2;
        var away = team1.IsHomeTeam ? team2 : team1;

        var firstInns = GetTeamDistribution(inputs, home, away);
        var secondInns = GetTeamDistribution(inputs, away, home);
        var selections = new List<RaceDistributionSelection<string>>
        {
            firstInns,
            secondInns
        };

        var raceDist = new RaceDistribution<string>(selections);
        var normalisedCatProbs = Normalize(raceDist.GetProbabilities());

        var homeTeamAdjust = inputs.AdjustmentsPM.MatchAdjustments.MatchBetting/100.0;
            
        var outcomes = GetTeamTwoWayOutcomes(
            home.TeamName,
            home.TeamId,
            normalisedCatProbs[0].Probability + homeTeamAdjust,
            away.TeamName,
            away.TeamId,
            normalisedCatProbs[1].Probability - homeTeamAdjust);

        return new Market(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, new List<Specifier>(), MarketCode);
    }
        
    private static NamedRaceDistributionSelection GetTeamDistribution(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var inningsRuns = GetInningsRuns(inputs, battingTeam, bowlingTeam);
        var ballsRemaining = GetBallsRemainingForFormat(inputs.Evaluation.MatchEvaluation.Format);
        var inningsRunsVar = GetInningsRunsVar(inningsRuns, ballsRemaining);

        var contDist = new NormalDistribution(inningsRuns, inningsRunsVar);
        var dist = new DiscretizedContinuousDistribution(contDist, 0.0);

        return new NamedRaceDistributionSelection(battingTeam.TeamName, dist);
    }
        
    private static List<CategoricalProbability<string>> Normalize(IReadOnlyCollection<CategoricalProbability<string>> unnormalized)
    {
        var total = unnormalized.Sum(catProb => catProb.Probability);

        return unnormalized.Select(catProb => 
            new CategoricalProbability<string>(catProb.Category, catProb.Probability / total)).ToList();
    }
        
    private static double GetInningsRuns(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var batRating = battingTeam.BattingRating;
        var bowlRating = bowlingTeam.BowlingRating;
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var conditionsFactor = batRating * bowlRating * conditions;
        var format = inputs.Evaluation.MatchEvaluation.Format;

        var standardValue = format switch
        {
            Constants.Format.T10 => T10Standard,
            Constants.Format.T20 => T20Standard,
            Constants.Format.Test => TestStandard,
            Constants.Format.FC => FirstClassStandard,
            _ => ODIStandard // ODI
        };
            
        return conditionsFactor * standardValue;
    }

    private static int GetBallsRemainingForFormat(string format) =>
        format switch
        {
            Constants.Format.T20 => 120,
            Constants.Format.Hundred => 100,
            Constants.Format.ODI => 300,
            Constants.Format.Test => 1680,
            Constants.Format.FC => 1680,
            Constants.Format.T10 => 60,
            _ => 120
        };
        
    private static double GetInningsRunsVar(double mean, int ballsRemaining)
    {
        var inningsStDev = 1.4195 * Math.Pow(ballsRemaining, 0.6809);
        inningsStDev -= 0.0389 * mean;
        return inningsStDev * inningsStDev;
    }
}
