using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Players;

public class PlayerRuns : PlayerScores
{
    private const string MarketName = "Runs";

    public PlayerRuns(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 638;
        
    public override int GetLegacyMarketId() => 4;
        
    protected override Market CreateMarket(
        IPricingInputs inputs, TeamEvaluation team, PlayerEvaluation player,
        BatterAdjustmentsPM batterAdjustment, int batPosition, int indexAdjust)
    {
        var ratioConstant = GetRatioConstant(inputs, batPosition + indexAdjust);
        var medianRuns = ratioConstant * player.BatsmanEvaluation.ExpectedRuns;
        var line = (int) Math.Round(medianRuns) + (int) Math.Round(batterAdjustment.BatsmanRuns);
        var specifiers = GetSpecifiers(inputs, team, player, line);

        string marketName = $"{player.PlayerName} - {GetMarketName()}";

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = $"{player.PlayerName} - 1st Innings Runs";
        }

        return new Market(marketName, GetMarketId(), GetLegacyMarketId(), 
            GetOverUnderOutcomes(0.5), specifiers, GetMarketCode(team.IsHomeTeam, batPosition));
    }
        
    private static string GetMarketCode(bool isHomeTeam, int batPosition) => 
        $"{(isHomeTeam ? 5 : 6)}{batPosition}BARU";        
}
