using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamTopBatter : TeamHomeAwayMarketPricingModel
{
    private const string MarketName = "Top Bat";
    private const string VarianceParameters = "PlayerRuns";
    private const string VarianceParametersZeroProb = "ZeroProb";
    private const string LookupKey = "const";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookupZeroProb;
        
    public TeamTopBatter(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 674;
        AwayMarketId = 675;
        LegacyMarketId = 36;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
        _varianceLookupZeroProb = GetVarianceParameters(VarianceParametersZeroProb);
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team1, team2),
            CreateMarketForTeam(inputs, team2, team1)
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var selections = GetTeamDistribution(inputs, battingTeam, bowlingTeam);
        var raceDist = new RaceDistribution<string>(selections, 500);
        var mainProbs = raceDist.GetProbabilities();
        
        var outcomes = new List<Outcome>();
        foreach(var catProb in mainProbs)
        {
            var minimum = LookupProvider.GetTopBatMinimumLookup().Lookup(LookupKey, mainProbs.IndexOf(catProb) % 11 + 1);
            var probability = Math.Max(minimum, catProb.Probability);
            outcomes.Add(new Outcome(catProb.Category, string.Empty, probability));
        }

        var total = outcomes.Sum(x => x.Probability);
        var normalisedOutcomes = new List<Outcome>();
        foreach (var outcome in outcomes)
        {
            normalisedOutcomes.Add(new Outcome(outcome.OutcomeName, outcome.OutcomeId, outcome.Probability / total));            
        }
        
        return new Market(
            GetMarketName(battingTeam), 
            GetMarketId(battingTeam.IsHomeTeam), 
            GetLegacyMarketId(), 
            normalisedOutcomes, 
            GetTeamInningsSpecifiers(inputs, battingTeam), 
            GetMarketCode(battingTeam));
    }
    
    private List<RaceDistributionSelection<string>> GetTeamDistribution(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var selections = new List<RaceDistributionSelection<string>>();
        battingTeam.PlayerEvaluations =
            battingTeam.PlayerEvaluations.OrderBy(x => x.BatsmanEvaluation.BattingNumber).ToList();
        for (var x = 0; x < battingTeam.PlayerEvaluations.Count; x++)
        {
            selections.Add(GetPlayerDistribution(inputs,battingTeam, bowlingTeam, x));
        }
        return selections;
    }
    
    private RaceDistributionSelection<string> GetPlayerDistribution
        (IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam, int x)
    {
        var playerRuns = TopBatterMethods.GetPlayerRuns(inputs, battingTeam, bowlingTeam, x);
        var runsVar = _varianceLookup[GetFormat(inputs)].GetVariance(playerRuns);
        var player = battingTeam.PlayerEvaluations[x];
        var playerName = $"{player.PlayerName}|{player.PlayerId}";
        var zeroProb = _varianceLookupZeroProb[GetFormat(inputs)].GetVariance(playerRuns);
        var cap = TopBatterMethods.GetCap(LookupProvider, inputs, battingTeam, bowlingTeam)[x];
        var dist = new CappedPoissonGammaDistribution(playerRuns, runsVar, zeroProb, cap);
        return new RaceDistributionSelection<string>(playerName, dist);
    }

    private static string GetMarketCode(TeamEvaluation team) => $"NL{(team.IsHomeTeam ? 1 : 2)}TBNL";
}
