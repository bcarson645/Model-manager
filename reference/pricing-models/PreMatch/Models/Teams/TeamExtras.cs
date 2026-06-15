using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Adjustments;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamExtras : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Innings Extras";
    private const string MarketCode = "4PINA";
    private const string VarianceParameters = "MatchExtras";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public TeamExtras(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 666;
        AwayMarketId = 667;
        LegacyMarketId = 32;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team1, inputs.AdjustmentsPM.GetTeam1Adjustments()),
            CreateMarketForTeam(inputs, team2, inputs.AdjustmentsPM.GetTeam2Adjustments())
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation team, InningsAdjustmentsPM adjustments)
    {
        var expected = team.ExtrasPrediction + adjustments.InningsExtras;
        var line = Math.Max((int) Math.Round(expected - 0.8), 0);
        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expected);
        var underProb = GetUnderProbability(expected, variance, line);
        return CreateMarket(inputs, team, underProb, line, MarketCode);
    }
}
