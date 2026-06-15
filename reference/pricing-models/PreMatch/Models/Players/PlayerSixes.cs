using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Players;

public class PlayerSixes : PlayerScores
{
    private const string MarketName = "Sixes";
    private const string VarianceParameters = "PlayerSixes";

    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;

    public PlayerSixes(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override int GetMarketId() => 644;

    public override int GetLegacyMarketId() => 11;

    protected override Market CreateMarket(
        IPricingInputs inputs, TeamEvaluation team, PlayerEvaluation player,
        BatterAdjustmentsPM batterAdjustment, int batPosition, int indexAdjust)
    {
        var expected = batPosition > 3
            ? player.BatsmanEvaluation.ExpectedSixes * GetAdjust(inputs)
            : player.BatsmanEvaluation.ExpectedSixes;

        expected += batterAdjustment.BatsmanSixes / 10.0;

        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expected);
        var underProb = GetUnderProbability(expected, variance, 0);
        var specifiers = GetSpecifiers(inputs, team, player, 0);

        string marketName = $"{player.PlayerName} - {GetMarketName()}";

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = $"{player.PlayerName} - 1st Innings Sixes";
        }

        return new Market(marketName, GetMarketId(), GetLegacyMarketId(),
            GetOverUnderOutcomes(underProb), specifiers, GetMarketCode(team.IsHomeTeam, batPosition, 6));
    }
}
