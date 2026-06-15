using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class TossWinner : StandardMarketPricingModel
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Toss Winner";
    private const string MarketCode = "54PINB";
    
    public TossWinner(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 694;

    public override int GetLegacyMarketId() => 54;
        
    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        
        var outcomes = GetTeamTwoWayOutcomes(team1.TeamName, team1.TeamId, 0.5, team2.TeamName, team2.TeamId, 0.5);
        var specifiers = new List<Specifier>
        {
            new MaxOverSpecifier(GetInitialOversForFormat(inputs.Evaluation.MatchEvaluation.Format))
        };
            
        return new List<Market> { new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode) };
    }
}
