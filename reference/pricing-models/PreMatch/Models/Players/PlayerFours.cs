using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Players;

public class PlayerFours : PlayerScores
{
    private const string MarketName = "Fours";
    private const string VarianceParameters = "PlayerFours";

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;

    public PlayerFours(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override int GetMarketId() => 643;

    public override int GetLegacyMarketId() => 10;

    protected override Market CreateMarket(
        IPricingInputs inputs, TeamEvaluation team, PlayerEvaluation player,
        BatterAdjustmentsPM batterAdjustment, int batPosition, int indexAdjust)
    {
        var adjust = GetAdjust(inputs);
        var expected = batPosition > 3
            ? player.BatsmanEvaluation.ExpectedFours * adjust
            : player.BatsmanEvaluation.ExpectedFours;

        var batFoursAdj = batterAdjustment.BatsmanFours;
        var expectedAdj = expected + batFoursAdj / 10.0;

        var line = (int)Math.Round(expected / 2);
        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expectedAdj);
        var underProb = GetUnderProbability(expectedAdj, variance, line);
        var specifiers = GetSpecifiers(inputs, team, player, line);

        string marketName = $"{player.PlayerName} - {GetMarketName()}";

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = $"{player.PlayerName} - 1st Innings Fours";
        }

        return new Market(marketName, GetMarketId(), GetLegacyMarketId(),
            GetOverUnderOutcomes(underProb), specifiers, GetMarketCode(team.IsHomeTeam, batPosition, 4));
    }
}
