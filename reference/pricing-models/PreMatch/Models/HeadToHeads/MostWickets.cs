using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

public class MostWickets : HeadStandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "To Take Most Wickets";
    private const string VarianceParameters = "PlayerWickets";
    private const string MarketCode = "BWLVBWL";
    
    public MostWickets(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        VarianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 687;

    public override int GetLegacyMarketId() => 48;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var player1 = GetTopBowler(inputs, team1, team2);
        var player2 = GetTopBowler(inputs, team2, team1);

        var player1Name = $"{player1.PlayerName}|{player1.PlayerId}";
        var player2Name = $"{player2.PlayerName}|{player2.PlayerId}";

        var specifiers = GetMaxOverSpecifier(inputs);
        specifiers.Add(new PlayerSpecifier(player1Name));
        specifiers.Add(new PlayerSpecifier(player2Name));
        
        var selections = new List<RaceDistributionSelection<string>>
        {
            GetPlayerDistribution(inputs, team1, team2),
            GetPlayerDistribution(inputs, team2, team1)
        };

        var raceDist = new RaceDistribution<string>(selections);
        var probabilities = raceDist.GetProbabilities();
        
        var homeAdj = inputs.AdjustmentsPM.MatchAdjustments.MostWickets;
        var tieAdj = inputs.AdjustmentsPM.MatchAdjustments.MostWicketsTie;
        var homeProb = probabilities[0].Probability + homeAdj / 100 - tieAdj / 100;
        var awayProb = probabilities[1].Probability - homeAdj / 100;

        var outcomes = GetTeamThreeWayOutcomes(team1.TeamName, team1.TeamId, homeProb, team2.TeamName, team2.TeamId, awayProb);
        return new List<Market> { new (GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode) };
    }
    
    private NamedRaceDistributionSelection GetPlayerDistribution(IPricingInputs inputs, TeamEvaluation bowlingTeam, TeamEvaluation battingTeam)
    {
        var topBowler = GetTopBowler(inputs, bowlingTeam,battingTeam);
        var playerWickets = GetPlayerWickets(inputs, battingTeam, topBowler);
        var wicketsVar = VarianceLookup[GetFormat(inputs)].GetVariance(playerWickets);
        var playerName = topBowler.PlayerName;

        var dist = new PoissonGammaDistribution(playerWickets, wicketsVar);
        return new NamedRaceDistributionSelection(playerName, dist);
    }
    
    private static double GetPlayerWickets(
        IPricingInputs inputs, TeamEvaluation battingTeam, PlayerEvaluation bowler)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var battingRating = battingTeam.BattingRating;
        var wicketAdjust = 0.5 * (battingRating / conditions + 1);

        var expectedWickets = bowler.BowlerEvaluation.GetExpectedWickets();
        expectedWickets /= wicketAdjust;

        return expectedWickets;
    }

    private static PlayerEvaluation GetTopBowler(IPricingInputs inputs, TeamEvaluation bowlingTeam, TeamEvaluation battingTeam)
    {
        var topBowler = bowlingTeam.PlayerEvaluations[0];
        var maxWickets = GetPlayerWickets(inputs, battingTeam, topBowler);

        for (var x = 1; x < 11; x++)
        {
            var bowler = bowlingTeam.PlayerEvaluations[x];
            var expectedWickets = GetPlayerWickets(inputs, battingTeam, bowler);
            
            if (expectedWickets > maxWickets)
            {
                maxWickets = expectedWickets;
                topBowler = bowler;
            }
        }
        
        return topBowler;
    }
}
