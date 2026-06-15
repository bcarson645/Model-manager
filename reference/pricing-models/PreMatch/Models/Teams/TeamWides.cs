using PremiumCricket.Lib.Pricing.Distributions.Discrete;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public class TeamWides : TeamHomeAwayMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Wides Faced";
    private const string MarketCode = "INRUB";
    private const string VarianceParameters = "MatchWides";
    
    private readonly IDictionary<string, PoissonGammaVarianceParameters> _varianceLookup;
        
    public TeamWides(ILookupProvider lookupProvider) : base(lookupProvider)
    {
        HomeMarketId = 704;
        AwayMarketId = 705;
        LegacyMarketId = 64;
        _varianceLookup = GetVarianceParameters(VarianceParameters);
    }

    public override string GetMarketName() => MarketName;

    public override List<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
            
        return new List<Market>
        {
            CreateMarketForTeam(inputs, team1),
            CreateMarketForTeam(inputs, team2)
        };
    }

    private Market CreateMarketForTeam(IPricingInputs inputs, TeamEvaluation team)
    {
        var inns = team.IsHomeTeam ? 0 : 1;
        var adjust = inputs.AdjustmentsPM.InningsAdjustments[inns].WidesBowled;
        var expected = team.InningsWides + adjust;
        var line = Math.Max((int) Math.Round(expected - 0.8), 0);
        var variance = _varianceLookup[GetFormat(inputs)].GetVariance(expected);
        var underProb = GetUnderProbability(expected, variance, line);
        return CreateMarket(inputs, team, underProb, line, MarketCode);
    }
}
