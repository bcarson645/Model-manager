using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using PremiumCricket.Lib.Pricing.PricingModels;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public abstract class MatchTopPlayer : StandardMarketPricingModel
{
    protected MatchTopPlayer(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }
    
    protected List<RaceDistributionSelection<string>> GetSelections(IPricingInputs inputs)
    {
        var selections = new List<RaceDistributionSelection<string>>();
        var team1 = inputs.Evaluation.GetTeam1Evaluation();
        var team2 = inputs.Evaluation.GetTeam2Evaluation();
        team1.PlayerEvaluations.Sort((a,b)=>a.BatsmanEvaluation.BattingNumber.CompareTo(b.BatsmanEvaluation.BattingNumber));
        team2.PlayerEvaluations.Sort((a,b)=>a.BatsmanEvaluation.BattingNumber.CompareTo(b.BatsmanEvaluation.BattingNumber));

        var team1Sels = GetTeamDistribution(inputs, team1, team2);
        var team2Sels = GetTeamDistribution(inputs, team2, team1);
        
        selections.AddRange(team1Sels.Take(11));
        selections.AddRange(team2Sels.Take(11));
        selections.AddRange(team1Sels.Skip(11));
        selections.AddRange(team2Sels.Skip(11));
        
        return selections;
    }

    private List<RaceDistributionSelection<string>> GetTeamDistribution(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var selections = new List<RaceDistributionSelection<string>>();
        
        for (var x = 0; x < battingTeam.PlayerEvaluations.Count; x++)
        {
            selections.Add(GetPlayerDistribution(inputs, battingTeam, bowlingTeam, x));
        }

        return selections;
    }

    protected abstract NamedRaceDistributionSelection GetPlayerDistribution(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam, int x);

    protected static List<Specifier> GetSpecifiers(double maxOvers)
    {
        return new List<Specifier>
        {
            new MaxOverSpecifier(maxOvers)
        };
    }
}
