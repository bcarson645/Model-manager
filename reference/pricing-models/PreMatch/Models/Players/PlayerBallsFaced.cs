using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Overs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Players;

public class PlayerBallsFaced(ILookupProvider lookupProvider) : PlayerScores(lookupProvider)
{
    private const string MarketName = "Balls Faced";

    public override string GetMarketName() => MarketName;

    public override int GetMarketId() => 1215;

    public override int GetLegacyMarketId() => 151;

    protected override Market CreateMarket(
        IPricingInputs inputs, TeamEvaluation team, PlayerEvaluation player,
        BatterAdjustmentsPM batterAdjustment, int batPosition, int indexAdjust)
    {
        var ratioConstant = GetRatioConstant(inputs, batPosition);
        var medianRuns = ratioConstant * player.BatsmanEvaluation.ExpectedRuns;

        var format = CommonMethods.GetLookupFormat(inputs);
        var ballsFacedAdjust = LookupProvider.GetBallsFacedAdjustLookup().Lookup(format, batPosition);

        var expectedStrikeRate = player.BatsmanEvaluation.StrikeRate;

        var expectedBalls = medianRuns / (expectedStrikeRate * ballsFacedAdjust);

        var line = (int)Math.Round(expectedBalls);

        var underProb = 0.5;
        var specifiers = GetSpecifiers(inputs, team, player, line);

        string marketName = $"{player.PlayerName} - {GetMarketName()}";

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = $"{player.PlayerName} - 1st Innings Balls Faced";
        }

        return new Market(marketName, GetMarketId(), GetLegacyMarketId(),
            GetOverUnderOutcomes(underProb), specifiers, GetMarketCode(team.IsHomeTeam, batPosition));
    }

    private static string GetMarketCode(bool isHomeTeam, int batPosition) =>
        $"{(isHomeTeam ? 5 : 6)}{batPosition}BABF";
}
