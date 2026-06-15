using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;
using PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MatchTopBatter : MatchTopPlayer
{
    private const string MarketName = "Match Top Bat";
    private const string VarianceParameters = "PlayerRuns";
    private const string VarianceParametersZero = "ZeroProb";
    private const string MarketCode = "PMTRSNL";

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookupZero;
    
    public MatchTopBatter(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
        _varianceLookupZero = GetVarianceParameters(VarianceParametersZero);
    }

    public override string GetMarketName() => MarketName;
    
    public override int GetMarketId() => 683;
    
    public override int GetLegacyMarketId() => 45;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var selections = GetSelections(inputs);
        var raceDist = new RaceDistribution<string>(selections, 500);
        var mainProbs = raceDist.GetProbabilities();
        
        var outcomes = new List<Outcome>();
        foreach (var catProb in mainProbs)
        {
            var minimum = LookupProvider.GetMatchTopBatMinimumLookup().Lookup((mainProbs.IndexOf(catProb) % 11) + 1);
            var probability = Math.Max(minimum, catProb.Probability);
            outcomes.Add(new Outcome(catProb.Category, string.Empty, probability));
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
        var format = GetFormat(inputs);
        var playerRuns = TopBatterMethods.GetPlayerRuns(inputs, battingTeam, bowlingTeam, x);
        var runsVar = _varianceLookup[format].GetVariance(playerRuns);
        var playerName = battingTeam.PlayerEvaluations[x].PlayerName;
        var zeroProb = GetZeroProb(playerRuns, format);
        var cap = TopBatterMethods.GetCap(LookupProvider, inputs, battingTeam, bowlingTeam)[x];
        var dist = new CappedPoissonGammaDistribution(playerRuns, runsVar, zeroProb, cap);
        return new NamedRaceDistributionSelection(playerName, dist);
    }
    
    private double GetZeroProb(double runs, string format) => 
        _varianceLookupZero[format].GetVariance(runs);
}
