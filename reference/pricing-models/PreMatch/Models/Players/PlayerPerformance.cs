using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Players;

public class PlayerPerformance : StandardMarketPricingModel
{
    private const string MarketName = "Player Perf";
    private const string VarianceParameters = "PlayerPerf";
    private const string LookupKey = "const";

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;

    public PlayerPerformance(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override int GetMarketId() => 709;

    public override int GetLegacyMarketId() => 67;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var team1Players = GetTopPlayers(inputs, team1, team2);
        var team2Players = GetTopPlayers(inputs, team2, team1);

        var markets = new List<Market>();

        var order = 0;
        foreach (var player in team1Players)
        {
            markets.Add(CreateMarket(inputs, team1, team2, player, order));
            order++;
        }

        order = 0;
        foreach (var player in team2Players)
        {
            markets.Add(CreateMarket(inputs, team2, team1, player, order));
            order++;
        }

        return markets;
    }

    private Market CreateMarket(
        IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam, int playerIndex, int order)
    {
        var expectedPoints = Math.Max(GetPoints(inputs, battingTeam, bowlingTeam, playerIndex), 0);
        var line = (int)Math.Round(expectedPoints * 0.9);
        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expectedPoints);
        var playerName = battingTeam.PlayerEvaluations[playerIndex].PlayerName;
        var playerID = battingTeam.PlayerEvaluations[playerIndex].PlayerId;

        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(GetInitialOversForFormat(inputs.Evaluation.MatchEvaluation.Format)),
            new LineSpecifier(line + 0.5),
            new TeamSpecifier($"{battingTeam.TeamName}|{battingTeam.TeamId}"),
            new PlayerSpecifier($"{playerName}|{playerID}")
        };

        return Market.CreateUnderOver(
            $"{playerName} - {GetMarketName()}", GetMarketId(), GetLegacyMarketId(),
            GetUnderProbability(expectedPoints, variance, line), specifiers, GetMarketCode(battingTeam.IsHomeTeam, order));
    }

    private static string GetMarketCode(bool isHomeTeam, int position) =>
        position == 1 ? $"{(isHomeTeam ? 5 : 6)}6BARU" : $"{(isHomeTeam ? 1 : 2)}PERF{position + 1}";

    private List<int> GetTopPlayers(IPricingInputs inputs, TeamEvaluation battingTeam, TeamEvaluation bowlingTeam)
    {
        var topPlayersPositions = new List<int>();
        var teamPoints = GetPlayerPoints(inputs, battingTeam, bowlingTeam);
        var sortedTeamPoints = teamPoints.OrderByDescending(x => x).ToArray();

        for (var x = 0; x < 5; x++)
        {
            var original = teamPoints.IndexOf(sortedTeamPoints[x]);
            topPlayersPositions.Add(original);
        }

        return topPlayersPositions;
    }

    private List<double> GetPlayerPoints(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2)
    {
        var playerPoints = new List<double>();
        for (var x = 0; x < team1.PlayerEvaluations.Count; x++)
        {
            playerPoints.Add(GetPoints(inputs, team1, team2, x));
        }
        return playerPoints;
    }

    private double GetPoints(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2, int x)
    {
        var player = team1.PlayerEvaluations[x];
        var wickets = GetPlayerWickets(inputs, team1, team2, x);
        var catches = GetCatches(inputs, team1, team2, x);
        var stumpings = GetStumpings(inputs, team1, team2);
        var keeper = team1.GetKeeper()?.PlayerName;

        double playerPoints = 0;
        playerPoints += 10 * catches;
        playerPoints += 20 * wickets;
        playerPoints += player.BatsmanEvaluation.ExpectedRuns;

        if (keeper == player.PlayerName)
        {
            playerPoints += 25 * stumpings;
        }

        return playerPoints;
    }

    private static double GetPlayerWickets(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2, int x)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var wicketAdjust = 0.5 * (team2.BattingRating / conditions + 1);
        var expectedWickets = team1.PlayerEvaluations[x].BowlerEvaluation.GetExpectedWickets();
        expectedWickets /= wicketAdjust;
        return expectedWickets;
    }

    private double GetCatches(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2, int x)
    {
        var keeperCatchProb = team1.DismissalMethodEvaluation.Keeper;
        var fielderCatchProb = team1.DismissalMethodEvaluation.Fielder;
        var wickets = GetTeamWickets(inputs, team1, team2);
        var keeperCatches = keeperCatchProb * wickets;
        var keeper = team1.GetKeeper()?.PlayerName;
        double catches;
        var player = team1.PlayerEvaluations[x].PlayerName;

        if (player == keeper)
        {
            catches = keeperCatches;
        }
        else
        {
            var fielderAdjust = LookupProvider.GetCatchesAdjustLookup().Lookup(LookupKey, x + 1);
            catches = fielderCatchProb * fielderAdjust * wickets / 10.0;
        }

        return catches;
    }

    private double GetStumpings(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2)
    {
        var format = GetFormat(inputs);
        if (inputs.Evaluation.MatchEvaluation.IsFirstClass) format = Constants.Format.Test;
        var stumpingProb = LookupProvider.GetStumpingProbLookup().Lookup(format, 1);
        var spinWickets = GetSpinWickets(inputs, team1, team2);
        return stumpingProb * spinWickets;
    }

    private static double GetTeamWickets(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2)
    {
        var wicketAdjust = GetWicketAdjust(inputs, team2);
        return team1.GetTeamRawWickets() / wicketAdjust;
    }

    private static double GetSpinWickets(IPricingInputs inputs, TeamEvaluation team1, TeamEvaluation team2)
    {
        var wicketAdjust = GetWicketAdjust(inputs, team2);
        var teamWickets = 0.0;

        for (var x = 0; x < 11; x++)
        {
            if (team1.PlayerEvaluations[x].BowlerEvaluation.IsSpin())
            {
                var expectedWickets = team1.PlayerEvaluations[x].BowlerEvaluation.GetExpectedWickets();
                teamWickets += expectedWickets;
            }
        }

        return teamWickets / wicketAdjust;
    }

    private static double GetWicketAdjust(IPricingInputs inputs, TeamEvaluation team2)
    {
        var conditions = inputs.Evaluation.MatchEvaluation.ConditionAdjustment;
        var wicketAdjust = 0.5 * (team2.BattingRating / conditions + 1);
        return wicketAdjust;
    }
}
