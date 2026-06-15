using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;
using PremiumCricket.Lib.Pricing.PricingModels;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class FirstPartnership : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Runs in First Partnership";
    private const string MarketCode = "01FONW";
    
    public FirstPartnership(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 999;
        
    public override int GetLegacyMarketId() => 129;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var team1 = inputs.Evaluation.GetTeam1Evaluation();
        var team2 = inputs.Evaluation.GetTeam2Evaluation();
        
        team1.PlayerEvaluations.Sort((a,b)=> a.BatsmanEvaluation.BattingNumber.CompareTo(b.BatsmanEvaluation.BattingNumber));
        team2.PlayerEvaluations.Sort((a,b)=> a.BatsmanEvaluation.BattingNumber.CompareTo(b.BatsmanEvaluation.BattingNumber));

        double team1Bat1Runs;
        double team1Bat2Runs;
        double team2Bat1Runs;
        double team2Bat2Runs;

        if (inputs.Evaluation.MatchEvaluation.IsT10)
        {
            team1Bat1Runs = team1.PlayerEvaluations[0].BatsmanEvaluation.BattingAverage;
            team1Bat2Runs = team1.PlayerEvaluations[1].BatsmanEvaluation.BattingAverage;
            team2Bat1Runs = team2.PlayerEvaluations[0].BatsmanEvaluation.BattingAverage;
            team2Bat2Runs = team2.PlayerEvaluations[1].BatsmanEvaluation.BattingAverage;
        }
        else
        {
            team1Bat1Runs = team1.PlayerEvaluations[0].BatsmanEvaluation.ExpectedRuns;
            team1Bat2Runs = team1.PlayerEvaluations[1].BatsmanEvaluation.ExpectedRuns;
            team2Bat1Runs = team2.PlayerEvaluations[0].BatsmanEvaluation.ExpectedRuns;
            team2Bat2Runs = team2.PlayerEvaluations[1].BatsmanEvaluation.ExpectedRuns;
        }
            
        var multiplier = inputs.IsTestOrFirstClassMatch() ? 1.0 : 1.05;
        var averageRuns = (team1Bat1Runs + team1Bat2Runs + team2Bat1Runs + team2Bat2Runs) * 0.25 * multiplier;
        var adjust = inputs.AdjustmentsPM.MatchAdjustments.FirstPartnership;
        var runLine = (int) Math.Round((averageRuns * Math.Log(2)) + adjust);
            
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable),
            new LineSpecifier(runLine + 0.5),
            new InningsSpecifier(1),
            new WicketSpecifier(1)
        };
            
        return new List<Market>
        {
            Market.CreateUnderOver(GetMarketName(), GetMarketId(), GetLegacyMarketId(), 0.5, specifiers, MarketCode)
        };
    }
}
